import { describe, expect, it } from "vitest";

import shippedBaseline from "./baseline.json" with { type: "json" };
import {
	evaluateMarkdownProbe,
	evaluateScan,
	flattenChecks,
	renderGithubAnnotations,
	renderSummary,
	shouldFailJob,
} from "./lib.mjs";

const baseline = {
	knownFailChecks: [
		"discoverability.dnsAid",
		"discovery.authMd",
		"discovery.ard",
	],
	ignoreGroups: ["commerce"],
};

const sampleScan = {
	url: "https://ta93abe.com",
	targetUrl: "https://ta93abe.com",
	scannedAt: "2026-09-16T16:26:39.762Z",
	level: 5,
	levelName: "Agent-Native",
	checks: {
		discoverability: {
			robotsTxt: {
				status: "pass",
				message: "robots.txt exists with valid format",
			},
			dnsAid: {
				status: "fail",
				message: "DNS-AID well-known entrypoint records not found",
			},
		},
		contentAccessibility: {
			markdownNegotiation: {
				status: "pass",
				message: "Site supports Markdown for Agents",
			},
		},
		discovery: {
			apiCatalog: {
				status: "pass",
				message: "API Catalog found with 1 API listed",
			},
			authMd: {
				status: "fail",
				message: "auth.md exists but agent_auth metadata was not found",
			},
			ard: {
				status: "fail",
				message: "ARD capability manifest not found",
			},
		},
		commerce: {
			x402: {
				status: "neutral",
				message: "x402 payment protocol not detected (not a commerce site)",
			},
		},
	},
};

describe("baseline.json", () => {
	it("tracks the three open isitagentready fails from TA-967", () => {
		expect(shippedBaseline.knownFailChecks).toEqual(baseline.knownFailChecks);
		expect(shippedBaseline.markdownPaths.map((row) => row.path)).toEqual([
			"/",
			"/about/",
			"/blog/hello-world/",
		]);
	});
});

describe("flattenChecks", () => {
	it("flattens nested groups into dotted ids", () => {
		const rows = flattenChecks(sampleScan.checks);
		expect(rows.map((row) => row.id)).toEqual([
			"discoverability.robotsTxt",
			"discoverability.dnsAid",
			"contentAccessibility.markdownNegotiation",
			"discovery.apiCatalog",
			"discovery.authMd",
			"discovery.ard",
			"commerce.x402",
		]);
		expect(
			rows.find((row) => row.id === "discoverability.dnsAid"),
		).toMatchObject({
			status: "fail",
			message: "DNS-AID well-known entrypoint records not found",
		});
	});
});

describe("evaluateScan", () => {
	it("keeps the three known fails informational and ignores commerce", () => {
		const result = evaluateScan(sampleScan, baseline);
		expect(result.level).toBe(5);
		expect(result.knownFails.map((row) => row.id)).toEqual([
			"discoverability.dnsAid",
			"discovery.authMd",
			"discovery.ard",
		]);
		expect(result.unexpectedFails).toEqual([]);
		expect(result.ignored.map((row) => row.id)).toEqual(["commerce.x402"]);
	});

	it("treats a previously passing check that now fails as a regression", () => {
		const scan = structuredClone(sampleScan);
		scan.checks.discovery.apiCatalog.status = "fail";
		scan.checks.discovery.apiCatalog.message = "API Catalog missing";
		const result = evaluateScan(scan, baseline);
		expect(result.unexpectedFails.map((row) => row.id)).toEqual([
			"discovery.apiCatalog",
		]);
	});

	it("reports a known fail that started passing", () => {
		const scan = structuredClone(sampleScan);
		scan.checks.discovery.ard.status = "pass";
		scan.checks.discovery.ard.message = "ARD catalog found";
		const result = evaluateScan(scan, baseline);
		expect(result.knownFails.map((row) => row.id)).not.toContain(
			"discovery.ard",
		);
		expect(result.newlyPassing.map((row) => row.id)).toEqual(["discovery.ard"]);
	});
});

describe("evaluateMarkdownProbe", () => {
	it("accepts content-type that includes markdown", () => {
		expect(
			evaluateMarkdownProbe(
				{
					path: "/",
					status: 200,
					contentType: "text/markdown; charset=utf-8",
				},
				true,
			),
		).toMatchObject({ ok: true, regression: false });
	});

	it("flags homepage html as a regression", () => {
		expect(
			evaluateMarkdownProbe(
				{ path: "/", status: 200, contentType: "text/html" },
				true,
			),
		).toMatchObject({ ok: false, regression: true });
	});

	it("does not treat known subpath html as a regression", () => {
		expect(
			evaluateMarkdownProbe(
				{ path: "/about/", status: 200, contentType: "text/html" },
				false,
			),
		).toMatchObject({ ok: false, regression: false, unexpectedPass: false });
	});

	it("notes when a known-failing path starts returning markdown", () => {
		expect(
			evaluateMarkdownProbe(
				{
					path: "/about/",
					status: 200,
					contentType: "text/markdown; charset=utf-8",
				},
				false,
			),
		).toMatchObject({ ok: true, unexpectedPass: true, regression: false });
	});
});

describe("shouldFailJob", () => {
	it("stays green for the current known fails", () => {
		const result = evaluateScan(sampleScan, baseline);
		expect(
			shouldFailJob({
				...result,
				markdownRegressions: [],
				gateRegressions: true,
				gateKnownFails: false,
			}),
		).toBe(false);
	});

	it("fails when a passing check regresses and gating is on", () => {
		expect(
			shouldFailJob({
				unexpectedFails: [{ id: "discovery.apiCatalog" }],
				knownFails: [],
				markdownRegressions: [],
				gateRegressions: true,
				gateKnownFails: false,
			}),
		).toBe(true);
	});

	it("fails known remaining fails only when that gate is on", () => {
		expect(
			shouldFailJob({
				unexpectedFails: [],
				knownFails: [{ id: "discovery.ard" }],
				markdownRegressions: [],
				gateRegressions: true,
				gateKnownFails: true,
			}),
		).toBe(true);
	});
});

describe("renderSummary", () => {
	it("includes level, known fails, and markdown probe table", () => {
		const scan = evaluateScan(sampleScan, baseline);
		const markdown = [
			evaluateMarkdownProbe(
				{
					path: "/",
					status: 200,
					contentType: "text/markdown; charset=utf-8",
				},
				true,
			),
			evaluateMarkdownProbe(
				{ path: "/about/", status: 200, contentType: "text/html" },
				false,
			),
			evaluateMarkdownProbe(
				{
					path: "/blog/hello-world/",
					status: 200,
					contentType: "text/html",
				},
				false,
			),
		];
		const summary = renderSummary({
			scan,
			markdown,
			uiUrl: "https://isitagentready.com/ta93abe.com",
		});
		expect(summary).toContain("Level 5 Agent-Native");
		expect(summary).toContain("discoverability.dnsAid");
		expect(summary).toContain("/about/");
		expect(summary).toContain("text/html");
		expect(summary).toContain("<!-- agent-ready-scan -->");
		expect(summary).toContain("はゲートしません");
	});

	it("says known fails are gated when that flag is on", () => {
		const scan = evaluateScan(sampleScan, baseline);
		const summary = renderSummary({
			scan,
			markdown: [],
			uiUrl: "https://isitagentready.com/ta93abe.com",
			gateKnownFails: true,
		});
		expect(summary).toContain("もゲートします");
	});
});

describe("renderGithubAnnotations", () => {
	it("warns on known fails and errors on regressions", () => {
		const scan = evaluateScan(sampleScan, baseline);
		scan.unexpectedFails = [
			{
				id: "discovery.apiCatalog",
				status: "fail",
				message: "API Catalog missing",
			},
		];
		const markdown = [
			evaluateMarkdownProbe(
				{ path: "/", status: 200, contentType: "text/html" },
				true,
			),
		];
		const lines = renderGithubAnnotations({ scan, markdown });
		expect(lines.some((line) => line.startsWith("::warning "))).toBe(true);
		expect(lines.some((line) => line.includes("discovery.apiCatalog"))).toBe(
			true,
		);
		expect(lines.some((line) => line.startsWith("::error "))).toBe(true);
		expect(lines.some((line) => line.includes("GET / markdown"))).toBe(true);
	});
});
