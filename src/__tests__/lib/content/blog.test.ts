import { describe, expect, it } from "vitest";

import {
	blogNeighbors,
	sortBlogList,
	type BlogListItem,
} from "@/lib/content/blog";

function item(
	partial: Partial<BlogListItem> &
		Pick<BlogListItem, "slug" | "title" | "publish_date">,
): BlogListItem {
	return {
		excerpt: partial.excerpt ?? "",
		tags: partial.tags ?? [],
		...partial,
	};
}

describe("blog list helpers", () => {
	it("sorts newest first and builds neighbors", () => {
		const posts = sortBlogList([
			item({
				slug: "old",
				title: "Old",
				publish_date: new Date("2026-01-01"),
				tags: ["a"],
			}),
			item({
				slug: "new",
				title: "New",
				publish_date: new Date("2026-08-30"),
				tags: ["a"],
			}),
			item({
				slug: "mid",
				title: "Mid",
				publish_date: new Date("2026-03-01"),
				tags: ["b"],
			}),
		]);

		expect(posts.map((post) => post.slug)).toEqual(["new", "mid", "old"]);

		const aroundMid = blogNeighbors(posts, "mid");
		expect(aroundMid.prev?.id).toBe("old");
		expect(aroundMid.next?.id).toBe("new");
		expect(aroundMid.related.map((post) => post.slug)).toEqual([]);

		const aroundNew = blogNeighbors(posts, "new");
		expect(aroundNew.related.map((post) => post.slug)).toEqual(["old"]);
	});
});
