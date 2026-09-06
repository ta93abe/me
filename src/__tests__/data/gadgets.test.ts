import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

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
	it("keeps unique kebab slugs and bundled images", () => {
		const slugs = GADGETS.map((gadget) => gadget.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		expect(GADGETS.length).toBeGreaterThanOrEqual(6);
		expect(GADGETS.length).toBeLessThanOrEqual(12);

		for (const gadget of GADGETS) {
			expect(gadget.slug).toMatch(/^[a-z][a-z0-9-]*$/);
			expect(gadget.name.length).toBeGreaterThan(0);
			expect(gadget.note.length).toBeGreaterThan(0);
			expect(existsSync(path.join(assetsDir, `${gadget.slug}.svg`))).toBe(true);
			expect(gadget.image.length).toBeGreaterThan(0);
			expect(gadget.image.startsWith("/gadgets/")).toBe(false);
			expect(gadget.image.startsWith("/things/")).toBe(false);
			expect(
				gadget.image.startsWith("data:image/svg+xml") ||
					(gadget.image.includes(gadget.slug) &&
						/\.svg(?:\?.*)?$/.test(gadget.image)),
			).toBe(true);
			expect(getGadget(gadget.slug)).toEqual(gadget);
			expect(gadgetPath(gadget.slug)).toBe(`/gadgets/${gadget.slug}`);
			expect(gadgetViewTransitionName(gadget.slug)).toBe(
				`gadget-${gadget.slug}`,
			);
		}
	});

	it("distinguishes the index from item paths", () => {
		expect(isGadgetsIndexPath("/gadgets")).toBe(true);
		expect(isGadgetsIndexPath("/gadgets/")).toBe(true);
		expect(isGadgetsIndexPath("/gadgets/macbook-pro")).toBe(false);
		expect(gadgetSlugFromPath("/gadgets")).toBeNull();
		expect(gadgetSlugFromPath("/gadgets/macbook-pro")).toBe("macbook-pro");
		expect(gadgetSlugFromPath("/gadgets/macbook-pro/")).toBe("macbook-pro");
		expect(getGadget("missing")).toBeUndefined();
	});

	it("keeps software tools off the object shelf", () => {
		const names = GADGETS.map((gadget) => gadget.name);
		expect(names).not.toEqual(
			expect.arrayContaining(["Cursor", "Nix", "Fish"]),
		);
	});
});
