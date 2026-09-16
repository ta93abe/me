export const MCP_CORS_ALLOW_ORIGIN = "*";
export const MCP_CORS_ALLOW_METHODS = "POST, GET, OPTIONS";
export const MCP_CORS_ALLOW_HEADERS =
	"Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID";
export const MCP_CORS_EXPOSE_HEADERS =
	"MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID";

export type McpServerInfo = {
	name: string;
	version: string;
};

export type McpJsonResponse = (
	request: Request,
	value: unknown,
	init?: ResponseInit,
) => Response;

export type McpHandlerOptions = {
	jsonResponse: McpJsonResponse;
	getSiteOverview: () => Promise<string>;
	serverInfo: McpServerInfo;
	endpointName: string;
};

export function applyMcpCorsHeaders(headers: Headers): void {
	headers.set("Access-Control-Allow-Origin", MCP_CORS_ALLOW_ORIGIN);
	headers.set("Access-Control-Allow-Methods", MCP_CORS_ALLOW_METHODS);
	headers.set("Access-Control-Allow-Headers", MCP_CORS_ALLOW_HEADERS);
	headers.set("Access-Control-Expose-Headers", MCP_CORS_EXPOSE_HEADERS);
}

export function withMcpCors(response: Response): Response {
	const headers = new Headers(response.headers);
	applyMcpCorsHeaders(headers);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function mcpPreflightResponse(): Response {
	const headers = new Headers();
	applyMcpCorsHeaders(headers);
	return new Response(null, {
		status: 204,
		headers,
	});
}

function mcpToolList() {
	return [
		{
			name: "get_site_overview",
			description:
				"Return a concise, read-only overview of ta93abe.com and its machine-readable discovery URLs.",
			inputSchema: {
				type: "object",
				properties: {},
				additionalProperties: false,
			},
		},
	];
}

export async function handleMcp(
	request: Request,
	options: McpHandlerOptions,
): Promise<Response> {
	const method = request.method.toUpperCase();

	if (method === "OPTIONS") {
		return mcpPreflightResponse();
	}

	const respond = (value: unknown, init: ResponseInit = {}): Response =>
		withMcpCors(options.jsonResponse(request, value, init));

	if (method !== "POST" && method !== "GET" && method !== "HEAD") {
		return respond(
			{
				error: "Method Not Allowed",
			},
			{
				status: 405,
				headers: {
					Allow: MCP_CORS_ALLOW_METHODS,
				},
			},
		);
	}

	if (method !== "POST") {
		return respond(
			{
				name: options.endpointName,
				description: "Send JSON-RPC 2.0 POST requests to use read-only tools.",
			},
			{
				headers: {
					Allow: MCP_CORS_ALLOW_METHODS,
				},
			},
		);
	}

	let payload: {
		id?: string | number | null;
		method?: string;
		params?: Record<string, unknown>;
		jsonrpc?: string;
	};

	try {
		payload = await request.json();
	} catch {
		return respond(
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

	const id = payload.id ?? null;

	if (payload.method === "initialize") {
		return respond({
			jsonrpc: "2.0",
			id,
			result: {
				protocolVersion: "2025-06-18",
				capabilities: {
					tools: {},
					resources: {},
				},
				serverInfo: options.serverInfo,
			},
		});
	}

	if (payload.method === "tools/list") {
		return respond({
			jsonrpc: "2.0",
			id,
			result: {
				tools: mcpToolList(),
			},
		});
	}

	if (payload.method === "tools/call") {
		const toolName = payload.params?.name;
		if (toolName !== "get_site_overview") {
			return respond({
				jsonrpc: "2.0",
				id,
				error: {
					code: -32602,
					message: "Unknown tool",
				},
			});
		}

		return respond({
			jsonrpc: "2.0",
			id,
			result: {
				content: [
					{
						type: "text",
						text: await options.getSiteOverview(),
					},
				],
			},
		});
	}

	return respond({
		jsonrpc: "2.0",
		id,
		error: {
			code: -32601,
			message: "Method not found",
		},
	});
}
