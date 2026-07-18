/**
 * Creative media helpers for Atelier / Gallery
 * 絵・写真・音楽の共通定義
 */

export const MEDIA_TYPES = ["drawing", "photo", "music"] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
	drawing: "絵",
	photo: "写真",
	music: "音楽",
};

export function isMediaType(value: string): value is MediaType {
	return (MEDIA_TYPES as readonly string[]).includes(value);
}

export function getMediaTypeLabel(mediaType: MediaType): string {
	return MEDIA_TYPE_LABELS[mediaType];
}
