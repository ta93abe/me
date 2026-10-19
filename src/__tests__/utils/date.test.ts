import { describe, expect, it } from "vitest";

import {
	formatBlogSurfaceDate,
	formatDate,
	isSameCalendarDayInJst,
	toDatetimeAttr,
} from "@/utils/date";

describe("formatDate", () => {
	it("should format Date object to Japanese format", () => {
		const date = new Date("2024-01-15");
		const result = formatDate(date);
		expect(result).toBe("2024年1月15日");
	});

	it("should format string date to Japanese format", () => {
		const result = formatDate("2024-12-25");
		expect(result).toBe("2024年12月25日");
	});

	it("should accept custom format options", () => {
		const date = new Date("2024-06-01");
		const result = formatDate(date, {
			year: "numeric",
			month: "short",
		});
		expect(result).toBe("2024年6月");
	});

	it("should handle edge case dates", () => {
		// First day of year
		expect(formatDate(new Date("2024-01-01"))).toBe("2024年1月1日");
		// Last day of year
		expect(formatDate(new Date("2024-12-31"))).toBe("2024年12月31日");
	});
});

describe("isSameCalendarDayInJst", () => {
	it("treats same calendar day in JST as equal", () => {
		const morning = new Date("2026-09-08T00:30:00.000Z");
		const evening = new Date("2026-09-08T14:00:00.000Z");
		expect(isSameCalendarDayInJst(morning, evening)).toBe(true);
	});

	it("treats different calendar days in JST as unequal", () => {
		const a = new Date("2026-09-08T00:30:00.000Z");
		const b = new Date("2026-09-09T00:30:00.000Z");
		expect(isSameCalendarDayInJst(a, b)).toBe(false);
	});
});

describe("formatBlogSurfaceDate", () => {
	it("shows publish date only when revise is absent", () => {
		expect(formatBlogSurfaceDate(new Date("2024-01-15"))).toBe("2024年1月15日");
	});

	it("shows publish date only when revise is the same JST day", () => {
		const publish = new Date("2026-09-08T00:30:00.000Z");
		const revise = new Date("2026-09-08T14:00:00.000Z");
		expect(formatBlogSurfaceDate(publish, revise)).toBe("2026年9月8日");
	});

	it("appends revise on one line when JST calendar day differs", () => {
		const publish = new Date("2026-09-01T00:00:00.000Z");
		const revise = new Date("2026-09-16T00:00:00.000Z");
		expect(formatBlogSurfaceDate(publish, revise)).toBe(
			"2026年9月1日（2026年9月16日更新）",
		);
	});
});

describe("toDatetimeAttr", () => {
	it("returns an ISO-8601 datetime for a Date", () => {
		const date = new Date("2026-08-30T00:00:00.000Z");
		expect(toDatetimeAttr(date)).toBe("2026-08-30T00:00:00.000Z");
	});

	it("returns an ISO-8601 datetime for a date string", () => {
		expect(toDatetimeAttr("2026-09-16T00:00:00.000Z")).toBe(
			"2026-09-16T00:00:00.000Z",
		);
	});
});
