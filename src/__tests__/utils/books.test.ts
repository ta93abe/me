import { describe, expect, it } from "vitest";
import { statusLabels, statusStyles } from "../../utils/books";

describe("statusLabels", () => {
	it("should have correct label for read status", () => {
		expect(statusLabels.read).toBe("読了");
	});

	it("should have correct label for reading status", () => {
		expect(statusLabels.reading).toBe("読書中");
	});

	it("should have correct label for stacked status", () => {
		expect(statusLabels.stacked).toBe("積読");
	});

	it("should have all three statuses defined", () => {
		const keys = Object.keys(statusLabels);
		expect(keys).toHaveLength(3);
		expect(keys).toContain("read");
		expect(keys).toContain("reading");
		expect(keys).toContain("stacked");
	});
});

describe("statusStyles", () => {
	it("should have correct style for read status", () => {
		expect(statusStyles.read).toContain("emerald");
	});

	it("should have correct style for reading status", () => {
		expect(statusStyles.reading).toContain("blue");
	});

	it("should have correct style for stacked status", () => {
		expect(statusStyles.stacked).toContain("amber");
	});

	it("should have matching keys with statusLabels", () => {
		const labelKeys = Object.keys(statusLabels);
		const styleKeys = Object.keys(statusStyles);
		expect(styleKeys).toEqual(labelKeys);
	});
});
