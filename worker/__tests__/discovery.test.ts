import { describe, expect, it } from "vitest";

import { DISCOVERY_LINKS } from "../discovery.ts";

function parseLinkHeader(header: string): Array<{
	href: string;
	rel: string;
	type?: string;
}> {
	return header.split(/,\s*(?=<)/).map((entry) => {
		const href = /<([^>]+)>/.exec(entry)?.[1];
		const rel = /rel="([^"]+)"/.exec(entry)?.[1];
		const type = /type="([^"]+)"/.exec(entry)?.[1];
		if (!href || !rel) {
			throw new Error(`invalid Link entry: ${entry}`);
		}
		return { href, rel, type };
	});
}

describe("homepage discovery Link header", () => {
	const links = parseLinkHeader(DISCOVERY_LINKS);

	it("includes auth.md as describedby markdown", () => {
		expect(links).toContainEqual({
			href: "/auth.md",
			rel: "describedby",
			type: "text/markdown",
		});
	});

	it("keeps existing discovery relations for isitagentready", () => {
		expect(links).toEqual(
			expect.arrayContaining([
				{
					href: "/llms.txt",
					rel: "describedby",
					type: "text/plain",
				},
				{
					href: "/llms-full.txt",
					rel: "describedby",
					type: "text/plain",
				},
				{
					href: "/.well-known/api-catalog",
					rel: "api-catalog",
					type: "application/linkset+json",
				},
				{
					href: "/.well-known/mcp/server-card.json",
					rel: "service-desc",
					type: "application/json",
				},
				{
					href: "/.well-known/agent-skills/index.json",
					rel: "describedby",
					type: "application/json",
				},
				{
					href: "/.well-known/agent-card.json",
					rel: "service-desc",
					type: "application/json",
				},
			]),
		);
	});
});
