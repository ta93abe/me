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
 * starts a new group. Blank lines do not split groups. `Sitemap` is
 * file-level and ignored for membership. Named groups do not inherit `*`.
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
				current = { userAgents: [], contentSignal: undefined };
				groups.push(current);
				inRules = false;
			}
			current.userAgents.push(userAgent[1].trim());
			continue;
		}

		if (/^sitemap:/i.test(line)) {
			continue;
		}

		inRules = true;
		if (!current) {
			continue;
		}

		const signal = /^content-signal:\s*(.+)$/i.exec(line);
		if (signal) {
			current.contentSignal = signal[1].trim();
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

	it("passes the Lighthouse 13.4.1 robots-txt audit", async () => {
		const { default: RobotsTxt } =
			(await import("lighthouse/core/audits/seo/robots-txt.js")) as {
				default: RobotsTxtAudit;
			};
		const result = RobotsTxt.audit({
			RobotsTxt: { status: 200, content: robotsTxt },
		});
		expect(result.score).toBe(1);
	});
});
