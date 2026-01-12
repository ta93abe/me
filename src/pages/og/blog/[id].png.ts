import { getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";
import { generateOgImage } from "../../../utils/og/generate-og-image";

export const getStaticPaths: GetStaticPaths = async () => {
	const blogPosts = await getCollection("blog");
	return blogPosts.map((post) => ({
		params: { id: post.id },
		props: { title: post.data.title },
	}));
};

export const GET: APIRoute = async ({ props }) => {
	const { title } = props as { title: string };

	const png = await generateOgImage({
		title,
		type: "blog",
	});

	return new Response(png, {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
