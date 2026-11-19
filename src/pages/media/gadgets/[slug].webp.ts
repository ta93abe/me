import type { APIRoute } from "astro";

import { getGadgets } from "@/lib/content/site-collections";
import { gadgetImageBytes } from "@/lib/gadgets/images";

export const prerender = true;

export async function getStaticPaths() {
	return (await getGadgets()).map((gadget) => ({
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
