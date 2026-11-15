import { isTweetId, parseTweetUrl } from "./tweet-url.ts";

export type TweetRefInput = {
	id?: string | number;
	url?: string;
};

export type TweetRef = {
	id: string;
	href: string;
};

/**
 * `<Tweet id="..." />` / `<Tweet url="https://x.com/.../status/..." />` を解決する。
 * Slidev と同じく両方あれば id を優先する。どちらも不正なら null。
 */
export function resolveTweetRef(input: TweetRefInput): TweetRef | null {
	const id = input.id === undefined ? "" : String(input.id).trim();
	if (id) {
		if (!isTweetId(id)) {
			return null;
		}
		const fromUrl = input.url ? parseTweetUrl(input.url) : null;
		return {
			id,
			href: fromUrl?.id === id ? fromUrl.url : `https://x.com/i/status/${id}`,
		};
	}
	const parsed = input.url ? parseTweetUrl(input.url) : null;
	return parsed ? { id: parsed.id, href: parsed.url } : null;
}

/** `scale` は 0.25〜3 の数だけ受け付ける（CSS 変数に入れるので文字列はそのまま使わない）。 */
export function parseTweetScale(
	value: string | number | undefined,
): number | undefined {
	if (value === undefined || value === "") {
		return undefined;
	}
	const scale = Number(value);
	if (!Number.isFinite(scale) || scale < 0.25 || scale > 3) {
		return Number.NaN;
	}
	return scale;
}
