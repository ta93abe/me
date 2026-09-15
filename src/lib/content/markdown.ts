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
	matchStandaloneTweetBlock,
	tweetBlockStartIndex,
} from "./tweet-url.ts";
import { fetchTweetEmbed, tweetEmbedHtml, type TweetFetcher } from "./tweet.ts";

export type { TweetFetcher };

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

type TweetRef = {
	id: string;
	href: string;
};

function createTweetExtension(pending: TweetRef[]) {
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

export async function renderBlogMarkdown(
	markdown: string,
	options: { fetchTweet?: TweetFetcher } = {},
): Promise<string> {
	const pending: TweetRef[] = [];
	const marked = new Marked({
		gfm: true,
		renderer: {
			code: renderCode,
		},
	});
	marked.use({
		extensions: [createTweetExtension(pending)],
	});

	const html = marked.parse(markdown, { async: false }) as string;
	if (pending.length === 0) {
		return html;
	}

	const fetchTweet = options.fetchTweet ?? fetchTweetEmbed;
	const tweets = new Map<string, Awaited<ReturnType<TweetFetcher>>>();
	await Promise.all(
		[...new Set(pending.map((ref) => ref.id))].map(async (id) => {
			try {
				tweets.set(id, await fetchTweet(id));
			} catch {
				tweets.set(id, null);
			}
		}),
	);

	return html.replace(
		/<div data-tweet-embed="(\d+)"><\/div>/g,
		(_match, index: string) => {
			const ref = pending[Number(index)];
			if (!ref) {
				return "";
			}
			return tweetEmbedHtml(ref.href, tweets.get(ref.id) ?? null);
		},
	);
}
