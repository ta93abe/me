import type { APIRoute } from "astro";

import { loadDecks } from "@/slides/load-decks";
import { formatDate } from "@/utils/date";
import { generateOgImage } from "@/utils/og/generate-og-image";

export const prerender = true;

export async function getStaticPaths() {
	const decks = await loadDecks();
	return decks.map((deck) => ({
		params: { slug: deck.frontmatter.slug },
		props: {
			title: deck.frontmatter.title,
			date: deck.frontmatter.date,
			event: deck.frontmatter.event,
		},
	}));
}

interface Props {
	title: string;
	date: string;
	event?: string;
}

export const GET: APIRoute<Props> = async ({ props }) => {
	const png = await generateOgImage({
		layout: "slides-cover",
		title: props.title,
		subtitle: props.date ? formatDate(props.date) : "Slides",
		event: props.event,
		type: "slides",
	});

	return new Response(Buffer.from(png), {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
