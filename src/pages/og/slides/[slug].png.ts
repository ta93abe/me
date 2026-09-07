import type { APIRoute } from "astro";

import { loadDecks } from "@/slides/load-decks";
import { generateOgImage } from "@/utils/og/generate-og-image";

export const prerender = true;

export async function getStaticPaths() {
	const decks = await loadDecks();
	return decks.map((deck) => ({
		params: { slug: deck.frontmatter.slug },
		props: { title: deck.frontmatter.title },
	}));
}

interface Props {
	title: string;
}

export const GET: APIRoute<Props> = async ({ props }) => {
	const png = await generateOgImage({
		title: props.title,
		subtitle: "Slides",
		type: "slides",
	});

	return new Response(Buffer.from(png), {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
