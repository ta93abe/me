import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SITE } from "@/config/site";
import { robotsTxtErrors } from "@/utils/robots";

const robotsPath = join(
	dirname(fileURLToPath(import.meta.url)),
	"../../../public/robots.txt",
);

describe("robotsTxtErrors", () => {
	it("flags Content-Signal as an unknown robots.txt directive", () => {
		const errors = robotsTxtErrors(
			"User-agent: *\nAllow: /\nContent-Signal: ai-train=no\n",
		);
		expect(errors).toEqual(['line 3: unknown directive "content-signal"']);
	});

	it("accepts the Lighthouse safelist without Content-Signal", () => {
		expect(
			robotsTxtErrors(
				`User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap-index.xml\n`,
			),
		).toEqual([]);
	});
});

describe("public/robots.txt", () => {
	const robots = readFileSync(robotsPath, "utf8");

	it("is the app's static crawl policy and has no Content-Signal", () => {
		expect(robots).toMatch(/^# robots.txt/m);
		expect(robots).toContain("The Worker does not generate robots.txt");
		expect(robots).not.toMatch(/^\s*Content-Signal\s*:/im);
		expect(robots).toContain(`Sitemap: ${SITE.url}/sitemap-index.xml`);
		expect(robotsTxtErrors(robots)).toEqual([]);
	});

	it("passes the Lighthouse robots-txt audit", async () => {
		const { default: RobotsTxt } =
			await import("lighthouse/core/audits/seo/robots-txt.js");
		const result = RobotsTxt.audit({
			RobotsTxt: { status: 200, content: robots },
		});
		expect(result.score).toBe(1);
	});
});

describe("public/_headers", () => {
	const headers = readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "../../../public/_headers"),
		"utf8",
	);

	it("declares Content-Signal as an HTTP header instead", () => {
		expect(headers).toMatch(
			/^ {2}Content-Signal: ai-train=no, search=yes, ai-input=yes$/m,
		);
	});
});
