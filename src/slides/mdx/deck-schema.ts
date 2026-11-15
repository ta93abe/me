import { z } from "astro/zod";

import { parseAccent } from "../parser/accent.ts";
import {
	COLOR_THEMES,
	DECK_EFFECTS,
	DeckError,
	type DeckFrontmatter,
} from "../parser/types.ts";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const nonEmpty = z.string().trim().min(1);

/** YAML の日付（Date）も文字列も `YYYY-MM-DD` にそろえる。 */
const deckDate = z
	.union([z.date(), z.string()])
	.transform((value) =>
		value instanceof Date ? value.toISOString().slice(0, 10) : value.trim(),
	)
	.refine((value) => DATE.test(value), "date は YYYY-MM-DD にしてください");

/**
 * デッキの frontmatter（ADR-0002 決定 2）。色コードや未知キーは書けない（`.strict()`）。
 * accent は紫以外を使うときだけ書き、ビルド時に深い色を計算する。
 */
export const deckFrontmatterSchema = z
	.object({
		title: nonEmpty,
		date: deckDate,
		description: nonEmpty,
		slug: z.string().regex(SLUG, "slug は英小文字・数字・ハイフンだけです"),
		theme: z.enum(COLOR_THEMES).default("dark"),
		accent: z.string().optional(),
		effect: z.enum(DECK_EFFECTS).optional(),
		event: nonEmpty.optional(),
		talkSlug: z
			.string()
			.regex(SLUG, "talkSlug は英小文字・数字・ハイフンだけです")
			.optional(),
		unlisted: z.boolean().default(false),
	})
	.strict()
	.transform((data, ctx): DeckFrontmatter => {
		let accent: { accent: string; accentDeep: string } | undefined;
		if (data.accent !== undefined) {
			try {
				accent = parseAccent(data.accent);
			} catch (error) {
				ctx.addIssue({
					code: "custom",
					path: ["accent"],
					message: error instanceof DeckError ? error.message : String(error),
				});
				return z.NEVER;
			}
		}
		return {
			title: data.title,
			date: data.date,
			description: data.description,
			slug: data.slug,
			theme: data.theme,
			...accent,
			...(data.effect ? { effect: data.effect } : {}),
			...(data.event ? { event: data.event } : {}),
			...(data.talkSlug ? { talkSlug: data.talkSlug } : {}),
			...(data.unlisted ? { unlisted: true } : {}),
		};
	});
