import { describe, expect, it } from "vitest";

import {
	ARTICLE_BODY_MAX_CHARS,
	articleBodyText,
	countWords,
	extractShortListItems,
	markdownToPlainText,
} from "@/utils/article-text";

const codingAgentBody = `γ-GTP もあって予測変換もそっちになるんですかね。Claude をクラウドを発音する人もいますね。

ChatGPTには当初から課金し、Anthopic の勃興とともに Claude にも課金し始めました。一時期はMaxプランにしていたんですが最近はProに落としています。

2026 年 9 月時点で課金しているものです。

- Claude Pro ($20)
- ChatGPT Plus (¥3,000)
- Cursor Pro+ ($60)
- Devin Pro ($20)
- OpenCode Go ($10)
- Google AI Pro (¥29,000 per year)

コーディング用途で Cursor Pro+ をメインに使っています。`;

describe("markdownToPlainText", () => {
	it("keeps paragraph text and drops markdown markers", () => {
		expect(markdownToPlainText("ブログを始めようじゃないか。")).toBe(
			"ブログを始めようじゃないか。",
		);
		expect(markdownToPlainText("## 見出し\n\n本文です。")).toBe(
			"見出し\n\n本文です。",
		);
		expect(markdownToPlainText("[リンク](https://example.com)と**強調**")).toBe(
			"リンクと強調",
		);
	});

	it("does not treat fenced code list markers as visible list chrome", () => {
		const text = markdownToPlainText(`本文

\`\`\`yaml
sources:
    your_project_name:
      +meta:
        authorize:
          - resource_type: model
\`\`\`
`);
		expect(text).toContain("resource_type: model");
		expect(text).not.toContain("```");
	});
});

describe("countWords", () => {
	it("returns a positive integer for Japanese body copy", () => {
		const count = countWords("ブログを始めようじゃないか。");
		expect(count).toBeGreaterThan(0);
		expect(Number.isInteger(count)).toBe(true);
	});

	it("counts Latin words", () => {
		expect(countWords("Hello World body")).toBe(3);
	});
});

describe("articleBodyText", () => {
	it("returns the full body when it fits", () => {
		expect(
			articleBodyText(
				"ブログを始めようじゃないか。",
				"https://example.com/blog/hello-world/",
			),
		).toBe("ブログを始めようじゃないか。");
	});

	it("truncates long bodies and appends the canonical URL", () => {
		const long = "あ".repeat(ARTICLE_BODY_MAX_CHARS + 80);
		const url = "https://example.com/blog/long-post/";
		const result = articleBodyText(long, url);
		expect(result.endsWith(url)).toBe(true);
		expect(result.length).toBeLessThan(long.length + url.length);
		expect(result.slice(0, ARTICLE_BODY_MAX_CHARS)).toBe(
			long.slice(0, ARTICLE_BODY_MAX_CHARS),
		);
	});
});

describe("extractShortListItems", () => {
	it("pulls paid service names out of a coding-agent style list", () => {
		expect(extractShortListItems(codingAgentBody)).toEqual([
			"Claude Pro",
			"ChatGPT Plus",
			"Cursor Pro+",
			"Devin Pro",
			"OpenCode Go",
			"Google AI Pro",
		]);
	});

	it("ignores short lists and list markers inside fenced code", () => {
		expect(extractShortListItems("- one\n- two\n")).toEqual([]);
		expect(
			extractShortListItems(`導入文

\`\`\`yaml
sources:
  your_project:
    +meta:
      authorize:
        - resource_type: model
        - resource_type: source
        - resource_type: snapshot
\`\`\`
`),
		).toEqual([]);
	});
});
