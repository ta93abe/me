import { describe, expect, it } from "vitest";

import {
	linkBlockStartIndex,
	matchStandaloneLinkBlock,
	parseLinkUrl,
} from "@/lib/content/link-url";

describe("parseLinkUrl", () => {
	it("accepts public http(s) URLs", () => {
		expect(parseLinkUrl("https://coosenp.ai")).toEqual({
			href: "https://coosenp.ai/",
		});
		expect(parseLinkUrl("https://github.com/ta93abe/me")).toEqual({
			href: "https://github.com/ta93abe/me",
		});
		expect(parseLinkUrl("http://example.com/path?q=1")).toEqual({
			href: "http://example.com/path?q=1",
		});
	});

	it("rejects tweet and YouTube URLs so dedicated embeds own them", () => {
		expect(parseLinkUrl("https://x.com/jack/status/20")).toBeNull();
		expect(parseLinkUrl("https://twitter.com/jack/status/20")).toBeNull();
		expect(parseLinkUrl("https://youtu.be/dQw4w9WgXcQ")).toBeNull();
		expect(
			parseLinkUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
		).toBeNull();
	});

	it("rejects private, script, and non-http URLs", () => {
		expect(parseLinkUrl("javascript:alert(1)")).toBeNull();
		expect(parseLinkUrl("data:text/html,hi")).toBeNull();
		expect(parseLinkUrl("https://localhost/secret")).toBeNull();
		expect(parseLinkUrl("https://127.0.0.1/")).toBeNull();
		expect(parseLinkUrl("https://192.168.0.8/")).toBeNull();
		expect(parseLinkUrl("not a url")).toBeNull();
	});
});

describe("matchStandaloneLinkBlock", () => {
	it("picks up a bare https URL on its own line", () => {
		expect(
			matchStandaloneLinkBlock("https://coosenp.ai\n\nNext paragraph."),
		).toEqual({
			raw: "https://coosenp.ai\n\n",
			href: "https://coosenp.ai/",
		});
	});

	it("picks up markdown and angle-bracket links that are the whole block", () => {
		expect(
			matchStandaloneLinkBlock("[CooSenpAI](https://coosenp.ai)\n"),
		).toEqual({
			raw: "[CooSenpAI](https://coosenp.ai)\n",
			href: "https://coosenp.ai/",
		});
		expect(matchStandaloneLinkBlock("<https://example.com/a>")).toEqual({
			raw: "<https://example.com/a>",
			href: "https://example.com/a",
		});
	});

	it("ignores tweet URLs, in-sentence links, and profile leftovers", () => {
		expect(
			matchStandaloneLinkBlock("https://x.com/jack/status/20\n"),
		).toBeNull();
		expect(
			matchStandaloneLinkBlock("https://youtu.be/dQw4w9WgXcQ\n"),
		).toBeNull();
		expect(
			matchStandaloneLinkBlock("See https://example.com here.\n"),
		).toBeNull();
		expect(matchStandaloneLinkBlock("x.com/jack\n")).toBeNull();
	});
});

describe("linkBlockStartIndex", () => {
	it("finds the next standalone http(s) URL candidate", () => {
		expect(linkBlockStartIndex("Hello\n\nhttps://example.com\n")).toBe(6);
		expect(linkBlockStartIndex("no links")).toBeUndefined();
	});
});
