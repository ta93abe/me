import { describe, expect, it, vi } from "vitest";

import {
	fetchLinkCard,
	linkCardHtml,
	type LinkCardData,
} from "@/lib/content/link-card";

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
	});
});

describe("fetchLinkCard", () => {
	it("reads Open Graph tags and resolves a relative image", async () => {
		const fetchImpl = vi.fn(async () => {
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

		expect(fetchImpl).toHaveBeenCalledOnce();
		expect(card.title).toBe("CooSenpAI");
		expect(card.description).toBe("A helper AI");
		expect(card.image).toBe("https://coosenp.ai/og.png");
		expect(card.domain).toBe("coosenp.ai");
		expect(card.favicon).toBe("https://coosenp.ai/favicon.png");
		expect(card.href).toBe("https://coosenp.ai/app");
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

		const httpImage = vi.fn(async () => {
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
	});

	it("does not keep fetched page HTML in card fields", async () => {
		const fetchImpl = vi.fn(async () => {
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
	});
});
