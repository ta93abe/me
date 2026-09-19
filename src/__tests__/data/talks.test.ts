import { describe, expect, it } from "vitest";

import { TALKS, talkYoutubeUrl } from "@/data/talks";
import { isYoutubeId } from "@/lib/content/youtube-url";

describe("TALKS catalog", () => {
	it("lists recorded appearances newest first", () => {
		expect(TALKS.map((talk) => talk.slug)).toEqual([
			"frosty-friday-live-challenge-vol56",
			"mintsuyo-2026-rookie",
		]);
		expect(TALKS.map((talk) => talk.date)).toEqual([
			"2026-08-27",
			"2026-05-14",
		]);
	});

	it("keeps unique kebab slugs and valid YouTube ids", () => {
		const slugs = TALKS.map((talk) => talk.slug);
		expect(new Set(slugs).size).toBe(slugs.length);

		for (const talk of TALKS) {
			expect(talk.slug).toMatch(/^[a-z][a-z0-9-]*$/);
			expect(talk.title.length).toBeGreaterThan(0);
			expect(talk.event.length).toBeGreaterThan(0);
			expect(talk.excerpt.length).toBeGreaterThan(0);
			expect(talk.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(isYoutubeId(talk.youtubeId)).toBe(true);
			expect(talkYoutubeUrl(talk)).toBe(
				`https://www.youtube.com/watch?v=${talk.youtubeId}`,
			);
			for (const link of talk.links ?? []) {
				expect(link.href.startsWith("https://")).toBe(true);
				expect(link.label.length).toBeGreaterThan(0);
			}
		}
	});

	it("points the two requested recordings at the live and playlist videos", () => {
		expect(TALKS.map((talk) => talk.youtubeId)).toEqual([
			"KLEApocYmww",
			"7yvAfZ8vCDU",
		]);
		expect(
			TALKS.flatMap((talk) => (talk.links ?? []).map((link) => link.href)),
		).toEqual(
			expect.arrayContaining([
				"https://www.youtube.com/playlist?list=PLVj4iIZgzTAq2FzaBBgqFOtZaJTcoG3JR",
				"https://datatech-jp.connpass.com/event/386885/",
				"https://speakerdeck.com/ta93abe/cloudflare-dehazimeru-data-platform",
			]),
		);
	});
});
