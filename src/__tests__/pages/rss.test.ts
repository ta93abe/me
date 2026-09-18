import type { APIContext } from "astro";
import { describe, expect, it } from "vitest";

import { GET } from "../../pages/rss.xml.ts";

describe("GET /rss.xml", () => {
	it("sends Content-Signal and keeps the RSS content type", async () => {
		const response = await GET({
			site: new URL("https://ta93abe.com"),
		} as APIContext);

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"application/rss+xml; charset=utf-8",
		);
		expect(response.headers.get("Content-Signal")).toBe(
			"ai-train=no, search=yes, ai-input=yes",
		);
		expect(response.headers.get("Link")).toContain(
			'</llms.txt>; rel="describedby"',
		);

		const body = await response.text();
		expect(body).toContain('<rss version="2.0"');
		expect(body).toContain("<language>ja</language>");
	});
});
