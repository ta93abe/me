import type { HTMLElement } from "node-html-parser";
import { parse } from "node-html-parser";

export interface OgpData {
	title: string;
	description: string;
	image: string;
	favicon: string;
	url: string;
	domain: string;
}

function extractMetaContent(root: HTMLElement, property: string): string {
	const element = root.querySelector(
		`meta[property="${property}"], meta[name="${property}"]`,
	);
	return element?.getAttribute("content") ?? "";
}

function extractTitle(root: HTMLElement): string {
	return root.querySelector("title")?.textContent ?? "";
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

		if (!response.ok) {
			throw new Error(`HTTP ${response.status} ${response.statusText}`);
		}

		const html = await response.text();
		const root = parse(html);

		const ogTitle = extractMetaContent(root, "og:title") || extractTitle(root);
		const ogDescription =
			extractMetaContent(root, "og:description") ||
			extractMetaContent(root, "description");
		const ogImage = extractMetaContent(root, "og:image");

		return {
			title: ogTitle || domain,
			description: ogDescription,
			image: ogImage,
			favicon,
			url,
			domain,
		};
	} catch (error) {
		console.error(`[OGP] Failed to fetch ${url}:`, error);
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
