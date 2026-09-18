import { describe, expect, it } from "vitest";

import { withOptionalFontDisplay } from "@/utils/optional-font-display";

describe("withOptionalFontDisplay", () => {
	it("replaces font-display swap so late webfonts cannot shift layout", () => {
		const css = `
@font-face {
	font-family: "Noto Serif JP";
	font-display: swap;
	src: url("./noto.woff2") format("woff2");
}
`;
		expect(withOptionalFontDisplay(css)).toContain("font-display: optional");
		expect(withOptionalFontDisplay(css)).not.toContain("font-display: swap");
	});

	it("leaves unrelated CSS untouched", () => {
		const css = ".hero { display: flex; }";
		expect(withOptionalFontDisplay(css)).toBe(css);
	});
});
