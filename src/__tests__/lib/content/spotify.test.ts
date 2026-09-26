import { describe, expect, it } from "vitest";

import { spotifyEmbedHtml } from "../../../lib/content/spotify.ts";

describe("spotifyEmbedHtml", () => {
	it("renders allowlisted iframe", () => {
		const href = "https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl";
		const html = spotifyEmbedHtml(href);
		expect(html).toContain('class="embed-spotify-frame"');
		expect(html).toContain("open.spotify.com/embed/track/");
		expect(html).not.toContain("<script");
	});

	it("falls back for invalid URLs", () => {
		const html = spotifyEmbedHtml("https://example.com/not-spotify");
		expect(html).toContain("embed-spotify-fallback");
	});
});
