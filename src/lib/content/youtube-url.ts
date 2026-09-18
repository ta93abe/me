const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export type ParsedYoutube = {
	id: string;
	url: string;
};

export function isYoutubeId(value: string): boolean {
	return VIDEO_ID.test(value);
}

export function youtubeWatchUrl(id: string, startSeconds?: number): string {
	const url = new URL("https://www.youtube.com/watch");
	url.searchParams.set("v", id);
	if (startSeconds && startSeconds > 0) {
		url.searchParams.set("t", String(startSeconds));
	}
	return url.href;
}

export function youtubeThumbnailUrl(id: string): string {
	return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function normalizeHost(host: string): string {
	return host.toLowerCase().replace(/^www\./, "");
}

function isYoutubeHost(host: string): boolean {
	const normalized = normalizeHost(host);
	return (
		normalized === "youtu.be" ||
		normalized === "youtube.com" ||
		normalized === "m.youtube.com" ||
		normalized === "music.youtube.com" ||
		normalized === "youtube-nocookie.com"
	);
}

function parseTimecode(value: string | null): number | undefined {
	if (!value) {
		return undefined;
	}
	if (/^\d+$/.test(value)) {
		const seconds = Number(value);
		return seconds > 0 ? seconds : undefined;
	}
	const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
	if (!match) {
		return undefined;
	}
	const hours = Number(match[1] ?? 0);
	const minutes = Number(match[2] ?? 0);
	const seconds = Number(match[3] ?? 0);
	const total = hours * 3600 + minutes * 60 + seconds;
	return total > 0 ? total : undefined;
}

function startFromUrl(url: URL): number | undefined {
	const fromQuery = parseTimecode(
		url.searchParams.get("t") ?? url.searchParams.get("start"),
	);
	if (fromQuery) {
		return fromQuery;
	}
	const hash = url.hash.replace(/^#/, "");
	if (!hash) {
		return undefined;
	}
	const hashParams = new URLSearchParams(hash);
	return parseTimecode(hashParams.get("t") ?? hashParams.get("start"));
}

function videoIdFromPath(host: string, pathname: string): string | undefined {
	const path = pathname.replace(/\/+$/, "") || "/";
	if (normalizeHost(host) === "youtu.be") {
		const id = path.slice(1);
		return isYoutubeId(id) ? id : undefined;
	}
	const nested = /^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})$/.exec(path);
	return nested?.[1] && isYoutubeId(nested[1]) ? nested[1] : undefined;
}

export function parseYoutubeUrl(raw: string): ParsedYoutube | null {
	let parsed: URL;
	try {
		parsed = new URL(raw.trim());
	} catch {
		return null;
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return null;
	}
	if (!isYoutubeHost(parsed.hostname)) {
		return null;
	}

	const fromQuery = parsed.searchParams.get("v");
	const id =
		(fromQuery && isYoutubeId(fromQuery) ? fromQuery : undefined) ??
		videoIdFromPath(parsed.hostname, parsed.pathname);
	if (!id) {
		return null;
	}

	return {
		id,
		url: youtubeWatchUrl(id, startFromUrl(parsed)),
	};
}

export function parseYoutubeRef(raw: string): ParsedYoutube | null {
	const trimmed = raw.trim();
	if (isYoutubeId(trimmed)) {
		return { id: trimmed, url: youtubeWatchUrl(trimmed) };
	}
	return parseYoutubeUrl(trimmed);
}

const BLOCK_END = "(?:[ \\t]*\\n+|$)";

function withHttps(raw: string): string {
	return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const YOUTUBE_HOST =
	"(?:www\\.|m\\.|music\\.)?(?:youtube(?:-nocookie)?\\.com|youtu\\.be)";

/**
 * 段落先頭の YouTube URL / Markdown リンク / Zenn 記法を 1 ブロックとして取る。
 * 文中の URL は残して通常のリンクにする。
 */
export function matchStandaloneYoutubeBlock(
	src: string,
): { raw: string; href: string; id: string } | null {
	const candidates: Array<{ raw: string; href: string }> = [];

	const zenn = new RegExp(`^@\\[youtube\\]\\(([^)\\s]+)\\)${BLOCK_END}`).exec(
		src,
	);
	if (zenn?.[1]) {
		candidates.push({ raw: zenn[0], href: zenn[1] });
	}

	const angled = new RegExp(`^<(https?:\\/\\/[^>\\s]+)>${BLOCK_END}`, "i").exec(
		src,
	);
	if (angled?.[1]) {
		candidates.push({ raw: angled[0], href: angled[1] });
	}

	const mdLink = new RegExp(`^\\[[^\\]]*\\]\\(([^)\\s]+)\\)${BLOCK_END}`).exec(
		src,
	);
	if (mdLink?.[1]) {
		candidates.push({ raw: mdLink[0], href: mdLink[1] });
	}

	const bare = new RegExp(
		`^((?:https?:\\/\\/)?${YOUTUBE_HOST}\\/[^\\s]+)${BLOCK_END}`,
		"i",
	).exec(src);
	if (bare?.[1]) {
		candidates.push({ raw: bare[0], href: withHttps(bare[1]) });
	}

	for (const candidate of candidates) {
		const parsed = parseYoutubeRef(candidate.href);
		if (parsed) {
			return { raw: candidate.raw, href: parsed.url, id: parsed.id };
		}
	}

	return null;
}

export function youtubeBlockStartIndex(src: string): number | undefined {
	const match = new RegExp(
		`(?:^|\\n)(?:@\\[youtube\\]\\(|<(?:https?:\\/\\/)?${YOUTUBE_HOST}|\\[[^\\]]*\\]\\((?:https?:\\/\\/)?${YOUTUBE_HOST}|(?:https?:\\/\\/)?${YOUTUBE_HOST}\\/)`,
		"i",
	).exec(src);
	return match ? match.index : undefined;
}
