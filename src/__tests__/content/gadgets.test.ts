import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
	gadgetBySlug,
	gadgetPath,
	gadgetRatingLabel,
	gadgetSlugFromPath,
	gadgetViewTransitionName,
	hasGadgetRating,
	indexableGadgetSlugs,
	isGadgetRating,
	isGadgetsIndexPath,
	isIndexableGadget,
} from "@/lib/gadgets/gadgets";
import {
	GADGET_THUMB_SIZES,
	GADGET_THUMB_WIDTHS,
	gadgetImageBytes,
	gadgetImageUrl,
	gadgetThumbSrcset,
	gadgetThumbUrl,
} from "@/lib/gadgets/images";
import { resizeGadgetThumb } from "@/lib/gadgets/thumbs";

import { readGadgets } from "../helpers/site-content.ts";

const assetsDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../assets/gadgets",
);

// src/content/gadgets/*.mdx を schema で検証し、order 順に読む。
const GADGETS = readGadgets();

describe("gadgets collection", () => {
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
			expect(gadgetBySlug(GADGETS, gadget.slug)).toEqual(gadget);
			expect(gadgetPath(gadget.slug)).toBe(`/gadgets/${gadget.slug}/`);
			expect(gadgetViewTransitionName(gadget.slug)).toBe(
				`gadget-${gadget.slug}`,
			);
			expect(gadget.brand.length).toBeGreaterThan(0);
			const image = gadgetImageUrl(gadget.slug);
			expect(image).toBe(`/media/gadgets/${gadget.slug}.webp`);
			expect(image.startsWith("data:")).toBe(false);
			expect(image.startsWith("/gadgets/")).toBe(false);
			expect(image.startsWith("/things/")).toBe(false);
			const bytes = gadgetImageBytes(gadget.slug);
			expect(bytes.byteLength).toBeGreaterThan(0);
			expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
		}

		expect(GADGET_THUMB_WIDTHS).toEqual([320, 480, 640]);
		expect(GADGET_THUMB_SIZES).toBe("(min-width: 1024px) 8rem, 7rem");
		expect(gadgetThumbUrl("oura-ring-5", 320)).toBe(
			"/media/gadgets/oura-ring-5/320.webp",
		);
		expect(gadgetThumbUrl("oura-ring-5", 640)).toBe(
			"/media/gadgets/oura-ring-5.webp",
		);
		expect(gadgetThumbSrcset("oura-ring-5")).toBe(
			"/media/gadgets/oura-ring-5/320.webp 320w, /media/gadgets/oura-ring-5/480.webp 480w, /media/gadgets/oura-ring-5.webp 640w",
		);
	});

	it("resizes listing thumbs smaller than the 640 source", async () => {
		const original = gadgetImageBytes("oura-ring-5");
		const thumb = await resizeGadgetThumb("oura-ring-5", 320);
		expect(thumb.byteLength).toBeGreaterThan(0);
		expect(thumb.byteLength).toBeLessThan(original.byteLength);
		expect(String.fromCharCode(...thumb.slice(0, 4))).toBe("RIFF");
	});

	it("keeps rating and notes optional and does not invent values", () => {
		expect(isGadgetRating(4)).toBe(true);
		expect(isGadgetRating(0)).toBe(false);
		expect(isGadgetRating(6)).toBe(false);
		expect(gadgetRatingLabel(4)).toBe("評価 4 / 5");

		for (const gadget of GADGETS) {
			expect(hasGadgetRating(gadget)).toBe(false);
			expect(gadget.rating).toBeUndefined();
			expect(gadget.pros).toBeUndefined();
			expect(gadget.cons).toBeUndefined();
			expect(isIndexableGadget(gadget)).toBe(false);
			expect(gadget.indexable).toBeUndefined();
		}

		expect(indexableGadgetSlugs(GADGETS)).toEqual([]);
		expect(
			isIndexableGadget({
				slug: "demo",
				name: "Demo",
				note: "長い本文がある想定",
				brand: "Demo",
				indexable: true,
			}),
		).toBe(true);
		expect(
			indexableGadgetSlugs([
				{ slug: "a", name: "A", note: "n", brand: "b", indexable: true },
				{ slug: "b", name: "B", note: "n", brand: "b" },
			]),
		).toEqual(["a"]);
	});

	it("keeps the listing order of the old catalog", () => {
		expect(GADGETS.map((gadget) => gadget.slug).slice(0, 3)).toEqual([
			"mac-studio",
			"hhkb-type-s",
			"shure-sm7b",
		]);
		expect(GADGETS.at(-1)?.slug).toBe("milestone-ms-i1");
	});

	it("distinguishes the index from item paths", () => {
		expect(isGadgetsIndexPath("/gadgets")).toBe(true);
		expect(isGadgetsIndexPath("/gadgets/")).toBe(true);
		expect(isGadgetsIndexPath("/gadgets/mac-studio")).toBe(false);
		expect(gadgetSlugFromPath("/gadgets")).toBeNull();
		expect(gadgetSlugFromPath("/gadgets/mac-studio")).toBe("mac-studio");
		expect(gadgetSlugFromPath("/gadgets/mac-studio/")).toBe("mac-studio");
		expect(gadgetBySlug(GADGETS, "missing")).toBeUndefined();
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
