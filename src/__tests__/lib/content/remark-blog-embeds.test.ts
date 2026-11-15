import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import { remarkBlogEmbeds } from "@/lib/content/remark-blog-embeds";

type JsxNode = {
	type: string;
	name?: string;
	attributes?: Array<{ name: string; value: string }>;
};

function transform(markdown: string, path: string): JsxNode[] {
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkBlogEmbeds);
	const file = { path, value: markdown };
	const tree = processor.runSync(
		processor.parse(markdown),
		file as never,
	) as unknown as {
		children: JsxNode[];
	};
	return tree.children;
}

function attrs(node: JsxNode): Record<string, string> {
	return Object.fromEntries(
		(node.attributes ?? []).map((attribute) => [
			attribute.name,
			attribute.value,
		]),
	);
}

describe("remarkBlogEmbeds", () => {
	const blogPath = "/repo/src/content/blog/post.mdx";

	it("replaces URL-only paragraphs in blog posts with <BlogEmbed />", () => {
		const children = transform(
			"前置き\n\nhttps://x.com/a/status/123\n\nhttps://github.com/a/b\n",
			blogPath,
		);
		expect(children.map((node) => node.type)).toEqual([
			"paragraph",
			"mdxJsxFlowElement",
			"mdxJsxFlowElement",
		]);
		expect(children[1].name).toBe("BlogEmbed");
		expect(attrs(children[1])).toEqual({
			kind: "tweet",
			href: "https://x.com/a/status/123",
			id: "123",
		});
		expect(attrs(children[2])).toEqual({
			kind: "link",
			href: "https://github.com/a/b",
		});
	});

	it("keeps inline URLs as links", () => {
		const children = transform(
			"詳しくは https://github.com/a/b を見る\n",
			blogPath,
		);
		expect(children.map((node) => node.type)).toEqual(["paragraph"]);
	});

	it("does nothing outside src/content/blog", () => {
		const children = transform(
			"https://github.com/a/b\n",
			"/repo/src/slides/decks/deck.mdx",
		);
		expect(children.map((node) => node.type)).toEqual(["paragraph"]);
	});
});
