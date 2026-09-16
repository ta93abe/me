import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";

type RobotsGroup = {
	userAgents: string[];
	allow: string[];
	disallow: string[];
};

function parseRobotsGroups(text: string): RobotsGroup[] {
	const groups: RobotsGroup[] = [];
	let current: RobotsGroup | null = null;

	for (const raw of text.split(/\r?\n/)) {
		const line = raw.replace(/#.*$/, "").trim();
		if (!line) {
			current = null;
			continue;
		}

		const colon = line.indexOf(":");
		if (colon === -1) {
			continue;
		}

		const name = line.slice(0, colon).trim().toLowerCase();
		const value = line.slice(colon + 1).trim();

		if (name === "user-agent") {
			if (!current) {
				current = { userAgents: [], allow: [], disallow: [] };
				groups.push(current);
			}
			current.userAgents.push(value);
			continue;
		}

		if (!current) {
			continue;
		}
		if (name === "allow") {
			current.allow.push(value);
		}
		if (name === "disallow") {
			current.disallow.push(value);
		}
	}

	return groups;
}

function groupFor(groups: RobotsGroup[], userAgent: string): RobotsGroup {
	const group = groups.find((item) =>
		item.userAgents.some(
			(agent) => agent.toLowerCase() === userAgent.toLowerCase(),
		),
	);
	expect(group, `missing robots.txt group for ${userAgent}`).toBeDefined();
	return group as RobotsGroup;
}

describe("public/robots.txt AI bot policy", () => {
	const robots = readFileSync(join(root, "public/robots.txt"), "utf8");
	const headers = readFileSync(join(root, "public/_headers"), "utf8");
	const worker = readFileSync(join(root, "worker/index.ts"), "utf8");
	const groups = parseRobotsGroups(robots);

	it("keeps Content-Signal aligned with the HTTP header and Worker", () => {
		expect(robots).toContain(`Content-Signal: ${CONTENT_SIGNAL}`);
		expect(headers).toMatch(
			new RegExp(`^ {2}Content-Signal: ${CONTENT_SIGNAL}$`, "m"),
		);
		expect(worker).toContain(`"${CONTENT_SIGNAL}"`);
	});

	it("allows search and live-fetch user agents", () => {
		const allowed = [
			"*",
			"GPTBot",
			"ChatGPT-User",
			"OAI-SearchBot",
			"ClaudeBot",
			"Claude-Web",
			"Claude-SearchBot",
			"Claude-User",
			"Google-Extended",
			"PerplexityBot",
			"CCBot",
			"Applebot",
			"Meta-ExternalFetcher",
		];

		for (const userAgent of allowed) {
			const group = groupFor(groups, userAgent);
			expect(group.allow).toContain("/");
			expect(group.disallow).not.toContain("/");
		}
	});

	it("disallows training-only user agents", () => {
		const disallowed = [
			"Applebot-Extended",
			"Meta-ExternalAgent",
			"anthropic-ai",
		];

		for (const userAgent of disallowed) {
			const group = groupFor(groups, userAgent);
			expect(group.disallow).toContain("/");
			expect(group.allow).not.toContain("/");
		}
	});

	it("points crawlers at the sitemap index", () => {
		expect(robots).toContain("Sitemap: https://ta93abe.com/sitemap-index.xml");
	});
});
