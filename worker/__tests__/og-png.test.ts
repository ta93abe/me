import { describe, expect, it } from "vitest";

import { renderBlogOgPng } from "../content/og-png.ts";

function pngSize(bytes: Uint8Array): { width: number; height: number } {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	return {
		width: view.getUint32(16),
		height: view.getUint32(20),
	};
}

describe("blog OG PNG", () => {
	it("renders a 1200x630 PNG that includes a wrapped Japanese title", async () => {
		const png = await renderBlogOgPng(
			"ブログ記事のタイトルを含んだ OGP 画像を生成する",
		);
		expect(png[0]).toBe(0x89);
		expect(png[1]).toBe(0x50);
		expect(png[2]).toBe(0x4e);
		expect(png[3]).toBe(0x47);
		expect(pngSize(png)).toEqual({ width: 1200, height: 630 });
	}, 20_000);
});
