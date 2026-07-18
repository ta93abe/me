import type { APIRoute } from "astro";

import { SITE } from "@/config/site";
import { generateOgImage } from "@/utils/og/generate-og-image";

export const GET: APIRoute = async () => {
	const png = await generateOgImage({
		title: SITE.name,
		subtitle: "Software Engineer",
		type: "default",
	});

	return new Response(Buffer.from(png), {
		headers: {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
};
