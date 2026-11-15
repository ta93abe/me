import type { BlogEmbed } from "./embed-cache.ts";
import { matchStandaloneLinkBlock } from "./link-url.ts";
import { matchStandaloneSpotifyBlock } from "./spotify-url.ts";
import { matchStandaloneTweetBlock } from "./tweet-url.ts";
import { matchStandaloneYoutubeBlock } from "./youtube-url.ts";

/**
 * 段落のソースが「URL（または Markdown リンク）1 つだけ」なら埋め込みにする。
 * 判定は marked 版（`markdown.ts`）と同じ matcher を使い、X → YouTube → Spotify → リンクカードの順で決める。
 */
export function standaloneEmbed(source: string): BlogEmbed | null {
	const text = source.trim();
	if (text.length === 0 || text.includes("\n")) {
		return null;
	}
	const whole = (raw: string) => raw.trim() === text;

	const tweet = matchStandaloneTweetBlock(text);
	if (tweet && whole(tweet.raw)) {
		return { kind: "tweet", id: tweet.id, href: tweet.href };
	}
	const youtube = matchStandaloneYoutubeBlock(text);
	if (youtube && whole(youtube.raw)) {
		return { kind: "youtube", id: youtube.id, href: youtube.href };
	}
	const spotify = matchStandaloneSpotifyBlock(text);
	if (spotify && whole(spotify.raw)) {
		return { kind: "spotify", href: spotify.href };
	}
	const link = matchStandaloneLinkBlock(text);
	if (link && whole(link.raw)) {
		return { kind: "link", href: link.href };
	}
	return null;
}
