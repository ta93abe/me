/**
 * Run Lighthouse (lab) against a local or remote base URL and enforce budgets.
 *
 * Env:
 *   PERF_BASE_URL  (default: http://127.0.0.1:4321)
 *   PERF_OUT_DIR   (default: perf-results)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = process.env.PERF_OUT_DIR
	? path.resolve(process.env.PERF_OUT_DIR)
	: path.join(root, "perf-results");

const baseUrl = (process.env.PERF_BASE_URL || "http://127.0.0.1:4321").replace(
	/\/+$/,
	"",
);

async function loadBudgets() {
	const raw = await readFile(path.join(root, "perf/budgets.json"), "utf8");
	return JSON.parse(raw);
}

function metricValue(audits, id) {
	const audit = audits[id];
	if (!audit || audit.numericValue == null) return null;
	return audit.numericValue;
}

function checkBudgets(audits, categories, budgets) {
	const failures = [];
	const score = categories.performance?.score;
	if (
		budgets.performanceScore != null &&
		score != null &&
		score < budgets.performanceScore
	) {
		failures.push(
			`performanceScore=${score.toFixed(2)} below budget ${budgets.performanceScore}`,
		);
	}

	const checks = [
		["lcp", "largest-contentful-paint", "ms"],
		["fcp", "first-contentful-paint", "ms"],
		["cls", "cumulative-layout-shift", ""],
		["tbt", "total-blocking-time", "ms"],
		["si", "speed-index", "ms"],
		["ttfb", "server-response-time", "ms"],
	];

	for (const [budgetKey, auditId, unit] of checks) {
		const limit = budgets[budgetKey];
		const value = metricValue(audits, auditId);
		if (limit == null || value == null) continue;
		if (value > limit) {
			failures.push(
				`${budgetKey}=${Math.round(value)}${unit} exceeds budget ${limit}${unit}`,
			);
		}
	}

	return failures;
}

async function main() {
	const config = await loadBudgets();
	await mkdir(outDir, { recursive: true });

	const chrome = await launch({
		chromePath: process.env.CHROME_PATH || undefined,
		chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
	});

	const summary = [];
	const allFailures = [];

	try {
		for (const pathname of config.urls) {
			const url = `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
			console.log(`[lh] Auditing ${url}`);

			// preview / localhost は実ネットワーク遅延がほぼ無いので、
			// mobile 3G シミュレーションではなく provided（スロットルなし）で計測し、
			// コード変更によるラボ指標のデグレを検知する。
			const result = await lighthouse(url, {
				port: chrome.port,
				output: ["json", "html"],
				logLevel: "error",
				onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
				formFactor: "desktop",
				screenEmulation: {
					mobile: false,
					width: 1350,
					height: 940,
					deviceScaleFactor: 1,
					disabled: false,
				},
				throttlingMethod: "provided",
			});

			if (!result?.lhr) {
				allFailures.push(`${pathname}: lighthouse returned no result`);
				continue;
			}

			const { lhr, report } = result;
			const slug = pathname.replaceAll("/", "_") || "home";
			const jsonPath = path.join(outDir, `lighthouse-${slug}.json`);
			const htmlPath = path.join(outDir, `lighthouse-${slug}.html`);

			await writeFile(jsonPath, JSON.stringify(lhr, null, "\t"));
			const html = Array.isArray(report) ? report[1] : report;
			if (typeof html === "string") {
				await writeFile(htmlPath, html);
			}

			const failures = checkBudgets(lhr.audits, lhr.categories, config.budgets);
			const row = {
				url,
				performanceScore: lhr.categories.performance?.score ?? null,
				lcp: metricValue(lhr.audits, "largest-contentful-paint"),
				fcp: metricValue(lhr.audits, "first-contentful-paint"),
				cls: metricValue(lhr.audits, "cumulative-layout-shift"),
				tbt: metricValue(lhr.audits, "total-blocking-time"),
				failures,
			};
			summary.push(row);

			console.log(
				`[lh] ${pathname} perf=${row.performanceScore?.toFixed(2)} LCP=${Math.round(row.lcp ?? 0)}ms CLS=${row.cls}`,
			);
			if (failures.length) {
				allFailures.push(...failures.map((f) => `${pathname}: ${f}`));
				for (const f of failures) console.error(`  ✗ ${f}`);
			} else {
				console.log("  ✓ within budgets");
			}
		}
	} finally {
		await chrome.kill();
	}

	const summaryPath = path.join(outDir, "lighthouse-summary.json");
	await writeFile(
		summaryPath,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				baseUrl,
				budgets: config.budgets,
				summary,
			},
			null,
			"\t",
		),
	);
	console.log(`[lh] Wrote ${summaryPath}`);

	if (allFailures.length) {
		console.error(
			`[lh] Budget failures:\n${allFailures.map((f) => `- ${f}`).join("\n")}`,
		);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
