import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const slidesRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../slides",
);

describe("deck player effects (TA-881)", () => {
	it("hides snow overlay when reduced motion is preferred", async () => {
		const snowCss = await readFile(
			path.join(slidesRoot, "player/effects/snow.css"),
			"utf8",
		);
		expect(snowCss).toContain("@media (prefers-reduced-motion: reduce)");
		expect(snowCss).toMatch(
			/prefers-reduced-motion: reduce[\s\S]*\.deck-effect-layer[\s\S]*display:\s*none/,
		);
	});

	it("initializes snow only from deck-effects entry", async () => {
		const deckEffects = await readFile(
			path.join(slidesRoot, "player/effects/deck-effects.js"),
			"utf8",
		);
		expect(deckEffects).toContain("dataset.effect");
		expect(deckEffects).toContain('data-deck-effect-layer="snow"');
		expect(deckEffects).toContain("prefers-reduced-motion: reduce");
	});
});
