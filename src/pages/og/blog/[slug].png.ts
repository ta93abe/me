import type { APIRoute } from "astro";

import { getBlogList } from "@/lib/content/blog-collection";
import { generateOgImage } from "@/utils/og/generate-og-image";

export const prerender = true;

export async function getStaticPaths() {
	return (await getBlogList()).map((post) => ({
		params: { slug: post.slug },
		props: { title: post.title },
	}));
}

type Props = { title: string };

// 以前は Worker が R2 のタイトルから実行時に描いていた。同じカード（subtitle: Blog）をビルド時に出す。
export const GET: APIRoute<Props> = async ({ props }) => {
	const png = await generateOgImage({
		title: props.title,
		subtitle: "Blog",
		type: "blog",
	});

	return new Response(Buffer.from(png), {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
