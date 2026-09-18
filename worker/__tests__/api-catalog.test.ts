import { describe, expect, it } from "vitest";

import { buildApiCatalog } from "../api-catalog.ts";

const siteUrl = "https://ta93abe.com";

function itemHrefs(catalog: ReturnType<typeof buildApiCatalog>): string[] {
	return catalog.linkset.flatMap(
		(entry) => entry.item?.map((link) => link.href) ?? [],
	);
}

describe("RFC 9727 API catalog", () => {
	const catalog = buildApiCatalog(siteUrl);
	const [index, mcp, a2a] = catalog.linkset;

	it("lists individual services as item links on the catalog index", () => {
		expect(index.anchor).toBe(`${siteUrl}/.well-known/api-catalog`);
		expect(index.item).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ href: `${siteUrl}/mcp` }),
				expect.objectContaining({
					href: `${siteUrl}/.well-known/mcp/server-card.json`,
				}),
				expect.objectContaining({
					href: `${siteUrl}/.well-known/agent-card.json`,
				}),
				expect.objectContaining({
					href: `${siteUrl}/.well-known/agent-skills/index.json`,
				}),
			]),
		);
		expect(itemHrefs(catalog)).toHaveLength(4);
	});

	it("keeps MCP service-desc on the MCP item, not mixed with A2A", () => {
		expect(mcp.anchor).toBe(`${siteUrl}/mcp`);
		expect(mcp["service-desc"]).toEqual([
			{
				href: `${siteUrl}/.well-known/mcp/server-card.json`,
				type: "application/json",
			},
		]);
		expect(index["service-desc"]).toBeUndefined();
		expect(a2a["service-desc"]).toBeUndefined();
	});

	it("describes A2A with describedby instead of a second service-desc", () => {
		expect(a2a.anchor).toBe(`${siteUrl}/.well-known/agent-card.json`);
		expect(a2a.describedby).toEqual([
			{
				href: `${siteUrl}/.well-known/agent-card.json`,
				type: "application/json",
			},
		]);
	});
});
