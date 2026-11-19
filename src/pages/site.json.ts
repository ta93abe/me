import type { APIRoute } from "astro";

import { getGadgets, getLinks, getWorks } from "@/lib/content/site-collections";
import { indexableGadgetSlugs } from "@/lib/gadgets/gadgets";

import type { SiteManifest } from "../../worker/content/site-manifest.ts";

// Worker の llms-full.txt が読むサイトのデータ（ビルド時に生成。正は src/content/ の MDX）。
export const GET: APIRoute = async () => {
	const manifest: SiteManifest = {
		works: await getWorks(),
		links: await getLinks(),
		indexableGadgetSlugs: indexableGadgetSlugs(await getGadgets()),
	};

	return new Response(JSON.stringify(manifest), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};
