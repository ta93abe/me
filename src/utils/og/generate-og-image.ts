import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { SITE } from "../../config/site";

// OG Image dimensions (1200x630 is the standard)
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Cache for font data
let fontData: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
	if (fontData) {
		return fontData;
	}

	// Load Noto Sans JP from a CDN that provides TTF format
	// Using jsDelivr to serve the font from npm package
	const fontUrl =
		"https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.0/files/noto-sans-jp-japanese-700-normal.woff";

	const fontDataResponse = await fetch(fontUrl);
	if (!fontDataResponse.ok) {
		throw new Error(`Failed to fetch font: ${fontDataResponse.status}`);
	}

	fontData = await fontDataResponse.arrayBuffer();

	return fontData;
}

interface OgImageOptions {
	title: string;
	subtitle?: string;
	type?: "blog" | "works" | "default";
}

export async function generateOgImage(
	options: OgImageOptions,
): Promise<Uint8Array> {
	const { title, subtitle = SITE.author, type = "default" } = options;

	const font = await loadFont();

	// Color schemes based on content type
	const colorSchemes = {
		blog: {
			background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
			accent: "#60a5fa",
			text: "#f1f5f9",
		},
		works: {
			background: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)",
			accent: "#a78bfa",
			text: "#f1f5f9",
		},
		default: {
			background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
			accent: "#818cf8",
			text: "#f5f5f5",
		},
	};

	const colors = colorSchemes[type];

	// Truncate title if too long
	const displayTitle =
		title.length > 50 ? `${title.substring(0, 47)}...` : title;

	// Calculate font size based on title length
	const fontSize =
		displayTitle.length > 30 ? 48 : displayTitle.length > 20 ? 56 : 64;

	const svg = await satori(
		{
			type: "div",
			props: {
				style: {
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "60px",
					background: colors.background,
					fontFamily: "Noto Sans JP",
				},
				children: [
					// Header with site name
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "16px",
							},
							children: [
								{
									type: "div",
									props: {
										style: {
											width: "48px",
											height: "48px",
											borderRadius: "50%",
											background: colors.accent,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "24px",
											fontWeight: "700",
											color: "#0a0a0a",
										},
										children: "T",
									},
								},
								{
									type: "div",
									props: {
										style: {
											fontSize: "24px",
											fontWeight: "700",
											color: colors.text,
											opacity: 0.8,
										},
										children: SITE.name,
									},
								},
							],
						},
					},
					// Main title
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "16px",
								flex: 1,
								justifyContent: "center",
							},
							children: [
								{
									type: "div",
									props: {
										style: {
											fontSize: `${fontSize}px`,
											fontWeight: "700",
											color: colors.text,
											lineHeight: 1.3,
											letterSpacing: "-0.02em",
										},
										children: displayTitle,
									},
								},
							],
						},
					},
					// Footer with author/subtitle
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							},
							children: [
								{
									type: "div",
									props: {
										style: {
											fontSize: "20px",
											color: colors.text,
											opacity: 0.7,
										},
										children: subtitle,
									},
								},
								{
									type: "div",
									props: {
										style: {
											fontSize: "18px",
											color: colors.accent,
											fontWeight: "600",
										},
										children: new URL(SITE.url).hostname,
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: OG_WIDTH,
			height: OG_HEIGHT,
			fonts: [
				{
					name: "Noto Sans JP",
					data: font,
					weight: 700,
					style: "normal",
				},
			],
		},
	);

	// Convert SVG to PNG using resvg
	const resvg = new Resvg(svg, {
		fitTo: {
			mode: "width",
			value: OG_WIDTH,
		},
	});

	const pngData = resvg.render();
	return pngData.asPng();
}
