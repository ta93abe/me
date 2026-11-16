import sharp from "sharp";

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
const DEFAULT_RETRY_DELAY_MS = 400;
const USER_AGENT =
	"Mozilla/5.0 (compatible; ta93abe-ogp/1.0; +https://ta93abe.com)";

const RASTER_DATA_URI =
	/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/;

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
			const response = await fetchImpl(url, {
				headers: {
					accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
					"user-agent": USER_AGENT,
				},
				redirect: "follow",
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});
			if (response.status === 429 && attempt < MAX_ATTEMPTS - 1) {
				await sleep(retryDelayMs * 2 ** attempt);
				continue;
			}
			if (!response.ok) {
				return undefined;
			}
			const bytes = new Uint8Array(await response.arrayBuffer());
			if (bytes.byteLength === 0 || bytes.byteLength > MAX_SOURCE_BYTES) {
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
