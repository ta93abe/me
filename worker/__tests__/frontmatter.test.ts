import { describe, expect, it } from "vitest";

import { looksLikeMdx, parseMarkdownDocument } from "../content/frontmatter.ts";

describe("frontmatter", () => {
	it("parses scalars, arrays, and the markdown body", () => {
		const parsed = parseMarkdownDocument(`---
title: Hello world
date: 2026-08-30
tags:
  - rust
  - workers
draft: false
---

body text
`);
		expect(parsed.frontmatter.title).toBe("Hello world");
		expect(parsed.frontmatter.date).toBe("2026-08-30");
		expect(parsed.frontmatter.tags).toEqual(["rust", "workers"]);
		expect(parsed.frontmatter.draft).toBe(false);
		expect(parsed.body).toBe("body text\n");
	});

	it("parses inline arrays", () => {
		const parsed = parseMarkdownDocument(`---
title: x
tags: [a, b]
---
`);
		expect(parsed.frontmatter.tags).toEqual(["a", "b"]);
	});

	it("rejects markdown without frontmatter", () => {
		expect(() => parseMarkdownDocument("# hi\n")).toThrow(/frontmatter/);
	});

	it("detects mdx import/jsx", () => {
		expect(looksLikeMdx('import x from "./x"\n')).toBe(true);
		expect(looksLikeMdx("---\ntitle: a\n---\n\n<Hero />\n")).toBe(true);
		expect(looksLikeMdx("---\ntitle: a\n---\n\nhello\n")).toBe(false);
	});
});
