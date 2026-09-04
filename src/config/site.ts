export const SITE = {
	name: "Takumi Abe",
	handle: "ta93abe",
	tagline: "データ基盤と CI を書くソフトウェアエンジニア。絵と音楽も置く。",
	description:
		"データ基盤と CI を書くソフトウェアエンジニア、Takumi Abe (ta93abe) のポートフォリオ。絵と音楽も置く。",
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

/**
 * トップの次の行動。Gallery は公開コンテンツができるまで出さない。
 * Contact フォームは TA-789。ナビ本整理は TA-785。
 */
export const HOME_CTAS = [
	{ href: "/about", label: "About", variant: "secondary" },
	{ href: "/blog", label: "Blog", variant: "primary" },
	{ href: "/contact", label: "Contact", variant: "secondary" },
] as const;

export type FeaturedWork = {
	href: string;
	title: string;
	excerpt: string;
};

/**
 * トップに出す代表作。blog か GitHub。Gallery の URL は使わない。
 */
export const FEATURED_WORKS: readonly FeaturedWork[] = [
	{
		href: "https://github.com/ta93abe/dbt-jobs",
		title: "dbt-jobs",
		excerpt:
			"dbt の CI/CD パイプラインを GitHub Actions で実行する composite action。",
	},
	{
		href: "https://github.com/ta93abe/dbt-intro",
		title: "dbt-intro",
		excerpt: "DuckDB と dbt Fusion で組んだ、小売 MDM の入門デモ。",
	},
	{
		href: "https://github.com/ta93abe/enbu",
		title: "enbu",
		excerpt: "Cloudflare 上に置くデータ基盤。",
	},
];
