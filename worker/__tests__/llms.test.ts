import { describe, expect, it } from "vitest";

import { buildSiteOverviewMarkdown } from "../content/llms.ts";

const ORIGIN = "https://ta93abe.com";
const A2A_AGENT_CARD_URL = `${ORIGIN}/.well-known/agent-card.json`;

function machineReadableSection(markdown: string): string {
	const match = markdown.split("## Machine-readable resources")[1];
	expect(match).toBeDefined();
	return match.split(/^## /m)[0];
}

describe("llms.txt machine-readable resources", () => {
	it("lists the A2A Agent Card as a markdown link", () => {
		const markdown = buildSiteOverviewMarkdown({
			siteUrl: ORIGIN,
			siteTitle: "Takumi Abe / ta93abe",
			siteDescription: "Personal portfolio site",
		});
		const section = machineReadableSection(markdown);

		const hrefs = [
			...section.matchAll(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g),
		].map((match) => match[1]);

		expect(section).toContain(`[A2A Agent Card](${A2A_AGENT_CARD_URL})`);
		expect(hrefs).toContain(A2A_AGENT_CARD_URL);
		expect(section).toContain(
			`- MCP server card: ${ORIGIN}/.well-known/mcp/server-card.json`,
		);
	});
});
