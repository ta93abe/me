import { describe, expect, it } from "vitest";

import {
	isTweetId,
	matchStandaloneTweetBlock,
	parseTweetUrl,
} from "@/lib/content/tweet-url";

describe("parseTweetUrl", () => {
	it("accepts twitter.com and x.com status URLs", () => {
		expect(parseTweetUrl("https://twitter.com/jack/status/20")).toEqual({
			id: "20",
			url: "https://x.com/jack/status/20",
		});
		expect(parseTweetUrl("https://x.com/jack/status/20?s=20&t=abc")).toEqual({
			id: "20",
			url: "https://x.com/jack/status/20",
		});
	});

	it("accepts www, mobile, and i/status share links", () => {
		expect(parseTweetUrl("https://www.x.com/jack/status/20")?.id).toBe("20");
		expect(parseTweetUrl("https://mobile.twitter.com/jack/status/20")?.id).toBe(
			"20",
		);
		expect(parseTweetUrl("https://x.com/i/status/20")).toEqual({
			id: "20",
			url: "https://x.com/i/status/20",
		});
		expect(parseTweetUrl("https://x.com/i/web/status/20")?.id).toBe("20");
	});

	it("rejects non-tweet URLs", () => {
		expect(parseTweetUrl("https://x.com/jack")).toBeNull();
		expect(parseTweetUrl("https://example.com/status/20")).toBeNull();
		expect(parseTweetUrl("javascript:alert(1)")).toBeNull();
		expect(parseTweetUrl("not a url")).toBeNull();
	});
});

describe("matchStandaloneTweetBlock", () => {
	it("picks up a bare x.com status URL", () => {
		expect(matchStandaloneTweetBlock("https://x.com/jack/status/20\n")).toEqual(
			{
				raw: "https://x.com/jack/status/20\n",
				href: "https://x.com/jack/status/20",
				id: "20",
			},
		);
		expect(matchStandaloneTweetBlock("x.com/jack/status/20")).toEqual({
			raw: "x.com/jack/status/20",
			href: "https://x.com/jack/status/20",
			id: "20",
		});
	});

	it("picks up markdown and angle-bracket links that are the whole block", () => {
		expect(
			matchStandaloneTweetBlock(
				"[https://x.com/jack/status/20](https://x.com/jack/status/20)",
			),
		).toEqual({
			raw: "[https://x.com/jack/status/20](https://x.com/jack/status/20)",
			href: "https://x.com/jack/status/20",
			id: "20",
		});
		expect(matchStandaloneTweetBlock("<https://x.com/jack/status/20>")).toEqual(
			{
				raw: "<https://x.com/jack/status/20>",
				href: "https://x.com/jack/status/20",
				id: "20",
			},
		);
	});

	it("ignores profile URLs and in-sentence leftovers", () => {
		expect(matchStandaloneTweetBlock("https://x.com/jack\n")).toBeNull();
		expect(
			matchStandaloneTweetBlock("See https://x.com/jack/status/20 here.\n"),
		).toBeNull();
	});
});

describe("isTweetId", () => {
	it("accepts numeric snowflake ids", () => {
		expect(isTweetId("20")).toBe(true);
		expect(isTweetId("1585841080431321088")).toBe(true);
		expect(isTweetId("abc")).toBe(false);
		expect(isTweetId("")).toBe(false);
	});
});
