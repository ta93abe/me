import { describe, expect, it } from "vitest";

import {
	A2A_HTTP_INTERFACE_TYPE,
	A2A_PATH,
	a2aAgentCard,
	a2aEndpoint,
	handleA2a,
} from "../a2a.ts";

const SITE_URL = "https://ta93abe.com";
const OVERVIEW = "# Takumi Abe / ta93abe\n\nPersonal portfolio site.";

function post(method: string, params?: Record<string, unknown>): Request {
	return new Request(`${SITE_URL}${A2A_PATH}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method,
			params,
		}),
	});
}

describe("a2a agent card", () => {
	it("points the A2A interface at /a2a, not /mcp", () => {
		const card = a2aAgentCard({
			url: SITE_URL,
			title: "Takumi Abe / ta93abe",
			description: "Personal portfolio site.",
		});
		const endpoint = a2aEndpoint(SITE_URL);

		expect(card.url).toBe(endpoint);
		expect(card.supportedInterfaces).toHaveLength(1);
		expect(card.supportedInterfaces[0]).toEqual({
			type: A2A_HTTP_INTERFACE_TYPE,
			url: endpoint,
			protocolBinding: "JSONRPC",
			protocolVersion: "1.0",
		});
		expect(card.url).not.toContain("/mcp");
		expect(card.supportedInterfaces[0].url).not.toContain("/mcp");
	});
});

describe("handleA2a", () => {
	it("describes the JSON-RPC endpoint on GET", async () => {
		const result = await handleA2a(
			new Request(`${SITE_URL}${A2A_PATH}`),
			async () => OVERVIEW,
		);

		expect(result.headers?.Allow).toBe("POST");
		expect(result.body).toMatchObject({
			name: "ta93abe.com A2A endpoint",
		});
	});

	it("answers message/send with the site overview", async () => {
		const result = await handleA2a(
			post("message/send", {
				message: {
					messageId: "client-msg",
					role: "user",
					parts: [{ kind: "text", text: "What is ta93abe.com?" }],
				},
			}),
			async () => OVERVIEW,
		);
		const body = result.body as {
			result: { kind: string; role: string; parts: { text: string }[] };
		};

		expect(body.result.kind).toBe("message");
		expect(body.result.role).toBe("agent");
		expect(body.result.parts[0]?.text).toBe(OVERVIEW);
	});

	it("answers SendMessage with an A2A 1.0 message wrapper", async () => {
		const result = await handleA2a(
			post("SendMessage", {
				message: {
					messageId: "client-msg",
					role: "ROLE_USER",
					parts: [{ text: "List the public sections." }],
				},
			}),
			async () => OVERVIEW,
		);
		const body = result.body as {
			result: {
				message: { role: string; parts: { text: string }[] };
			};
		};

		expect(body.result.message.role).toBe("ROLE_AGENT");
		expect(body.result.message.parts[0]?.text).toBe(OVERVIEW);
	});

	it("does not speak MCP methods", async () => {
		const result = await handleA2a(post("tools/list"), async () => OVERVIEW);
		const body = result.body as { error: { code: number; message: string } };

		expect(body.error.code).toBe(-32601);
		expect(body.error.message).toBe("Method not found");
	});

	it("rejects streaming because the card does not advertise it", async () => {
		const result = await handleA2a(
			post("message/stream", {
				message: {
					messageId: "client-msg",
					role: "user",
					parts: [{ kind: "text", text: "stream please" }],
				},
			}),
			async () => OVERVIEW,
		);
		const body = result.body as { error: { code: number } };

		expect(body.error.code).toBe(-32004);
	});

	it("returns Task not found when a client continues an unknown task", async () => {
		const result = await handleA2a(
			post("SendMessage", {
				message: {
					messageId: "client-msg",
					taskId: "missing-task",
					role: "ROLE_USER",
					parts: [{ text: "follow up" }],
				},
			}),
			async () => OVERVIEW,
		);
		const body = result.body as { error: { code: number } };

		expect(body.error.code).toBe(-32001);
	});
});
