import { describe, expect, it } from "vitest";

import { NAV_LINKS, SECONDARY_LINKS } from "@/config/navigation";

const hiddenSections = ["/gallery", "/atelier", "/bookshelf"] as const;

describe("NAV_LINKS", () => {
	it("keeps the header to About, Blog, and Contact", () => {
		expect(NAV_LINKS.map((link) => link.href)).toEqual([
			"/about",
			"/blog",
			"/contact",
		]);
		expect(NAV_LINKS).toHaveLength(3);
	});

	it("omits Gallery, Atelier, and Bookshelf until those collections have site pages", () => {
		const hrefs = NAV_LINKS.map((link) => link.href);
		const labels = NAV_LINKS.map((link) => link.text);

		expect(hrefs).not.toEqual(expect.arrayContaining([...hiddenSections]));
		expect(labels).not.toEqual(
			expect.arrayContaining(["Gallery", "Atelier", "Bookshelf"]),
		);
	});
});

describe("SECONDARY_LINKS", () => {
	it("keeps Links, Tools, and Slides out of the header", () => {
		expect(SECONDARY_LINKS.map((link) => link.href)).toEqual([
			"/links",
			"/tools",
			"/slides",
		]);

		const headerHrefs = NAV_LINKS.map((link) => link.href);
		for (const href of SECONDARY_LINKS.map((link) => link.href)) {
			expect(headerHrefs).not.toContain(href);
		}
	});

	it("omits Gallery, Atelier, and Bookshelf", () => {
		expect(SECONDARY_LINKS.map((link) => link.href)).not.toEqual(
			expect.arrayContaining([...hiddenSections]),
		);
	});
});
