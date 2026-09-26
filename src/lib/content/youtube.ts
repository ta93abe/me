import {
	isYoutubeId,
	parseYoutubeRef,
	youtubeThumbnailUrl,
	youtubeWatchUrl,
} from "./youtube-url.ts";

const OEMBED_URL = "https://www.youtube.com/oembed";
const FETCH_TIMEOUT_MS = 2500;

const PLAY_BG_PATH =
	"M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z";

export type YoutubeEmbedData = {
	id: string;
	url: string;
	title: string;
	authorName: string;
	thumbnailUrl: string;
};

export type YoutubeFetcher = (id: string) => Promise<YoutubeEmbedData | null>;

export type YoutubeFetchOptions = {
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function nonEmpty(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function httpsUrl(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
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

function playSvg(): string {
	return `<svg class="youtube-embed-play-icon" viewBox="0 0 68 48" width="68" height="48" aria-hidden="true"><path class="youtube-embed-play-bg" d="${PLAY_BG_PATH}" fill="#f00"/><path fill="#fff" d="M45 24 27 14v20z"/></svg>`;
}

function thumbHtml(src: string, alt: string): string {
	return `<span class="youtube-embed-media"><img class="youtube-embed-thumb" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="480" height="360" loading="lazy" decoding="async" referrerpolicy="no-referrer" /><span class="youtube-embed-play" aria-hidden="true">${playSvg()}</span></span>`;
}

function thumbnailFor(id: string, candidate?: string): string {
	return httpsUrl(candidate) ?? youtubeThumbnailUrl(id);
}

function youtubeStartSeconds(href: string): number {
	const parsed = parseYoutubeRef(href);
	if (!parsed) {
		return 0;
	}
	try {
		const url = new URL(parsed.url);
		const raw = url.searchParams.get("t") ?? url.searchParams.get("start");
		if (raw && /^\d+$/.test(raw)) {
			return Number(raw);
		}
	} catch {
		// ignore
	}
	return 0;
}

function lazyYoutubeFigure(
	href: string,
	id: string,
	title: string,
	authorName: string,
	thumbnail: string,
): string {
	const start = youtubeStartSeconds(href);
	const startAttr = start > 0 ? ` data-youtube-start="${start}"` : "";
	const label = title.length > 0 ? title : "YouTube動画を再生";
	return `<figure class="youtube-embed" data-youtube-id="${escapeHtml(id)}"${startAttr}><button type="button" class="youtube-embed-card youtube-embed-lazy" aria-label="${escapeHtml(label)}">${thumbHtml(thumbnail, title)}<span class="youtube-embed-copy"><span class="youtube-embed-title">${escapeHtml(title.length > 0 ? title : "YouTubeで動画を見る")}</span><span class="youtube-embed-byline"><span class="youtube-embed-author">${escapeHtml(authorName)}</span><span class="youtube-embed-provider">YouTube</span></span></span></button></figure>\n`;
}

export function youtubeFallbackHtml(href: string): string {
	const parsed = parseYoutubeRef(href);
	if (!parsed) {
		const display = href.replace(/^https:\/\//, "");
		return `<figure class="youtube-embed youtube-embed-fallback"><a class="youtube-embed-card" href="${escapeHtml(href)}" rel="noopener noreferrer" target="_blank"><span class="youtube-embed-copy"><span class="youtube-embed-title">YouTubeで動画を見る</span><span class="youtube-embed-byline"><span class="youtube-embed-url">${escapeHtml(display)}</span></span></span></a></figure>\n`;
	}
	return lazyYoutubeFigure(
		href,
		parsed.id,
		"",
		"",
		youtubeThumbnailUrl(parsed.id),
	);
}

export function youtubeEmbedHtml(
	href: string,
	video: YoutubeEmbedData | null,
): string {
	if (!video) {
		return youtubeFallbackHtml(href);
	}

	const thumbnail = thumbnailFor(video.id, video.thumbnailUrl);
	return lazyYoutubeFigure(
		href,
		video.id,
		video.title,
		video.authorName,
		thumbnail,
	);
}

function oembedRequestUrl(id: string): string {
	const url = new URL(OEMBED_URL);
	url.searchParams.set("format", "json");
	url.searchParams.set("url", youtubeWatchUrl(id));
	return url.toString();
}

async function readJson(
	fetchImpl: typeof fetch,
	url: string,
): Promise<unknown> {
	const response = await fetchImpl(url, {
		headers: { accept: "application/json" },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});
	if (!response.ok) {
		return null;
	}
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("json")) {
		return null;
	}
	return response.json();
}

function fromOembed(id: string, data: unknown): YoutubeEmbedData | null {
	if (!isRecord(data)) {
		return null;
	}
	const title = nonEmpty(data.title);
	const authorName = nonEmpty(data.author_name);
	if (!title || !authorName) {
		return null;
	}
	return {
		id,
		url: youtubeWatchUrl(id),
		title,
		authorName,
		thumbnailUrl: thumbnailFor(id, nonEmpty(data.thumbnail_url)),
	};
}

export async function fetchYoutubeEmbed(
	id: string,
	options: YoutubeFetchOptions = {},
): Promise<YoutubeEmbedData | null> {
	if (!isYoutubeId(id)) {
		return null;
	}
	const fetchImpl = options.fetch ?? fetch;
	try {
		return fromOembed(id, await readJson(fetchImpl, oembedRequestUrl(id)));
	} catch {
		return null;
	}
}
