import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const robots = readFileSync(join(process.cwd(), "public/robots.txt"), "utf8");

function allowsRoot(userAgent: string): boolean {
	const escaped = userAgent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(
		`User-agent:\\s*${escaped}\\r?\\nAllow:\\s*/\\s*(?:\\n|$)`,
	).test(robots);
}

describe("robots.txt", () => {
	it("keeps the wildcard crawl allow", () => {
		expect(allowsRoot("*")).toBe(true);
	});

	it("explicitly allows major AI crawlers that look for their own rules", () => {
		for (const userAgent of [
			"GPTBot",
			"ChatGPT-User",
			"OAI-SearchBot",
			"ClaudeBot",
			"Claude-Web",
			"Google-Extended",
			"PerplexityBot",
			"CCBot",
			"Applebot",
			"Applebot-Extended",
			"Amazonbot",
			"meta-externalagent",
		]) {
			expect(allowsRoot(userAgent), userAgent).toBe(true);
		}
	});

	it("does not add Bytespider", () => {
		expect(robots).not.toMatch(/User-agent:\s*Bytespider/i);
	});
});
