import { parseSpotifyUrl } from "./spotify-url.ts";
import { parseTweetUrl } from "./tweet-url.ts";
import { parseYoutubeUrl } from "./youtube-url.ts";

export type ParsedLinkUrl = {
	href: string;
};

const PRIVATE_HOST =
	/^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|\[::1\])$|\.local$|^10\.\d+\.\d+\.\d+$|^192\.168\.\d+\.\d+$|^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$|^169\.254\.\d+\.\d+$/;

function isPublicHttpUrl(parsed: URL): boolean {
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return false;
	}
	const host = parsed.hostname.toLowerCase();
	if (!host || PRIVATE_HOST.test(host)) {
		return false;
	}
	return true;
}

export function parseLinkUrl(raw: string): ParsedLinkUrl | null {
	let parsed: URL;
	try {
		parsed = new URL(raw.trim());
	} catch {
		return null;
	}

	if (
		!isPublicHttpUrl(parsed) ||
		parseTweetUrl(parsed.href) ||
		parseYoutubeUrl(parsed.href) ||
		parseSpotifyUrl(parsed.href)
	) {
		return null;
	}

	return { href: parsed.href };
}

const BLOCK_END = "(?:[ \\t]*\\n+|$)";

/**
 * 段落先頭の http(s) URL / Markdown リンクを 1 ブロックとして取る。
 * 文中の URL と X / YouTube URL は残す。
 */
export function matchStandaloneLinkBlock(
	src: string,
): { raw: string; href: string } | null {
	const candidates: Array<{ raw: string; href: string }> = [];

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

	const bare = new RegExp(`^(https?:\\/\\/[^\\s<]+)${BLOCK_END}`, "i").exec(
		src,
	);
	if (bare?.[1]) {
		candidates.push({ raw: bare[0], href: bare[1] });
	}

	for (const candidate of candidates) {
		const parsed = parseLinkUrl(candidate.href);
		if (parsed) {
			return { raw: candidate.raw, href: parsed.href };
		}
	}

	return null;
}

export function linkBlockStartIndex(src: string): number | undefined {
	const match =
		/(?:^|\n)(?:<(?:https?:\/\/)|\[(?:[^\]]*)\]\((?:https?:\/\/)|https?:\/\/)/i.exec(
			src,
		);
	return match ? match.index : undefined;
}
