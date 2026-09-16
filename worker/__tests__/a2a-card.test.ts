import { describe, expect, it } from "vitest";

import {
	A2A_PATH,
	A2A_PREFERRED_TRANSPORT,
	A2A_PROTOCOL_VERSION,
	a2aAgentCard,
	handleA2aRpc,
} from "../a2a.ts";

const SITE_URL = "https://ta93abe.com";
const card = a2aAgentCard({
	siteUrl: SITE_URL,
	name: "Takumi Abe / ta93abe",
	description: "Personal portfolio site.",
});

describe("a2aAgentCard", () => {
	it("uses the current A2A 0.3 fields current clients require", () => {
		expect(card.protocolVersion).toBe(A2A_PROTOCOL_VERSION);
		expect(card.preferredTransport).toBe(A2A_PREFERRED_TRANSPORT);
		expect(card.url).toBe(`${SITE_URL}${A2A_PATH}`);
		expect(card.securitySchemes).toEqual({});
		expect(card.security).toEqual([{}]);
	});

	it("does not keep the deprecated authentication.schemes shape", () => {
		expect(card).not.toHaveProperty("authentication");
	});

	it("does not advertise /mcp as an A2A HTTP interface", () => {
		const serialized = JSON.stringify(card);
		expect(serialized).not.toContain("/mcp");
		expect(card.url).not.toBe(SITE_URL);
		expect(card.supportedInterfaces[0]?.url).toBe(`${SITE_URL}${A2A_PATH}`);
		expect(card.additionalInterfaces[0]?.url).toBe(`${SITE_URL}${A2A_PATH}`);
	});

	it("declares a v1.0 supportedInterfaces entry with protocolBinding", () => {
		expect(card.supportedInterfaces).toEqual([
			{
				url: `${SITE_URL}${A2A_PATH}`,
				protocolBinding: A2A_PREFERRED_TRANSPORT,
				protocolVersion: "0.3",
			},
		]);
	});

	it("uses MIME types for default input and output modes", () => {
		expect(card.defaultInputModes).toEqual(["text/plain"]);
		expect(card.defaultOutputModes).toEqual(["text/plain"]);
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
