import { describe, expect, it } from "vitest";

import { NAV_LINKS, NOT_FOUND_RECOVERY_LINKS } from "@/config/navigation";

describe("NAV_LINKS", () => {
	it("keeps primary content sections", () => {
		const hrefs = NAV_LINKS.map((link) => link.href);

		expect(hrefs).toEqual(expect.arrayContaining(["/gallery", "/blog"]));
	});

	it("omits Bookshelf until real books exist", () => {
		expect(NAV_LINKS.map((link) => link.href)).not.toContain("/bookshelf");
		expect(NAV_LINKS.map((link) => link.text)).not.toContain("Bookshelf");
	});
});

describe("NOT_FOUND_RECOVERY_LINKS", () => {
	it("guides lost visitors to About, Contact, Gallery, and Blog", () => {
		expect(NOT_FOUND_RECOVERY_LINKS.map((link) => link.href)).toEqual([
			"/about",
			"/contact",
			"/gallery",
			"/blog",
		]);
	});

	it("does not send /contact to About", () => {
		const contact = NOT_FOUND_RECOVERY_LINKS.find(
			(link) => link.label === "Contact",
		);

		expect(contact?.href).toBe("/contact");
		expect(contact?.href).not.toBe("/about");
	});
});
