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
	{ href: "/works", text: "Works" },
	{ href: "/links", text: "Links" },
	{ href: "/blog", text: "Blog" },
	{ href: "/slides", text: "Slides" },
];

/**
 * Footer navigation links (if needed in future)
 * フッターナビゲーション用（将来的に使用）
 */
export const FOOTER_LINKS: readonly NavLink[] = [
	{ href: "/", text: "Home" },
	{ href: "/works", text: "Works" },
	{ href: "/blog", text: "Blog" },
];
