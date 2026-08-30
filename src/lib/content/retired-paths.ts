export const RETIRED_SITE_PREFIXES = [
	"/gallery",
	"/atelier",
	"/bookshelf",
	"/works",
] as const;

export function isRetiredSitePath(pathname: string): boolean {
	const normalized = pathname.replace(/\/+$/, "") || "/";
	return RETIRED_SITE_PREFIXES.some(
		(prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
	);
}
