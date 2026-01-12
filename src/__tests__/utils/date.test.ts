import { describe, expect, it } from "vitest";
import { formatDate } from "../../utils/date";

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
