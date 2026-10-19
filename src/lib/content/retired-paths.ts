import { stripHtmlFilename } from "../../utils/canonical";

export const RETIRED_SITE_PREFIXES = [
	"/gallery",
	"/atelier",
	"/bookshelf",
] as const;

export function isRetiredSitePath(pathname: string): boolean {
	const normalized = stripHtmlFilename(pathname).replace(/\/+$/, "") || "/";
	return RETIRED_SITE_PREFIXES.some(
		(prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
	);
}
