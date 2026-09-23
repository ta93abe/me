import { describe, expect, it } from "vitest";

import {
	isActiveNavPath,
	NAV_LINKS,
	SECONDARY_LINKS,
} from "@/config/navigation";

const hiddenSections = ["/gallery", "/atelier", "/bookshelf"] as const;

describe("NAV_LINKS", () => {
	it("keeps the header to About, Blog, and Contact", () => {
		expect(NAV_LINKS.map((link) => link.href)).toEqual([
			"/about/",
			"/blog/",
			"/contact/",
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
	it("keeps Links, Tools, Gadgets, Talks, and Slides out of the header", () => {
		expect(SECONDARY_LINKS.map((link) => link.href)).toEqual([
			"/links/",
			"/tools/",
			"/gadgets/",
			"/talks/",
			"/slides/",
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

describe("isActiveNavPath", () => {
	it("treats slash and no-slash as the same page", () => {
		expect(isActiveNavPath("/about/", "/about")).toBe(true);
		expect(isActiveNavPath("/about/", "/about/")).toBe(true);
		expect(isActiveNavPath("/blog/", "/blog/hello-world/")).toBe(true);
		expect(isActiveNavPath("/blog/", "/about/")).toBe(false);
		expect(isActiveNavPath("/", "/")).toBe(true);
		expect(isActiveNavPath("/", "/about/")).toBe(false);
	});
});
