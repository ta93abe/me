import { describe, expect, it, vi } from "vitest";

import { DEFAULT_EMBED_FAVICON } from "@/lib/content/favicon";
import {
	fallbackLinkCard,
	fetchLinkCard,
	linkCardHtml,
	type LinkCardData,
} from "@/lib/content/link-card";

const PNG_1X1 = Uint8Array.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
	0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
	0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
	0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
	0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
	0x60, 0x82,
]);

function sampleCard(overrides: Partial<LinkCardData> = {}): LinkCardData {
	return {
		href: "https://coosenp.ai/",
		title: "CooSenpAI — アレコレソレが通じるAI",
		description:
			"AI に聞くたびチャットを開いてコピペして状況を説明する。その手間を...",
		image: "https://coosenp.ai/og.png",
		domain: "coosenp.ai",
		favicon: "https://www.google.com/s2/favicons?domain=coosenp.ai&sz=32",
		...overrides,
	};
}

function expectNoGoogleFavicon(html: string) {
	expect(html).not.toContain("google.com/s2/favicons");
	expect(html).not.toContain("gstatic.com");
}

describe("linkCardHtml", () => {
	it("renders a Zenn-like card with title, description, domain, and image", () => {
		const html = linkCardHtml(sampleCard());

		expect(html).toContain('class="embed-card"');
		expect(html).toContain("CooSenpAI — アレコレソレが通じるAI");
		expect(html).toContain("その手間を");
		expect(html).toContain("coosenp.ai");
		expect(html).toContain('src="https://coosenp.ai/og.png"');
		expect(html).toContain('href="https://coosenp.ai/"');
		expect(html).toContain('rel="noopener noreferrer"');
		expect(html).toContain('target="_blank"');
		expect(html).not.toContain("embed-card-no-image");
		expect(html).toContain(`src="${DEFAULT_EMBED_FAVICON}"`);
		expectNoGoogleFavicon(html);
	});

	it("never emits Google favicon URLs, even when the cache still has one", () => {
		const google = linkCardHtml(sampleCard());
		const gstatic = linkCardHtml(
			sampleCard({
				favicon:
					"https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=http://github.com&size=32",
				domain: "github.com",
			}),
		);
		const remote = linkCardHtml(
			sampleCard({ favicon: "https://coosenp.ai/favicon.png" }),
		);

		expectNoGoogleFavicon(google);
		expectNoGoogleFavicon(gstatic);
		expectNoGoogleFavicon(remote);
		expect(gstatic).toContain('src="/icons/embed/github.com.svg"');
		expect(remote).toContain(`src="${DEFAULT_EMBED_FAVICON}"`);
	});

	it("keeps a publish-time raster data URI and known-host SVGs", () => {
		const png =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
		const data = linkCardHtml(sampleCard({ favicon: png }));
		const github = linkCardHtml(
			sampleCard({
				href: "https://github.com/ta93abe/me",
				domain: "github.com",
				favicon: "/icons/embed/github.com.svg",
			}),
		);

		expect(data).toContain(`src="${png}"`);
		expect(github).toContain('src="/icons/embed/github.com.svg"');
		expectNoGoogleFavicon(data);
		expectNoGoogleFavicon(github);
	});

	it("omits the thumbnail when no https image is present", () => {
		const html = linkCardHtml(sampleCard({ image: undefined }));
		expect(html).toContain("embed-card-no-image");
		expect(html).not.toContain("embed-card-thumb");
	});

	it("escapes untrusted OGP text and never inlines fetched markup", () => {
		const html = linkCardHtml(
			sampleCard({
				title: "<script>alert(1)</script>",
				description: "<img src=x onerror=alert(1)>",
				domain: 'ex.com">',
				href: "https://example.com/safe",
			}),
		);

		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<img src=x");
		expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
		expect(html).toContain("ex.com&quot;&gt;");
		expectNoGoogleFavicon(html);
	});
});

describe("fallbackLinkCard", () => {
	it("uses first-party icons and never Google", () => {
		expect(fallbackLinkCard("https://github.com/ta93abe/me").favicon).toBe(
			"/icons/embed/github.com.svg",
		);
		expect(fallbackLinkCard("https://example.com/x").favicon).toBe(
			DEFAULT_EMBED_FAVICON,
		);
		expectNoGoogleFavicon(
			linkCardHtml(fallbackLinkCard("https://example.com/x")),
		);
	});
});

describe("fetchLinkCard", () => {
	it("reads Open Graph tags and inlines a downloaded favicon", async () => {
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("favicon.png")) {
				return new Response(PNG_1X1, {
					headers: { "content-type": "image/png" },
				});
			}
			return new Response(
				`<!doctype html><html><head>
<title>Fallback title</title>
<meta property="og:title" content="CooSenpAI">
<meta property="og:description" content="A helper AI">
<meta property="og:image" content="/og.png">
<link rel="icon" href="https://coosenp.ai/favicon.png">
</head><body><h1>not in card</h1></body></html>`,
				{ headers: { "content-type": "text/html; charset=utf-8" } },
			);
		});

		const card = await fetchLinkCard("https://coosenp.ai/app", {
			fetch: fetchImpl,
		});

		expect(card.title).toBe("CooSenpAI");
		expect(card.description).toBe("A helper AI");
		expect(card.image).toBe("https://coosenp.ai/og.png");
		expect(card.domain).toBe("coosenp.ai");
		expect(card.favicon).toMatch(/^data:image\/png;base64,/);
		expect(card.href).toBe("https://coosenp.ai/app");
		expectNoGoogleFavicon(linkCardHtml(card));
	});

	it("resolves relative og:image against the final response URL", async () => {
		const response = new Response(
			`<!doctype html><html><head>
<meta property="og:title" content="CooSenpAI">
<meta property="og:image" content="/og.png">
</head></html>`,
			{ headers: { "content-type": "text/html; charset=utf-8" } },
		);
		Object.defineProperty(response, "url", {
			value: "https://www.coosenp.ai/app",
		});
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (
				url.includes("favicon") ||
				url.includes("gstatic") ||
				url.includes("google.com")
			) {
				return new Response("no", { status: 404 });
			}
			return response;
		});

		const card = await fetchLinkCard("https://coosenp.ai/app", {
			fetch: fetchImpl,
		});
		expect(card.image).toBe("https://www.coosenp.ai/og.png");
		expect(card.favicon).toBe(DEFAULT_EMBED_FAVICON);
		expectNoGoogleFavicon(linkCardHtml(card));
	});

	it("falls back to domain when fetch fails and drops http images", async () => {
		const fetchImpl = vi.fn(async () => new Response("no", { status: 500 }));
		const failed = await fetchLinkCard("https://example.com/x", {
			fetch: fetchImpl,
		});
		expect(failed.title).toBe("example.com");
		expect(failed.description).toBe("");
		expect(failed.image).toBeUndefined();
		expect(failed.domain).toBe("example.com");
		expect(failed.favicon).toBe(DEFAULT_EMBED_FAVICON);
		expectNoGoogleFavicon(linkCardHtml(failed));

		const httpImage = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("favicon") || url.includes("google.com")) {
				return new Response("no", { status: 404 });
			}
			return new Response(
				`<html><head>
<meta property="og:title" content="Hi">
<meta property="og:image" content="http://example.com/insecure.png">
</head></html>`,
				{ headers: { "content-type": "text/html" } },
			);
		});
		const card = await fetchLinkCard("https://example.com/x", {
			fetch: httpImage,
		});
		expect(card.title).toBe("Hi");
		expect(card.image).toBeUndefined();
		expect(card.favicon).toBe(DEFAULT_EMBED_FAVICON);
	});

	it("does not keep fetched page HTML in card fields", async () => {
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.includes("favicon") || url.includes("google.com")) {
				return new Response("no", { status: 404 });
			}
			return new Response(
				`<html><head>
<meta property="og:title" content="Safe">
<meta property="og:description" content="<b>bold</b>">
</head><body><script>document.cookie</script></body></html>`,
				{ headers: { "content-type": "text/html" } },
			);
		});
		const card = await fetchLinkCard("https://example.com/", {
			fetch: fetchImpl,
		});
		expect(card.title).toBe("Safe");
		expect(card.description).not.toContain("<script>");
		expect(card.description).not.toContain("document.cookie");
		expect(card.description).not.toContain("<b>");
		expectNoGoogleFavicon(linkCardHtml(card));
	});

	it("uses a repo SVG for GitHub and never stores a Google favicon URL", async () => {
		const fetchImpl = vi.fn(async () => {
			return new Response(
				`<!doctype html><html><head>
<meta property="og:title" content="me">
</head></html>`,
				{ headers: { "content-type": "text/html" } },
			);
		});
		const card = await fetchLinkCard("https://github.com/ta93abe/me", {
			fetch: fetchImpl,
		});
		expect(card.favicon).toBe("/icons/embed/github.com.svg");
		expect(
			fetchImpl.mock.calls.every((call) => {
				const url = String(call[0]);
				return !url.includes("google.com") && !url.includes("gstatic.com");
			}),
		).toBe(true);
		expectNoGoogleFavicon(linkCardHtml(card));
	});
});
