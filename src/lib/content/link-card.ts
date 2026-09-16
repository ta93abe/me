import { parse, type HTMLElement } from "node-html-parser";

import { parseLinkUrl } from "./link-url.ts";

const FETCH_TIMEOUT_MS = 2500;
const MAX_HTML_BYTES = 512_000;
const USER_AGENT =
	"Mozilla/5.0 (compatible; ta93abe-ogp/1.0; +https://ta93abe.com)";

export type LinkCardData = {
	href: string;
	title: string;
	description: string;
	image?: string;
	domain: string;
	favicon: string;
};

export type LinkCardFetcher = (url: string) => Promise<LinkCardData>;

export type LinkCardFetchOptions = {
	fetch?: typeof fetch;
};

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function collapseText(value: string): string {
	return value
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function googleFavicon(domain: string): string {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

function displayDomain(href: string): string {
	try {
		return new URL(href).hostname.replace(/^www\./, "");
	} catch {
		return href;
	}
}

export function fallbackLinkCard(href: string): LinkCardData {
	const domain = displayDomain(href);
	return {
		href,
		title: domain,
		description: "",
		domain,
		favicon: domain ? googleFavicon(domain) : "",
	};
}

function httpsUrl(value: string | undefined, base: string): string | undefined {
	if (!value) {
		return undefined;
	}
	try {
		const url = new URL(value, base);
		if (url.protocol !== "https:") {
			return undefined;
		}
		return url.href;
	} catch {
		return undefined;
	}
}

function metaContent(root: HTMLElement, property: string): string {
	const element = root.querySelector(
		`meta[property="${property}"], meta[name="${property}"]`,
	);
	return collapseText(element?.getAttribute("content") ?? "");
}

function iconHref(root: HTMLElement, base: string): string | undefined {
	for (const link of root.querySelectorAll("link[rel]")) {
		const rel = (link.getAttribute("rel") ?? "").toLowerCase();
		if (!/\bicon\b/.test(rel) && rel !== "apple-touch-icon") {
			continue;
		}
		const href = httpsUrl(link.getAttribute("href") ?? undefined, base);
		if (href) {
			return href;
		}
	}
	return undefined;
}

function fromHtml(href: string, html: string): LinkCardData {
	const fallback = fallbackLinkCard(href);
	const root = parse(html);
	const title =
		metaContent(root, "og:title") ||
		metaContent(root, "twitter:title") ||
		collapseText(root.querySelector("title")?.textContent ?? "") ||
		fallback.title;
	const description =
		metaContent(root, "og:description") ||
		metaContent(root, "twitter:description") ||
		metaContent(root, "description");
	const image =
		httpsUrl(metaContent(root, "og:image:secure_url"), href) ??
		httpsUrl(metaContent(root, "og:image"), href) ??
		httpsUrl(metaContent(root, "twitter:image"), href);

	return {
		href,
		title: title.slice(0, 200),
		description: description.slice(0, 300),
		image,
		domain: fallback.domain,
		favicon: iconHref(root, href) ?? fallback.favicon,
	};
}

export function linkCardHtml(card: LinkCardData): string {
	const title = escapeHtml(card.title);
	const description = card.description
		? `<span class="embed-card-description">${escapeHtml(card.description)}</span>`
		: "";
	const favicon = card.favicon
		? `<img class="embed-card-favicon" src="${escapeHtml(card.favicon)}" alt="" width="16" height="16" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
		: "";
	const thumb = card.image
		? `<span class="embed-card-thumb"><img src="${escapeHtml(card.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></span>`
		: "";
	const noImage = card.image ? "" : " embed-card-no-image";

	return `<a class="embed-card${noImage}" href="${escapeHtml(card.href)}" rel="noopener noreferrer" target="_blank"><span class="embed-card-body"><span class="embed-card-title">${title}</span>${description}<span class="embed-card-site">${favicon}<span class="embed-card-domain">${escapeHtml(card.domain)}</span></span></span>${thumb}</a>\n`;
}

export async function fetchLinkCard(
	url: string,
	options: LinkCardFetchOptions = {},
): Promise<LinkCardData> {
	const parsed = parseLinkUrl(url);
	const href = parsed?.href ?? url;
	const fallback = fallbackLinkCard(href);
	if (!parsed) {
		return fallback;
	}

	const fetchImpl = options.fetch ?? fetch;
	try {
		const response = await fetchImpl(href, {
			headers: {
				accept: "text/html,application/xhtml+xml",
				"accept-language": "ja,en;q=0.8",
				"user-agent": USER_AGENT,
			},
			redirect: "follow",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});
		if (!response.ok) {
			return fallback;
		}
		const contentType = response.headers.get("content-type") ?? "";
		if (contentType && !contentType.includes("html")) {
			return fallback;
		}
		const html = (await response.text()).slice(0, MAX_HTML_BYTES);
		return fromHtml(href, html);
	} catch {
		return fallback;
	}
}
