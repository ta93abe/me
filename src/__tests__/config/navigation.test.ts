import { describe, expect, it } from "vitest";

import {
	NAV_LINKS,
	PRIMARY_NAV_LINKS,
	SECONDARY_NAV_LINKS,
} from "@/config/navigation";

const hrefs = (links: readonly { href: string }[]) =>
	links.map((link) => link.href);

describe("navigation", () => {
	it("keeps the header to four primary destinations", () => {
		expect(hrefs(PRIMARY_NAV_LINKS)).toEqual([
			"/about",
			"/gallery",
			"/blog",
			"/contact",
		]);
		expect(NAV_LINKS).toEqual(PRIMARY_NAV_LINKS);
	});

	it("moves secondary pages out of the header", () => {
		expect(hrefs(SECONDARY_NAV_LINKS)).toEqual([
			"/atelier",
			"/tools",
			"/slides",
			"/links",
		]);
	});

	it("omits Bookshelf until real books exist", () => {
		expect(hrefs(PRIMARY_NAV_LINKS)).not.toContain("/bookshelf");
		expect(hrefs(SECONDARY_NAV_LINKS)).not.toContain("/bookshelf");
		expect(NAV_LINKS.map((link) => link.text)).not.toContain("Bookshelf");
	});

	it("does not repeat a destination across primary and secondary nav", () => {
		const primary = new Set(hrefs(PRIMARY_NAV_LINKS));
		const secondary = hrefs(SECONDARY_NAV_LINKS);

		expect(secondary.every((href) => !primary.has(href))).toBe(true);
	});
});
