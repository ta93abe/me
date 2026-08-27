import { describe, expect, it } from "vitest";

import { getFeaturedWorks, sortWorksByDate } from "@/utils/works";

function work(
	id: string,
	options: {
		featured?: boolean;
		completedDate?: Date;
	} = {},
) {
	return {
		id,
		data: {
			featured: options.featured,
			completedDate: options.completedDate,
		},
	};
}

describe("works helpers", () => {
	it("sorts by completedDate descending", () => {
		const older = work("older", { completedDate: new Date("2024-01-01") });
		const newer = work("newer", { completedDate: new Date("2025-06-01") });
		expect(sortWorksByDate([older, newer]).map((item) => item.id)).toEqual([
			"newer",
			"older",
		]);
	});

	it("prefers featured works, then newest", () => {
		const sketch = work("sketch", {
			completedDate: new Date("2026-01-01"),
		});
		const featuredOlder = work("featured-old", {
			featured: true,
			completedDate: new Date("2024-01-01"),
		});
		const featuredNewer = work("featured-new", {
			featured: true,
			completedDate: new Date("2025-01-01"),
		});

		expect(
			getFeaturedWorks([sketch, featuredOlder, featuredNewer], 2).map(
				(item) => item.id,
			),
		).toEqual(["featured-new", "featured-old"]);
	});

	it("falls back to newest works when none are featured", () => {
		const older = work("older", { completedDate: new Date("2024-01-01") });
		const newer = work("newer", { completedDate: new Date("2025-01-01") });
		expect(getFeaturedWorks([older, newer], 1).map((item) => item.id)).toEqual([
			"newer",
		]);
	});
});
