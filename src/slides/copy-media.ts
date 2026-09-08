import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const decksDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"decks",
);

export async function copySlideMedia(publicDir: string): Promise<void> {
	const destRoot = path.join(publicDir, "slides", "media");
	await rm(destRoot, { recursive: true, force: true });

	const entries = await readdir(decksDir, { withFileTypes: true });
	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}
		const dest = path.join(destRoot, entry.name);
		await mkdir(dest, { recursive: true });
		await cp(path.join(decksDir, entry.name), dest, {
			recursive: true,
		});
	}
}
