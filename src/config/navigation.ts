/**
 * Navigation configuration
 * ナビゲーションリンクの一元管理
 */

export interface NavLink {
	readonly href: string;
	readonly text: string;
}

/**
 * Main navigation links
 * ヘッダーナビゲーションに表示するリンク
 *
 * Gallery / Atelier / Bookshelf は公開コンテンツができるまで外す。
 * 旧 URL は `astro.config.mjs` で `/` へリダイレクトする。
 */
export const NAV_LINKS: readonly NavLink[] = [
	{ href: "/blog", text: "Blog" },
	{ href: "/links", text: "Links" },
	{ href: "/tools", text: "Tools" },
	{ href: "/slides", text: "Slides" },
];
