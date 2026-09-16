const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_PROTOCOL_VERSIONS = [
	"2025-11-25",
	"2025-06-18",
	"2025-03-26",
] as const;
const SESSION_HEADER = "Mcp-Session-Id";
const PROTOCOL_VERSION_HEADER = "MCP-Protocol-Version";
const ALLOWED_METHODS = "POST";

export type McpServerInfo = {
	name: string;
	version: string;
};

export type McpContext = {
	serverInfo: McpServerInfo;
	siteOverview: () => Promise<string>;
};

type JsonRpcId = string | number;

type JsonRpcMessage = {
	jsonrpc?: unknown;
	id?: JsonRpcId | null;
	method?: unknown;
	params?: unknown;
	result?: unknown;
	error?: unknown;
};

function mediaTypes(header: string | null): string[] {
	if (!header) {
		return [];
	}

	return header
		.split(",")
		.map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "")
		.filter(Boolean);
}

function acceptsEventStream(request: Request): boolean {
	return mediaTypes(request.headers.get("Accept")).includes(
		"text/event-stream",
	);
}

function isJsonContentType(request: Request): boolean {
	const contentType = request.headers.get("Content-Type");
	return !contentType || contentType.toLowerCase().includes("application/json");
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonRpcRequest(
	message: JsonRpcMessage,
): message is JsonRpcMessage & { method: string } {
	return typeof message.method === "string" && "id" in message;
}

function isJsonRpcNotification(
	message: JsonRpcMessage,
): message is JsonRpcMessage & { method: string } {
	return typeof message.method === "string" && !("id" in message);
}

function jsonBody(value: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json; charset=utf-8");
	headers.set("Vary", "Accept");
	return new Response(JSON.stringify(value), {
		...init,
		headers,
	});
}

function methodNotAllowed(): Response {
	return jsonBody(
		{
			jsonrpc: "2.0",
			id: null,
			error: {
				code: -32000,
				message: "Method not allowed",
			},
		},
		{
			status: 405,
			headers: {
				Allow: ALLOWED_METHODS,
			},
		},
	);
}

function jsonRpcError(
	id: JsonRpcId | null,
	code: number,
	message: string,
	status = 200,
	extraHeaders?: HeadersInit,
): Response {
	return jsonBody(
		{
			jsonrpc: "2.0",
			id,
			error: { code, message },
		},
		{ status, headers: extraHeaders },
	);
}

function sseMessage(value: unknown): string {
	return `event: message\ndata: ${JSON.stringify(value)}\n\n`;
}

function rpcResponse(
	request: Request,
	payload: unknown,
	extraHeaders?: HeadersInit,
): Response {
	const headers = new Headers(extraHeaders);
	headers.set("Vary", "Accept");

	if (acceptsEventStream(request)) {
		headers.set("Content-Type", "text/event-stream");
		headers.set("Cache-Control", "no-cache");
		return new Response(sseMessage(payload), { headers });
	}

	headers.set("Content-Type", "application/json; charset=utf-8");
	return new Response(JSON.stringify(payload), { headers });
}

function rpcResult(
	request: Request,
	id: JsonRpcId | null,
	result: unknown,
	extraHeaders?: HeadersInit,
): Response {
	return rpcResponse(request, { jsonrpc: "2.0", id, result }, extraHeaders);
}

function rpcError(
	request: Request,
	id: JsonRpcId | null,
	code: number,
	message: string,
	extraHeaders?: HeadersInit,
): Response {
	return rpcResponse(
		request,
		{
			jsonrpc: "2.0",
			id,
			error: { code, message },
		},
		extraHeaders,
	);
}

function sessionIdFor(request: Request, isInitialize: boolean): string | null {
	const existing = request.headers.get(SESSION_HEADER)?.trim();
	if (existing) {
		return existing;
	}
	if (isInitialize) {
		return crypto.randomUUID();
	}
	return null;
}

function withSession(
	headers: HeadersInit | undefined,
	sessionId: string | null,
): Headers {
	const next = new Headers(headers);
	if (sessionId) {
		next.set(SESSION_HEADER, sessionId);
	}
	return next;
}

function unsupportedProtocolVersion(request: Request): Response | null {
	const version = request.headers.get(PROTOCOL_VERSION_HEADER);
	if (!version) {
		return null;
	}
	if (
		(SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(version.trim())
	) {
		return null;
	}
	return jsonRpcError(
		null,
		-32000,
		`Bad Request: Unsupported protocol version: ${version}`,
		400,
	);
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

function negotiateProtocolVersion(params: unknown): string {
	if (!isRecord(params) || typeof params.protocolVersion !== "string") {
		return PROTOCOL_VERSION;
	}
	return (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(
		params.protocolVersion,
	)
		? params.protocolVersion
		: PROTOCOL_VERSION;
}

async function handleJsonRpcRequest(
	request: Request,
	message: JsonRpcMessage & { method: string },
	ctx: McpContext,
	sessionId: string | null,
): Promise<Response> {
	const id = message.id ?? null;
	const headers = withSession(undefined, sessionId);

	if (message.method === "initialize") {
		return rpcResult(
			request,
			id,
			{
				protocolVersion: negotiateProtocolVersion(message.params),
				capabilities: {
					tools: {},
					resources: {},
				},
				serverInfo: ctx.serverInfo,
			},
			headers,
		);
	}

	if (message.method === "tools/list") {
		return rpcResult(request, id, { tools: mcpToolList() }, headers);
	}

	if (message.method === "tools/call") {
		const toolName =
			isRecord(message.params) && typeof message.params.name === "string"
				? message.params.name
				: undefined;
		if (toolName !== "get_site_overview") {
			return rpcError(request, id, -32602, "Unknown tool", headers);
		}

		return rpcResult(
			request,
			id,
			{
				content: [
					{
						type: "text",
						text: await ctx.siteOverview(),
					},
				],
			},
			headers,
		);
	}

	return rpcError(request, id, -32601, "Method not found", headers);
}

/**
 * Streamable HTTP MCP endpoint (spec 2025-06-18).
 *
 * POST JSON-RPC requests reply as `text/event-stream` when the client Accept
 * lists that type, otherwise as `application/json`. Notifications and client
 * responses return 202. GET does not open a standalone SSE stream (405).
 */
export async function handleMcp(
	request: Request,
	ctx: McpContext,
): Promise<Response> {
	const method = request.method.toUpperCase();
	if (method !== "POST") {
		return methodNotAllowed();
	}

	const protocolError = unsupportedProtocolVersion(request);
	if (protocolError) {
		return protocolError;
	}

	if (!isJsonContentType(request)) {
		return jsonRpcError(
			null,
			-32000,
			"Unsupported Media Type: Content-Type must be application/json",
			415,
		);
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return jsonRpcError(null, -32700, "Parse error", 400);
	}

	if (Array.isArray(payload) || !isRecord(payload)) {
		return jsonRpcError(
			null,
			-32600,
			"Invalid Request: Streamable HTTP requires a single JSON-RPC message",
			400,
		);
	}

	const message = payload as JsonRpcMessage;

	if (isJsonRpcNotification(message) || !("method" in message)) {
		return new Response(null, {
			status: 202,
			headers: withSession(undefined, sessionIdFor(request, false)),
		});
	}

	if (!isJsonRpcRequest(message)) {
		return jsonRpcError(null, -32600, "Invalid Request", 400);
	}

	const sessionId = sessionIdFor(request, message.method === "initialize");
	return handleJsonRpcRequest(request, message, ctx, sessionId);
}
