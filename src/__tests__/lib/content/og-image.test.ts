import { describe, expect, it, vi } from "vitest";

import { firstPartyOgImageSrc, resolveOgImage } from "@/lib/content/og-image";

const PNG_1X1 = Uint8Array.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
	0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
	0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
	0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
	0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
	0x60, 0x82,
]);

const PNG_DATA_URI =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("firstPartyOgImageSrc", () => {
	it("keeps raster data URIs and drops remote or svg sources", () => {
		expect(firstPartyOgImageSrc(PNG_DATA_URI)).toBe(PNG_DATA_URI);
		expect(
			firstPartyOgImageSrc(
				"https://opengraph.githubassets.com/abc/civitaspo/dbt-authorized-models",
			),
		).toBeUndefined();
		expect(firstPartyOgImageSrc("https://coosenp.ai/og.png")).toBeUndefined();
		expect(
			firstPartyOgImageSrc("data:image/svg+xml;base64,PHN2Zy8+"),
		).toBeUndefined();
		expect(firstPartyOgImageSrc(undefined)).toBeUndefined();
	});
});

describe("resolveOgImage", () => {
	it("downloads, resizes, and inlines a raster as a webp data URI", async () => {
		const fetchImpl = vi.fn(async () => {
			return new Response(PNG_1X1, {
				headers: { "content-type": "image/png" },
			});
		});
		const image = await resolveOgImage(
			"https://opengraph.githubassets.com/abc/civitaspo/dbt-authorized-models",
			{ fetch: fetchImpl },
		);
		expect(image).toMatch(/^data:image\/webp;base64,/);
		expect(fetchImpl).toHaveBeenCalledOnce();
	});

	it("retries a 429 then inlines the image", async () => {
		let calls = 0;
		const fetchImpl = vi.fn(async () => {
			calls += 1;
			if (calls === 1) {
				return new Response("rate limited", { status: 429 });
			}
			return new Response(PNG_1X1, {
				headers: { "content-type": "image/png" },
			});
		});
		const image = await resolveOgImage("https://example.com/og.png", {
			fetch: fetchImpl,
			retryDelayMs: 0,
		});
		expect(image).toMatch(/^data:image\/webp;base64,/);
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});

	it("returns undefined when the host keeps 429ing", async () => {
		const fetchImpl = vi.fn(
			async () => new Response("rate limited", { status: 429 }),
		);
		await expect(
			resolveOgImage("https://example.com/og.png", {
				fetch: fetchImpl,
				retryDelayMs: 0,
			}),
		).resolves.toBeUndefined();
		expect(fetchImpl).toHaveBeenCalledTimes(3);
	});

	it("rejects http URLs and reuses the cache for the same href", async () => {
		expect(
			await resolveOgImage("http://example.com/og.png", {
				fetch: vi.fn(),
			}),
		).toBeUndefined();

		const fetchImpl = vi.fn(async () => {
			return new Response(PNG_1X1, {
				headers: { "content-type": "image/png" },
			});
		});
		const cache = new Map<string, Promise<string | undefined>>();
		const [first, second] = await Promise.all([
			resolveOgImage("https://example.com/og.png", { fetch: fetchImpl, cache }),
			resolveOgImage("https://example.com/og.png", { fetch: fetchImpl, cache }),
		]);
		expect(first).toBe(second);
		expect(fetchImpl).toHaveBeenCalledOnce();
	});

	it("does not request loopback or private og:image hosts", async () => {
		const fetchImpl = vi.fn();
		await expect(
			resolveOgImage("https://127.0.0.1/og.png", { fetch: fetchImpl }),
		).resolves.toBeUndefined();
		await expect(
			resolveOgImage("https://192.168.0.8/og.png", { fetch: fetchImpl }),
		).resolves.toBeUndefined();
		await expect(
			resolveOgImage("https://localhost/og.png", { fetch: fetchImpl }),
		).resolves.toBeUndefined();
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("follows a public https redirect and refuses a private one", async () => {
		const publicFetch = vi.fn(async (input: RequestInfo | URL) => {
			const href = String(input);
			if (href === "https://example.com/og.png") {
				return new Response(null, {
					status: 302,
					headers: { location: "https://cdn.example.com/og.png" },
				});
			}
			return new Response(PNG_1X1, {
				headers: { "content-type": "image/png" },
			});
		});
		await expect(
			resolveOgImage("https://example.com/og.png", { fetch: publicFetch }),
		).resolves.toMatch(/^data:image\/webp;base64,/);
		expect(publicFetch).toHaveBeenCalledTimes(2);

		const privateFetch = vi.fn(async () => {
			return new Response(null, {
				status: 302,
				headers: { location: "https://127.0.0.1/secret.png" },
			});
		});
		await expect(
			resolveOgImage("https://example.com/og.png", { fetch: privateFetch }),
		).resolves.toBeUndefined();
		expect(privateFetch).toHaveBeenCalledOnce();
	});

	it("stops reading once the source exceeds the size limit", async () => {
		const oversized = new Uint8Array(2_500_001);
		const listed = vi.fn(
			async () =>
				new Response(oversized, {
					headers: {
						"content-type": "image/png",
						"content-length": String(oversized.byteLength),
					},
				}),
		);
		await expect(
			resolveOgImage("https://example.com/og.png", { fetch: listed }),
		).resolves.toBeUndefined();

		const streamed = vi.fn(
			async () =>
				new Response(oversized, {
					headers: { "content-type": "image/png" },
				}),
		);
		await expect(
			resolveOgImage("https://example.com/og.png", { fetch: streamed }),
		).resolves.toBeUndefined();
		expect(listed).toHaveBeenCalledOnce();
		expect(streamed).toHaveBeenCalledOnce();
	});
});
