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
	alternateName: "ta93abe",
	jobTitle: "Software Engineer",
	/** Person スキーマ / About で使う立ち位置 */
	tagline: "データ基盤と CI を書くソフトウェアエンジニア。絵と音楽も置く。",
	interests: ["データ基盤", "CI/CD", "絵", "写真", "音楽"],
	/** GitHub / X / LinkedIn。Person.sameAs と About の SNS 欄で共有 */
	profiles: [
		{ name: "GitHub", url: "https://github.com/ta93abe" },
		{ name: "X", url: "https://x.com/ta93abe_" },
		{ name: "LinkedIn", url: "https://linkedin.com/in/ta93abe" },
	],
	/** Newsletter（Substack）。Links エントリと同じ公開 URL */
	substackUrl: "https://ta93abe.substack.com",
	/** 購読導線のリンク先。埋め込みウィジェットは使わない */
	substackSubscribeUrl: "https://ta93abe.substack.com/subscribe",
} as const;

export const SITE_SAME_AS = SITE.profiles.map((profile) => profile.url);

export type SiteConfig = typeof SITE;
