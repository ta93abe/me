import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const slidesRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../slides",
);

describe("overview grid player styles (TA-1363)", () => {
	it("polishes thumbnail grid, accent ring, and code-slide legibility", async () => {
		const layouts = await readFile(
			path.join(slidesRoot, "design-system/layouts.css"),
			"utf8",
		);

		expect(layouts).toContain("html.is-overview .stage-wrap");
		expect(layouts).toMatch(
			/\.deck\.is-overview[\s\S]*grid-template-columns: repeat\(auto-fill, minmax\(16\.5rem, 1fr\)\)/,
		);
		expect(layouts).toContain(".deck.is-overview .slide:focus-visible");
		expect(layouts).toContain(".deck.is-overview .slide.is-active");
		expect(layouts).toMatch(
			/\.deck\.is-overview \.slide\[data-type="code"\] pre\.shiki/,
		);
	});

	it("hides progress chrome while overview is open", async () => {
		const playerCss = await readFile(
			path.join(slidesRoot, "player/player.css"),
			"utf8",
		);
		const playerJs = await readFile(
			path.join(slidesRoot, "player/player.js"),
			"utf8",
		);

		expect(playerCss).toContain("html.is-overview .player-ui .progress");
		expect(playerJs).toContain(
			'document.documentElement.classList.toggle("is-overview", on)',
		);
	});
});
