export const SLIDE_TYPES = [
	"cover",
	"section",
	"body",
	"split",
	"quote",
	"code",
	"figure",
	"center",
	"end",
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];

export const COLOR_THEMES = ["dark", "light"] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

export const DECK_EFFECTS = ["snow"] as const;

export type DeckEffect = (typeof DECK_EFFECTS)[number];

export type DeckFrontmatter = {
	title: string;
	date: string;
	description: string;
	slug: string;
	theme: ColorTheme;
	accent?: string;
	accentDeep?: string;
	effect?: DeckEffect;
	event?: string;
	talkSlug?: string;
	unlisted?: boolean;
};

/** デッキ一覧で使う単位。本文は content collection の `render()` で描画する。 */
export type Deck = {
	frontmatter: DeckFrontmatter;
};

export class DeckError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DeckError";
	}
}

export function isSlideType(value: string): value is SlideType {
	return (SLIDE_TYPES as readonly string[]).includes(value);
}

export function isColorTheme(value: string): value is ColorTheme {
	return (COLOR_THEMES as readonly string[]).includes(value);
}

export function isDeckEffect(value: string): value is DeckEffect {
	return (DECK_EFFECTS as readonly string[]).includes(value);
}
