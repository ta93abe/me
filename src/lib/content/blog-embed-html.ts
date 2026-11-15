import type { BlogEmbed } from "./embed-cache.ts";
import type { FaviconCache } from "./favicon.ts";
import { fetchLinkCard, linkCardHtml } from "./link-card.ts";
import { spotifyEmbedHtml } from "./spotify.ts";
import { fetchTweetEmbed, tweetEmbedHtml } from "./tweet.ts";
import { fetchYoutubeEmbed, youtubeEmbedHtml } from "./youtube.ts";

export type BlogEmbedFetchOptions = {
	fetch?: typeof fetch;
	favicons?: FaviconCache;
};

/**
 * ビルド時に埋め込み先を取得して HTML にする。取得に失敗したら各 builder のフォールバックを出す。
 */
export async function blogEmbedHtml(
	embed: BlogEmbed,
	options: BlogEmbedFetchOptions = {},
): Promise<string> {
	switch (embed.kind) {
		case "tweet":
			return tweetEmbedHtml(
				embed.href,
				await fetchTweetEmbed(embed.id, { fetch: options.fetch }),
			);
		case "youtube":
			return youtubeEmbedHtml(
				embed.href,
				await fetchYoutubeEmbed(embed.id, { fetch: options.fetch }),
			);
		case "spotify":
			return spotifyEmbedHtml(embed.href);
		case "link":
			return linkCardHtml(
				await fetchLinkCard(embed.href, {
					fetch: options.fetch,
					favicons: options.favicons,
				}),
			);
	}
}

const cache = new Map<string, Promise<string>>();
const favicons: FaviconCache = new Map();

/** 同じ URL はビルド中に 1 回だけ取りに行く（ページと RSS などで共有）。 */
export function cachedBlogEmbedHtml(embed: BlogEmbed): Promise<string> {
	const key = `${embed.kind}:${embed.href}`;
	let pending = cache.get(key);
	if (!pending) {
		pending = blogEmbedHtml(embed, { favicons });
		cache.set(key, pending);
	}
	return pending;
}
