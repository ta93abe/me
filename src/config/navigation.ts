/**
 * Navigation configuration
 * ナビゲーションリンクの一元管理
 */

import { withTrailingSlash } from "@/utils/canonical";

export interface NavLink {
	readonly href: string;
	readonly text: string;
}

/**
 * Main navigation links
 * ヘッダーナビゲーションに表示するリンク
 *
 * 主軸は About / Blog / Contact。Gallery / Atelier / Bookshelf は
 * 公開コンテンツができるまで出さない（旧 URL は `/` へリダイレクト）。
 * href は canonical と同じ末尾スラッシュ。
 */
export const NAV_LINKS: readonly NavLink[] = [
	{ href: "/about/", text: "About" },
	{ href: "/blog/", text: "Blog" },
	{ href: "/contact/", text: "Contact" },
];

/**
 * Secondary navigation links
 * フッターに出す公開ページ。URL はそのまま残す。
 */
export const SECONDARY_LINKS: readonly NavLink[] = [
	{ href: "/links/", text: "Links" },
	{ href: "/tools/", text: "Tools" },
	{ href: "/gadgets/", text: "Gadgets" },
	{ href: "/slides/", text: "Slides" },
];

export function isActiveNavPath(href: string, currentPath: string): boolean {
	if (href === "/") {
		return currentPath === "/" || currentPath === "";
	}
	const current = withTrailingSlash(currentPath);
	const target = withTrailingSlash(href);
	return current === target || current.startsWith(target);
}
