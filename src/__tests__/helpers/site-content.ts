import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
	gadgetFrontmatterSchema,
	gadgetsFromEntries,
	linkFrontmatterSchema,
	sortByOrder,
	talkFrontmatterSchema,
	talksFromEntries,
	workFrontmatterSchema,
	type FeaturedWork,
	type SiteLink,
} from "@/lib/content/site-data";
import type { Gadget } from "@/lib/gadgets/gadgets";
import type { Talk } from "@/lib/talks/talks";

const CONTENT_DIR = path.resolve(import.meta.dirname, "../../content");

/**
 * テスト用。`key: value` だけの平坦な frontmatter を読む（値は JSON の文字列・数値・真偽値）。
 * 本番は `astro:content` が読むので、ここはテストから実データを見るためだけに使う。
 */
export function readFlatFrontmatter(source: string): Record<string, unknown> {
	const match = source.match(/^---\n([\s\S]*?)\n---/);
	if (!match?.[1]) {
		throw new Error("frontmatter がありません");
	}
	const data: Record<string, unknown> = {};
	for (const line of match[1].split("\n")) {
		const field = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
		if (!field?.[1] || !field[2]) {
			throw new Error(`平坦な key: value ではありません: ${line}`);
		}
		data[field[1]] = JSON.parse(field[2]);
	}
	return data;
}

export function readCollection(name: string): { id: string; data: unknown }[] {
	const dir = path.join(CONTENT_DIR, name);
	return readdirSync(dir)
		.filter((file) => file.endsWith(".mdx"))
		.map((file) => ({
			id: file.replace(/\.mdx$/, ""),
			data: readFlatFrontmatter(readFileSync(path.join(dir, file), "utf8")),
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
