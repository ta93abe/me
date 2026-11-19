import { describe, expect, it } from "vitest";

import {
	BLOG_COLLECTION_LEAD,
	blogCollectionDescription,
	COLLECTION_DESCRIPTION_MAX_LENGTH,
	contactPageDescription,
	firstClause,
	namedListDescription,
	SLIDES_COLLECTION_LEAD,
	slidesCollectionDescription,
	TALKS_COLLECTION_LEAD,
	talksCollectionDescription,
	worksCollectionDescription,
} from "@/utils/collection-description";

import { readLinks, readTalks, readWorks } from "../helpers/site-content.ts";

const FEATURED_WORKS = readWorks();
const TALKS = readTalks();
const TALKS_COLLECTION_DESCRIPTION = talksCollectionDescription(TALKS);
const WORKS_COLLECTION_DESCRIPTION = worksCollectionDescription(FEATURED_WORKS);
const CONTACT_DESCRIPTION = contactPageDescription(readLinks());

const META_MIN_LENGTH = 50;

describe("namedListDescription", () => {
	it("joins the lead and names in the home/links voice", () => {
		expect(namedListDescription("代表作", ["dbt-jobs", "enbu"])).toBe(
			"代表作。dbt-jobs、enbu。",
		);
	});

	it("returns only the lead when the list is empty", () => {
		expect(namedListDescription("技術ブログ。日々の学び", [])).toBe(
			"技術ブログ。日々の学び。",
		);
	});

	it("keeps the first name even when it exceeds maxLength, then stops", () => {
		const description = namedListDescription(
			"リード",
			["短い", "とても長い名前"],
			12,
		);
		expect(description).toBe("リード。短い。");
		expect(namedListDescription("リード", ["一二三四五六七八九十"], 8)).toBe(
			"リード。一二三四五六七八九十。",
		);
	});
});

describe("firstClause", () => {
	it("cuts FEATURED_WORKS excerpts at を / で without adding facts", () => {
		expect(firstClause(FEATURED_WORKS[0]?.excerpt ?? "")).toBe(
			"dbt の CI/CD パイプライン",
		);
		expect(firstClause(FEATURED_WORKS[1]?.excerpt ?? "")).toBe(
			"DuckDB と dbt Fusion",
		);
		expect(firstClause(FEATURED_WORKS[2]?.excerpt ?? "")).toBe(
			"Cloudflare 上に置くデータ基盤",
		);
	});
});

describe("listing meta descriptions", () => {
	const slides = slidesCollectionDescription([
		"Snowflake で何が起きているのかを把握する",
		"Snowflake と dbt",
		"SnowflakeとClickOpsの限界",
	]);
	const blog = blogCollectionDescription([
		"Snowflake World Tour Tokyo に行ってきたよー",
		"ChatGTPは気になっていたけど、クラウド Code は気にならなくなった",
		"Hello World",
	]);

	it.each([
		["talks", TALKS_COLLECTION_DESCRIPTION, ["Frosty Friday", "Cloudflare"]],
		["contact", CONTACT_DESCRIPTION, ["@ta93abe_", "GitHub"]],
		["slides", slides, ["Snowflake", "dbt"]],
		["blog", blog, ["Snowflake World Tour Tokyo", "ChatGTP", "Hello World"]],
		["works", WORKS_COLLECTION_DESCRIPTION, ["dbt-jobs", "DuckDB", "enbu"]],
	] as const)(
		"%s is at least 50 characters and names what is on the page",
		(_label, description, needles) => {
			expect(description.length).toBeGreaterThanOrEqual(META_MIN_LENGTH);
			expect(description.length).toBeLessThanOrEqual(
				COLLECTION_DESCRIPTION_MAX_LENGTH + 20,
			);
			for (const needle of needles) {
				expect(description).toContain(needle);
			}
		},
	);

	it("rebuilds talks and works from the live catalogs", () => {
		expect(TALKS_COLLECTION_DESCRIPTION).toBe(
			talksCollectionDescription(TALKS),
		);
		expect(TALKS_COLLECTION_DESCRIPTION).toContain(TALKS[0]?.title ?? "");
		expect(WORKS_COLLECTION_DESCRIPTION).toBe(
			worksCollectionDescription(FEATURED_WORKS),
		);
		expect(WORKS_COLLECTION_DESCRIPTION.startsWith("代表作。")).toBe(true);
	});

	it("keeps the short leads for on-page intros", () => {
		expect(TALKS_COLLECTION_LEAD).toBe("登壇と配信に出た回です。");
		expect(SLIDES_COLLECTION_LEAD).toBe(
			"登壇やLTで使用したスライドの一覧です。",
		);
		expect(BLOG_COLLECTION_LEAD.length).toBeLessThan(META_MIN_LENGTH);
	});

	it("picks up a newly listed slide title", () => {
		const next = slidesCollectionDescription([
			"Snowflake と dbt",
			"新しいデッキ",
		]);
		expect(next).toContain("新しいデッキ");
		expect(next).toContain("Snowflake と dbt");
	});

	it("spells the current catalogs in the home/links voice", () => {
		expect(TALKS_COLLECTION_DESCRIPTION).toBe(
			"登壇と配信に出た回です。Frosty Friday Live Challenge Vol.56、Cloudflare で始める Data Platform。",
		);
		expect(CONTACT_DESCRIPTION).toBe(
			"連絡は SNS から。いちばん反応しやすいのは X（@ta93abe_）。GitHub、Zenn、LinkedIn、Speaker Deck、connpass、Substack。",
		);
		expect(slides).toBe(
			"登壇やLTで使用したスライドの一覧です。Snowflake で何が起きているのかを把握する、Snowflake と dbt、SnowflakeとClickOpsの限界。",
		);
		expect(blog).toBe(
			"技術ブログ。Snowflake World Tour Tokyo に行ってきたよー、ChatGTPは気になっていたけど、クラウド Code は気にならなくなった、Hello World。",
		);
		expect(WORKS_COLLECTION_DESCRIPTION).toBe(
			"代表作。dbt-jobs、dbt-intro、enbu。dbt の CI/CD パイプライン、DuckDB と dbt Fusion、Cloudflare 上に置くデータ基盤。",
		);
	});
});
