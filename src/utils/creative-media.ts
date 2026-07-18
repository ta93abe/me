/**
 * Creative media helpers for Atelier / Gallery
 * 絵・写真・音楽・プロジェクトの共通定義
 */

/** Atelier 向け（創作のみ） */
export const CREATIVE_MEDIA_TYPES = ["drawing", "photo", "music"] as const;

/** Gallery 向け（創作 + ポートフォリオプロジェクト） */
export const MEDIA_TYPES = [...CREATIVE_MEDIA_TYPES, "project"] as const;

export type CreativeMediaType = (typeof CREATIVE_MEDIA_TYPES)[number];
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
	drawing: "絵",
	photo: "写真",
	music: "音楽",
	project: "プロジェクト",
};

export function isMediaType(value: string): value is MediaType {
	return (MEDIA_TYPES as readonly string[]).includes(value);
}

export function isCreativeMediaType(value: string): value is CreativeMediaType {
	return (CREATIVE_MEDIA_TYPES as readonly string[]).includes(value);
}

export function getMediaTypeLabel(mediaType: MediaType): string {
	return MEDIA_TYPE_LABELS[mediaType];
}
