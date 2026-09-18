import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function walkSourceFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "__tests__") {
			continue;
		}
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...walkSourceFiles(path));
		} else if (/\.(ts|astro|js|mjs)$/.test(entry.name)) {
			out.push(path);
		}
	}
	return out;
}

describe("WebMCP origin tools", () => {
	it("does not register get_site_overview in page scripts", () => {
		// Cloudflare の mcp-server-client pack が /mcp の同名ツールを WebMCP に出す。
		// オリジン側でも registerTool すると navigator.modelContext に二重登録される。
		const hits = walkSourceFiles(srcDir).filter((file) =>
			readFileSync(file, "utf8").includes("get_site_overview"),
		);

		expect(hits.map((file) => file.slice(srcDir.length + 1))).toEqual([]);
	});
});
