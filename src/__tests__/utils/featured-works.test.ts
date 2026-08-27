import { describe, expect, it } from "vitest";

import { isExternalHref, resolveFeaturedWorks } from "@/utils/featured-works";

const gallery = [
	{
		id: "dbt-jobs",
		title: "dbt-jobs",
		excerpt:
			"dbt の CI/CD パイプラインを GitHub Actions で実行するための composite action。",
	},
	{
		id: "quiet-frame",
		title: "静かな枠",
		excerpt: "余白と一枚の画像だけで成立する展示の試作。",
	},
];

describe("resolveFeaturedWorks", () => {
	it("puts selected gallery pieces first and fills to 3 with fallbacks", () => {
		const featured = resolveFeaturedWorks(gallery);

		expect(featured).toHaveLength(3);
		expect(featured[0]).toMatchObject({
			href: "/gallery/dbt-jobs",
			title: "dbt-jobs",
			source: "gallery",
		});
		expect(featured[1]?.source).toBe("fallback");
		expect(featured[2]?.source).toBe("fallback");
	});

	it("skips missing gallery ids and still returns fallbacks", () => {
		const featured = resolveFeaturedWorks(gallery, {
			galleryIds: ["missing", "dbt-jobs"],
			limit: 2,
		});

		expect(featured).toHaveLength(2);
		expect(featured[0]?.href).toBe("/gallery/dbt-jobs");
		expect(featured[1]?.source).toBe("fallback");
	});

	it("uses only gallery pieces when 3 ids resolve", () => {
		const featured = resolveFeaturedWorks(
			[
				...gallery,
				{
					id: "real-drawing",
					title: "本物の絵",
					excerpt: "差し替え後の作品。",
				},
			],
			{
				galleryIds: ["dbt-jobs", "real-drawing", "quiet-frame"],
			},
		);

		expect(featured.map((work) => work.source)).toEqual([
			"gallery",
			"gallery",
			"gallery",
		]);
		expect(featured.map((work) => work.href)).toEqual([
			"/gallery/dbt-jobs",
			"/gallery/real-drawing",
			"/gallery/quiet-frame",
		]);
	});
});

describe("isExternalHref", () => {
	it("detects absolute http(s) urls", () => {
		expect(isExternalHref("https://github.com/ta93abe/dbt-intro")).toBe(true);
		expect(isExternalHref("/gallery/dbt-jobs")).toBe(false);
	});
});
