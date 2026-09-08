import { Resvg } from "@cf-wasm/resvg";
import { satori } from "@cf-wasm/satori";

import {
	buildOgCardElement,
	OG_HEIGHT,
	OG_WIDTH,
} from "../../src/utils/og/card.ts";
import { loadOgFont } from "../../src/utils/og/font.ts";

export async function renderBlogOgPng(title: string): Promise<Uint8Array> {
	const font = await loadOgFont();
	const svg = await satori(
		buildOgCardElement({
			title,
			subtitle: "Blog",
			type: "blog",
		}),
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

	const resvg = await Resvg.async(svg, {
		fitTo: {
			mode: "width",
			value: OG_WIDTH,
		},
	});

	return resvg.render().asPng();
}
