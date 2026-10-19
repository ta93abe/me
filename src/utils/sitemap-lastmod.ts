import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { withTrailingSlash } from "./canonical.ts";

export type SitemapLastmodItem = {
	url: string;
	lastmod?: string;
};

const GADGETS_SOURCE = "src/data/gadgets.ts";
const TALKS_SOURCE = "src/data/talks.ts";
const SLIDES_DECKS_DIR = "src/slides/decks";
const SLIDES_INDEX_SOURCE = "src/pages/slides/index.astro";

const STATIC_PAGE_SOURCES = [
	{ pathname: "/", source: "src/pages/index.astro" },
	{ pathname: "/about/", source: "src/pages/about.astro" },
	{ pathname: "/works/", source: "src/pages/works.astro" },
	{ pathname: "/contact/", source: "src/pages/contact.astro" },
	{ pathname: "/links/", source: "src/pages/links.astro" },
	{ pathname: "/tools/", source: "src/pages/tools.astro" },
] as const;

export function toW3cLastmod(date: Date | string): string {
	const value = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(value.getTime())) {
		throw new TypeError(`Invalid lastmod date: ${String(date)}`);
	}
	return value.toISOString();
}

function sitemapPathname(url: string): string {
	return withTrailingSlash(new URL(url).pathname);
}

/** sitemap-0 用。`/blog/` は sitemap-blog.xml の責務。 */
export function includeInStaticSitemap(page: string): boolean {
	if (page.includes("/print") || page.includes("/og/")) {
		return false;
	}

	return !sitemapPathname(page).startsWith("/blog/");
}

function parseFrontmatterDate(raw: string | undefined): Date | undefined {
	if (!raw) {
		return undefined;
	}
	const value = raw.replace(/^["']|["']$/g, "").trim();
	if (!value) {
		return undefined;
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return undefined;
	}
	return date;
}

function maxDate(dates: Array<Date | undefined>): Date | undefined {
	let latest: Date | undefined;
	for (const date of dates) {
		if (!date) {
			continue;
		}
		if (!latest || date.getTime() > latest.getTime()) {
			latest = date;
		}
	}
	return latest;
}

function readGitLastmod(
	relativePath: string,
	rootDir: string,
): Date | undefined {
	try {
		const iso = execFileSync(
			"git",
			["log", "-1", "--format=%cI", "--", relativePath],
			{
				cwd: rootDir,
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			},
		).trim();
		if (!iso) {
			return undefined;
		}
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) {
			return undefined;
		}
		return date;
	} catch {
		// git missing, not a repo, or the path has no history
		return undefined;
	}
}

function setLastmod(
	lastmodByPath: Map<string, string>,
	pathname: string,
	date: Date | undefined,
): void {
	if (!date) {
		return;
	}
	lastmodByPath.set(pathname, toW3cLastmod(date));
}

function readSlideDates(
	rootDir: string,
): Array<{ slug: string; lastmod: Date }> {
	const decksDir = path.join(rootDir, SLIDES_DECKS_DIR);
	let files: string[] = [];
	try {
		files = readdirSync(decksDir);
	} catch {
		return [];
	}

	const slides: Array<{ slug: string; lastmod: Date }> = [];
	for (const file of files) {
		if (!file.endsWith(".md")) {
			continue;
		}
		const text = readFileSync(path.join(decksDir, file), "utf8");
		const slug = text.match(/^slug:\s*(.+)$/m)?.[1]?.trim();
		const lastmod = parseFrontmatterDate(
			text.match(/^updated:\s*(.+)$/m)?.[1] ??
				text.match(/^date:\s*(.+)$/m)?.[1],
		);
		if (!slug || !lastmod) {
			continue;
		}
		slides.push({ slug, lastmod });
	}
	return slides;
}

function readTalkDates(rootDir: string): Date[] {
	try {
		const text = readFileSync(path.join(rootDir, TALKS_SOURCE), "utf8");
		const dates: Date[] = [];
		for (const match of text.matchAll(
			/^\s*date:\s*["'](\d{4}-\d{2}-\d{2})["']/gm,
		)) {
			const date = parseFrontmatterDate(match[1]);
			if (date) {
				dates.push(date);
			}
		}
		return dates;
	} catch {
		return [];
	}
}

function lastmodForPath(
	pathname: string,
	lastmodByPath: ReadonlyMap<string, string>,
): string | undefined {
	const exact = lastmodByPath.get(pathname);
	if (exact) {
		return exact;
	}
	if (pathname.startsWith("/gadgets/")) {
		return lastmodByPath.get("/gadgets/");
	}
	if (pathname.startsWith("/slides/")) {
		return lastmodByPath.get("/slides/");
	}
	return undefined;
}

export function applyStaticSitemapLastmod(
	item: SitemapLastmodItem,
	lastmodByPath: ReadonlyMap<string, string>,
): SitemapLastmodItem {
	const lastmod = lastmodForPath(sitemapPathname(item.url), lastmodByPath);
	const next: SitemapLastmodItem = { ...item };
	delete next.lastmod;
	if (lastmod) {
		next.lastmod = lastmod;
	}
	return next;
}

/** sitemap-0.xml の lastmod。git / frontmatter / データの実更新日だけ。ビルド時刻は使わない。 */
export function createStaticSitemapSerializer(
	options: {
		rootDir?: string;
	} = {},
): (item: SitemapLastmodItem) => SitemapLastmodItem {
	const rootDir = options.rootDir ?? process.cwd();
	const lastmodByPath = new Map<string, string>();

	for (const page of STATIC_PAGE_SOURCES) {
		setLastmod(
			lastmodByPath,
			page.pathname,
			readGitLastmod(page.source, rootDir),
		);
	}

	setLastmod(
		lastmodByPath,
		"/gadgets/",
		readGitLastmod(GADGETS_SOURCE, rootDir),
	);
	setLastmod(
		lastmodByPath,
		"/talks/",
		readGitLastmod(TALKS_SOURCE, rootDir) ?? maxDate(readTalkDates(rootDir)),
	);

	const slides = readSlideDates(rootDir);
	setLastmod(
		lastmodByPath,
		"/slides/",
		maxDate([
			...slides.map((slide) => slide.lastmod),
			readGitLastmod(SLIDES_INDEX_SOURCE, rootDir),
		]),
	);
	for (const slide of slides) {
		setLastmod(lastmodByPath, `/slides/${slide.slug}/`, slide.lastmod);
	}

	return (item) => applyStaticSitemapLastmod(item, lastmodByPath);
}
