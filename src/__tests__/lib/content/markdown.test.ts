import { describe, expect, it, vi } from "vitest";

import type { LinkCardData } from "@/lib/content/link-card";
import { renderBlogMarkdown } from "@/lib/content/markdown";
import type { TweetEmbedData } from "@/lib/content/tweet";

const jack: TweetEmbedData = {
	id: "20",
	url: "https://x.com/jack/status/20",
	text: "just setting up my twttr",
	createdAt: "2006-03-21T20:50:14.000Z",
	displayTextRange: [0, 24],
	author: {
		name: "jack",
		screenName: "jack",
		avatarUrl: "https://pbs.twimg.com/profile_images/example.jpg",
		verified: true,
	},
	photos: [],
	entities: [],
};

const coosenp: LinkCardData = {
	href: "https://coosenp.ai/",
	title: "CooSenpAI — アレコレソレが通じるAI",
	description: "AI に聞くたびチャットを開いてコピペして状況を説明する。",
	image: "https://coosenp.ai/og.png",
	domain: "coosenp.ai",
	favicon: "https://coosenp.ai/favicon.png",
};

describe("renderBlogMarkdown", () => {
	it("renders headings and paragraphs", async () => {
		const html = await renderBlogMarkdown("# Hello\n\nA paragraph.");
		expect(html).toContain("<h1>");
		expect(html).toContain("Hello");
		expect(html).toContain("<p>A paragraph.</p>");
	});

	it("highlights fenced code with Prism classes", async () => {
		const html = await renderBlogMarkdown("```ts\nconst n = 1;\n```");
		expect(html).toContain('class="language-ts"');
		expect(html).toContain("token");
	});

	it("escapes unhighlighted code", async () => {
		const html = await renderBlogMarkdown(
			"```unknownlang\n<script>alert(1)</script>\n```",
		);
		expect(html).not.toContain("<script>");
		expect(html).toContain("&lt;script&gt;");
	});

	it("embeds Zenn @[tweet] syntax as a static card", async () => {
		const fetchTweet = vi.fn(async () => jack);
		const html = await renderBlogMarkdown(
			"Intro.\n\n@[tweet](https://twitter.com/jack/status/20)\n\nOutro.",
			{ fetchTweet },
		);

		expect(fetchTweet).toHaveBeenCalledWith("20");
		expect(html).toContain('class="tweet-embed"');
		expect(html).toContain("just setting up my twttr");
		expect(html).toContain("<p>Intro.</p>");
		expect(html).toContain("<p>Outro.</p>");
		expect(html).not.toContain("data-tweet-embed");
	});

	it("embeds a standalone tweet URL on its own line", async () => {
		const fetchTweet = vi.fn(async () => jack);
		const html = await renderBlogMarkdown("https://x.com/jack/status/20\n", {
			fetchTweet,
		});
		expect(html).toContain('class="tweet-embed"');
		expect(html).not.toContain("<p>https://x.com/jack/status/20</p>");
	});

	it("embeds markdown and protocol-less x.com URLs as cards", async () => {
		const fetchTweet = vi.fn(async () => jack);
		const linked = await renderBlogMarkdown(
			"[https://x.com/jack/status/20](https://x.com/jack/status/20)\n",
			{ fetchTweet },
		);
		const bare = await renderBlogMarkdown("x.com/jack/status/20\n", {
			fetchTweet,
		});
		const labeled = await renderBlogMarkdown(
			"[ポスト](https://x.com/jack/status/20)\n",
			{ fetchTweet },
		);

		expect(linked).toContain('class="tweet-embed"');
		expect(bare).toContain('class="tweet-embed"');
		expect(labeled).toContain('class="tweet-embed"');
		expect(fetchTweet).toHaveBeenCalledTimes(3);
	});

	it("does not embed a tweet URL inside a sentence or a fence", async () => {
		const fetchTweet = vi.fn(async () => jack);
		const paragraph = await renderBlogMarkdown(
			"See https://x.com/jack/status/20 here.",
			{ fetchTweet },
		);
		const fenced = await renderBlogMarkdown(
			"```\nhttps://x.com/jack/status/20\n```",
			{ fetchTweet },
		);

		expect(fetchTweet).not.toHaveBeenCalled();
		expect(paragraph).not.toContain("tweet-embed");
		expect(fenced).toContain("<pre");
		expect(fenced).not.toContain("tweet-embed");
	});

	it("fetches a duplicate tweet id once and falls back when missing", async () => {
		const fetchTweet = vi.fn(async () => null);
		const html = await renderBlogMarkdown(
			"@[tweet](https://x.com/jack/status/20)\n\n@[tweet](https://twitter.com/jack/status/20)\n",
			{ fetchTweet },
		);

		expect(fetchTweet).toHaveBeenCalledOnce();
		expect(
			html.match(/class="tweet-embed tweet-embed-fallback"/g)?.length,
		).toBe(2);
	});

	it("embeds a standalone https URL as an OGP card", async () => {
		const fetchLink = vi.fn(async () => coosenp);
		const html = await renderBlogMarkdown(
			"Intro.\n\nhttps://coosenp.ai\n\nOutro.",
			{ fetchLink },
		);

		expect(fetchLink).toHaveBeenCalledWith("https://coosenp.ai/");
		expect(html).toContain('class="embed-card"');
		expect(html).toContain("CooSenpAI — アレコレソレが通じるAI");
		expect(html).toContain("coosenp.ai");
		expect(html).toContain("<p>Intro.</p>");
		expect(html).toContain("<p>Outro.</p>");
		expect(html).not.toContain("data-link-embed");
		expect(html).not.toContain("<p>https://coosenp.ai");
	});

	it("embeds a markdown link that is the whole paragraph", async () => {
		const fetchLink = vi.fn(async () => coosenp);
		const html = await renderBlogMarkdown("[CooSenpAI](https://coosenp.ai)\n", {
			fetchLink,
		});
		expect(html).toContain('class="embed-card"');
		expect(html).not.toContain("<p><a href");
	});

	it("does not card a URL inside a sentence or a fence", async () => {
		const fetchLink = vi.fn(async () => coosenp);
		const paragraph = await renderBlogMarkdown(
			"See https://example.com here.",
			{ fetchLink },
		);
		const fenced = await renderBlogMarkdown("```\nhttps://example.com\n```", {
			fetchLink,
		});

		expect(fetchLink).not.toHaveBeenCalled();
		expect(paragraph).not.toContain("embed-card");
		expect(fenced).toContain("<pre");
		expect(fenced).not.toContain("embed-card");
	});

	it("keeps X status URLs as tweet cards, not OGP cards", async () => {
		const fetchTweet = vi.fn(async () => jack);
		const fetchLink = vi.fn(async () => coosenp);
		const html = await renderBlogMarkdown("https://x.com/jack/status/20\n", {
			fetchTweet,
			fetchLink,
		});

		expect(fetchLink).not.toHaveBeenCalled();
		expect(fetchTweet).toHaveBeenCalledWith("20");
		expect(html).toContain('class="tweet-embed"');
		expect(html).not.toContain("embed-card");
	});

	it("fetches a duplicate link once and never emits a Substack widget", async () => {
		const fetchLink = vi.fn(async () => ({
			...coosenp,
			href: "https://ta93abe.substack.com/",
			domain: "ta93abe.substack.com",
			title: "Newsletter",
		}));
		const html = await renderBlogMarkdown(
			"https://ta93abe.substack.com\n\nhttps://ta93abe.substack.com/\n",
			{ fetchLink },
		);

		expect(fetchLink).toHaveBeenCalledOnce();
		expect(html).toContain('class="embed-card"');
		expect(html).not.toContain("<iframe");
		expect(html).not.toContain("substack.com/embed");
	});
});
