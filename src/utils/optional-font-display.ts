/**
 * Late `font-display: swap` is a field CLS source: unicode-range files
 * arriving after first paint restyle visible text. `optional` keeps the
 * fallback if the webfont missed the first paint.
 */
export function withOptionalFontDisplay(css: string): string {
	return css.replace(/font-display:\s*swap/gi, "font-display: optional");
}

export function optionalFontDisplayPlugin() {
	return {
		name: "optional-font-display",
		transform(code: string, id: string) {
			if (!id.includes("@fontsource") || !id.includes(".css")) {
				return;
			}
			return {
				code: withOptionalFontDisplay(code),
				map: null,
			};
		},
	};
}
