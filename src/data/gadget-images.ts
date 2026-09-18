const gadgetPhotos = import.meta.glob<string>("../assets/gadgets/*.webp", {
	eager: true,
	query: "?inline",
	import: "default",
});

export function gadgetImageUrl(slug: string): string {
	return `/media/gadgets/${slug}.webp`;
}

function gadgetDataUri(slug: string): string {
	const match = Object.entries(gadgetPhotos).find(([key]) =>
		key.endsWith(`/${slug}.webp`),
	);
	const uri = match?.[1];
	if (typeof uri !== "string" || uri.length === 0) {
		throw new Error(`Missing gadget image: ${slug}`);
	}
	return uri;
}

export function gadgetImageBytes(slug: string): Uint8Array<ArrayBuffer> {
	const uri = gadgetDataUri(slug);
	const comma = uri.indexOf(",");
	if (comma < 0) {
		throw new Error(`Invalid gadget image: ${slug}`);
	}
	const binary = atob(uri.slice(comma + 1));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}
