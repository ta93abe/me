const gadgetSvgs = import.meta.glob<string>("../assets/gadgets/*.svg", {
	eager: true,
	query: "?raw",
	import: "default",
});

export function gadgetImageUrl(slug: string): string {
	const match = Object.entries(gadgetSvgs).find(([key]) =>
		key.endsWith(`/${slug}.svg`),
	);
	const svg = match?.[1];
	if (typeof svg !== "string" || svg.length === 0) {
		throw new Error(`Missing gadget image: ${slug}`);
	}
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
