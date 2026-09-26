import { Marked } from "marked";
import Prism from "prismjs";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-diff.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-yaml.js";

import type { BlogEmbed } from "./embed-cache.ts";
import {
	fallbackLinkCard,
	linkCardHtml,
	type LinkCardData,
} from "./link-card.ts";
import { linkBlockStartIndex, matchStandaloneLinkBlock } from "./link-url.ts";
import {
	matchStandaloneSpotifyBlock,
	spotifyBlockStartIndex,
} from "./spotify-url.ts";
import { spotifyEmbedHtml } from "./spotify.ts";
import {
	matchStandaloneTweetBlock,
	tweetBlockStartIndex,
} from "./tweet-url.ts";
import { tweetEmbedHtml, type TweetEmbedData } from "./tweet.ts";
import {
	matchStandaloneYoutubeBlock,
	youtubeBlockStartIndex,
} from "./youtube-url.ts";
import { youtubeEmbedHtml, type YoutubeEmbedData } from "./youtube.ts";

export type {
	BlogEmbed,
	BlogEmbedLink,
	BlogEmbedSpotify,
	BlogEmbedTweet,
	BlogEmbedYoutube,
} from "./embed-cache.ts";

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function renderCode({ text, lang }: { text: string; lang?: string }): string {
	const language = lang?.split(/\s+/)[0] ?? "";
	const grammar = language ? Prism.languages[language] : undefined;
	const highlighted = grammar
		? Prism.highlight(text, grammar, language)
		: escapeHtml(text);
	const className = language ? `language-${language}` : "";
	return `<pre class="${className}"><code class="${className}">${highlighted}</code></pre>\n`;
}

type PendingEmbed = BlogEmbed;

function createTweetExtension(pending: PendingEmbed[]) {
	return {
		name: "tweetEmbed",
		level: "block" as const,
		start(src: string) {
			return tweetBlockStartIndex(src);
		},
		tokenizer(src: string) {
			const match = matchStandaloneTweetBlock(src);
			if (!match) {
				return undefined;
			}
			return {
				type: "tweetEmbed",
				raw: match.raw,
				id: match.id,
				href: match.href,
			};
		},
		renderer(token: { id?: unknown; href?: unknown }) {
			const index = pending.length;
			pending.push({
				kind: "tweet",
				id: String(token.id ?? ""),
				href: String(token.href ?? ""),
			});
			return `<div data-tweet-embed="${index}"></div>\n`;
		},
	};
}

function createYoutubeExtension(pending: PendingEmbed[]) {
	return {
		name: "youtubeEmbed",
		level: "block" as const,
		start(src: string) {
			return youtubeBlockStartIndex(src);
		},
		tokenizer(src: string) {
			const match = matchStandaloneYoutubeBlock(src);
			if (!match) {
				return undefined;
			}
			return {
				type: "youtubeEmbed",
				raw: match.raw,
				id: match.id,
				href: match.href,
			};
		},
		renderer(token: { id?: unknown; href?: unknown }) {
			const index = pending.length;
			pending.push({
				kind: "youtube",
				id: String(token.id ?? ""),
				href: String(token.href ?? ""),
			});
			return `<div data-youtube-embed="${index}"></div>\n`;
		},
	};
}

function createSpotifyExtension(pending: PendingEmbed[]) {
	return {
		name: "spotifyEmbed",
		level: "block" as const,
		start(src: string) {
			return spotifyBlockStartIndex(src);
		},
		tokenizer(src: string) {
			const match = matchStandaloneSpotifyBlock(src);
			if (!match) {
				return undefined;
			}
			return {
				type: "spotifyEmbed",
				raw: match.raw,
				href: match.href,
			};
		},
		renderer(token: { href?: unknown }) {
			const index = pending.length;
			pending.push({
				kind: "spotify",
				href: String(token.href ?? ""),
			});
			return `<div data-spotify-embed="${index}"></div>\n`;
		},
	};
}

function createLinkExtension(pending: PendingEmbed[]) {
	return {
		name: "linkCard",
		level: "block" as const,
		start(src: string) {
			return linkBlockStartIndex(src);
		},
		tokenizer(src: string) {
			const match = matchStandaloneLinkBlock(src);
			if (!match) {
				return undefined;
			}
			return {
				type: "linkCard",
				raw: match.raw,
				href: match.href,
			};
		},
		renderer(token: { href?: unknown }) {
			const index = pending.length;
			pending.push({
				kind: "link",
				href: String(token.href ?? ""),
			});
			return `<div data-link-embed="${index}"></div>\n`;
		},
	};
}

function parsePendingEmbeds(markdown: string): PendingEmbed[] {
	const pending: PendingEmbed[] = [];
	const marked = new Marked({
		gfm: true,
		renderer: {
			code: renderCode,
		},
	});
	marked.use({
		extensions: [
			createTweetExtension(pending),
			createYoutubeExtension(pending),
			createSpotifyExtension(pending),
			createLinkExtension(pending),
		],
	});
	marked.parse(markdown, { async: false });
	return pending;
}

export function collectBlogEmbeds(markdown: string): BlogEmbed[] {
	const seenTweet = new Set<string>();
	const seenYoutube = new Set<string>();
	const seenLink = new Set<string>();
	const seenSpotify = new Set<string>();
	const embeds: BlogEmbed[] = [];
	for (const item of parsePendingEmbeds(markdown)) {
		if (item.kind === "tweet") {
			if (seenTweet.has(item.id)) {
				continue;
			}
			seenTweet.add(item.id);
			embeds.push(item);
			continue;
		}
		if (item.kind === "youtube") {
			if (seenYoutube.has(item.id)) {
				continue;
			}
			seenYoutube.add(item.id);
			embeds.push(item);
			continue;
		}
		if (item.kind === "spotify") {
			if (seenSpotify.has(item.href)) {
				continue;
			}
			seenSpotify.add(item.href);
			embeds.push(item);
			continue;
		}
		if (seenLink.has(item.href)) {
			continue;
		}
		seenLink.add(item.href);
		embeds.push(item);
	}
	return embeds;
}

export type RenderBlogMarkdownOptions = {
	tweets?: ReadonlyMap<string, TweetEmbedData | null>;
	videos?: ReadonlyMap<string, YoutubeEmbedData | null>;
	links?: ReadonlyMap<string, LinkCardData>;
};

export async function renderBlogMarkdown(
	markdown: string,
	options: RenderBlogMarkdownOptions = {},
): Promise<string> {
	const pending: PendingEmbed[] = [];
	const marked = new Marked({
		gfm: true,
		renderer: {
			code: renderCode,
		},
	});
	marked.use({
		extensions: [
			createTweetExtension(pending),
			createYoutubeExtension(pending),
			createSpotifyExtension(pending),
			createLinkExtension(pending),
		],
	});

	const html = marked.parse(markdown, { async: false }) as string;
	if (pending.length === 0) {
		return html;
	}

	const tweets = options.tweets ?? new Map();
	const videos = options.videos ?? new Map();
	const links = options.links ?? new Map();

	return html
		.replace(
			/<div data-tweet-embed="(\d+)"><\/div>/g,
			(_match, index: string) => {
				const ref = pending[Number(index)];
				if (ref?.kind !== "tweet") {
					return "";
				}
				return tweetEmbedHtml(ref.href, tweets.get(ref.id) ?? null);
			},
		)
		.replace(
			/<div data-youtube-embed="(\d+)"><\/div>/g,
			(_match, index: string) => {
				const ref = pending[Number(index)];
				if (ref?.kind !== "youtube") {
					return "";
				}
				return youtubeEmbedHtml(ref.href, videos.get(ref.id) ?? null);
			},
		)
		.replace(
			/<div data-link-embed="(\d+)"><\/div>/g,
			(_match, index: string) => {
				const ref = pending[Number(index)];
				if (ref?.kind !== "link") {
					return "";
				}
				return linkCardHtml(links.get(ref.href) ?? fallbackLinkCard(ref.href));
			},
		)
		.replace(
			/<div data-spotify-embed="(\d+)"><\/div>/g,
			(_match, index: string) => {
				const ref = pending[Number(index)];
				if (ref?.kind !== "spotify") {
					return "";
				}
				return spotifyEmbedHtml(ref.href);
			},
		);
}
