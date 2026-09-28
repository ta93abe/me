import { describe, expect, it } from "vitest";

import {
	buildSlidesCoverOgElement,
	slidesCoverTitleFontSize,
} from "@/utils/og/slides-cover";

describe("slidesCoverTitleFontSize", () => {
	it("uses display-scale sizes for short titles", () => {
		expect(slidesCoverTitleFontSize("短い")).toBe(80);
	});

	it("shrinks for long titles", () => {
		const long =
			"とても長いスライドデッキのタイトルで折り返しと省略を確認するための文字列";
		expect(slidesCoverTitleFontSize(long)).toBeLessThan(80);
	});
});

describe("buildSlidesCoverOgElement", () => {
	it("includes title, sublabel, and cover background", () => {
		const node = buildSlidesCoverOgElement({
			title: "デザインシステム ショーケース",
			sublabel: "2026年9月6日",
			event: "デザインシステム検証",
		});

		const rootStyle = node.props.style as Record<string, unknown>;
		expect(rootStyle.backgroundColor).toBe("#0e0b14");
		expect(String(rootStyle.backgroundImage)).toContain("radial-gradient");

		const json = JSON.stringify(node);
		expect(json).toContain("デザインシステム");
		expect(json).toContain("ショーケース");
		expect(json).toContain("2026年9月6日");
		expect(json).toContain("デザインシステム検証");
	});

	it("omits event block when event is absent", () => {
		const node = buildSlidesCoverOgElement({
			title: "Slides",
			sublabel: "Slides",
		});
		const json = JSON.stringify(node);
		expect(json).not.toContain('"event"');
		expect(json).toContain("Slides");
	});
});
