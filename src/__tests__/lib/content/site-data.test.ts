import { describe, expect, it } from "vitest";

import {
	linkFrontmatterSchema,
	profileUrls,
	sortByOrder,
	talkFrontmatterSchema,
	talksFromEntries,
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

describe("work href", () => {
	const work = (href: string) =>
		workFrontmatterSchema.safeParse({
			title: "x",
			href,
			excerpt: "x",
			order: 1,
		}).success;

	it("accepts GitHub URLs and on-site blog paths", () => {
		expect(work("https://github.com/ta93abe/enbu")).toBe(true);
		expect(work("/blog/hello-world/")).toBe(true);
	});

	it("rejects protocol-relative and bare paths", () => {
		expect(work("//evil.example.com/")).toBe(false);
		expect(work("blog/hello-world/")).toBe(false);
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

const TALK = {
	title: "Talk",
	event: "Event",
	date: "2026-05-14",
	excerpt: "excerpt",
	youtubeId: "7yvAfZ8vCDU",
};

describe("talkFrontmatterSchema", () => {
	it("accepts the optional fields", () => {
		expect(
			talkFrontmatterSchema.parse({
				...TALK,
				slideSlug: "snowflake-dbt",
				youtubeThumbnailFit: "square",
				links: [{ label: "イベント", href: "https://example.com/" }],
			}).links,
		).toEqual([{ label: "イベント", href: "https://example.com/" }]);
	});

	it("rejects unknown keys, bad dates and bad YouTube ids", () => {
		expect(
			talkFrontmatterSchema.safeParse({ ...TALK, slug: "x" }).success,
		).toBe(false);
		expect(
			talkFrontmatterSchema.safeParse({ ...TALK, date: "2026/05/14" }).success,
		).toBe(false);
		expect(
			talkFrontmatterSchema.safeParse({ ...TALK, date: "2026-02-30" }).success,
		).toBe(false);
		expect(
			talkFrontmatterSchema.safeParse({ ...TALK, youtubeId: "short" }).success,
		).toBe(false);
		expect(
			talkFrontmatterSchema.safeParse({
				...TALK,
				links: [{ label: "x", href: "/relative" }],
			}).success,
		).toBe(false);
	});
});

describe("talksFromEntries", () => {
	it("sorts newest first, then by file name, and uses the file name as slug", () => {
		const talks = talksFromEntries([
			{ id: "older", data: { ...TALK, date: "2026-05-14" } },
			{ id: "b-same-day", data: { ...TALK, date: "2026-08-27" } },
			{ id: "a-same-day", data: { ...TALK, date: "2026-08-27" } },
		]);
		expect(talks.map((talk) => talk.slug)).toEqual([
			"a-same-day",
			"b-same-day",
			"older",
		]);
	});
});
