import { describe, expect, it } from "vitest";

import { NAV_LINKS } from "@/config/navigation";

describe("NAV_LINKS", () => {
	it("keeps public sections that currently have pages", () => {
		expect(NAV_LINKS.map((link) => link.href)).toEqual([
			"/about",
			"/blog",
			"/links",
			"/tools",
			"/slides",
		]);
	});

	it("omits Gallery, Atelier, and Bookshelf until those collections have site pages", () => {
		const hrefs = NAV_LINKS.map((link) => link.href);
		const labels = NAV_LINKS.map((link) => link.text);

		expect(hrefs).not.toEqual(
			expect.arrayContaining(["/gallery", "/atelier", "/bookshelf"]),
		);
		expect(labels).not.toEqual(
			expect.arrayContaining(["Gallery", "Atelier", "Bookshelf"]),
		);
	});
});
