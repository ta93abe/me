import { expect, test } from "@playwright/test";

const MIN_HSTS_MAX_AGE = 15_552_000; // 180 days — Lighthouse has-hsts baseline

function parseMaxAge(hsts: string | undefined): number | null {
	if (!hsts) {
		return null;
	}
	const match = hsts.match(/max-age=(\d+)/i);
	return match ? Number(match[1]) : null;
}

test.describe("Security headers", () => {
	test("public HTML and discovery routes send HSTS", async ({ request }) => {
		const paths = ["/", "/blog/", "/llms.txt", "/.well-known/security.txt"];

		for (const path of paths) {
			const response = await request.fetch(path, { maxRedirects: 0 });
			expect(response.ok(), path).toBeTruthy();
			const hsts = response.headers()["strict-transport-security"];
			expect(hsts, `${path} missing Strict-Transport-Security`).toBeTruthy();
			const maxAge = parseMaxAge(hsts);
			expect(maxAge, `${path} max-age`).not.toBeNull();
			expect(maxAge!, `${path} max-age too short`).toBeGreaterThanOrEqual(
				MIN_HSTS_MAX_AGE,
			);
			expect(hsts!.toLowerCase(), `${path} preload`).not.toContain("preload");
		}
	});
});
