import { describe, expect, it } from "vitest";

import { buildLlmsFullText } from "../content/blog-manifest.ts";
import {
	EMPTY_SITE_MANIFEST,
	loadSiteManifest,
	SITE_MANIFEST_PATH,
	siteManifestFromJson,
} from "../content/site-manifest.ts";

const ORIGIN = "https://ta93abe.com";

const site = {
	works: [
		{
			href: "https://github.com/ta93abe/dbt-jobs",
			title: "dbt-jobs",
			excerpt: "dbt の CI/CD。",
		},
	],
	links: [
		{ name: "GitHub", url: "https://github.com/ta93abe", icon: "github" },
	],
};

function assets(byPath: Record<string, unknown>) {
	const requested: string[] = [];
	return {
		requested,
		fetch: async (request: Request) => {
			const { pathname } = new URL(request.url);
			requested.push(pathname);
			const body = byPath[pathname];
			return body === undefined
				? new Response("not found", { status: 404 })
				: Response.json(body);
		},
	};
}

describe("siteManifestFromJson", () => {
	it("keeps well-formed works and links and drops the rest", () => {
		expect(
			siteManifestFromJson({
				works: [...site.works, { title: "no href" }, "x"],
				links: [...site.links, { name: "no url", icon: "x" }],
			}),
		).toEqual(site);
	});

	it("returns an empty manifest for non-objects", () => {
		expect(siteManifestFromJson(null)).toEqual(EMPTY_SITE_MANIFEST);
		expect(siteManifestFromJson([])).toEqual(EMPTY_SITE_MANIFEST);
	});
});

describe("loadSiteManifest", () => {
	it("reads /site.json from ASSETS", async () => {
		const fetcher = assets({ [SITE_MANIFEST_PATH]: site });
		expect(await loadSiteManifest(fetcher, ORIGIN)).toEqual(site);
		expect(fetcher.requested).toEqual([SITE_MANIFEST_PATH]);
	});

	it("falls back to empty when the asset is missing", async () => {
		expect(await loadSiteManifest(assets({}), ORIGIN)).toEqual(
			EMPTY_SITE_MANIFEST,
		);
		expect(await loadSiteManifest(undefined, ORIGIN)).toEqual(
			EMPTY_SITE_MANIFEST,
		);
	});
});

describe("llms-full.txt", () => {
	it("inlines works and links from /site.json", async () => {
		const full = await buildLlmsFullText(
			assets({ [SITE_MANIFEST_PATH]: site, "/blog.json": { posts: [] } }),
			ORIGIN,
		);
		expect(full).toContain(
			"- [dbt-jobs](https://github.com/ta93abe/dbt-jobs) — dbt の CI/CD。",
		);
		expect(full).toContain("- [GitHub](https://github.com/ta93abe)");
	});
});
