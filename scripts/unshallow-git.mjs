/**
 * Cloudflare Workers Builds などは git clone --depth=1 のため、
 * `git log -- <path>` が全ファイルで HEAD 時刻を返す。sitemap lastmod の前に履歴を戻す。
 * 失敗してもビルドは止めない。
 */
import { execFileSync } from "node:child_process";

function git(args, options = {}) {
	return execFileSync("git", args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		...options,
	}).trim();
}

let shallow;
try {
	shallow = git(["rev-parse", "--is-shallow-repository"]);
} catch {
	console.log("[unshallow-git] not a git repository; skipping");
	process.exit(0);
}

console.log(
	`[unshallow-git] git rev-parse --is-shallow-repository: ${shallow}`,
);

if (shallow !== "true") {
	process.exit(0);
}

try {
	git(["fetch", "--unshallow"]);
	const after = git(["rev-parse", "--is-shallow-repository"]);
	console.log(
		`[unshallow-git] git fetch --unshallow: ok (is-shallow-repository: ${after})`,
	);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.warn(`[unshallow-git] git fetch --unshallow failed: ${message}`);
}
