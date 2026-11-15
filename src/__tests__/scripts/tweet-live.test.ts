/// <reference lib="dom" />
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { hasLiveTweet, TWEET_WIDGETS_ORIGIN } from "@/lib/content/tweet-live";
import { mountLiveTweets } from "@/scripts/tweet-live";

function frame(attributes: string): HTMLElement {
	document.body.innerHTML = `<div class="tweet-embed-frame" data-tweet-id="123" ${attributes}><blockquote class="tweet-embed">static</blockquote><div class="tweet-embed-live"></div></div>`;
	return document.querySelector(".tweet-embed-frame") as HTMLElement;
}

async function flush(): Promise<void> {
	for (let i = 0; i < 5; i += 1) {
		await Promise.resolve();
	}
}

describe("hasLiveTweet", () => {
	it("finds <Tweet ... live /> only", () => {
		expect(hasLiveTweet('<Tweet id="1" live />')).toBe(true);
		expect(hasLiveTweet('<Tweet live id="1" />')).toBe(true);
		expect(hasLiveTweet('<Tweet id="1" live={true} />')).toBe(true);
		expect(hasLiveTweet('<Tweet id="1" />')).toBe(false);
		expect(hasLiveTweet('<Tweet id="1" liveliness="x" />')).toBe(false);
		expect(hasLiveTweet("live な話")).toBe(false);
	});
});

describe("mountLiveTweets", () => {
	afterEach(() => {
		delete window.twttr;
		vi.unstubAllGlobals();
		document.body.innerHTML = "";
	});

	it("does nothing without live tweets", () => {
		frame("");
		const append = vi.spyOn(document.head, "appendChild");
		mountLiveTweets();
		expect(append).not.toHaveBeenCalled();
	});

	it("swaps in the official embed with do-not-track", async () => {
		vi.stubGlobal("IntersectionObserver", undefined);
		const createTweet = vi.fn(async () => document.createElement("div"));
		window.twttr = { widgets: { createTweet } };
		const element = frame('data-tweet-live="" data-tweet-cards="hidden"');

		mountLiveTweets();
		await flush();

		expect(createTweet).toHaveBeenCalledWith(
			"123",
			element.querySelector(".tweet-embed-live"),
			expect.objectContaining({
				dnt: true,
				cards: "hidden",
				conversation: "none",
			}),
		);
		expect(element.classList.contains("is-live")).toBe(true);
	});

	it("keeps the static card when the embed fails", async () => {
		vi.stubGlobal("IntersectionObserver", undefined);
		window.twttr = { widgets: { createTweet: vi.fn(async () => undefined) } };
		const element = frame('data-tweet-live=""');

		mountLiveTweets();
		await flush();

		expect(element.classList.contains("is-live")).toBe(false);
	});
});

describe("blog post page", () => {
	it("adds widgets.js to CSP only for posts with <Tweet live />", () => {
		const page = readFileSync(
			join(process.cwd(), "src/pages/blog/[id].astro"),
			"utf8",
		);
		expect(page).toContain("hasLiveTweet(entry.body");
		expect(page).toContain("Astro.csp?.insertScriptResource");
		expect(page).toContain("mountLiveTweets()");
		expect(TWEET_WIDGETS_ORIGIN).toBe("https://platform.twitter.com");
	});
});
