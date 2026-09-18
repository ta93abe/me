import { describe, expect, it } from "vitest";

import {
	A2A_ENDPOINT,
	A2A_PATH,
	A2A_PREFERRED_TRANSPORT,
	A2A_PROTOCOL_VERSION,
	a2aAgentCard,
	handleA2aRpc,
} from "../agent-card.ts";

const SITE_URL = "https://ta93abe.com";
const MCP_ENDPOINT = `${SITE_URL}/mcp`;

describe("a2aAgentCard", () => {
	const card = a2aAgentCard();

	it("uses the current A2A 0.3 fields current clients require", () => {
		expect(card.protocolVersion).toBe(A2A_PROTOCOL_VERSION);
		expect(card.preferredTransport).toBe(A2A_PREFERRED_TRANSPORT);
		expect(card.url).toBe(A2A_ENDPOINT);
		expect(card.securitySchemes).toEqual({});
		expect(card.security).toEqual([{}]);
	});

	it("does not keep the deprecated authentication.schemes shape", () => {
		expect(card).not.toHaveProperty("authentication");
	});

	it("does not advertise /mcp or the site origin as an A2A interface", () => {
		expect(card.url).not.toBe(MCP_ENDPOINT);
		expect(card.url).not.toBe(SITE_URL);
		expect(card.url).toBe(A2A_ENDPOINT);
		expect(card.supportedInterfaces.map((iface) => iface.url)).toEqual([
			A2A_ENDPOINT,
		]);
		expect(card.additionalInterfaces.map((iface) => iface.url)).toEqual([
			A2A_ENDPOINT,
		]);
		expect(JSON.stringify(card.supportedInterfaces)).not.toContain("/mcp");
		expect(JSON.stringify(card.additionalInterfaces)).not.toContain("/mcp");
	});

	it("declares a supportedInterfaces entry with protocolBinding", () => {
		expect(card.supportedInterfaces).toEqual([
			{
				url: A2A_ENDPOINT,
				protocolBinding: A2A_PREFERRED_TRANSPORT,
				protocolVersion: "0.3",
			},
		]);
	});

	it("uses MIME types for default input and output modes", () => {
		expect(card.defaultInputModes).toEqual(["text/plain"]);
		expect(card.defaultOutputModes).toEqual(["text/plain"]);
	});

	it("tells agents to discover via MCP and llms.txt and not to use /mcp as A2A", () => {
		expect(card.description).toMatch(/MCP/i);
		expect(card.description).toMatch(/llms\.txt/);
		expect(card.description).toContain(A2A_ENDPOINT);

		const skill = card.skills.find((entry) => entry.id === "site-overview");
		expect(skill).toBeDefined();
		expect(skill?.description).toMatch(/MCP/i);
		expect(skill?.description).toMatch(/llms\.txt/);
		expect(skill?.description).toContain(A2A_PATH);
	});
});

describe("handleA2aRpc", () => {
	it("answers message/send with a site overview message", () => {
		const result = handleA2aRpc(
			{
				jsonrpc: "2.0",
				id: 1,
				method: "message/send",
				params: {
					message: {
						role: "user",
						parts: [{ kind: "text", text: "What is this site?" }],
						messageId: "msg-1",
					},
				},
			},
			"# overview",
		);

		expect(result.status).toBe(200);
		expect(result.body).toEqual(
			expect.objectContaining({
				jsonrpc: "2.0",
				id: 1,
				result: expect.objectContaining({
					kind: "message",
					role: "agent",
					parts: [{ kind: "text", text: "# overview" }],
				}),
			}),
		);
	});

	it("does not treat MCP initialize as an A2A method", () => {
		const result = handleA2aRpc(
			{ jsonrpc: "2.0", id: "mcp", method: "initialize" },
			"# overview",
		);

		expect(result.body).toEqual({
			jsonrpc: "2.0",
			id: "mcp",
			error: { code: -32601, message: "Method not found" },
		});
	});
});
