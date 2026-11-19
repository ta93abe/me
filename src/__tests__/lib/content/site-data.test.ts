import { describe, expect, it } from "vitest";

import {
	linkFrontmatterSchema,
	profileUrls,
	sortByOrder,
	workFrontmatterSchema,
} from "@/lib/content/site-data";

describe("sortByOrder", () => {
	it("sorts by order ascending", () => {
		const sorted = sortByOrder("works", [
			{ id: "b", data: { order: 20 } },
			{ id: "a", data: { order: 10 } },
		]);
		expect(sorted.map((entry) => entry.id)).toEqual(["a", "b"]);
	});

	it("fails when two entries share an order", () => {
		expect(() =>
			sortByOrder("links", [
				{ id: "github", data: { order: 10 } },
				{ id: "zenn", data: { order: 10 } },
			]),
		).toThrow("links: order 10 が github と zenn で重複しています");
	});
});

describe("frontmatter schemas", () => {
	it("rejects unknown keys", () => {
		expect(
			workFrontmatterSchema.safeParse({
				title: "x",
				href: "https://example.com",
				excerpt: "x",
				order: 1,
				extra: true,
			}).success,
		).toBe(false);
		expect(
			linkFrontmatterSchema.safeParse({
				name: "x",
				url: "https://example.com",
				icon: "x",
				order: 1,
				color: "#fff",
			}).success,
		).toBe(false);
	});

	it("requires an absolute URL and an integer order", () => {
		expect(
			linkFrontmatterSchema.safeParse({
				name: "x",
				url: "/relative",
				icon: "x",
				order: 1,
			}).success,
		).toBe(false);
		expect(
			workFrontmatterSchema.safeParse({
				title: "x",
				href: "https://example.com",
				excerpt: "x",
				order: 1.5,
			}).success,
		).toBe(false);
	});
});

describe("profileUrls", () => {
	it("keeps link order", () => {
		expect(
			profileUrls([
				{ name: "GitHub", url: "https://github.com/ta93abe", icon: "github" },
				{ name: "X", url: "https://x.com/ta93abe_", icon: "x" },
			]),
		).toEqual(["https://github.com/ta93abe", "https://x.com/ta93abe_"]);
	});
});
