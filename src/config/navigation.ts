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
];

export interface RecoveryLink {
	readonly href: string;
	readonly label: string;
	readonly meta: string;
}

/**
 * 404 から人のページへ戻る索引。
 * `/careers` や `/jobs` はリダイレクトせず、About へのリンクで足りる。
 * `/contact` は独立ページなので About へ送らない。
 */
export const NOT_FOUND_RECOVERY_LINKS: readonly RecoveryLink[] = [
	{ href: "/about", label: "About", meta: "The person" },
	{ href: "/contact", label: "Contact", meta: "Say hello" },
	{ href: "/gallery", label: "Gallery", meta: "Selected archive" },
	{ href: "/blog", label: "Blog", meta: "Field notes" },
];
