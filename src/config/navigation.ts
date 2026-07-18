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
 */
export const NAV_LINKS: readonly NavLink[] = [
	{ href: "/gallery", text: "Gallery" },
	{ href: "/atelier", text: "Atelier" },
	{ href: "/bookshelf", text: "Bookshelf" },
	{ href: "/blog", text: "Blog" },
	{ href: "/links", text: "Links" },
	{ href: "/tools", text: "Tools" },
	{ href: "/slides", text: "Slides" },
];
