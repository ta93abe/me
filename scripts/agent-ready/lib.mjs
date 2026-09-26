/**
 * Parse isitagentready scan JSON and Markdown content-negotiation probes.
 */

export const SUMMARY_MARKER = "<!-- agent-ready-scan -->";

/**
 * @param {Record<string, unknown> | null | undefined} checks
 * @param {string} [prefix]
 * @returns {{ id: string, status: string, message: string, details?: unknown }[]}
 */
export function flattenChecks(checks, prefix = "") {
	if (!checks || typeof checks !== "object") {
		return [];
	}

	const rows = [];
	for (const [key, value] of Object.entries(checks)) {
		const id = prefix ? `${prefix}.${key}` : key;
		if (
			value &&
			typeof value === "object" &&
			"status" in value &&
			"message" in value
		) {
			rows.push({
				id,
				status: String(value.status),
				message: String(value.message),
				details: value.details,
			});
			continue;
		}
		if (value && typeof value === "object") {
			rows.push(
				...flattenChecks(/** @type {Record<string, unknown>} */ (value), id),
			);
		}
	}
	return rows;
}

/**
 * @param {{ checks?: Record<string, unknown>, url?: string, targetUrl?: string, scannedAt?: string, level?: number, levelName?: string }} scan
 * @param {{ knownFailChecks?: string[], ignoreGroups?: string[] }} baseline
 */
export function evaluateScan(scan, baseline) {
	const knownFailChecks = new Set(baseline.knownFailChecks ?? []);
	const ignoreGroups = new Set(baseline.ignoreGroups ?? ["commerce"]);
	const checks = flattenChecks(scan.checks);

	/** @type {typeof checks} */
	const knownFails = [];
	/** @type {typeof checks} */
	const unexpectedFails = [];
	/** @type {typeof checks} */
	const newlyPassing = [];
	/** @type {typeof checks} */
	const passes = [];
	/** @type {typeof checks} */
	const ignored = [];
	/** @type {typeof checks} */
	const neutrals = [];

	for (const check of checks) {
		const group = check.id.split(".")[0];
		if (ignoreGroups.has(group)) {
			ignored.push(check);
			continue;
		}

		if (check.status === "fail") {
			if (knownFailChecks.has(check.id)) {
				knownFails.push(check);
			} else {
				unexpectedFails.push(check);
			}
			continue;
		}

		if (check.status === "pass") {
			passes.push(check);
			if (knownFailChecks.has(check.id)) {
				newlyPassing.push(check);
			}
			continue;
		}

		neutrals.push(check);
	}

	return {
		url: scan.url ?? scan.targetUrl ?? "",
		scannedAt: scan.scannedAt ?? "",
		level: scan.level ?? null,
		levelName: scan.levelName ?? "",
		checks,
		knownFails,
		unexpectedFails,
		newlyPassing,
		passes,
		ignored,
		neutrals,
	};
}

/**
 * @param {{ path: string, status: number, contentType?: string | null }} probe
 * @param {boolean} expectMarkdown
 */
export function evaluateAgentAuthProbe(probe) {
	const contentType = probe.contentType ?? "";
	const ok =
		probe.status === 200 && contentType.toLowerCase().includes("json");
	return {
		path: probe.path ?? "/agent/auth",
		status: probe.status,
		contentType,
		ok,
		regression: !ok,
	};
}

export function evaluateMarkdownProbe(probe, expectMarkdown) {
	const contentType = probe.contentType ?? "";
	const ok =
		probe.status === 200 && contentType.toLowerCase().includes("markdown");
	return {
		path: probe.path,
		status: probe.status,
		contentType,
		ok,
		expectMarkdown,
		regression: Boolean(expectMarkdown) && !ok,
		unexpectedPass: expectMarkdown === false && ok,
	};
}

/**
 * @param {{
 *   unexpectedFails?: unknown[],
 *   knownFails?: unknown[],
 *   markdownRegressions?: unknown[],
 *   gateRegressions?: boolean,
 *   gateKnownFails?: boolean,
 * }} input
 */
export function shouldFailJob(input) {
	const unexpectedFails = input.unexpectedFails ?? [];
	const knownFails = input.knownFails ?? [];
	const markdownRegressions = input.markdownRegressions ?? [];
	const agentAuthRegression = input.agentAuth?.regression === true;

	if (input.gateKnownFails && knownFails.length > 0) {
		return true;
	}
	if (
		input.gateRegressions &&
		(unexpectedFails.length > 0 ||
			markdownRegressions.length > 0 ||
			agentAuthRegression)
	) {
		return true;
	}
	return false;
}

/**
 * @param {{ status: string, id: string }} row
 */
function statusLabel(row) {
	return row.status;
}

/**
 * @param {{
 *   scan: ReturnType<typeof evaluateScan> & { knownFailIssues?: Record<string, string> },
 *   markdown: ReturnType<typeof evaluateMarkdownProbe>[],
 *   uiUrl: string,
 *   gateRegressions?: boolean,
 *   gateKnownFails?: boolean,
 * }} input
 */
export function renderSummary({
	scan,
	markdown,
	agentAuth,
	uiUrl,
	gateRegressions = true,
	gateKnownFails = false,
}) {
	const markdownRegressions = markdown.filter((row) => row.regression);
	const failJob = shouldFailJob({
		...scan,
		markdownRegressions,
		agentAuth,
		gateRegressions,
		gateKnownFails,
	});
	const issues = scan.knownFailIssues ?? {};

	const checkRows = [...scan.knownFails, ...scan.unexpectedFails]
		.map((row) => {
			const issue = issues[row.id] ? ` (${issues[row.id]})` : "";
			return `| \`${row.id}\` | ${statusLabel(row)} | ${escapeTable(row.message)}${issue} |`;
		})
		.join("\n");

	const markdownRows = markdown
		.map((row) => {
			const expected = row.expectMarkdown ? "markdown" : "html（TA-892）";
			const result = row.regression
				? "regression"
				: row.unexpectedPass
					? "improved"
					: row.ok
						? "pass"
						: "known miss";
			return `| \`${row.path}\` | ${expected} | \`${row.contentType || "(none)"}\` | ${result} |`;
		})
		.join("\n");

	const newlyPassing = scan.newlyPassing
		.map((row) => `- \`${row.id}\` が pass になった。baseline を更新できる`)
		.join("\n");

	return `${SUMMARY_MARKER}
## isitagentready

- 対象: ${scan.url}
- UI: ${uiUrl}
- scannedAt: ${scan.scannedAt || "(unknown)"}
- **Level ${scan.level ?? "?"} ${scan.levelName || ""}**

### スキャナ（トップ URL）

| チェック | 状態 | メッセージ |
| --- | --- | --- |
${checkRows || "| （fail なし） | | |"}

${gateKnownFails ? "既知の fail（`dnsAid` / `authMd` / `ard`）もゲートします。" : "既知の fail（`dnsAid` / `authMd` / `ard`）はゲートしません。"}以前 pass だったチェックが fail に戻ったら job を落とします。
${newlyPassing ? `\n### 新たに pass\n\n${newlyPassing}\n` : ""}
### Markdown content negotiation

| パス | 期待 | content-type | 結果 |
| --- | --- | --- | --- |
${markdownRows}

### POST /agent/auth（TA-968）

| 項目 | 値 |
| --- | --- |
| status | ${agentAuth?.status ?? "(not probed)"} |
| content-type | \`${agentAuth?.contentType || "(none)"}\` |
| 結果 | ${agentAuth?.regression ? "regression" : agentAuth?.ok ? "pass" : "fail"} |

### 判定

- 回帰チェック: ${scan.unexpectedFails.length + markdownRegressions.length + (agentAuth?.regression ? 1 : 0)} 件
- known fail: ${scan.knownFails.length} 件
- job: ${failJob ? "fail" : "success"}
`;
}

/**
 * @param {string} value
 */
function escapeTable(value) {
	return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

/**
 * @param {{
 *   scan: ReturnType<typeof evaluateScan>,
 *   markdown: ReturnType<typeof evaluateMarkdownProbe>[],
 * }} input
 */
export function renderGithubAnnotations({ scan, markdown, agentAuth }) {
	/** @type {string[]} */
	const lines = [];
	lines.push(
		`::notice title=isitagentready::Level ${scan.level ?? "?"} ${scan.levelName} (${scan.scannedAt})`,
	);

	for (const row of scan.knownFails) {
		lines.push(
			`::warning title=isitagentready::${row.id} failed: ${row.message}`,
		);
	}
	for (const row of scan.newlyPassing) {
		lines.push(
			`::notice title=isitagentready::${row.id} started passing; update baseline.json`,
		);
	}
	for (const row of scan.unexpectedFails) {
		lines.push(
			`::error title=isitagentready::${row.id} failed: ${row.message}`,
		);
	}
	if (agentAuth?.regression) {
		lines.push(
			`::error title=isitagentready::POST /agent/auth が ${agentAuth.status} ${agentAuth.contentType || "(none)"} を返した`,
		);
	}
	for (const row of markdown) {
		if (row.regression) {
			lines.push(
				`::error title=isitagentready::GET ${row.path} markdown が ${row.contentType || "(none)"} を返した`,
			);
			continue;
		}
		if (!row.expectMarkdown && !row.ok) {
			lines.push(
				`::warning title=isitagentready::GET ${row.path} markdown は ${row.contentType || "(none)"}（TA-892）`,
			);
		}
		if (row.unexpectedPass) {
			lines.push(
				`::notice title=isitagentready::GET ${row.path} が markdown を返し始めた。baseline を更新できる`,
			);
		}
	}
	return lines;
}
