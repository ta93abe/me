import { describe, expect, it } from "vitest";

import { cn } from "../../utils/cn";

describe("cn", () => {
	it("merges Tailwind classes", () => {
		expect(cn("px-3 text-sm", "px-6")).toBe("text-sm px-6");
	});

	it("ignores conditional falsey values", () => {
		expect(cn("rounded", false, null, undefined, "border")).toBe(
			"rounded border",
		);
	});
});
