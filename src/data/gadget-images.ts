const gadgetPhotos = import.meta.glob<string>(
	"../assets/gadgets/*.{webp,png,jpg,jpeg}",
	{
		eager: true,
		query: "?url",
		import: "default",
	},
);

const photoExtension = /\.(webp|png|jpe?g)$/i;

export function gadgetImageUrl(slug: string): string {
	const match = Object.entries(gadgetPhotos).find(([key]) => {
		const file = key.split("/").pop() ?? "";
		return file.replace(photoExtension, "") === slug;
	});
	const url = match?.[1];
	if (typeof url !== "string" || url.length === 0) {
		throw new Error(`Missing gadget image: ${slug}`);
	}
	return url;
}
