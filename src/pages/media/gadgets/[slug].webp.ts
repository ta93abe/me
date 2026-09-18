import type { APIRoute } from "astro";

import { gadgetImageBytes } from "@/data/gadget-images";
import { GADGETS } from "@/data/gadgets";

export const prerender = true;

export function getStaticPaths() {
	return GADGETS.map((gadget) => ({
		params: { slug: gadget.slug },
	}));
}

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response("Not found", { status: 404 });
	}

	return new Response(gadgetImageBytes(slug), {
		headers: {
			"Content-Type": "image/webp",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
