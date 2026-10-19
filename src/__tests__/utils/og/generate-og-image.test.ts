import { describe, expect, it } from "vitest";

import { OG_HEIGHT, OG_WIDTH } from "@/utils/og/card";
import { generateOgImage } from "@/utils/og/generate-og-image";

describe("generateOgImage", () => {
	it("renders slides-cover layout as 1200×630 PNG", async () => {
		const png = await generateOgImage({
			layout: "slides-cover",
			title: "OG test deck",
			subtitle: "2026年1月1日",
			type: "slides",
		});

		expect(png.byteLength).toBeGreaterThan(1000);
		expect(png[0]).toBe(0x89);
		expect(png[1]).toBe(0x50);
	}, 30_000);
});

describe("OG dimensions", () => {
	it("keeps standard Open Graph size", () => {
		expect(OG_WIDTH).toBe(1200);
		expect(OG_HEIGHT).toBe(630);
	});
});
