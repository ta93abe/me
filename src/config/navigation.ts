/**
 * Navigation configuration
 * ナビゲーションリンクの一元管理
 */

export interface NavLink {
	readonly href: string;
	readonly text: string;
}

/**
 * Header / モバイルメニュー前半に出す主軸
 */
export const PRIMARY_NAV_LINKS: readonly NavLink[] = [
	{ href: "/about", text: "About" },
	{ href: "/gallery", text: "Gallery" },
	{ href: "/blog", text: "Blog" },
	{ href: "/contact", text: "Contact" },
];

/**
 * フッター / モバイルメニュー後半に出す二次ページ
 *
 * Bookshelf は実本が揃うまで外す（TA-782 / TA-785）。
 * `/bookshelf` の URL 自体は残している。
 */
export const SECONDARY_NAV_LINKS: readonly NavLink[] = [
	{ href: "/atelier", text: "Atelier" },
	{ href: "/tools", text: "Tools" },
	{ href: "/slides", text: "Slides" },
	{ href: "/links", text: "Links" },
];

/**
 * Main navigation links
 * ヘッダーナビゲーションに表示するリンク
 */
export const NAV_LINKS: readonly NavLink[] = PRIMARY_NAV_LINKS;
