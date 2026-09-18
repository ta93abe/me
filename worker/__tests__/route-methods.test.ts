import { describe, expect, it } from "vitest";

import { shouldDelegateNonGetToAstro } from "../route-methods.ts";

describe("shouldDelegateNonGetToAstro", () => {
	it("keeps GET and HEAD on the Worker", () => {
		expect(shouldDelegateNonGetToAstro("/agent/auth", "GET")).toBe(false);
		expect(shouldDelegateNonGetToAstro("/blog", "HEAD")).toBe(false);
	});

	it("keeps MCP and agent registration POSTs on the Worker", () => {
		expect(shouldDelegateNonGetToAstro("/mcp", "POST")).toBe(false);
		expect(shouldDelegateNonGetToAstro("/agent/auth", "POST")).toBe(false);
	});

	it("delegates other non-GET routes to Astro", () => {
		expect(shouldDelegateNonGetToAstro("/blog", "POST")).toBe(true);
		expect(shouldDelegateNonGetToAstro("/contact", "PUT")).toBe(true);
	});
});
