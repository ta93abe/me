/**
 * Markdown 代替表現の発見広告。
 *
 * 契約は同 URL + `Accept: text/markdown` の content negotiation。
 * `.md` ツインは出さない。TA-892 以降は公開 HTML に出す。
 */

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

export function hasMarkdownAlternateLink(
	linkHeader: string | null | undefined,
): boolean {
	if (!linkHeader) {
		return false;
	}
	return /rel="alternate";\s*type="text\/markdown"/i.test(linkHeader);
}
