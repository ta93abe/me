import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parseFrontmatter } from "@astrojs/markdown-remark";

import {
	gadgetFrontmatterSchema,
	gadgetsFromEntries,
	linkFrontmatterSchema,
	pageFrontmatterSchema,
	sortByOrder,
	talkFrontmatterSchema,
	talksFromEntries,
	toolCategoriesFromEntries,
	toolCategoryFrontmatterSchema,
	workFrontmatterSchema,
	type FeaturedWork,
	type PageCopy,
	type SiteLink,
	type ToolCategory,
} from "@/lib/content/site-data";
import type { Gadget } from "@/lib/gadgets/gadgets";
import type { Talk } from "@/lib/talks/talks";

/** テスト用。本番は `astro:content` が読む。ここはテストから実データを見るためだけに使う。 */
const CONTENT_DIR = path.resolve(import.meta.dirname, "../../content");

export function readCollection(name: string): { id: string; data: unknown }[] {
	const dir = path.join(CONTENT_DIR, name);
	return readdirSync(dir)
		.filter((file) => file.endsWith(".mdx"))
		.map((file) => ({
			id: file.replace(/\.mdx$/, ""),
			data: parseFrontmatter(readFileSync(path.join(dir, file), "utf8"))
				.frontmatter as unknown,
		}));
}

export function readWorks(): FeaturedWork[] {
	const entries = readCollection("works").map((entry) => ({
		id: entry.id,
		data: workFrontmatterSchema.parse(entry.data),
	}));
	return sortByOrder("works", entries).map(({ data }) => ({
		href: data.href,
		title: data.title,
		excerpt: data.excerpt,
	}));
}

export function readLinks(): SiteLink[] {
	const entries = readCollection("links").map((entry) => ({
		id: entry.id,
		data: linkFrontmatterSchema.parse(entry.data),
	}));
	return sortByOrder("links", entries).map(({ data }) => ({
		name: data.name,
		url: data.url,
		icon: data.icon,
	}));
}

export function readTalks(): Talk[] {
	return talksFromEntries(
		readCollection("talks").map((entry) => ({
			id: entry.id,
			data: talkFrontmatterSchema.parse(entry.data),
		})),
	);
}

export function readGadgets(): Gadget[] {
	return gadgetsFromEntries(
		readCollection("gadgets").map((entry) => ({
			id: entry.id,
			data: gadgetFrontmatterSchema.parse(entry.data),
		})),
	);
}

export function readToolCategories(): ToolCategory[] {
	return toolCategoriesFromEntries(
		readCollection("tools").map((entry) => ({
			id: entry.id,
			data: toolCategoryFrontmatterSchema.parse(entry.data),
		})),
	);
}

export function readPageCopy(id: string): PageCopy {
	const entry = readCollection("pages").find((page) => page.id === id);
	if (!entry) {
		throw new Error(`src/content/pages/${id}.mdx がありません`);
	}
	return pageFrontmatterSchema.parse(entry.data);
}
