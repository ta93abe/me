export interface OgpData {
	title: string;
	description: string;
	image: string;
	favicon: string;
	url: string;
	domain: string;
}

function extractMetaContent(html: string, property: string): string {
	const regex = new RegExp(
		`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
		"i",
	);
	const match = html.match(regex);
	if (match) return match[1];

	// content が property より前にあるパターン
	const regexReverse = new RegExp(
		`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`,
		"i",
	);
	const matchReverse = html.match(regexReverse);
	return matchReverse?.[1] ?? "";
}

function extractTitle(html: string): string {
	const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
	return match?.[1] ?? "";
}

export async function fetchOgpData(url: string): Promise<OgpData> {
	const domain = new URL(url).hostname.replace("www.", "");
	const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "bot",
			},
		});
		const html = await response.text();

		const ogTitle = extractMetaContent(html, "og:title") || extractTitle(html);
		const ogDescription =
			extractMetaContent(html, "og:description") ||
			extractMetaContent(html, "description");
		const ogImage = extractMetaContent(html, "og:image");

		return {
			title: ogTitle || domain,
			description: ogDescription,
			image: ogImage,
			favicon,
			url,
			domain,
		};
	} catch {
		return {
			title: domain,
			description: "",
			image: "",
			favicon,
			url,
			domain,
		};
	}
}
