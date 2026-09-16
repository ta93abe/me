/**
 * Markdown 代替表現の発見広告。
 *
 * 現状の契約は同 URL + `Accept: text/markdown` の content negotiation。
 * `.md` ツインは出さない。下位ページへの展開は TA-892 のあと。
 */

export function advertisesMarkdownRepresentation(pathname: string): boolean {
	const normalized = pathname.replace(/\/+$/, "") || "/";
	return normalized === "/" || normalized === "/index.html";
}

export function markdownAlternateLinkHeader(href: string): string {
	return `<${href}>; rel="alternate"; type="text/markdown"`;
}

export function composeLinkHeader(
	...parts: Array<string | null | undefined>
): string {
	return parts
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part))
		.join(", ");
}

export function homepageCanonicalHref(siteUrl: string): string {
	return siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
}

export function homepageLinkValue(
	existingLink: string | null | undefined,
	siteUrl: string,
	discoveryLinks: string,
): string {
	return composeLinkHeader(
		existingLink,
		markdownAlternateLinkHeader(homepageCanonicalHref(siteUrl)),
		discoveryLinks,
	);
}
