const FONT_URL =
	"https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.0/files/noto-sans-jp-japanese-700-normal.woff";

let fontData: ArrayBuffer | null = null;
let fontPromise: Promise<ArrayBuffer> | null = null;

export async function loadOgFont(): Promise<ArrayBuffer> {
	if (fontData) {
		return fontData;
	}
	if (fontPromise) {
		return fontPromise;
	}

	fontPromise = (async () => {
		const response = await fetch(FONT_URL);
		if (!response.ok) {
			throw new Error(`Failed to fetch OG font: ${response.status}`);
		}
		fontData = await response.arrayBuffer();
		return fontData;
	})();

	try {
		return await fontPromise;
	} catch (error) {
		fontPromise = null;
		throw error;
	}
}
