export const SITE = {
	name: "Takumi Abe",
	description:
		"ソフトウェアエンジニア Takumi Abe (ta93abe) のポートフォリオ。Gallery、Blog、Tools など。",
	author: "Takumi Abe",
	url: "https://ta93abe.com",
	slidesUrl: "https://slides.ta93abe.com",
	locale: "ja_JP",
	lang: "ja",
	/** X (Twitter) @handle — meta twitter:site / creator 用 */
	twitter: "@ta93abe_",
} as const;

export type SiteConfig = typeof SITE;
