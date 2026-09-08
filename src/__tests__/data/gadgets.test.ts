import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { gadgetImageUrl } from "@/data/gadget-images";
import {
	GADGETS,
	gadgetPath,
	gadgetSlugFromPath,
	gadgetViewTransitionName,
	getGadget,
	isGadgetsIndexPath,
} from "@/data/gadgets";

const assetsDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../assets/gadgets",
);

describe("GADGETS catalog", () => {
	it("keeps unique kebab slugs and on-disk images", () => {
		const slugs = GADGETS.map((gadget) => gadget.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		expect(GADGETS.length).toBeGreaterThanOrEqual(6);
		expect(GADGETS.length).toBeLessThanOrEqual(20);

		for (const gadget of GADGETS) {
			expect(gadget.slug).toMatch(/^[a-z][a-z0-9-]*$/);
			expect(gadget.name.length).toBeGreaterThan(0);
			expect(gadget.note.length).toBeGreaterThan(0);
			expect(existsSync(path.join(assetsDir, `${gadget.slug}.webp`))).toBe(
				true,
			);
			expect(gadget.imageSource?.href.startsWith("https://")).toBe(true);
			expect(getGadget(gadget.slug)).toEqual(gadget);
			expect(gadgetPath(gadget.slug)).toBe(`/gadgets/${gadget.slug}`);
			expect(gadgetViewTransitionName(gadget.slug)).toBe(
				`gadget-${gadget.slug}`,
			);
			const image = gadgetImageUrl(gadget.slug);
			expect(image.startsWith("data:image/webp")).toBe(true);
			expect(image.startsWith("/gadgets/")).toBe(false);
			expect(image.startsWith("/things/")).toBe(false);
		}
	});

	it("distinguishes the index from item paths", () => {
		expect(isGadgetsIndexPath("/gadgets")).toBe(true);
		expect(isGadgetsIndexPath("/gadgets/")).toBe(true);
		expect(isGadgetsIndexPath("/gadgets/mac-studio")).toBe(false);
		expect(gadgetSlugFromPath("/gadgets")).toBeNull();
		expect(gadgetSlugFromPath("/gadgets/mac-studio")).toBe("mac-studio");
		expect(gadgetSlugFromPath("/gadgets/mac-studio/")).toBe("mac-studio");
		expect(getGadget("missing")).toBeUndefined();
	});

	it("keeps software tools off the object shelf", () => {
		const names = GADGETS.map((gadget) => gadget.name);
		expect(names).not.toEqual(
			expect.arrayContaining(["Cursor", "Nix", "Fish"]),
		);
		expect(names).toEqual(
			expect.arrayContaining([
				"Mac Studio M1 Max",
				"HHKB Type-S",
				"Shure SM7B",
				"Volt 276",
				"Philips Hue",
				"Nature Remo Lapis",
				"Novation Launchkey 49",
				"Novation Launchpad Pro",
				"Sony MDR-7506",
				"Oura Ring 5",
				"Pebble Index 01",
				"Evering",
				"Eufy Robot Vacuum Omni E25",
				"holo オーブ L X-PAC",
				"Nike ACG ゼガマ ハイク",
				"milestone MS-i1",
			]),
		);
	});
});
