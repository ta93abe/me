import { describe, expect, it } from "vitest";

import { NAV_LINKS } from "@/config/navigation";

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
