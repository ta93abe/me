import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { withTrailingSlash } from "./canonical.ts";

export type SitemapLastmodItem = {
	url: string;
	lastmod?: string;
};

const GADGETS_SOURCE = "src/data/gadgets.ts";
const TALKS_SOURCE = "src/data/talks.ts";
const SLIDES_DECKS_DIR = "src/slides/decks";

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

function readSourceLastmod(
	relativePath: string,
	fallback: Date,
	rootDir: string,
): Date {
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
		if (iso) {
			const date = new Date(iso);
			if (!Number.isNaN(date.getTime())) {
				return date;
			}
		}
	} catch {
		// git missing, not a repo, or the path has no history
	}

	try {
		return statSync(path.join(rootDir, relativePath)).mtime;
	} catch {
		return fallback;
	}
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
		const date = text.match(/^date:\s*(.+)$/m)?.[1]?.trim();
		if (!slug || !date) {
			continue;
		}
		const lastmod = new Date(date);
		if (Number.isNaN(lastmod.getTime())) {
			continue;
		}
		slides.push({ slug, lastmod });
	}
	return slides;
}

function lastmodForPath(
	pathname: string,
	lastmodByPath: ReadonlyMap<string, string>,
	fallbackLastmod: string,
): string {
	const exact = lastmodByPath.get(pathname);
	if (exact) {
		return exact;
	}
	if (pathname.startsWith("/gadgets/")) {
		const gadget = lastmodByPath.get("/gadgets/");
		if (gadget) {
			return gadget;
		}
	}
	if (pathname.startsWith("/slides/")) {
		const slides = lastmodByPath.get("/slides/");
		if (slides) {
			return slides;
		}
	}
	return fallbackLastmod;
}

export function applyStaticSitemapLastmod(
	item: SitemapLastmodItem,
	lastmodByPath: ReadonlyMap<string, string>,
	fallbackLastmod: string,
): SitemapLastmodItem & { lastmod: string } {
	return {
		...item,
		lastmod: lastmodForPath(
			sitemapPathname(item.url),
			lastmodByPath,
			fallbackLastmod,
		),
	};
}

export function createStaticSitemapSerializer(
	options: {
		now?: Date;
		rootDir?: string;
	} = {},
): (item: SitemapLastmodItem) => SitemapLastmodItem & { lastmod: string } {
	const now = options.now ?? new Date();
	const rootDir = options.rootDir ?? process.cwd();
	const fallbackLastmod = toW3cLastmod(now);
	const lastmodByPath = new Map<string, string>();

	for (const page of STATIC_PAGE_SOURCES) {
		lastmodByPath.set(
			page.pathname,
			toW3cLastmod(readSourceLastmod(page.source, now, rootDir)),
		);
	}

	lastmodByPath.set(
		"/gadgets/",
		toW3cLastmod(readSourceLastmod(GADGETS_SOURCE, now, rootDir)),
	);
	lastmodByPath.set(
		"/talks/",
		toW3cLastmod(readSourceLastmod(TALKS_SOURCE, now, rootDir)),
	);

	const slides = readSlideDates(rootDir);
	const slideTimes = slides.map((slide) => slide.lastmod.getTime());
	const slidesIndexSource = readSourceLastmod(
		"src/pages/slides/index.astro",
		now,
		rootDir,
	);
	const slidesIndex = slideTimes.length
		? new Date(Math.max(...slideTimes, slidesIndexSource.getTime()))
		: slidesIndexSource;
	lastmodByPath.set("/slides/", toW3cLastmod(slidesIndex));
	for (const slide of slides) {
		lastmodByPath.set(`/slides/${slide.slug}/`, toW3cLastmod(slide.lastmod));
	}

	lastmodByPath.set("/blog/", fallbackLastmod);

	return (item) =>
		applyStaticSitemapLastmod(item, lastmodByPath, fallbackLastmod);
}
