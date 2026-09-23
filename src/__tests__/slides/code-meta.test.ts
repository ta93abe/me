import { describe, expect, it } from "vitest";

import { parseCodeFenceMeta } from "@/slides/parser/code-meta";

describe("parseCodeFenceMeta", () => {
	it("reads a static range", () => {
		expect(parseCodeFenceMeta("{2-4}")).toEqual({
			always: [2, 3, 4],
			steps: [],
		});
	});

	it("reads click steps", () => {
		expect(parseCodeFenceMeta("ts {1|3-4}")).toEqual({
			always: [],
			steps: [[1], [3, 4]],
		});
	});

	it("ignores fences without braces", () => {
		expect(parseCodeFenceMeta("ts")).toEqual({ always: [], steps: [] });
	});
});
