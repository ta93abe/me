import { describe, expect, it } from "vitest";

import {
	matchStandaloneSpotifyBlock,
	parseSpotifyUrl,
	spotifyEmbedSrc,
} from "../../../lib/content/spotify-url.ts";

describe("spotify-url", () => {
	it("parses track URLs", () => {
		const href = "https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl";
		expect(parseSpotifyUrl(href)?.url).toBe(href);
		expect(spotifyEmbedSrc(href)).toBe(
			"https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl",
		);
	});

	it("matches standalone spotify blocks only", () => {
		const block = matchStandaloneSpotifyBlock(
			"https://open.spotify.com/track/abc123\n\nnext",
		);
		expect(block?.href).toContain("spotify.com/track/abc123");
		expect(
			matchStandaloneSpotifyBlock("see https://open.spotify.com/track/x\n"),
		).toBeNull();
	});
});
