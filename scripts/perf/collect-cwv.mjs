/**
 * Collect lab Core Web Vitals via Cloudflare Browser Run (CDP + Puppeteer).
 *
 * Env:
 *   CF_ACCOUNT_ID / CLOUDFLARE_ACCOUNT_ID
 *   CF_API_TOKEN / CLOUDFLARE_API_TOKEN  (Browser Rendering - Edit)
 *   PERF_BASE_URL  (default: https://ta93abe.com)
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "perf-results");

const accountId =
	process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "";
const apiToken =
	process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || "";
const baseUrl = (process.env.PERF_BASE_URL || "https://ta93abe.com").replace(
	/\/+$/,
	"",
);

function fail(message) {
	console.error(`[cwv] ${message}`);
	process.exit(1);
}

async function loadBudgets() {
	const raw = await readFile(path.join(root, "perf/budgets.json"), "utf8");
	return JSON.parse(raw);
}

async function collectPageMetrics(page, settleMs) {
	return page.evaluate(async (waitMs) => {
		await new Promise((resolve) => {
			if (document.readyState === "complete") {
				resolve(undefined);
				return;
			}
			window.addEventListener("load", () => resolve(undefined), { once: true });
		});

		await new Promise((r) => setTimeout(r, waitMs));

		const nav = performance.getEntriesByType("navigation")[0];
		const paints = performance.getEntriesByType("paint");
		const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
		const shiftEntries = performance.getEntriesByType("layout-shift");

		const fcp = paints.find((p) => p.name === "first-contentful-paint")?.startTime;
		const lcp = lcpEntries.at(-1)?.startTime;
		const cls = shiftEntries
			.filter((e) => !e.hadRecentInput)
			.reduce((sum, e) => sum + e.value, 0);
		const ttfb = nav?.responseStart;

		return {
			url: location.href,
			title: document.title,
			fcp: fcp ?? null,
			lcp: lcp ?? null,
			cls: Number(cls.toFixed(4)),
			ttfb: ttfb ?? null,
			domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
			loadEvent: nav?.loadEventEnd ?? null,
		};
	}, settleMs);
}

function checkBudgets(metrics, budgets) {
	const failures = [];
	const map = [
		["lcp", metrics.lcp, "ms"],
		["fcp", metrics.fcp, "ms"],
		["cls", metrics.cls, ""],
		["ttfb", metrics.ttfb, "ms"],
	];

	for (const [key, value, unit] of map) {
		const limit = budgets[key];
		if (limit == null || value == null) continue;
		if (value > limit) {
			failures.push(
				`${key}=${value}${unit} exceeds budget ${limit}${unit}`,
			);
		}
	}
	return failures;
}

async function main() {
	if (!accountId || !apiToken) {
		fail(
			"Set CF_ACCOUNT_ID and CF_API_TOKEN (Browser Rendering - Edit permission).",
		);
	}

	const config = await loadBudgets();
	const settleMs = config.browserRun?.settleMs ?? 5000;
	const navigationTimeoutMs =
		config.browserRun?.navigationTimeoutMs ?? 45_000;

	const browserWSEndpoint = `wss://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/devtools/browser?keep_alive=600000`;

	console.log(`[cwv] Connecting Browser Run CDP…`);
	const browser = await puppeteer.connect({
		browserWSEndpoint,
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
	});

	const results = [];
	const allFailures = [];

	try {
		for (const pathname of config.urls) {
			const url = `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
			const page = await browser.newPage();
			await page.setViewport({ width: 1350, height: 940, deviceScaleFactor: 1 });
			page.setDefaultNavigationTimeout(navigationTimeoutMs);

			console.log(`[cwv] Navigating ${url}`);
			await page.goto(url, { waitUntil: "networkidle2" });

			const metrics = await collectPageMetrics(page, settleMs);
			const failures = checkBudgets(metrics, config.budgets);
			results.push({ url, metrics, failures });

			const shotPath = path.join(
				outDir,
				`screenshot-${pathname.replaceAll("/", "_") || "home"}.png`,
			);
			await mkdir(outDir, { recursive: true });
			await page.screenshot({ path: shotPath, fullPage: false });
			console.log(
				`[cwv] ${pathname} LCP=${metrics.lcp?.toFixed?.(0) ?? "n/a"}ms CLS=${metrics.cls} FCP=${metrics.fcp?.toFixed?.(0) ?? "n/a"}ms`,
			);
			if (failures.length) {
				allFailures.push(...failures.map((f) => `${pathname}: ${f}`));
				for (const f of failures) console.error(`  ✗ ${f}`);
			} else {
				console.log("  ✓ within budgets");
			}

			await page.close();
		}
	} finally {
		await browser.disconnect();
	}

	await mkdir(outDir, { recursive: true });
	const reportPath = path.join(outDir, "browser-run-cwv.json");
	await writeFile(
		reportPath,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				baseUrl,
				budgets: config.budgets,
				results,
			},
			null,
			"\t",
		),
	);
	console.log(`[cwv] Wrote ${reportPath}`);

	if (allFailures.length) {
		fail(`Budget failures:\n${allFailures.map((f) => `- ${f}`).join("\n")}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
