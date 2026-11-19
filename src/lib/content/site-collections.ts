import { getCollection } from "astro:content";

import { gadgetBySlug, type Gadget } from "../gadgets/gadgets.ts";
import { talkBySlug, type Talk } from "../talks/talks.ts";
import {
	profileUrls,
	gadgetsFromEntries,
	sortByOrder,
	talksFromEntries,
	type FeaturedWork,
	type SiteLink,
} from "./site-data.ts";

/** 代表作。`/works`、About、llms がこれを読む。 */
export async function getWorks(): Promise<FeaturedWork[]> {
	return sortByOrder("works", await getCollection("works")).map(({ data }) => ({
		href: data.href,
		title: data.title,
		excerpt: data.excerpt,
	}));
}

/** 主に使っている場所。Links / Contact / About と JSON-LD の sameAs がこれを読む。 */
export async function getLinks(): Promise<SiteLink[]> {
	return sortByOrder("links", await getCollection("links")).map(({ data }) => ({
		name: data.name,
		url: data.url,
		icon: data.icon,
	}));
}

/** JSON-LD Person.sameAs 用。 */
export async function getProfileUrls(): Promise<string[]> {
	return profileUrls(await getLinks());
}

/** 登壇・配信。新しい順。`/talks`、About、スライドがこれを読む。 */
export async function getTalks(): Promise<Talk[]> {
	return talksFromEntries(await getCollection("talks"));
}

export async function getTalk(slug: string): Promise<Talk | undefined> {
	return talkBySlug(await getTalks(), slug);
}

/** 使っている道具。`order` 順。`/gadgets` と詳細ページ、画像の生成がこれを読む。 */
export async function getGadgets(): Promise<Gadget[]> {
	return gadgetsFromEntries(await getCollection("gadgets"));
}

export async function getGadget(slug: string): Promise<Gadget | undefined> {
	return gadgetBySlug(await getGadgets(), slug);
}
