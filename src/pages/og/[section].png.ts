import type { APIRoute } from "astro";

import { SITE } from "@/config/site";
import { generateOgImage } from "@/utils/og/generate-og-image";
import { OG_SECTIONS } from "@/utils/og/sections";

export const prerender = true;

export function getStaticPaths() {
	return OG_SECTIONS.map((section) => ({
		params: { section: section.slug },
		props: section,
	}));
}

type SectionProps = (typeof OG_SECTIONS)[number];

export const GET: APIRoute<SectionProps> = async ({ props }) => {
	const png = await generateOgImage({
		title: props.title,
		subtitle: SITE.author,
		type: props.type,
	});

	return new Response(Buffer.from(png), {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
