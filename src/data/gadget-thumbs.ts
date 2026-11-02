import sharp from "sharp";

import { GADGET_SOURCE_WIDTH, gadgetImageBytes } from "@/data/gadget-images";

export async function resizeGadgetThumb(
	slug: string,
	width: number,
): Promise<Uint8Array<ArrayBuffer>> {
	const original = gadgetImageBytes(slug);
	if (!Number.isInteger(width) || width <= 0 || width >= GADGET_SOURCE_WIDTH) {
		return original;
	}

	const out = await sharp(original)
		.resize(width, width, { fit: "inside" })
		.webp({ quality: 80 })
		.toBuffer();
	return new Uint8Array(out);
}
