/**
 * Re-scan https://ta93abe.com via isitagentready and probe Markdown negotiation.
 *
 * Env:
 *   AGENT_READY_URL              (default: baseline.scanUrl)
 *   AGENT_READY_API              (default: baseline.apiUrl)
 *   AGENT_READY_OUT_DIR          (default: agent-ready-results)
 *   AGENT_READY_GATE_REGRESSIONS (default: 1)
 *   AGENT_READY_GATE_KNOWN_FAILS (default: 0)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	evaluateMarkdownProbe,
	evaluateScan,
	renderGithubAnnotations,
	renderSummary,
	shouldFailJob,
} from "./lib.mjs";

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);

function truthy(value, fallback) {
	if (value == null || value === "") {
		return fallback;
	}
	return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}

function parseArgs(argv) {
	const args = {
		url: process.env.AGENT_READY_URL,
		api: process.env.AGENT_READY_API,
		outDir: process.env.AGENT_READY_OUT_DIR,
		gateRegressions: truthy(process.env.AGENT_READY_GATE_REGRESSIONS, true),
		gateKnownFails: truthy(process.env.AGENT_READY_GATE_KNOWN_FAILS, false),
	};

	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		const next = argv[i + 1];
		if (token === "--url" && next) {
			args.url = next;
			i += 1;
		} else if (token === "--api" && next) {
			args.api = next;
			i += 1;
		} else if (token === "--out-dir" && next) {
			args.outDir = next;
			i += 1;
		} else if (token === "--gate-regressions") {
			args.gateRegressions = true;
		} else if (token === "--no-gate-regressions") {
			args.gateRegressions = false;
		} else if (token === "--gate-known-fails") {
			args.gateKnownFails = true;
		} else if (token === "--no-gate-known-fails") {
			args.gateKnownFails = false;
		}
	}

	return args;
}

async function loadBaseline() {
	const raw = await readFile(
		path.join(root, "scripts/agent-ready/baseline.json"),
		"utf8",
	);
	return JSON.parse(raw);
}

async function fetchWithRetry(url, init, attempts = 3) {
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			const response = await fetch(url, {
				...init,
				signal: AbortSignal.timeout(45_000),
			});
			if (response.status >= 500 && attempt < attempts) {
				await delay(1_000 * attempt);
				continue;
			}
			return response;
		} catch (error) {
			lastError = error;
			if (attempt < attempts) {
				await delay(1_000 * attempt);
				continue;
			}
		}
	}
	throw lastError ?? new Error(`fetch failed: ${url}`);
}

function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function fetchScanJson(apiUrl, siteUrl) {
	const response = await fetchWithRetry(apiUrl, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			accept: "application/json",
		},
		body: JSON.stringify({ url: siteUrl }),
	});
	const text = await response.text();
	if (!response.ok) {
		throw new Error(`scan API ${response.status}: ${text.slice(0, 400)}`);
	}
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`scan API returned non-JSON: ${text.slice(0, 400)}`);
	}
}

async function fetchScanAgentMarkdown(apiUrl, siteUrl) {
	const response = await fetchWithRetry(apiUrl, {
		method: "POST",
		headers: {
			"content-type": "application/json",
			accept: "text/markdown",
		},
		body: JSON.stringify({ url: siteUrl, format: "agent" }),
	});
	const text = await response.text();
	if (!response.ok) {
		throw new Error(`agent scan ${response.status}: ${text.slice(0, 400)}`);
	}
	return text;
}

async function probeMarkdown(baseUrl, pathname) {
	const url = new URL(pathname, `${baseUrl.replace(/\/+$/, "")}/`).href;
	const response = await fetchWithRetry(url, {
		headers: {
			accept: "text/markdown",
			"cache-control": "no-cache",
		},
	});
	return {
		path: pathname,
		url,
		status: response.status,
		contentType: response.headers.get("content-type") ?? "",
	};
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const baseline = await loadBaseline();
	const siteUrl = (args.url || baseline.scanUrl).replace(/\/+$/, "");
	const apiUrl = args.api || baseline.apiUrl;
	const outDir = args.outDir
		? path.resolve(args.outDir)
		: path.join(root, "agent-ready-results");

	await mkdir(outDir, { recursive: true });

	const scanJson = await fetchScanJson(apiUrl, siteUrl);
	const scan = evaluateScan(scanJson, baseline);
	scan.knownFailIssues = baseline.knownFailIssues ?? {};

	let agentMarkdown = "";
	try {
		agentMarkdown = await fetchScanAgentMarkdown(apiUrl, siteUrl);
	} catch (error) {
		agentMarkdown = `agent format fetch failed: ${error instanceof Error ? error.message : String(error)}`;
	}

	const markdown = [];
	for (const spec of baseline.markdownPaths ?? []) {
		const probe = await probeMarkdown(siteUrl, spec.path);
		markdown.push(evaluateMarkdownProbe(probe, spec.expectMarkdown));
	}

	const markdownRegressions = markdown.filter((row) => row.regression);
	const failJob = shouldFailJob({
		...scan,
		markdownRegressions,
		gateRegressions: args.gateRegressions,
		gateKnownFails: args.gateKnownFails,
	});

	const summary = renderSummary({
		scan,
		markdown,
		uiUrl: baseline.uiUrl,
		gateRegressions: args.gateRegressions,
		gateKnownFails: args.gateKnownFails,
	});
	const annotations = renderGithubAnnotations({ scan, markdown });

	await writeFile(
		path.join(outDir, "scan.json"),
		`${JSON.stringify(scanJson, null, 2)}\n`,
	);
	await writeFile(path.join(outDir, "scan.agent.md"), agentMarkdown);
	await writeFile(
		path.join(outDir, "markdown-probes.json"),
		`${JSON.stringify(markdown, null, 2)}\n`,
	);
	await writeFile(path.join(outDir, "summary.md"), summary);
	await writeFile(
		path.join(outDir, "result.json"),
		`${JSON.stringify(
			{
				url: siteUrl,
				scannedAt: scan.scannedAt,
				level: scan.level,
				levelName: scan.levelName,
				knownFails: scan.knownFails.map((row) => row.id),
				unexpectedFails: scan.unexpectedFails.map((row) => row.id),
				newlyPassing: scan.newlyPassing.map((row) => row.id),
				markdown,
				failJob,
			},
			null,
			2,
		)}\n`,
	);

	if (process.env.GITHUB_STEP_SUMMARY) {
		await writeFile(process.env.GITHUB_STEP_SUMMARY, summary, { flag: "a" });
	}

	for (const line of annotations) {
		console.log(line);
	}
	console.log(summary);

	if (failJob) {
		console.error(
			"[agent-ready] regression detected (unexpected scanner fail or markdown regression)",
		);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("[agent-ready] scan failed:", error);
	process.exit(2);
});
