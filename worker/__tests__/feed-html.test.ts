import { describe, expect, it } from "vitest";

import { renderFeedHtml, sanitizeFeedHtml } from "../content/feed-html.ts";

describe("sanitizeFeedHtml", () => {
	it("drops script tags and javascript URLs", () => {
		const html = sanitizeFeedHtml(
			`<p><a href="javascript:alert(1)">x</a></p><script>alert(1)</script>`,
		);
		expect(html).not.toContain("<script>");
		expect(html).not.toContain("javascript:");
		expect(html).toContain("<p>");
	});

	it("drops obfuscated javascript URLs and mixed-case attributes", () => {
		const html = sanitizeFeedHtml(
			`<p><a HREF="java&#115;cript:alert(1)">x</a><img SRC="&#106;avascript:alert(1)" /></p>`,
		);
		expect(html.toLowerCase()).not.toContain("javascript");
		expect(html).not.toMatch(/href=/i);
		expect(html).not.toMatch(/src=/i);
	});
});

describe("renderFeedHtml", () => {
	it("keeps headings and lists from markdown", () => {
		const html = renderFeedHtml("## 課金スタック\n\n- Cursor\n");
		expect(html).toContain("<h2>課金スタック</h2>");
		expect(html).toContain("<li>Cursor</li>");
	});
});
