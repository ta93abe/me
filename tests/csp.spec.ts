import { expect, type Page, test } from "@playwright/test";

const CSP_PAGES = [
	"/",
	"/about/",
	"/blog/snowflake-world-tour-tokyo-2026/",
] as const;

type CspViolation = {
	effectiveDirective: string;
	blockedURI: string;
	originalPolicy: string;
	sourceFile: string;
};

async function installCspViolationCollector(page: Page): Promise<void> {
	await page.addInitScript(() => {
		const store = window as Window & {
			collectedCspViolations?: CspViolation[];
		};
		store.collectedCspViolations = [];
		document.addEventListener("securitypolicyviolation", (event) => {
			store.collectedCspViolations?.push({
				effectiveDirective: event.effectiveDirective,
				blockedURI: event.blockedURI,
				originalPolicy: event.originalPolicy,
				sourceFile: event.sourceFile,
			});
		});
	});
}

async function gotoAndCollectCspViolations(
	page: Page,
	path: string,
): Promise<{ violations: CspViolation[]; csp: string }> {
	const response = await page.goto(path);
	expect(response, path).not.toBeNull();
	const csp = response?.headers()["content-security-policy"] ?? "";

	await page.waitForLoadState("domcontentloaded");
	const island = page.locator("astro-island").first();
	if ((await island.count()) > 0) {
		await island.waitFor({ state: "attached" });
		await page
			.waitForFunction(() => {
				const node = document.querySelector("astro-island");
				return Boolean(node && !node.hasAttribute("ssr"));
			})
			.catch(() => undefined);
	}

	if (path === "/") {
		await page
			.locator("[data-hero-shader] canvas")
			.waitFor({ state: "attached", timeout: 5_000 })
			.catch(() => undefined);
	}

	const violations = await page.evaluate(() => {
		return (
			(window as Window & { collectedCspViolations?: CspViolation[] })
				.collectedCspViolations ?? []
		);
	});

	return { violations, csp };
}

test.describe("CSP runtime styles", () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test(
		"major pages have no style-src-elem violations",
		{
			tag: "@smoke",
		},
		async ({ page }) => {
			await installCspViolationCollector(page);

			for (const path of CSP_PAGES) {
				const { violations, csp } = await gotoAndCollectCspViolations(
					page,
					path,
				);

				expect(csp, `${path} missing CSP`).toBeTruthy();
				expect(csp, `${path} style-src-elem unsafe-inline`).not.toMatch(
					/style-src-elem[^;]*'unsafe-inline'/,
				);
				expect(violations, path).toEqual([]);
			}
		},
	);
});
