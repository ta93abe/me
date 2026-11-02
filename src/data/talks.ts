import { youtubeWatchUrl } from "@/lib/content/youtube-url";

export type TalkLink = {
	readonly label: string;
	readonly href: string;
};

export type YoutubeThumbnailVariant = "mqdefault" | "hqdefault";

export type Talk = {
	readonly slug: string;
	readonly title: string;
	readonly event: string;
	readonly date: string;
	readonly excerpt: string;
	readonly youtubeId: string;
	/** 自前デッキ `/slides/<slug>/` への slug。あるときだけ TalkCard に Slides を出す。 */
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

/**
 * 登壇・配信の正。`/talks` と About がこれを読む。新しいものが先。
 */
export const TALKS: readonly Talk[] = [
	{
		slug: "frosty-friday-live-challenge-vol56",
		title: "Frosty Friday Live Challenge Vol.56",
		event: "SnowVillage",
		date: "2026-08-27",
		excerpt: "SnowVillage の Frosty Friday Live Challenge にゲスト出演。",
		youtubeId: "KLEApocYmww",
		slideSlug: "showcase",
		links: [
			{
				label: "再生リスト",
				href: "https://www.youtube.com/playlist?list=PLVj4iIZgzTAq2FzaBBgqFOtZaJTcoG3JR",
			},
		],
	},
	{
		slug: "mintsuyo-2026-rookie",
		title: "Cloudflare で始める Data Platform",
		event:
			"みんなの考えた最強のデータ基盤アーキテクチャ'26前期〜前夜祭〜ルーキーズ",
		date: "2026-05-14",
		excerpt: "みん強'26前期 前夜祭。Cloudflare 上でデータ基盤を組む話。",
		youtubeId: "7yvAfZ8vCDU",
		youtubeThumbnailFit: "square",
		links: [
			{
				label: "イベント",
				href: "https://datatech-jp.connpass.com/event/386885/",
			},
			{
				label: "スライド",
				href: "https://speakerdeck.com/ta93abe/cloudflare-dehazimeru-data-platform",
			},
		],
	},
];

export function talkYoutubeUrl(talk: Talk): string {
	return youtubeWatchUrl(talk.youtubeId);
}

export function talkThumbnailUrl(
	talk: Talk,
	variant: YoutubeThumbnailVariant = "hqdefault",
): string {
	return `https://i.ytimg.com/vi/${talk.youtubeId}/${variant}.jpg`;
}

export function talkThumbnailSrcset(talk: Talk): string {
	return TALK_THUMBNAIL_VARIANTS.map(
		({ name, width }) => `${talkThumbnailUrl(talk, name)} ${width}w`,
	).join(", ");
}
