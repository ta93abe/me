export const SITE = {
	name: "Takumi Abe",
	description:
		"ソフトウェアエンジニア Takumi Abe (ta93abe) のポートフォリオ。Works、Gallery、Blog など。",
	author: "Takumi Abe",
	url: "https://ta93abe.com",
	slidesUrl: "https://slides.ta93abe.com",
	locale: "ja_JP",
	lang: "ja",
	/** X (Twitter) @handle — meta twitter:site / creator 用 */
	twitter: "@ta93abe_",
	/** Newsletter（Substack）。Links エントリと同じ公開 URL */
	substackUrl: "https://ta93abe.substack.com",
	/** 購読導線のリンク先。埋め込みウィジェットは使わない */
	substackSubscribeUrl: "https://ta93abe.substack.com/subscribe",
} as const;

export type SiteConfig = typeof SITE;
