import { describe, expect, it } from "vitest";

import {
	getThing,
	isThingsIndexPath,
	THINGS,
	thingPath,
	thingSlugFromPath,
	thingViewTransitionName,
} from "@/data/things";

describe("THINGS catalog", () => {
	it("keeps unique kebab slugs and image paths", () => {
		const slugs = THINGS.map((thing) => thing.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
		expect(THINGS.length).toBeGreaterThanOrEqual(6);
		expect(THINGS.length).toBeLessThanOrEqual(12);

		for (const thing of THINGS) {
			expect(thing.slug).toMatch(/^[a-z][a-z0-9-]*$/);
			expect(thing.name.length).toBeGreaterThan(0);
			expect(thing.note.length).toBeGreaterThan(0);
			expect(thing.image).toBe(`/things/${thing.slug}.svg`);
			expect(getThing(thing.slug)).toEqual(thing);
			expect(thingPath(thing.slug)).toBe(`/things/${thing.slug}`);
			expect(thingViewTransitionName(thing.slug)).toBe(`thing-${thing.slug}`);
		}
	});

	it("distinguishes the index from item paths", () => {
		expect(isThingsIndexPath("/things")).toBe(true);
		expect(isThingsIndexPath("/things/")).toBe(true);
		expect(isThingsIndexPath("/things/macbook-pro")).toBe(false);
		expect(thingSlugFromPath("/things")).toBeNull();
		expect(thingSlugFromPath("/things/macbook-pro")).toBe("macbook-pro");
		expect(thingSlugFromPath("/things/macbook-pro/")).toBe("macbook-pro");
		expect(getThing("missing")).toBeUndefined();
	});

	it("keeps software tools off the object shelf", () => {
		const names = THINGS.map((thing) => thing.name);
		expect(names).not.toEqual(
			expect.arrayContaining(["Cursor", "Nix", "Fish"]),
		);
	});
});
