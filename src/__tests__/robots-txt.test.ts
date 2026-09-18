import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CONTENT_SIGNAL } from "../../worker/discovery-headers.ts";

const robotsTxt = readFileSync(
	path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"../../public/robots.txt",
	),
	"utf8",
);

type RobotsGroup = {
	userAgents: string[];
	allow: string[];
	disallow: string[];
	contentSignal: string | undefined;
};

type RobotsTxtAudit = {
	audit: (artifacts: { RobotsTxt: { status: number; content: string } }) => {
		score: number | null;
	};
};

/**
 * RFC 9309 group parse: consecutive `User-agent` lines start a group,
 * following rule lines belong to it, and a later `User-agent` after rules
 * starts a new group. Blank lines do not split groups. `Sitemap` and
 * `Agentmap` are file-level and ignored for membership. Named groups do
 * not inherit `*`.
 */
function parseRobotsGroups(robots: string): RobotsGroup[] {
	const groups: RobotsGroup[] = [];
	let current: RobotsGroup | null = null;
	let inRules = false;

	for (const raw of robots.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const userAgent = /^user-agent:\s*(.+)$/i.exec(line);
		if (userAgent) {
			if (!current || inRules) {
				current = {
					userAgents: [],
					allow: [],
					disallow: [],
					contentSignal: undefined,
				};
				groups.push(current);
				inRules = false;
			}
			current.userAgents.push(userAgent[1].trim());
			continue;
		}

		if (/^sitemap:/i.test(line) || /^agentmap:/i.test(line)) {
			continue;
		}

		inRules = true;
		if (!current) {
			continue;
		}

		const signal = /^content-signal:\s*(.+)$/i.exec(line);
		if (signal) {
			current.contentSignal = signal[1].trim();
			continue;
		}

		const allow = /^allow:\s*(.+)$/i.exec(line);
		if (allow) {
			current.allow.push(allow[1].trim());
			continue;
		}

		const disallow = /^disallow:\s*(.+)$/i.exec(line);
		if (disallow) {
			current.disallow.push(disallow[1].trim());
		}
	}

	return groups;
}

function signalUserAgents(robots: string): string[] {
	return parseRobotsGroups(robots).flatMap((group) =>
		group.contentSignal ? group.userAgents : [],
	);
}

const trailingSignalOnlyOnLastGroup = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: CCBot
Allow: /

Content-Signal: ${CONTENT_SIGNAL}
Sitemap: https://ta93abe.com/sitemap.xml
`;

describe("robots.txt Content-Signal groups", () => {
	it("attributes a trailing Content-Signal only to the last User-agent group", () => {
		expect(signalUserAgents(trailingSignalOnlyOnLastGroup)).toEqual(["CCBot"]);
	});

	it("puts the same Content-Signal on every User-agent group, including *", () => {
		const groups = parseRobotsGroups(robotsTxt);
		const agents = groups.flatMap((group) => group.userAgents);

		expect(groups.length).toBeGreaterThan(1);
		expect(agents).toContain("*");
		expect(agents).toContain("CCBot");
		expect(agents).toContain("GPTBot");
		expect(new Set(signalUserAgents(robotsTxt))).toEqual(new Set(agents));

		for (const group of groups) {
			expect(group.contentSignal).toBe(CONTENT_SIGNAL);
		}
	});

	it("does not leave Content-Signal attributed to CCBot alone", () => {
		expect(signalUserAgents(robotsTxt)).not.toEqual(["CCBot"]);
	});

	it("keeps Sitemap as the sitemap.xml URL advertised by #256", () => {
		expect(robotsTxt).toMatch(
			/^Sitemap: https:\/\/ta93abe.com\/sitemap\.xml$/m,
		);
		expect(robotsTxt).not.toMatch(/Sitemap:.*sitemap-index\.xml/);
	});

	it("advertises the ARD catalog with a file-level Agentmap URL", () => {
		expect(robotsTxt).toMatch(
			/^Agentmap: https:\/\/ta93abe\.com\/\.well-known\/ai-catalog\.json$/m,
		);
	});

	it("allows search and live-fetch user agents, including Applebot and Meta-ExternalFetcher", () => {
		const groups = parseRobotsGroups(robotsTxt);
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
			const group = groups.find((item) => item.userAgents.includes(userAgent));
			expect(group, `missing Allow group for ${userAgent}`).toBeDefined();
			expect(group?.allow).toContain("/");
			expect(group?.disallow).not.toContain("/");
			expect(group?.contentSignal).toBe(CONTENT_SIGNAL);
		}
	});

	it("disallows training-only user agents without dropping Content-Signal", () => {
		const groups = parseRobotsGroups(robotsTxt);
		const disallowed = [
			"Applebot-Extended",
			"Meta-ExternalAgent",
			"anthropic-ai",
		];

		for (const userAgent of disallowed) {
			const group = groups.find((item) => item.userAgents.includes(userAgent));
			expect(group, `missing Disallow group for ${userAgent}`).toBeDefined();
			expect(group?.disallow).toContain("/");
			expect(group?.allow).not.toContain("/");
			expect(group?.contentSignal).toBe(CONTENT_SIGNAL);
		}
	});

	it("passes the Lighthouse 13.4.1 robots-txt audit for Content-Signal groups", async () => {
		const { default: RobotsTxt } =
			(await import("lighthouse/core/audits/seo/robots-txt.js")) as {
				default: RobotsTxtAudit;
			};
		const withoutAgentmap = robotsTxt
			.split(/\r?\n/)
			.filter((line) => !/^agentmap:/i.test(line.trim()))
			.join("\n");
		const result = RobotsTxt.audit({
			RobotsTxt: { status: 200, content: withoutAgentmap },
		});
		expect(result.score).toBe(1);
	});
});
