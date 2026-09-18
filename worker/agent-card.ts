const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";
const SITE_TITLE = "Takumi Abe / ta93abe";
const MCP_SERVER_CARD = `${SITE_URL}/.well-known/mcp/server-card.json`;
const LLMS_TXT = `${SITE_URL}/llms.txt`;

export const A2A_PATH = "/a2a";
export const A2A_PROTOCOL_VERSION = "0.3.0";
export const A2A_PREFERRED_TRANSPORT = "JSONRPC";
export const A2A_ENDPOINT = `${SITE_URL}${A2A_PATH}`;

export type AgentInterface = {
	type?: string;
	url?: string;
	protocolBinding?: string;
	protocolVersion?: string;
	transport?: string;
};

export type AgentSkill = {
	id: string;
	name: string;
	description: string;
	tags: string[];
	examples?: string[];
};

export type A2AAgentCard = {
	protocolVersion: string;
	name: string;
	description: string;
	url: string;
	preferredTransport: string;
	additionalInterfaces: { url: string; transport: string }[];
	provider: { organization: string; url: string };
	version: string;
	documentationUrl: string;
	capabilities: {
		streaming: boolean;
		pushNotifications: boolean;
		stateTransitionHistory: boolean;
		extendedAgentCard: boolean;
	};
	securitySchemes: Record<string, never>;
	security: Record<string, never>[];
	defaultInputModes: string[];
	defaultOutputModes: string[];
	supportedInterfaces: AgentInterface[];
	skills: AgentSkill[];
};

type JsonRpcId = string | number | null;

type A2aJsonResponse = (value: unknown, init?: ResponseInit) => Response;

export function a2aAgentCard(): A2AAgentCard {
	return {
		protocolVersion: A2A_PROTOCOL_VERSION,
		name: SITE_TITLE,
		description:
			`${SITE_TITLE} portfolio: blog posts, slides, tools, gadgets, and social links. ` +
			`A2A JSON-RPC is at ${A2A_ENDPOINT} (message/send). ` +
			"Do not send A2A methods to /mcp. " +
			`Discover content via MCP (${MCP_SERVER_CARD}) or ${LLMS_TXT}.`,
		url: A2A_ENDPOINT,
		preferredTransport: A2A_PREFERRED_TRANSPORT,
		additionalInterfaces: [
			{
				url: A2A_ENDPOINT,
				transport: A2A_PREFERRED_TRANSPORT,
			},
		],
		provider: {
			organization: SITE_TITLE,
			url: SITE_URL,
		},
		version: "1.0.0",
		documentationUrl: LLMS_TXT,
		capabilities: {
			streaming: false,
			pushNotifications: false,
			stateTransitionHistory: false,
			extendedAgentCard: false,
		},
		securitySchemes: {},
		security: [{}],
		defaultInputModes: ["text/plain"],
		defaultOutputModes: ["text/plain"],
		supportedInterfaces: [
			{
				url: A2A_ENDPOINT,
				protocolBinding: A2A_PREFERRED_TRANSPORT,
				protocolVersion: "0.3",
			},
		],
		skills: [
			{
				id: "site-overview",
				name: "Site Overview",
				description:
					"Provides a concise overview of the public sections and discovery URLs on ta93abe.com. " +
					`Use A2A message/send on ${A2A_PATH}, MCP tool get_site_overview, or GET /llms.txt. ` +
					"Do not send A2A methods such as message/send to /mcp.",
				tags: ["portfolio", "blog", "discovery", "mcp", "a2a"],
				examples: [
					"What is ta93abe.com?",
					"List the public sections of this site.",
				],
			},
		],
	};
}

function jsonRpcError(
	id: JsonRpcId,
	code: number,
	message: string,
): { jsonrpc: "2.0"; id: JsonRpcId; error: { code: number; message: string } } {
	return {
		jsonrpc: "2.0",
		id,
		error: { code, message },
	};
}

function siteOverviewMessage(overview: string) {
	return {
		kind: "message",
		role: "agent",
		messageId: crypto.randomUUID(),
		parts: [
			{
				kind: "text",
				text: overview,
			},
		],
	};
}

export function handleA2aRpc(
	payload: unknown,
	overview: string,
): { status: number; body: unknown } {
	if (
		payload === null ||
		typeof payload !== "object" ||
		Array.isArray(payload)
	) {
		return {
			status: 400,
			body: jsonRpcError(null, -32600, "Invalid Request"),
		};
	}

	const request = payload as {
		id?: JsonRpcId;
		method?: string;
	};
	const id = request.id ?? null;

	if (request.method === "message/send") {
		return {
			status: 200,
			body: {
				jsonrpc: "2.0",
				id,
				result: siteOverviewMessage(overview),
			},
		};
	}

	return {
		status: 200,
		body: jsonRpcError(id, -32601, "Method not found"),
	};
}

export async function handleA2a(
	request: Request,
	overview: string,
	jsonResponse: A2aJsonResponse,
): Promise<Response> {
	if (request.method.toUpperCase() !== "POST") {
		return jsonResponse(
			{
				name: `${SITE_HOST} A2A endpoint`,
				description:
					"Send JSON-RPC 2.0 POST requests. Supported method: message/send.",
				url: A2A_ENDPOINT,
				preferredTransport: A2A_PREFERRED_TRANSPORT,
			},
			{
				status: 405,
				headers: {
					Allow: "POST",
				},
			},
		);
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return jsonResponse(
			{
				jsonrpc: "2.0",
				id: null,
				error: {
					code: -32700,
					message: "Parse error",
				},
			},
			{ status: 400 },
		);
	}

	const result = handleA2aRpc(payload, overview);
	return jsonResponse(result.body, { status: result.status });
}
