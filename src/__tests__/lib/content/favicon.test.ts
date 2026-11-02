import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
	DEFAULT_EMBED_FAVICON,
	firstPartyFaviconSrc,
	googleFaviconFetchUrl,
	isFirstPartyFavicon,
	isGoogleFaviconUrl,
	resolveFavicon,
	staticFaviconForDomain,
} from "@/lib/content/favicon";

const PNG_1X1 = Uint8Array.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
	0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
	0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
	0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
	0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
	0x60, 0x82,
]);

const root = process.cwd();

describe("static embed favicons", () => {
	it("keeps first-party SVG files for known hosts and the fallback", () => {
		for (const file of [
			"default.svg",
			"github.com.svg",
			"youtube.com.svg",
			"x.com.svg",
			"zenn.dev.svg",
		]) {
			const path = join(root, "public/icons/embed", file);
			expect(existsSync(path), path).toBe(true);
			expect(readFileSync(path, "utf8")).toContain("<svg");
		}
	});
});

describe("firstPartyFaviconSrc", () => {
	it("maps well-known hosts to repo SVGs and others to the generic icon", () => {
		expect(staticFaviconForDomain("www.github.com")).toBe(
			"/icons/embed/github.com.svg",
		);
		expect(staticFaviconForDomain("gist.github.com")).toBe(
			"/icons/embed/github.com.svg",
		);
		expect(staticFaviconForDomain("youtube.com")).toBe(
			"/icons/embed/youtube.com.svg",
		);
		expect(staticFaviconForDomain("x.com")).toBe("/icons/embed/x.com.svg");
		expect(staticFaviconForDomain("twitter.com")).toBe(
			"/icons/embed/x.com.svg",
		);
		expect(staticFaviconForDomain("zenn.dev")).toBe(
			"/icons/embed/zenn.dev.svg",
		);
		expect(staticFaviconForDomain("coosenp.ai")).toBe(DEFAULT_EMBED_FAVICON);
	});

	it("keeps first-party paths and raster data URIs, rejects the rest", () => {
		const png =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
		expect(isFirstPartyFavicon("/icons/embed/github.com.svg")).toBe(true);
		expect(isFirstPartyFavicon(png)).toBe(true);
		expect(isFirstPartyFavicon("data:image/svg+xml;base64,PHN2Zz4=")).toBe(
			false,
		);
		expect(isFirstPartyFavicon("/icons/embed/../secret.svg")).toBe(false);
		expect(firstPartyFaviconSrc(png, "example.com")).toBe(png);
		expect(
			firstPartyFaviconSrc(
				"https://www.google.com/s2/favicons?domain=example.com&sz=32",
				"example.com",
			),
		).toBe(DEFAULT_EMBED_FAVICON);
		expect(
			firstPartyFaviconSrc("https://coosenp.ai/favicon.png", "coosenp.ai"),
		).toBe(DEFAULT_EMBED_FAVICON);
		expect(
			firstPartyFaviconSrc(
				"https://www.google.com/s2/favicons?domain=github.com&sz=32",
				"github.com",
			),
		).toBe("/icons/embed/github.com.svg");
	});

	it("detects Google favicon service URLs", () => {
		expect(
			isGoogleFaviconUrl(
				"https://www.google.com/s2/favicons?domain=github.com&sz=32",
			),
		).toBe(true);
		expect(
			isGoogleFaviconUrl(
				"https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=http://github.com&size=32",
			),
		).toBe(true);
		expect(isGoogleFaviconUrl("https://github.com/favicon.ico")).toBe(false);
		expect(googleFaviconFetchUrl("github.com")).toContain(
			"google.com/s2/favicons",
		);
	});
});

describe("resolveFavicon", () => {
	it("returns a repo SVG for known hosts without fetching", async () => {
		const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
		await expect(
			resolveFavicon("github.com", { fetch: fetchImpl }),
		).resolves.toBe("/icons/embed/github.com.svg");
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("downloads a site icon at resolve time and inlines it as a data URI", async () => {
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			expect(String(input)).toBe("https://coosenp.ai/favicon.png");
			return new Response(PNG_1X1, {
				headers: { "content-type": "image/png" },
			});
		});

		const favicon = await resolveFavicon("coosenp.ai", {
			fetch: fetchImpl,
			candidates: ["https://coosenp.ai/favicon.png"],
			pageUrl: "https://coosenp.ai/",
		});

		expect(favicon).toMatch(/^data:image\/png;base64,/);
		expect(fetchImpl).toHaveBeenCalledOnce();
	});

	it("falls back to the generic icon when downloads fail", async () => {
		const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
		await expect(
			resolveFavicon("example.com", {
				fetch: fetchImpl,
				pageUrl: "https://example.com/",
			}),
		).resolves.toBe(DEFAULT_EMBED_FAVICON);
		expect(fetchImpl).toHaveBeenCalled();
	});

	it("caches unknown domains for the duration of one resolve pass", async () => {
		const fetchImpl = vi.fn(async () => {
			return new Response(PNG_1X1, {
				headers: { "content-type": "image/png" },
			});
		});
		const cache = new Map<string, Promise<string>>();

		const [first, second] = await Promise.all([
			resolveFavicon("example.com", {
				fetch: fetchImpl,
				candidates: ["https://example.com/icon.png"],
				cache,
			}),
			resolveFavicon("www.example.com", {
				fetch: fetchImpl,
				candidates: ["https://example.com/other.png"],
				cache,
			}),
		]);

		expect(first).toBe(second);
		expect(first).toMatch(/^data:image\/png;base64,/);
		expect(fetchImpl).toHaveBeenCalledOnce();
	});
});
