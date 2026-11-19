import type {
	FeaturedWork,
	SiteLink,
} from "../../src/lib/content/site-data.ts";

/**
 * ビルド時に `src/pages/site.json.ts` が出すサイトのデータ（正は `src/content/` の MDX、TA-2152）。
 * Worker は `astro:content` を読めないので、この静的アセットを読む。`blog-manifest.ts` と同じ形。
 */
export const SITE_MANIFEST_PATH = "/site.json";

export type SiteManifest = {
	works: FeaturedWork[];
	links: SiteLink[];
	/** indexable な Gadget 詳細の slug。Markdown alternate を出すかの判定に使う。 */
	indexableGadgetSlugs: string[];
};

export const EMPTY_SITE_MANIFEST: SiteManifest = {
	works: [],
	links: [],
	indexableGadgetSlugs: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function strings<K extends string>(
	value: unknown,
	keys: readonly K[],
): Record<K, string> | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const out = {} as Record<K, string>;
	for (const key of keys) {
		const field = value[key];
		if (typeof field !== "string") {
			return undefined;
		}
		out[key] = field;
	}
	return out;
}

export function siteManifestFromJson(value: unknown): SiteManifest {
	if (!isRecord(value)) {
		return EMPTY_SITE_MANIFEST;
	}
	const works = Array.isArray(value.works)
		? value.works.flatMap((item) => {
				const work = strings(item, ["href", "title", "excerpt"] as const);
				return work ? [work] : [];
			})
		: [];
	const links = Array.isArray(value.links)
		? value.links.flatMap((item) => {
				const link = strings(item, ["name", "url", "icon"] as const);
				return link ? [link] : [];
			})
		: [];
	const indexableGadgetSlugs = Array.isArray(value.indexableGadgetSlugs)
		? value.indexableGadgetSlugs.filter(
				(slug): slug is string => typeof slug === "string",
			)
		: [];
	return { works, links, indexableGadgetSlugs };
}

type AssetFetcher = { fetch: (request: Request) => Promise<Response> };

export async function loadSiteManifest(
	assets: AssetFetcher | undefined,
	origin: string,
): Promise<SiteManifest> {
	if (!assets) {
		return EMPTY_SITE_MANIFEST;
	}
	try {
		const response = await assets.fetch(
			new Request(new URL(SITE_MANIFEST_PATH, origin)),
		);
		if (!response.ok) {
			return EMPTY_SITE_MANIFEST;
		}
		return siteManifestFromJson(await response.json());
	} catch {
		return EMPTY_SITE_MANIFEST;
	}
}
