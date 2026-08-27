import { describe, expect, it } from "vitest";

import { SITE } from "@/config/site";

describe("SITE newsletter", () => {
	it("points subscribe CTA at Substack, not a self-hosted endpoint", () => {
		expect(SITE.substackUrl).toBe("https://ta93abe.substack.com");
		expect(SITE.substackSubscribeUrl).toBe(
			"https://ta93abe.substack.com/subscribe",
		);
		expect(SITE.substackSubscribeUrl.startsWith(SITE.substackUrl)).toBe(true);
	});
});
