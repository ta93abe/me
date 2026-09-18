import { describe, expect, it } from "vitest";

import { a2aAgentCard } from "../agent-card.ts";

const SITE_URL = "https://ta93abe.com";
const MCP_ENDPOINT = `${SITE_URL}/mcp`;
const A2A_HTTP_INTERFACE_TYPE =
	"https://a2a-protocol.org/schemas/interface/http-v1.json";

describe("a2aAgentCard", () => {
	const card = a2aAgentCard();

	it("stays discoverable as an Agent Card without an A2A RPC url", () => {
		expect(card.name).toBe("Takumi Abe / ta93abe");
		expect(card.version).toBe("1.0.0");
		expect(Object.hasOwn(card, "url")).toBe(false);
		expect(card.supportedInterfaces).toEqual([]);
	});

	it("does not advertise /mcp, the site origin, or A2A HTTP as a reachable interface", () => {
		expect(card.supportedInterfaces).toHaveLength(0);
		expect(card.url).toBeUndefined();
		for (const iface of card.supportedInterfaces) {
			expect(iface.url).not.toBe(MCP_ENDPOINT);
			expect(iface.url).not.toBe(SITE_URL);
			expect(iface.type).not.toBe(A2A_HTTP_INTERFACE_TYPE);
			expect(iface.protocolBinding).not.toBe("JSONRPC");
			expect(iface.protocolBinding).not.toBe("HTTP+JSON");
		}
	});

	it("tells agents to discover via MCP and llms.txt instead of A2A methods", () => {
		expect(card.description).toMatch(/MCP/i);
		expect(card.description).toMatch(/llms\.txt/);
		expect(card.description).toMatch(/A2A/i);

		const skill = card.skills.find((entry) => entry.id === "site-overview");
		expect(skill).toBeDefined();
		expect(skill?.description).toMatch(/MCP/i);
		expect(skill?.description).toMatch(/llms\.txt/);
	});
});
