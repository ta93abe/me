import { describe, expect, it } from "vitest";

import { renderBlogMarkdown } from "@/lib/content/markdown";

describe("renderBlogMarkdown", () => {
	it("renders headings and paragraphs", () => {
		const html = renderBlogMarkdown("# Hello\n\nA paragraph.");
		expect(html).toContain("<h1>");
		expect(html).toContain("Hello");
		expect(html).toContain("<p>A paragraph.</p>");
	});

	it("highlights fenced code with Prism classes", () => {
		const html = renderBlogMarkdown("```ts\nconst n = 1;\n```");
		expect(html).toContain('class="language-ts"');
		expect(html).toContain("token");
	});

	it("escapes unhighlighted code", () => {
		const html = renderBlogMarkdown(
			"```unknownlang\n<script>alert(1)</script>\n```",
		);
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});
});
