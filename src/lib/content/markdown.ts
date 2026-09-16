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

import {
	fallbackLinkCard,
	fetchLinkCard,
	linkCardHtml,
	type LinkCardData,
	type LinkCardFetcher,
} from "./link-card.ts";
import { linkBlockStartIndex, matchStandaloneLinkBlock } from "./link-url.ts";
import {
	matchStandaloneTweetBlock,
	tweetBlockStartIndex,
} from "./tweet-url.ts";
import { fetchTweetEmbed, tweetEmbedHtml, type TweetFetcher } from "./tweet.ts";
import {
	matchStandaloneYoutubeBlock,
	youtubeBlockStartIndex,
} from "./youtube-url.ts";
import {
	fetchYoutubeEmbed,
	youtubeEmbedHtml,
	type YoutubeFetcher,
} from "./youtube.ts";

export type { LinkCardFetcher, TweetFetcher, YoutubeFetcher };

const MAX_LINK_FETCHES = 8;

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

type EmbedRef = {
	id: string;
	href: string;
};

type LinkRef = {
	href: string;
};

function createTweetExtension(pending: EmbedRef[]) {
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
				id: String(token.id ?? ""),
				href: String(token.href ?? ""),
			});
			return `<div data-tweet-embed="${index}"></div>\n`;
		},
	};
}

function createYoutubeExtension(pending: EmbedRef[]) {
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
				id: String(token.id ?? ""),
				href: String(token.href ?? ""),
			});
			return `<div data-youtube-embed="${index}"></div>\n`;
		},
	};
}

function createLinkExtension(pending: LinkRef[]) {
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
				href: String(token.href ?? ""),
			});
			return `<div data-link-embed="${index}"></div>\n`;
		},
	};
}

async function fillEmbeds<T>(
	ids: string[],
	fetcher: (id: string) => Promise<T | null>,
): Promise<Map<string, T | null>> {
	const results = new Map<string, T | null>();
	await Promise.all(
		[...new Set(ids)].map(async (id) => {
			try {
				results.set(id, await fetcher(id));
			} catch {
				results.set(id, null);
			}
		}),
	);
	return results;
}

function replaceEmbedPlaceholders(
	html: string,
	attribute: string,
	pending: EmbedRef[],
	render: (href: string, id: string) => string,
): string {
	const pattern = new RegExp(`<div data-${attribute}="(\\d+)"></div>`, "g");
	return html.replace(pattern, (_match, index: string) => {
		const ref = pending[Number(index)];
		if (!ref) {
			return "";
		}
		return render(ref.href, ref.id);
	});
}

export async function renderBlogMarkdown(
	markdown: string,
	options: {
		fetchTweet?: TweetFetcher;
		fetchYoutube?: YoutubeFetcher;
		fetchLink?: LinkCardFetcher;
	} = {},
): Promise<string> {
	const pendingTweets: EmbedRef[] = [];
	const pendingYoutube: EmbedRef[] = [];
	const pendingLinks: LinkRef[] = [];
	const marked = new Marked({
		gfm: true,
		renderer: {
			code: renderCode,
		},
	});
	marked.use({
		extensions: [
			createTweetExtension(pendingTweets),
			createYoutubeExtension(pendingYoutube),
			createLinkExtension(pendingLinks),
		],
	});

	let html = marked.parse(markdown, { async: false }) as string;
	if (
		pendingTweets.length === 0 &&
		pendingYoutube.length === 0 &&
		pendingLinks.length === 0
	) {
		return html;
	}

	const fetchTweet = options.fetchTweet ?? fetchTweetEmbed;
	const fetchYoutube = options.fetchYoutube ?? fetchYoutubeEmbed;
	const fetchLink = options.fetchLink ?? fetchLinkCard;
	const cards = new Map<string, LinkCardData>();
	const uniqueLinks = [...new Set(pendingLinks.map((ref) => ref.href))];
	const linksToFetch = uniqueLinks.slice(0, MAX_LINK_FETCHES);
	for (const href of uniqueLinks.slice(MAX_LINK_FETCHES)) {
		cards.set(href, fallbackLinkCard(href));
	}

	const [tweets, videos] = await Promise.all([
		fillEmbeds(
			pendingTweets.map((ref) => ref.id),
			fetchTweet,
		),
		fillEmbeds(
			pendingYoutube.map((ref) => ref.id),
			fetchYoutube,
		),
		...linksToFetch.map(async (href) => {
			try {
				cards.set(href, await fetchLink(href));
			} catch {
				cards.set(href, fallbackLinkCard(href));
			}
		}),
	]);

	html = replaceEmbedPlaceholders(
		html,
		"tweet-embed",
		pendingTweets,
		(href, id) => tweetEmbedHtml(href, tweets.get(id) ?? null),
	);
	html = replaceEmbedPlaceholders(
		html,
		"youtube-embed",
		pendingYoutube,
		(href, id) => youtubeEmbedHtml(href, videos.get(id) ?? null),
	);
	return html.replace(
		/<div data-link-embed="(\d+)"><\/div>/g,
		(_match, index: string) => {
			const ref = pendingLinks[Number(index)];
			if (!ref) {
				return "";
			}
			return linkCardHtml(cards.get(ref.href) ?? fallbackLinkCard(ref.href));
		},
	);
}
