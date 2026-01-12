import { describe, expect, it } from "vitest";
import { formatReadingTime, getReadingTime } from "../../utils/reading-time";

describe("getReadingTime", () => {
	it("should return minimum 1 minute for short content", () => {
		const result = getReadingTime("短いテキスト");
		expect(result).toBe(1);
	});

	it("should calculate reading time based on character count", () => {
		// 800 characters at 400 chars/min = 2 minutes
		const content = "あ".repeat(800);
		const result = getReadingTime(content);
		expect(result).toBe(2);
	});

	it("should remove HTML tags from calculation", () => {
		const content = "<p>テスト</p><div>コンテンツ</div>";
		const result = getReadingTime(content);
		// Should only count actual text characters
		expect(result).toBe(1);
	});

	it("should remove code blocks from calculation", () => {
		const content = "本文テキスト```javascript\nconst x = 1;\n```続きのテキスト";
		const result = getReadingTime(content);
		expect(result).toBe(1);
	});

	it("should remove inline code from calculation", () => {
		const content = "これは`code`のテストです";
		const result = getReadingTime(content);
		expect(result).toBe(1);
	});

	it("should accept custom words per minute", () => {
		const content = "あ".repeat(600);
		// At 200 chars/min, 600 chars = 3 minutes
		const result = getReadingTime(content, 200);
		expect(result).toBe(3);
	});
});

describe("formatReadingTime", () => {
	it("should format reading time in Japanese", () => {
		expect(formatReadingTime(1)).toBe("約1分で読了");
		expect(formatReadingTime(5)).toBe("約5分で読了");
		expect(formatReadingTime(10)).toBe("約10分で読了");
	});
});
