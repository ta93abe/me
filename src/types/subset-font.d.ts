declare module "subset-font" {
	interface SubsetFontOptions {
		targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
		preserveNameIds?: number[];
		variationAxes?: Record<string, number | { min: number; max: number }>;
	}

	export default function subsetFont(
		font: Uint8Array,
		text: string,
		options?: SubsetFontOptions,
	): Promise<Uint8Array>;
}
