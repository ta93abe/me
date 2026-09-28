import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const slidesRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../slides",
);

describe("narrow viewport slide player styles (TA-1362)", () => {
	it("caps slide padding and enables split single-column fallback", async () => {
		const tokens = await readFile(
			path.join(slidesRoot, "design-system/tokens.css"),
			"utf8",
		);
		const layouts = await readFile(
			path.join(slidesRoot, "design-system/layouts.css"),
			"utf8",
		);

		expect(tokens).toMatch(/--pad:\s*clamp\(0\.85rem,/);
		expect(layouts).toContain("overflow-x: clip");
		expect(layouts).toContain("env(safe-area-inset-left)");
		expect(layouts).toMatch(
			/@media \(max-width: 640px\)[\s\S]*slide\[data-type="split"\][\s\S]*grid-template-columns: 1fr/,
		);
	});

	it("insets deck chrome for safe areas on small screens", async () => {
		const playerCss = await readFile(
			path.join(slidesRoot, "player/player.css"),
			"utf8",
		);

		expect(playerCss).toContain("env(safe-area-inset-right");
		expect(playerCss).toContain("env(safe-area-inset-bottom");
		expect(playerCss).toContain("env(safe-area-inset-left");
	});

	it("uses viewport-aware swipe threshold and vertical guard in player.js", async () => {
		const playerJs = await readFile(
			path.join(slidesRoot, "player/player.js"),
			"utf8",
		);

		expect(playerJs).toContain("function swipeThresholdPx()");
		expect(playerJs).toContain("touchY");
		expect(playerJs).toMatch(/Math\.abs\(deltaY\) \* 1\.15/);
	});
});
