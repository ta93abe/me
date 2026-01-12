/**
 * Navigation configuration
 * ナビゲーションリンクの一元管理
 */

export interface NavLink {
	href: string;
	text: string;
}

/**
 * Main navigation links
 * ヘッダーナビゲーションに表示するリンク
 */
export const NAV_LINKS: NavLink[] = [
	{ href: "/works", text: "Works" },
	{ href: "/links", text: "Links" },
	{ href: "/blog", text: "Blog" },
	{ href: "/slides", text: "Slides" },
] as const;

/**
 * Footer navigation links (if needed in future)
 * フッターナビゲーション用（将来的に使用）
 */
export const FOOTER_LINKS: NavLink[] = [
	{ href: "/", text: "Home" },
	{ href: "/works", text: "Works" },
	{ href: "/blog", text: "Blog" },
] as const;
