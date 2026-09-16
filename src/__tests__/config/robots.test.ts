import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const robotsTxt = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../../public/robots.txt"),
	"utf8",
);

describe("robots.txt", () => {
	it("advertises the ARD catalog with an absolute Agentmap URL", () => {
		expect(robotsTxt).toMatch(
			/^Agentmap: https:\/\/ta93abe\.com\/\.well-known\/ai-catalog\.json$/m,
		);
	});

	it("keeps Sitemap, Content-Signal, and AI bot Allow directives", () => {
		expect(robotsTxt).toContain(
			"Sitemap: https://ta93abe.com/sitemap-index.xml",
		);
		expect(robotsTxt).toContain(
			"Content-Signal: ai-train=no, search=yes, ai-input=yes",
		);
		expect(robotsTxt).toContain("User-agent: *");
		expect(robotsTxt).toContain("User-agent: GPTBot");
		expect(robotsTxt).toContain("User-agent: CCBot");
		expect(robotsTxt).toMatch(/^Allow: \/$/m);
	});
});
