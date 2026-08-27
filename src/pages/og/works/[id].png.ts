import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

import { generateOgImage } from "@/utils/og/generate-og-image";

export const getStaticPaths: GetStaticPaths = async () => {
	const works = await getCollection("works");
	return works.map((work) => ({
		params: { id: work.id },
		props: { title: work.data.title },
	}));
};

export const GET: APIRoute = async ({ props }) => {
	const { title } = props as { title: string };

	const png = await generateOgImage({
		title,
		type: "works",
	});

	return new Response(Buffer.from(png), {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
