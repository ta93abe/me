import { Resvg } from "@resvg/resvg-js";
import type { ReactNode } from "react";
import satori from "satori";

import {
	buildOgCardElement,
	OG_HEIGHT,
	OG_WIDTH,
	type OgCardOptions,
	type OgImageType,
} from "./card";
import { loadOgFont } from "./font";
import { buildSlidesCoverOgElement } from "./slides-cover";

export type { OgImageType };

function buildOgElement(options: OgCardOptions) {
	if (options.layout === "slides-cover") {
		return buildSlidesCoverOgElement({
			title: options.title,
			sublabel: options.subtitle ?? "Slides",
			event: options.event,
			siteName: options.siteName,
			hostname: options.hostname,
		});
	}
	return buildOgCardElement(options);
}

export async function generateOgImage(
	options: OgCardOptions,
): Promise<Uint8Array> {
	const font = await loadOgFont();

	const svg = await satori(buildOgElement(options) as ReactNode, {
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
	});

	const resvg = new Resvg(svg, {
		fitTo: {
			mode: "width",
			value: OG_WIDTH,
		},
	});

	const pngData = resvg.render();
	return pngData.asPng();
}
