/**
 * 旧パスから現行 canonical への 301。
 * キーは末尾スラッシュなし。照合時に正規化する。
 */
export const PAGE_ALIASES: Readonly<Record<string, string>> = {
	"/careers": "/about/",
	"/jobs": "/about/",
	"/recruit": "/about/",
	"/gadgets/macbook-pro": "/gadgets/",
	"/gadgets/keyboard": "/gadgets/",
	"/gadgets/headphones": "/gadgets/",
	"/gadgets/audio-interface": "/gadgets/",
	"/gadgets/sketchbook": "/gadgets/",
	"/gadgets/fountain-pen": "/gadgets/",
	"/gadgets/camera": "/gadgets/",
	"/gadgets/notebook": "/gadgets/",
};

export function pageAliasRedirect(pathname: string): string | null {
	const normalized = pathname.replace(/\/+$/, "") || "/";
	return PAGE_ALIASES[normalized] ?? null;
}
