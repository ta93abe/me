import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";

const robotsTxt = readFileSync(
	path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"../../public/robots.txt",
	),
	"utf8",
);

type ContentSignalRecord = {
	userAgent: string;
	signal: string;
};

function parseContentSignals(robots: string): ContentSignalRecord[] {
	const records: ContentSignalRecord[] = [];
	let currentAgents: string[] = [];
	let inRules = false;

	for (const raw of robots.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const userAgent = /^user-agent:\s*(.+)$/i.exec(line);
		if (userAgent) {
			if (inRules) {
				currentAgents = [];
				inRules = false;
			}
			currentAgents.push(userAgent[1].trim());
			continue;
		}

		if (/^sitemap:/i.test(line)) {
			continue;
		}

		inRules = true;
		const signal = /^content-signal:\s*(.+)$/i.exec(line);
		if (signal) {
			for (const agent of currentAgents) {
				records.push({ userAgent: agent, signal: signal[1].trim() });
			}
		}
	}

	return records;
}

describe("robots.txt Content-Signal", () => {
	it("attaches Content-Signal to User-agent: * instead of a specific crawler", () => {
		expect(parseContentSignals(robotsTxt)).toEqual([
			{ userAgent: "*", signal: CONTENT_SIGNAL },
		]);
	});

	it("places Content-Signal immediately after Allow in the * group", () => {
		expect(robotsTxt).toMatch(
			/^User-agent: \*\nAllow: \/\nContent-Signal: ai-train=no, search=yes, ai-input=yes\n/m,
		);
	});

	it("keeps Sitemap as a file-level trailing directive", () => {
		const lines = robotsTxt.trimEnd().split(/\r?\n/);
		expect(lines.at(-1)).toBe("Sitemap: https://ta93abe.com/sitemap-index.xml");
		expect(lines.some((line) => /^User-agent:\s*CCBot$/i.test(line))).toBe(
			true,
		);
	});
});
