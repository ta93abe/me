export type ParsedSpotify = {
	path: string;
	url: string;
};

const SPOTIFY_HOST = /^(?:open\.)?spotify\.com$/;

const EMBED_PATH =
	/^\/(track|album|playlist|episode|show|artist|audiobook)\/[A-Za-z0-9]+(?:\?.*)?$/;

export function parseSpotifyUrl(raw: string): ParsedSpotify | null {
	let parsed: URL;
	try {
		parsed = new URL(raw.trim());
	} catch {
		return null;
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return null;
	}
	const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
	if (!SPOTIFY_HOST.test(host)) {
		return null;
	}
	const path = `${parsed.pathname}${parsed.search}`;
	if (!EMBED_PATH.test(path)) {
		return null;
	}
	return {
		path,
		url: parsed.href,
	};
}

export function spotifyEmbedSrc(raw: string): string | null {
	const parsed = parseSpotifyUrl(raw);
	if (!parsed) {
		return null;
	}
	return `https://open.spotify.com/embed${parsed.path}`;
}

const BLOCK_END = "(?:[ \\t]*\\n+|$)";

function withHttps(raw: string): string {
	return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const SPOTIFY_HOST_PATTERN = "(?:open\\.)?spotify\\.com";

export function matchStandaloneSpotifyBlock(
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

	const bare = new RegExp(
		`^((?:https?:\\/\\/)?${SPOTIFY_HOST_PATTERN}\\/[^\\s]+)${BLOCK_END}`,
		"i",
	).exec(src);
	if (bare?.[1]) {
		candidates.push({ raw: bare[0], href: withHttps(bare[1]) });
	}

	for (const candidate of candidates) {
		if (parseSpotifyUrl(candidate.href)) {
			return candidate;
		}
	}

	return null;
}

export function spotifyBlockStartIndex(src: string): number | undefined {
	const match = new RegExp(
		`(?:^|\\n)(?:<(?:https?:\\/\\/)?${SPOTIFY_HOST_PATTERN}|\\[[^\\]]*\\]\\((?:https?:\\/\\/)?${SPOTIFY_HOST_PATTERN}|(?:https?:\\/\\/)?${SPOTIFY_HOST_PATTERN}\\/)`,
		"i",
	).exec(src);
	return match ? match.index : undefined;
}
