import sharp from "sharp";

import { isPublicHttpUrl } from "./link-url.ts";

export type OgImageCache = Map<string, Promise<string | undefined>>;

export type OgImageResolveOptions = {
	fetch?: typeof fetch;
	cache?: OgImageCache;
	/** 429 のリトライ間隔。テストでは 0 にする */
	retryDelayMs?: number;
};

const FETCH_TIMEOUT_MS = 2500;
const MAX_SOURCE_BYTES = 2_500_000;
const MAX_DATA_URI_BYTES = 48_000;
const THUMB_WIDTH = 480;
const MAX_ATTEMPTS = 3;
const MAX_REDIRECTS = 5;
const DEFAULT_RETRY_DELAY_MS = 400;
const USER_AGENT =
	"Mozilla/5.0 (compatible; ta93abe-ogp/1.0; +https://ta93abe.com)";

const RASTER_DATA_URI =
	/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/;

function httpsHref(value: string, base?: string): string | undefined {
	try {
		const url = new URL(value, base);
		if (url.protocol !== "https:" || !isPublicHttpUrl(url)) {
			return undefined;
		}
		return url.href;
	} catch {
		return undefined;
	}
}

function isRedirectStatus(status: number): boolean {
	return (
		status === 301 ||
		status === 302 ||
		status === 303 ||
		status === 307 ||
		status === 308
	);
}

async function readLimitedBody(
	response: Response,
): Promise<Uint8Array | undefined> {
	const lengthHeader = response.headers.get("content-length");
	if (lengthHeader) {
		const length = Number(lengthHeader);
		if (!Number.isFinite(length) || length <= 0 || length > MAX_SOURCE_BYTES) {
			await response.body?.cancel();
			return undefined;
		}
	}

	if (!response.body) {
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (bytes.byteLength === 0 || bytes.byteLength > MAX_SOURCE_BYTES) {
			return undefined;
		}
		return bytes;
	}

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			if (!value?.byteLength) {
				continue;
			}
			total += value.byteLength;
			if (total > MAX_SOURCE_BYTES) {
				await reader.cancel();
				return undefined;
			}
			chunks.push(value);
		}
	} catch {
		await reader.cancel().catch(() => undefined);
		return undefined;
	}

	if (total === 0) {
		return undefined;
	}

	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

async function fetchPublicHttps(
	url: string,
	fetchImpl: typeof fetch,
	init: RequestInit,
): Promise<Response | undefined> {
	let href: string | undefined = url;
	for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
		const parsed = href ? httpsHref(href) : undefined;
		if (!parsed) {
			return undefined;
		}
		const response = await fetchImpl(parsed, {
			...init,
			redirect: "manual",
		});
		if (!isRedirectStatus(response.status)) {
			return response;
		}
		const location = response.headers.get("location");
		await response.body?.cancel();
		if (!location || hop === MAX_REDIRECTS) {
			return undefined;
		}
		href = httpsHref(location, parsed);
	}
	return undefined;
}

function sleep(ms: number): Promise<void> {
	if (ms <= 0) {
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * リンクカードのサムネは自前の raster data URI だけ出す。
 * 外部 OG（opengraph.githubassets.com など）を直リンクしない。
 */
export function firstPartyOgImageSrc(
	image: string | undefined,
): string | undefined {
	if (!image) {
		return undefined;
	}
	return RASTER_DATA_URI.test(image) ? image : undefined;
}

async function toThumbDataUri(bytes: Uint8Array): Promise<string | undefined> {
	try {
		const out = await sharp(bytes)
			.resize(THUMB_WIDTH, THUMB_WIDTH, {
				fit: "inside",
				withoutEnlargement: true,
			})
			.webp({ quality: 70 })
			.toBuffer();
		if (out.byteLength === 0 || out.byteLength > MAX_DATA_URI_BYTES) {
			return undefined;
		}
		return `data:image/webp;base64,${out.toString("base64")}`;
	} catch {
		return undefined;
	}
}

async function downloadOgImage(
	url: string,
	fetchImpl: typeof fetch,
	retryDelayMs: number,
): Promise<string | undefined> {
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
		try {
			const response = await fetchPublicHttps(url, fetchImpl, {
				headers: {
					accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
					"user-agent": USER_AGENT,
				},
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});
			if (!response) {
				return undefined;
			}
			if (response.status === 429 && attempt < MAX_ATTEMPTS - 1) {
				await response.body?.cancel();
				await sleep(retryDelayMs * 2 ** attempt);
				continue;
			}
			if (!response.ok) {
				await response.body?.cancel();
				return undefined;
			}
			const bytes = await readLimitedBody(response);
			if (!bytes) {
				return undefined;
			}
			return toThumbDataUri(bytes);
		} catch {
			return undefined;
		}
	}
	return undefined;
}

/**
 * ビルド時に OG 画像を取得して縮小し、data URI にする。
 * 失敗・429・サイズ超過は画像なし（呼び出し側がカードだけ出す）。
 */
export async function resolveOgImage(
	url: string,
	options: OgImageResolveOptions = {},
): Promise<string | undefined> {
	const href = httpsHref(url);
	if (!href) {
		return undefined;
	}

	const cached = options.cache?.get(href);
	if (cached) {
		return cached;
	}

	const pending = downloadOgImage(
		href,
		options.fetch ?? fetch,
		options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
	);
	options.cache?.set(href, pending);
	return pending;
}
