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
 * Bookshelf は実本が揃うまで外す（TA-782 / TA-785）。
 * `/bookshelf` の URL 自体は残している。
 */
export const NAV_LINKS: readonly NavLink[] = [
	{ href: "/gallery", text: "Gallery" },
	{ href: "/atelier", text: "Atelier" },
	{ href: "/blog", text: "Blog" },
	{ href: "/links", text: "Links" },
	{ href: "/tools", text: "Tools" },
	{ href: "/slides", text: "Slides" },
	{ href: "/contact", text: "Contact" },
];
