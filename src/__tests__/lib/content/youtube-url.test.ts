import { describe, expect, it } from "vitest";

import {
	isYoutubeId,
	matchStandaloneYoutubeBlock,
	parseYoutubeRef,
} from "@/lib/content/youtube-url";

describe("parseYoutubeRef", () => {
	it("accepts watch, short, embed, shorts, and live URLs", () => {
		expect(
			parseYoutubeRef("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
		).toEqual({
			id: "dQw4w9WgXcQ",
			url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		});
		expect(parseYoutubeRef("https://youtu.be/dQw4w9WgXcQ")).toEqual({
			id: "dQw4w9WgXcQ",
			url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		});
		expect(
			parseYoutubeRef("https://www.youtube.com/embed/dQw4w9WgXcQ"),
		).toEqual({
			id: "dQw4w9WgXcQ",
			url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		});
		expect(
			parseYoutubeRef("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
		).toEqual({
			id: "dQw4w9WgXcQ",
			url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		});
		expect(parseYoutubeRef("https://www.youtube.com/live/dQw4w9WgXcQ")).toEqual(
			{
				id: "dQw4w9WgXcQ",
				url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			},
		);
	});

	it("accepts a bare video id and mobile hosts", () => {
		expect(parseYoutubeRef("dQw4w9WgXcQ")).toEqual({
			id: "dQw4w9WgXcQ",
			url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		});
		expect(
			parseYoutubeRef("https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share")
				?.id,
		).toBe("dQw4w9WgXcQ");
		expect(
			parseYoutubeRef("https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=abc")
				?.id,
		).toBe("dQw4w9WgXcQ");
		expect(
			parseYoutubeRef("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")?.id,
		).toBe("dQw4w9WgXcQ");
	});

	it("keeps a start offset on the canonical watch URL", () => {
		expect(parseYoutubeRef("https://youtu.be/dQw4w9WgXcQ?t=90")).toEqual({
			id: "dQw4w9WgXcQ",
			url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90",
		});
		expect(
			parseYoutubeRef("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s")
				?.url,
		).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90");
	});

	it("rejects non-video URLs", () => {
		expect(parseYoutubeRef("https://www.youtube.com/@ta93abe")).toBeNull();
		expect(
			parseYoutubeRef("https://www.youtube.com/playlist?list=PLabc"),
		).toBeNull();
		expect(
			parseYoutubeRef("https://example.com/watch?v=dQw4w9WgXcQ"),
		).toBeNull();
		expect(parseYoutubeRef("javascript:alert(1)")).toBeNull();
		expect(parseYoutubeRef("not a url")).toBeNull();
		expect(parseYoutubeRef("shortid")).toBeNull();
	});
});

describe("matchStandaloneYoutubeBlock", () => {
	it("picks up Zenn @[youtube] syntax with an id or URL", () => {
		expect(matchStandaloneYoutubeBlock("@[youtube](dQw4w9WgXcQ)\n")).toEqual({
			raw: "@[youtube](dQw4w9WgXcQ)\n",
			href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			id: "dQw4w9WgXcQ",
		});
		expect(
			matchStandaloneYoutubeBlock(
				"@[youtube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
			),
		).toEqual({
			raw: "@[youtube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
			href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			id: "dQw4w9WgXcQ",
		});
	});

	it("picks up a bare YouTube URL", () => {
		expect(
			matchStandaloneYoutubeBlock(
				"https://www.youtube.com/watch?v=dQw4w9WgXcQ\n",
			),
		).toEqual({
			raw: "https://www.youtube.com/watch?v=dQw4w9WgXcQ\n",
			href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			id: "dQw4w9WgXcQ",
		});
		expect(matchStandaloneYoutubeBlock("youtu.be/dQw4w9WgXcQ")).toEqual({
			raw: "youtu.be/dQw4w9WgXcQ",
			href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			id: "dQw4w9WgXcQ",
		});
	});

	it("picks up markdown and angle-bracket links that are the whole block", () => {
		expect(
			matchStandaloneYoutubeBlock(
				"[https://youtu.be/dQw4w9WgXcQ](https://youtu.be/dQw4w9WgXcQ)",
			),
		).toEqual({
			raw: "[https://youtu.be/dQw4w9WgXcQ](https://youtu.be/dQw4w9WgXcQ)",
			href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			id: "dQw4w9WgXcQ",
		});
		expect(
			matchStandaloneYoutubeBlock("<https://youtu.be/dQw4w9WgXcQ>"),
		).toEqual({
			raw: "<https://youtu.be/dQw4w9WgXcQ>",
			href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			id: "dQw4w9WgXcQ",
		});
	});

	it("ignores channel URLs and in-sentence leftovers", () => {
		expect(
			matchStandaloneYoutubeBlock("https://www.youtube.com/@ta93abe\n"),
		).toBeNull();
		expect(
			matchStandaloneYoutubeBlock("See https://youtu.be/dQw4w9WgXcQ here.\n"),
		).toBeNull();
	});
});

describe("isYoutubeId", () => {
	it("accepts 11-character video ids", () => {
		expect(isYoutubeId("dQw4w9WgXcQ")).toBe(true);
		expect(isYoutubeId("abcdefghijk")).toBe(true);
		expect(isYoutubeId("short")).toBe(false);
		expect(isYoutubeId("dQw4w9WgXcQ extra")).toBe(false);
		expect(isYoutubeId("")).toBe(false);
	});
});
