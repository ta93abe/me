/**
 * Resize the brand mark into the public favicon set.
 *
 * Source: src/assets/brand/favicon-source.png (2048² artwork)
 * Outputs:
 *   public/favicon.png            48×48 tab icon
 *   public/apple-touch-icon.png   180×180 iOS home-screen icon
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "src/assets/brand/favicon-source.png");

async function writePng(size, dest) {
	await sharp(source)
		.resize(size, size, { kernel: "lanczos3", fit: "cover" })
		.png({ compressionLevel: 9, effort: 10 })
		.toFile(dest);
	console.log(`wrote ${path.relative(root, dest)} (${size}×${size})`);
}

const publicDir = path.join(root, "public");
await mkdir(publicDir, { recursive: true });
await writePng(48, path.join(publicDir, "favicon.png"));
await writePng(180, path.join(publicDir, "apple-touch-icon.png"));
