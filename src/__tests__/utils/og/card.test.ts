import { describe, expect, it } from "vitest";

import { wrapOgTitle } from "@/utils/og/card";

describe("wrapOgTitle", () => {
	it("returns an empty line for blank titles", () => {
		expect(wrapOgTitle("   ")).toEqual([""]);
	});

	it("collapses whitespace before wrapping", () => {
		expect(wrapOgTitle("Hello    World")).toEqual(["Hello World"]);
	});
});
