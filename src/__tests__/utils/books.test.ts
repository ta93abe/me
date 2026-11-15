import { describe, expect, it } from "vitest";

import { statusLabels, statusStyles } from "@/utils/books";

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
	it("uses only neutral text and the purple accent", () => {
		expect(statusStyles.read).toBe("text-(--text-muted)");
		expect(statusStyles.reading).toBe("text-(--primary-color)");
		expect(statusStyles.stacked).toBe("text-(--text-secondary)");
		for (const style of Object.values(statusStyles)) {
			expect(style).not.toMatch(/emerald|blue|amber/);
		}
	});
});
