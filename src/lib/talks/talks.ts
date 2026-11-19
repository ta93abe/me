import { youtubeWatchUrl } from "@/lib/content/youtube-url";

export type TalkLink = {
	readonly label: string;
	readonly href: string;
};

export type YoutubeThumbnailVariant = "mqdefault" | "hqdefault";

/** 登壇・配信 1 件。正は `src/content/talks/<slug>.mdx`（TA-2152）。 */
export type Talk = {
	readonly slug: string;
	readonly title: string;
	readonly event: string;
	readonly date: string;
	readonly excerpt: string;
	readonly youtubeId: string;
	/** 公開デッキ `/slides/<slug>/` への slug。unlisted デッキは不可。あるときだけ TalkCard に Slides を出す。 */
	readonly slideSlug?: string;
	readonly youtubeThumbnailFit?: "wide" | "square";
	readonly links?: readonly TalkLink[];
};

/**
 * カード表示幅向けの YouTube サムネ。`maxresdefault`（1280×720）は
 * `/talks/` の表示サイズに対して過大なので使わない。
 */
export const TALK_THUMBNAIL_VARIANTS: readonly {
	readonly name: YoutubeThumbnailVariant;
	readonly width: number;
	readonly height: number;
}[] = [
	{ name: "mqdefault", width: 320, height: 180 },
	{ name: "hqdefault", width: 480, height: 360 },
];

export const TALK_THUMBNAIL_WIDTH = 480;
export const TALK_THUMBNAIL_HEIGHT = 360;

/** `/talks/` の main は `max-w-3xl` + `px-6`。カード画像の表示幅。 */
export const TALK_THUMBNAIL_SIZES =
	"(min-width: 48rem) 720px, calc(100vw - 3rem)";

export function talkYoutubeUrl(talk: Pick<Talk, "youtubeId">): string {
	return youtubeWatchUrl(talk.youtubeId);
}

export function talkThumbnailUrl(
	talk: Pick<Talk, "youtubeId">,
	variant: YoutubeThumbnailVariant = "hqdefault",
): string {
	return `https://i.ytimg.com/vi/${talk.youtubeId}/${variant}.jpg`;
}

export function talkThumbnailSrcset(talk: Pick<Talk, "youtubeId">): string {
	return TALK_THUMBNAIL_VARIANTS.map(
		({ name, width }) => `${talkThumbnailUrl(talk, name)} ${width}w`,
	).join(", ");
}

export function talkBySlug(
	talks: readonly Talk[],
	slug: string,
): Talk | undefined {
	return talks.find((talk) => talk.slug === slug);
}
