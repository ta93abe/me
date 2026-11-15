import { parseFrontmatter } from "@astrojs/markdown-remark";

import { deckFrontmatterSchema } from "./mdx/deck-schema.ts";
import { DeckError, type Deck } from "./parser/types.ts";

/**
 * デッキ一覧（frontmatter だけ）。本文の描画は content collection の `render()` で行う。
 * Cloudflare / workerd 上の `astro dev` では Node の `fs` が使えないので、Vite の glob で埋め込む。
 */
const deckModules = import.meta.glob("./decks/*.mdx", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

function slugFromGlobKey(key: string): string {
	const filename = key.slice(key.lastIndexOf("/") + 1);
	return filename.replace(/\.mdx$/, "");
}

export function parseDeckFrontmatter(source: string, fileSlug?: string): Deck {
	const { frontmatter } = parseFrontmatter(source);
	const parsed = deckFrontmatterSchema.safeParse(frontmatter);
	if (!parsed.success) {
		const message = parsed.error.issues
			.map(
				(issue) => `${issue.path.join(".") || "frontmatter"}: ${issue.message}`,
			)
			.join(" / ");
		throw new DeckError(
			`frontmatter が不正です${fileSlug ? `（${fileSlug}.mdx）` : ""}: ${message}`,
		);
	}
	if (fileSlug !== undefined && fileSlug !== parsed.data.slug) {
		throw new DeckError(
			`ファイル名 ${fileSlug}.mdx と slug ${parsed.data.slug} が一致しません`,
		);
	}
	return { frontmatter: parsed.data };
}

export async function loadDecks(): Promise<Deck[]> {
	const decks = Object.entries(deckModules).map(([key, source]) =>
		parseDeckFrontmatter(source, slugFromGlobKey(key)),
	);
	return decks.toSorted(
		(a, b) =>
			b.frontmatter.date.localeCompare(a.frontmatter.date) ||
			a.frontmatter.slug.localeCompare(b.frontmatter.slug),
	);
}
