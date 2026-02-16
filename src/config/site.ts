export const SITE = {
	name: "Portfolio",
	description: "個人ポートフォリオサイト",
	author: "Takumi Abe",
	url: "https://ta93abe.com",
	slidesUrl: "https://slides.ta93abe.com",
	locale: "ja_JP",
	lang: "ja",
	ensName: "ta93abe.eth",
} as const;

export type SiteConfig = typeof SITE;
