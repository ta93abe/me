const gadgetPhotos = import.meta.glob<string>("../assets/gadgets/*.webp", {
	eager: true,
	query: "?inline",
	import: "default",
});

export function gadgetImageUrl(slug: string): string {
	const match = Object.entries(gadgetPhotos).find(([key]) =>
		key.endsWith(`/${slug}.webp`),
	);
	const url = match?.[1];
	if (typeof url !== "string" || url.length === 0) {
		throw new Error(`Missing gadget image: ${slug}`);
	}
	return url;
}
