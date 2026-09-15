const TWEET_ID = /^[0-9]{1,40}$/;
const STATUS_PATH = /\/status\/(\d+)/;

export type ParsedTweetUrl = {
	id: string;
	url: string;
};

export function isTweetId(value: string): boolean {
	return TWEET_ID.test(value);
}

export function parseTweetUrl(raw: string): ParsedTweetUrl | null {
	let parsed: URL;
	try {
		parsed = new URL(raw.trim());
	} catch {
		return null;
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return null;
	}

	const host = parsed.hostname
		.toLowerCase()
		.replace(/^www\./, "")
		.replace(/^mobile\./, "");
	if (host !== "twitter.com" && host !== "x.com") {
		return null;
	}

	const id = parsed.pathname.match(STATUS_PATH)?.[1];
	if (!id || !isTweetId(id)) {
		return null;
	}

	const handle = parsed.pathname.match(
		/^\/([A-Za-z0-9_]{1,15})\/status\//,
	)?.[1];

	return {
		id,
		url: `https://x.com/${handle ?? "i"}/status/${id}`,
	};
}

const BLOCK_END = "(?:[ \\t]*\\n+|$)";

function withHttps(raw: string): string {
	return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/**
 * 段落先頭のポスト URL / Markdown リンク / Zenn 記法を 1 ブロックとして取る。
 * 文中の URL は残して通常のリンクにする。
 */
export function matchStandaloneTweetBlock(
	src: string,
): { raw: string; href: string; id: string } | null {
	const candidates: Array<{ raw: string; href: string }> = [];

	const zenn = new RegExp(`^@\\[tweet\\]\\(([^)\\s]+)\\)${BLOCK_END}`).exec(
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
		`^((?:https?:\\/\\/)?(?:www\\.|mobile\\.)?(?:twitter|x)\\.com\\/[^\\s]+)${BLOCK_END}`,
		"i",
	).exec(src);
	if (bare?.[1]) {
		candidates.push({ raw: bare[0], href: withHttps(bare[1]) });
	}

	for (const candidate of candidates) {
		const parsed = parseTweetUrl(candidate.href);
		if (parsed) {
			return { raw: candidate.raw, href: parsed.url, id: parsed.id };
		}
	}

	return null;
}

export function tweetBlockStartIndex(src: string): number | undefined {
	const match =
		/(?:^|\n)(?:@\[tweet\]\(|<(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter|x)\.com|\[[^\]]*\]\((?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter|x)\.com|(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter|x)\.com\/)/i.exec(
			src,
		);
	return match ? match.index : undefined;
}
