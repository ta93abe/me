export const DEFAULT_EMBED_FAVICON = "/icons/embed/default.svg";

export type RasterFaviconMime =
	| "image/png"
	| "image/jpeg"
	| "image/gif"
	| "image/webp"
	| "image/x-icon";

export type FaviconCache = Map<string, Promise<string>>;

export type FaviconResolveOptions = {
	fetch?: typeof fetch;
	candidates?: string[];
	pageUrl?: string;
	cache?: FaviconCache;
};

const FETCH_TIMEOUT_MS = 2500;
const MAX_FAVICON_BYTES = 32_768;
const USER_AGENT =
	"Mozilla/5.0 (compatible; ta93abe-ogp/1.0; +https://ta93abe.com)";

const EMBED_ICON_PATH = /^\/icons\/embed\/[a-z0-9][a-z0-9.-]*\.(svg|png)$/;
const RASTER_DATA_URI =
	/^data:image\/(png|jpeg|gif|webp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/]+=*$/;

const KNOWN_FAVICONS: Record<string, string> = {
	"github.com": "/icons/embed/github.com.svg",
	"gist.github.com": "/icons/embed/github.com.svg",
	"youtube.com": "/icons/embed/youtube.com.svg",
	"m.youtube.com": "/icons/embed/youtube.com.svg",
	"music.youtube.com": "/icons/embed/youtube.com.svg",
	"youtu.be": "/icons/embed/youtube.com.svg",
	"x.com": "/icons/embed/x.com.svg",
	"twitter.com": "/icons/embed/x.com.svg",
	"mobile.twitter.com": "/icons/embed/x.com.svg",
	"zenn.dev": "/icons/embed/zenn.dev.svg",
};

export function normalizeFaviconDomain(domain: string): string {
	return domain
		.trim()
		.toLowerCase()
		.replace(/^www\./, "");
}

export function staticFaviconForDomain(domain: string): string {
	const host = normalizeFaviconDomain(domain);
	return host ? (KNOWN_FAVICONS[host] ?? DEFAULT_EMBED_FAVICON) : "";
}

export function isGoogleFaviconUrl(value: string): boolean {
	try {
		const url = new URL(value);
		const host = url.hostname.toLowerCase();
		if (host === "www.google.com" && url.pathname === "/s2/favicons") {
			return true;
		}
		return host === "gstatic.com" || host.endsWith(".gstatic.com");
	} catch {
		return (
			value.includes("google.com/s2/favicons") || value.includes("gstatic.com")
		);
	}
}

export function googleFaviconFetchUrl(domain: string): string {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

export function isFirstPartyFavicon(src: string): boolean {
	return EMBED_ICON_PATH.test(src) || RASTER_DATA_URI.test(src);
}

export function firstPartyFaviconSrc(favicon: string, domain: string): string {
	if (isFirstPartyFavicon(favicon)) {
		return favicon;
	}
	return staticFaviconForDomain(domain);
}

function httpsHref(value: string): string | undefined {
	try {
		const url = new URL(value);
		if (url.protocol !== "https:") {
			return undefined;
		}
		return url.href;
	} catch {
		return undefined;
	}
}

function pageOrigin(
	pageUrl: string | undefined,
	domain: string,
): string | undefined {
	if (pageUrl) {
		const href = httpsHref(pageUrl);
		if (href) {
			return new URL(href).origin;
		}
	}
	const host = normalizeFaviconDomain(domain);
	return host ? `https://${host}` : undefined;
}

function mimeFromBytes(bytes: Uint8Array): RasterFaviconMime | undefined {
	if (
		bytes.length >= 8 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47
	) {
		return "image/png";
	}
	if (
		bytes.length >= 3 &&
		bytes[0] === 0xff &&
		bytes[1] === 0xd8 &&
		bytes[2] === 0xff
	) {
		return "image/jpeg";
	}
	if (
		bytes.length >= 6 &&
		bytes[0] === 0x47 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x38
	) {
		return "image/gif";
	}
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return "image/webp";
	}
	if (
		bytes.length >= 4 &&
		bytes[0] === 0x00 &&
		bytes[1] === 0x00 &&
		bytes[2] === 0x01 &&
		bytes[3] === 0x00
	) {
		return "image/x-icon";
	}
	return undefined;
}

function encodeBase64(bytes: Uint8Array): string {
	const chunk = 0x2000;
	let binary = "";
	for (let offset = 0; offset < bytes.length; offset += chunk) {
		binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
	}
	return btoa(binary);
}

function bytesToDataUri(bytes: Uint8Array, mime: RasterFaviconMime): string {
	switch (mime) {
		case "image/png":
		case "image/jpeg":
		case "image/gif":
		case "image/webp":
		case "image/x-icon":
			return `data:${mime};base64,${encodeBase64(bytes)}`;
		default: {
			const exhaustive: never = mime;
			return exhaustive;
		}
	}
}

async function downloadFavicon(
	url: string,
	fetchImpl: typeof fetch,
): Promise<string | undefined> {
	try {
		const response = await fetchImpl(url, {
			headers: {
				accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
				"user-agent": USER_AGENT,
			},
			redirect: "follow",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});
		if (!response.ok) {
			return undefined;
		}
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (bytes.byteLength === 0 || bytes.byteLength > MAX_FAVICON_BYTES) {
			return undefined;
		}
		const mime = mimeFromBytes(bytes);
		if (!mime) {
			return undefined;
		}
		return bytesToDataUri(bytes, mime);
	} catch {
		return undefined;
	}
}

function uniqueHttps(urls: Array<string | undefined>): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const value of urls) {
		if (!value) {
			continue;
		}
		const href = httpsHref(value);
		if (!href || seen.has(href)) {
			continue;
		}
		seen.add(href);
		result.push(href);
	}
	return result;
}

async function resolveRemoteFavicon(
	domain: string,
	options: FaviconResolveOptions,
): Promise<string> {
	const fetchImpl = options.fetch ?? fetch;
	const origin = pageOrigin(options.pageUrl, domain);
	const candidates = uniqueHttps([
		...(options.candidates ?? []).filter((url) => !isGoogleFaviconUrl(url)),
		origin ? `${origin}/favicon.ico` : undefined,
		googleFaviconFetchUrl(domain),
	]);

	for (const url of candidates) {
		const dataUri = await downloadFavicon(url, fetchImpl);
		if (dataUri) {
			return dataUri;
		}
	}
	return DEFAULT_EMBED_FAVICON;
}

export async function resolveFavicon(
	domain: string,
	options: FaviconResolveOptions = {},
): Promise<string> {
	const host = normalizeFaviconDomain(domain);
	if (!host) {
		return DEFAULT_EMBED_FAVICON;
	}

	const known = KNOWN_FAVICONS[host];
	if (known) {
		return known;
	}

	const cached = options.cache?.get(host);
	if (cached) {
		return cached;
	}

	const pending = resolveRemoteFavicon(host, options).catch(
		() => DEFAULT_EMBED_FAVICON,
	);
	options.cache?.set(host, pending);
	return pending;
}
