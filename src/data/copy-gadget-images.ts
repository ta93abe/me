import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const gadgetsDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../assets/gadgets",
);

export async function copyGadgetImages(publicDir: string): Promise<void> {
	const dest = path.join(publicDir, "media", "gadgets");
	await rm(dest, { recursive: true, force: true });
	await mkdir(dest, { recursive: true });

	const entries = await readdir(gadgetsDir);
	await Promise.all(
		entries
			.filter((name) => name.endsWith(".webp"))
			.map((name) => cp(path.join(gadgetsDir, name), path.join(dest, name))),
	);
}
