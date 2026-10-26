import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GADGETS } from "@/data/gadgets";
import {
	applyStaticSitemapLastmod,
	createStaticSitemapSerializer,
	includeInStaticSitemap,
	toW3cLastmod,
	type SitemapLastmodItem,
} from "@/utils/sitemap-lastmod";

import { buildBlogSitemapXml } from "../../../worker/content/derived.ts";

const W3C_DATETIME =
	/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

const STATIC_SITEMAP_URLS = [
	"https://ta93abe.com/",
	"https://ta93abe.com/about/",
	"https://ta93abe.com/contact/",
	"https://ta93abe.com/gadgets/",
	"https://ta93abe.com/links/",
	"https://ta93abe.com/talks/",
	"https://ta93abe.com/slides/",
	"https://ta93abe.com/slides/snowflake-clickops-limits/",
	"https://ta93abe.com/slides/snowflake-dbt/",
	"https://ta93abe.com/slides/snowflake-observability/",
	"https://ta93abe.com/tools/",
	"https://ta93abe.com/works/",
] as const;

const BUILD_TIME = "2099-01-01T00:00:00.000Z";

function sitemapLocs(xml: string): string[] {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
		(match) => match[1] ?? "",
	);
}

function writeFixture(rootDir: string, relativePath: string, contents: string) {
	const filePath = path.join(rootDir, relativePath);
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, contents);
}

const TALKS_FIXTURE = `export const TALKS = [
	{
		slug: "newer",
		date: "2026-08-27",
	},
	{
		slug: "older",
		date: "2026-05-14",
	},
];
`;

const SLIDE_FIXTURE = `---
slug: demo
date: 2026-03-02
updated: 2026-04-08
---
`;

const CONTACT_COMMIT_DATE = "2026-09-08T14:08:00Z";
const GADGETS_COMMIT_DATE = "2026-09-18T12:58:00Z";
const SLIDES_COMMIT_DATE = "2026-10-03T06:21:53Z";

function fixtureRoot(): string {
	const rootDir = mkdtempSync(path.join(tmpdir(), "sitemap-lastmod-"));
	writeFixture(rootDir, "src/data/talks.ts", TALKS_FIXTURE);
	writeFixture(rootDir, "src/data/gadgets.ts", "export const GADGETS = [];\n");
	writeFixture(rootDir, "src/slides/decks/demo.md", SLIDE_FIXTURE);
	writeFixture(rootDir, "src/pages/index.astro", "<h1>home</h1>\n");
	return rootDir;
}

function git(
	cwd: string,
	args: string[],
	env: Record<string, string> = {},
): string {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		env: {
			...process.env,
			GIT_AUTHOR_NAME: "Test",
			GIT_AUTHOR_EMAIL: "test@example.com",
			GIT_COMMITTER_NAME: "Test",
			GIT_COMMITTER_EMAIL: "test@example.com",
			GIT_CONFIG_COUNT: "1",
			GIT_CONFIG_KEY_0: "commit.gpgsign",
			GIT_CONFIG_VALUE_0: "false",
			...env,
		},
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

function commitFile(
	rootDir: string,
	relativePath: string,
	contents: string,
	date: string,
) {
	writeFixture(rootDir, relativePath, contents);
	git(rootDir, ["add", relativePath]);
	git(rootDir, ["commit", "-m", relativePath], {
		GIT_AUTHOR_DATE: date,
		GIT_COMMITTER_DATE: date,
	});
}

/** 複数コミットの履歴があるリポジトリ。最後はスライドだけを変える。 */
function gitHistoryFixture(): string {
	const rootDir = mkdtempSync(path.join(tmpdir(), "sitemap-git-"));
	git(rootDir, ["init", "-b", "main"]);
	git(rootDir, ["config", "user.email", "test@example.com"]);
	git(rootDir, ["config", "user.name", "Test"]);
	git(rootDir, ["config", "commit.gpgsign", "false"]);
	commitFile(
		rootDir,
		"src/pages/contact.astro",
		"<h1>contact</h1>\n",
		CONTACT_COMMIT_DATE,
	);
	commitFile(
		rootDir,
		"src/data/gadgets.ts",
		"export const GADGETS = [];\n",
		GADGETS_COMMIT_DATE,
	);
	commitFile(
		rootDir,
		"src/data/talks.ts",
		TALKS_FIXTURE,
		"2026-09-27T00:06:00Z",
	);
	commitFile(
		rootDir,
		"src/slides/decks/demo.md",
		SLIDE_FIXTURE,
		SLIDES_COMMIT_DATE,
	);
	return rootDir;
}

function shallowClone(source: string): string {
	const dest = mkdtempSync(path.join(tmpdir(), "sitemap-shallow-"));
	git(source, ["clone", "--no-local", "--depth=1", source, dest]);
	return dest;
}

describe("includeInStaticSitemap", () => {
	it("keeps the current static sitemap URLs", () => {
		for (const url of STATIC_SITEMAP_URLS) {
			expect(includeInStaticSitemap(url), url).toBe(true);
		}
	});

	it("drops thin gadget detail pages until they opt back in", () => {
		expect(includeInStaticSitemap("https://ta93abe.com/gadgets/")).toBe(true);
		expect(GADGETS.length).toBeGreaterThan(0);
		for (const gadget of GADGETS) {
			expect(
				includeInStaticSitemap(`https://ta93abe.com/gadgets/${gadget.slug}/`),
				gadget.slug,
			).toBe(false);
		}
	});

	it("leaves /blog/ and post URLs to sitemap-blog", () => {
		expect(includeInStaticSitemap("https://ta93abe.com/blog/")).toBe(false);
		expect(includeInStaticSitemap("https://ta93abe.com/blog")).toBe(false);
		expect(
			includeInStaticSitemap("https://ta93abe.com/blog/hello-world/"),
		).toBe(false);
	});

	it("still drops print and OG routes", () => {
		expect(
			includeInStaticSitemap("https://ta93abe.com/slides/showcase/print/"),
		).toBe(false);
		expect(
			includeInStaticSitemap("https://ta93abe.com/og/blog/hello-world.png"),
		).toBe(false);
	});

	it("drops unlisted slide player URLs", () => {
		expect(includeInStaticSitemap("https://ta93abe.com/slides/light/")).toBe(
			false,
		);
		expect(includeInStaticSitemap("https://ta93abe.com/slides/showcase/")).toBe(
			false,
		);
	});

	it("drops unlisted slugs from a fixture tree", () => {
		const rootDir = fixtureRoot();
		writeFixture(
			rootDir,
			"src/slides/decks/hidden.md",
			`---
slug: hidden
date: 2026-05-01
unlisted: true
---
`,
		);

		expect(
			includeInStaticSitemap("https://ta93abe.com/slides/hidden/", {
				rootDir,
			}),
		).toBe(false);
		expect(
			includeInStaticSitemap("https://ta93abe.com/slides/demo/", { rootDir }),
		).toBe(true);
	});

	it("has no overlap with the blog sitemap", () => {
		const blogLocs = new Set(
			sitemapLocs(
				buildBlogSitemapXml(
					[
						{
							slug: "hello-world",
							title: "Hello",
							excerpt: "from r2",
							publish_date: new Date("2026-08-30T00:00:00.000Z"),
						},
					],
					"https://ta93abe.com",
				),
			),
		);

		expect(blogLocs.has("https://ta93abe.com/blog/")).toBe(true);
		expect(STATIC_SITEMAP_URLS.filter((url) => blogLocs.has(url))).toEqual([]);
	});
});

describe("toW3cLastmod", () => {
	it("formats Date values as W3C Datetime", () => {
		expect(toW3cLastmod(new Date("2026-09-16T15:00:00.000Z"))).toBe(
			"2026-09-16T15:00:00.000Z",
		);
	});

	it("formats date-only strings as UTC midnight", () => {
		expect(toW3cLastmod("2026-09-06")).toBe("2026-09-06T00:00:00.000Z");
	});
});

describe("applyStaticSitemapLastmod", () => {
	it("uses a path-specific lastmod when present", () => {
		const item = applyStaticSitemapLastmod(
			{
				url: "https://ta93abe.com/about/",
				changefreq: "monthly",
			} as SitemapLastmodItem & { changefreq: string },
			new Map([["/about/", "2026-04-01T00:00:00.000Z"]]),
		);

		expect(item.lastmod).toBe("2026-04-01T00:00:00.000Z");
		expect(
			(item as SitemapLastmodItem & { changefreq: string }).changefreq,
		).toBe("monthly");
	});

	it("omits lastmod when the path has no content date", () => {
		const item = applyStaticSitemapLastmod(
			{
				url: "https://ta93abe.com/unknown/",
				lastmod: BUILD_TIME,
			},
			new Map(),
		);

		expect(item.lastmod).toBeUndefined();
	});
});

describe("createStaticSitemapSerializer", () => {
	it("stamps known static URLs with a content lastmod, not a build time", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});

		const lastmods = STATIC_SITEMAP_URLS.map((url) => {
			const item = serialize({ url, lastmod: BUILD_TIME });
			if (item.lastmod) {
				expect(item.lastmod, url).toMatch(W3C_DATETIME);
				expect(Number.isNaN(new Date(item.lastmod).getTime()), url).toBe(false);
				expect(new Date(item.lastmod).getTime(), url).toBeLessThan(
					new Date(BUILD_TIME).getTime(),
				);
			}
			return item.lastmod;
		});

		const unique = new Set(lastmods.filter((value) => value !== undefined));
		expect(unique.size).toBeGreaterThan(1);
		expect(unique.has(BUILD_TIME)).toBe(false);
	});

	it("omits lastmod for /blog/ instead of using the build timestamp", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/blog/",
			lastmod: BUILD_TIME,
		});

		expect(item.lastmod).toBeUndefined();
	});

	it("prefers gadget source dates over the build timestamp", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/gadgets/mac-studio/",
			lastmod: BUILD_TIME,
		});

		expect(item.lastmod).toMatch(W3C_DATETIME);
		expect(new Date(item.lastmod ?? "").getTime()).toBeLessThan(
			new Date(BUILD_TIME).getTime(),
		);
	});

	it("uses slide frontmatter dates for deck URLs", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: process.cwd(),
		});
		const item = serialize({
			url: "https://ta93abe.com/slides/snowflake-observability/",
			lastmod: BUILD_TIME,
		});

		expect(item.lastmod).toBe("2026-10-01T00:00:00.000Z");
	});

	it("ignores unlisted decks when stamping /slides/ lastmod", () => {
		const rootDir = fixtureRoot();
		writeFixture(
			rootDir,
			"src/slides/decks/hidden.md",
			`---
slug: hidden
date: 2026-12-01
unlisted: true
---
`,
		);
		const serialize = createStaticSitemapSerializer({ rootDir });

		expect(
			serialize({
				url: "https://ta93abe.com/slides/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe("2026-04-08T00:00:00.000Z");
		expect(
			serialize({
				url: "https://ta93abe.com/slides/hidden/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe("2026-04-08T00:00:00.000Z");
	});

	it("uses talk and slide content dates when git history is missing", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: fixtureRoot(),
		});

		expect(
			serialize({
				url: "https://ta93abe.com/talks/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe("2026-08-27T00:00:00.000Z");
		expect(
			serialize({
				url: "https://ta93abe.com/slides/demo/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe("2026-04-08T00:00:00.000Z");
		expect(
			serialize({
				url: "https://ta93abe.com/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBeUndefined();
		expect(
			serialize({
				url: "https://ta93abe.com/gadgets/mac-studio/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBeUndefined();
		expect(
			serialize({
				url: "https://ta93abe.com/blog/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBeUndefined();
	});

	it("uses per-file git dates when the clone has full history", () => {
		const serialize = createStaticSitemapSerializer({
			rootDir: gitHistoryFixture(),
		});

		expect(
			serialize({
				url: "https://ta93abe.com/contact/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe(toW3cLastmod(CONTACT_COMMIT_DATE));
		expect(
			serialize({
				url: "https://ta93abe.com/gadgets/mac-studio/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe(toW3cLastmod(GADGETS_COMMIT_DATE));
		expect(
			serialize({
				url: "https://ta93abe.com/slides/demo/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe("2026-04-08T00:00:00.000Z");
	});

	it("omits git lastmods on a shallow clone instead of stamping HEAD on every URL", () => {
		const source = gitHistoryFixture();
		const shallowDir = shallowClone(source);
		git(shallowDir, ["remote", "remove", "origin"]);
		expect(git(shallowDir, ["rev-parse", "--is-shallow-repository"])).toBe(
			"true",
		);

		const headTime = toW3cLastmod(
			git(shallowDir, ["log", "-1", "--format=%cI"]),
		);
		expect(headTime).toBe(toW3cLastmod(SLIDES_COMMIT_DATE));

		const serialize = createStaticSitemapSerializer({
			rootDir: shallowDir,
		});
		const contact = serialize({
			url: "https://ta93abe.com/contact/",
			lastmod: BUILD_TIME,
		});
		const gadgets = serialize({
			url: "https://ta93abe.com/gadgets/mac-studio/",
			lastmod: BUILD_TIME,
		});
		const talks = serialize({
			url: "https://ta93abe.com/talks/",
			lastmod: BUILD_TIME,
		});
		const slide = serialize({
			url: "https://ta93abe.com/slides/demo/",
			lastmod: BUILD_TIME,
		});

		expect(contact.lastmod).toBeUndefined();
		expect(gadgets.lastmod).toBeUndefined();
		expect(talks.lastmod).toBe("2026-08-27T00:00:00.000Z");
		expect(slide.lastmod).toBe("2026-04-08T00:00:00.000Z");

		const lastmods = [
			contact.lastmod,
			gadgets.lastmod,
			talks.lastmod,
			slide.lastmod,
		];
		expect(lastmods.filter((value) => value === headTime)).toEqual([]);
		expect(new Set(lastmods.filter((value) => value !== undefined)).size).toBe(
			2,
		);
	});

	it("unshallows a clone that still has origin before reading git lastmods", () => {
		const shallowDir = shallowClone(gitHistoryFixture());
		expect(git(shallowDir, ["rev-parse", "--is-shallow-repository"])).toBe(
			"true",
		);

		const serialize = createStaticSitemapSerializer({
			rootDir: shallowDir,
		});

		expect(git(shallowDir, ["rev-parse", "--is-shallow-repository"])).toBe(
			"false",
		);
		expect(
			serialize({
				url: "https://ta93abe.com/contact/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe(toW3cLastmod(CONTACT_COMMIT_DATE));
		expect(
			serialize({
				url: "https://ta93abe.com/gadgets/mac-studio/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe(toW3cLastmod(GADGETS_COMMIT_DATE));
	});

	it("restores per-file git dates after git fetch --unshallow", () => {
		const source = gitHistoryFixture();
		const shallowDir = shallowClone(source);
		git(shallowDir, ["fetch", "--unshallow"]);
		expect(git(shallowDir, ["rev-parse", "--is-shallow-repository"])).toBe(
			"false",
		);

		const serialize = createStaticSitemapSerializer({
			rootDir: shallowDir,
		});

		expect(
			serialize({
				url: "https://ta93abe.com/contact/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe(toW3cLastmod(CONTACT_COMMIT_DATE));
		expect(
			serialize({
				url: "https://ta93abe.com/gadgets/mac-studio/",
				lastmod: BUILD_TIME,
			}).lastmod,
		).toBe(toW3cLastmod(GADGETS_COMMIT_DATE));
	});
});
