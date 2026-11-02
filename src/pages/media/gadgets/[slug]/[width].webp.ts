import type { APIRoute } from "astro";

import { GADGET_SOURCE_WIDTH, GADGET_THUMB_WIDTHS } from "@/data/gadget-images";
import { resizeGadgetThumb } from "@/data/gadget-thumbs";
import { GADGETS } from "@/data/gadgets";

export const prerender = true;

const thumbWidths = GADGET_THUMB_WIDTHS.filter(
	(width) => width < GADGET_SOURCE_WIDTH,
);
const thumbWidthSet = new Set<number>(thumbWidths);

export function getStaticPaths() {
	return GADGETS.flatMap((gadget) =>
		thumbWidths.map((width) => ({
			params: { slug: gadget.slug, width: String(width) },
		})),
	);
}

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug;
	const width = Number(params.width);
	if (!slug || !thumbWidthSet.has(width)) {
		return new Response("Not found", { status: 404 });
	}

	return new Response(await resizeGadgetThumb(slug, width), {
		headers: {
			"Content-Type": "image/webp",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
