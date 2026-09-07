import type { OgImageType } from "@/utils/og/generate-og-image";

export const OG_SECTIONS = [
	{ slug: "about", title: "About", type: "default" },
	{ slug: "works", title: "Works", type: "works" },
	{ slug: "blog", title: "Blog", type: "blog" },
	{ slug: "contact", title: "Contact", type: "default" },
	{ slug: "links", title: "Links", type: "default" },
	{ slug: "tools", title: "Tools", type: "default" },
] as const satisfies ReadonlyArray<{
	slug: string;
	title: string;
	type: OgImageType;
}>;

export type OgSectionSlug = (typeof OG_SECTIONS)[number]["slug"];

export function ogSectionPath(slug: OgSectionSlug): string {
	return `/og/${slug}.png`;
}
