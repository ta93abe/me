import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"src",
);

export default defineConfig({
	resolve: {
		alias: {
			"@": srcDir,
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		include: ["**/*.test.ts", "**/*.spec.ts"],
		exclude: ["node_modules/", "dist/", ".astro/", "tests/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				".astro/",
				"**/*.config.*",
				"**/*.d.ts",
			],
		},
	},
});
