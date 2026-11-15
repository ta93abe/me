import { describe, expect, it } from "vitest";

import { standaloneEmbed } from "@/lib/content/standalone-embed";

describe("standaloneEmbed", () => {
	it("classifies a bare X post URL as a tweet", () => {
		expect(
			standaloneEmbed("https://x.com/civitaspo/status/2098270535855870306"),
		).toEqual({
			kind: "tweet",
			id: "2098270535855870306",
			href: "https://x.com/civitaspo/status/2098270535855870306",
		});
	});

	it("classifies a YouTube video URL as youtube", () => {
		expect(
			standaloneEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
		).toMatchObject({ kind: "youtube", id: "dQw4w9WgXcQ" });
	});

	it("classifies a Spotify URL as spotify", () => {
		expect(
			standaloneEmbed(
				"https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk",
			),
		).toMatchObject({ kind: "spotify" });
	});

	it("falls back to a link card for other public URLs", () => {
		expect(
			standaloneEmbed("https://github.com/civitaspo/dbt-authorized-models"),
		).toEqual({
			kind: "link",
			href: "https://github.com/civitaspo/dbt-authorized-models",
		});
		expect(
			standaloneEmbed("https://www.youtube.com/@DataEngineerCasualRadio"),
		).toMatchObject({ kind: "link" });
	});

	it("leaves URLs inside sentences and multi-line paragraphs alone", () => {
		expect(standaloneEmbed("見てください https://example.com")).toBeNull();
		expect(standaloneEmbed("https://example.com\n続きの文")).toBeNull();
		expect(standaloneEmbed("ただの文")).toBeNull();
		expect(standaloneEmbed("http://localhost:4321/")).toBeNull();
	});
});
