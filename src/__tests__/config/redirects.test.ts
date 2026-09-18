import { describe, expect, it } from "vitest";

import { pageAliasRedirect } from "@/config/redirects";

describe("pageAliasRedirect", () => {
	it("sends recruiter URLs to About with a trailing slash", () => {
		expect(pageAliasRedirect("/careers")).toBe("/about/");
		expect(pageAliasRedirect("/careers/")).toBe("/about/");
		expect(pageAliasRedirect("/jobs")).toBe("/about/");
		expect(pageAliasRedirect("/recruit")).toBe("/about/");
	});

	it("sends retired gadget slugs to the gadgets index", () => {
		expect(pageAliasRedirect("/gadgets/keyboard/")).toBe("/gadgets/");
		expect(pageAliasRedirect("/about")).toBeNull();
	});
});
