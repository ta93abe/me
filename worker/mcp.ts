const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";
const SESSION_HEADER = "Mcp-Session-Id";

export const MCP_ENDPOINT = `${SITE_URL}/mcp`;

export const MCP_CORS_ALLOW_ORIGIN = "*";
export const MCP_CORS_ALLOW_METHODS = "POST, GET, OPTIONS";
export const MCP_CORS_ALLOW_HEADERS =
	"Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID";
export const MCP_CORS_EXPOSE_HEADERS =
	"MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID";

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

export type McpJsonResponse = (value: unknown, init?: ResponseInit) => Response;

export type McpSiteContent = {
	siteOverviewMarkdown: () => Promise<string>;
	llmsFullText: () => Promise<string>;
};

type JsonRpcId = string | number | null;

type McpResource = {
	name: string;
	uri: string;
	mimeType: string;
	description: string;
};

function normalizeResourceUri(uri: string): string {
	return uri.trim().replace(/\/+$/, "");
}

export function mcpResources(): McpResource[] {
	return [
		{
			name: "site_overview",
			uri: `${SITE_URL}/llms.txt`,
			mimeType: "text/plain",
			description: "Concise overview of the public site.",
		},
		{
			name: "site_overview_full",
			uri: `${SITE_URL}/llms-full.txt`,
			mimeType: "text/plain",
			description:
				"Fuller agent notes, including crawl and Content-Signal guidance.",
		},
	];
}

export function mcpServerCard() {
	return {
		serverInfo: {
			name: `${SITE_HOST} site discovery`,
			version: "1.0.0",
		},
		description:
			"Read-only discovery endpoint for the public ta93abe.com portfolio site.",
		url: MCP_ENDPOINT,
		transport: {
			type: "streamable-http",
		},
		capabilities: {
			tools: true,
			resources: true,
		},
		tools: mcpToolList(),
		resources: mcpResources(),
	};
}

export function mcpToolList() {
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

export const SITE_OVERVIEW = {
	site: `${SITE_URL}/`,
	sections: [
		`${SITE_URL}/about/`,
		`${SITE_URL}/works/`,
		`${SITE_URL}/blog/`,
		`${SITE_URL}/contact/`,
		`${SITE_URL}/slides/`,
		`${SITE_URL}/talks/`,
		`${SITE_URL}/tools/`,
		`${SITE_URL}/gadgets/`,
		`${SITE_URL}/links/`,
	],
	discovery: {
		llms: `${SITE_URL}/llms.txt`,
		apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
		mcpServerCard: `${SITE_URL}/.well-known/mcp/server-card.json`,
		agentSkills: `${SITE_URL}/.well-known/agent-skills/index.json`,
		agentCard: `${SITE_URL}/.well-known/agent-card.json`,
		auth: `${SITE_URL}/auth.md`,
	},
} as const;

export function getSiteOverview() {
	return {
		...SITE_OVERVIEW,
		sections: [...SITE_OVERVIEW.sections],
		discovery: { ...SITE_OVERVIEW.discovery },
	};
}

export function mcpGetSiteOverviewResult(markdown: string) {
	return {
		content: [
			{
				type: "text" as const,
				text: markdown,
			},
		],
		structuredContent: getSiteOverview(),
	};
}

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

function sseMessage(value: unknown): string {
	return `event: message\ndata: ${JSON.stringify(value)}\n\n`;
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

function withSessionAndVary(
	headers: HeadersInit | undefined,
	sessionId: string | null,
): Headers {
	const next = withSession(headers, sessionId);
	next.set("Vary", "Accept");
	return next;
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

function rpcResponse(
	request: Request,
	jsonResponse: McpJsonResponse,
	payload: unknown,
	sessionId: string | null,
	init?: ResponseInit,
): Response {
	const headers = withSessionAndVary(init?.headers, sessionId);

	if (acceptsEventStream(request)) {
		headers.set("Content-Type", "text/event-stream");
		headers.set("Cache-Control", "no-cache");
		return withMcpCors(
			new Response(sseMessage(payload), {
				status: init?.status,
				headers,
			}),
		);
	}

	return withMcpCors(jsonResponse(payload, { ...init, headers }));
}

function jsonRpcResult(
	request: Request,
	jsonResponse: McpJsonResponse,
	id: JsonRpcId,
	result: unknown,
	sessionId: string | null,
): Response {
	return rpcResponse(
		request,
		jsonResponse,
		{
			jsonrpc: "2.0",
			id,
			result,
		},
		sessionId,
	);
}

function jsonRpcError(
	request: Request,
	jsonResponse: McpJsonResponse,
	id: JsonRpcId,
	code: number,
	message: string,
	sessionId: string | null,
	data?: unknown,
	status?: number,
): Response {
	return rpcResponse(
		request,
		jsonResponse,
		{
			jsonrpc: "2.0",
			id,
			error: data === undefined ? { code, message } : { code, message, data },
		},
		sessionId,
		status === undefined ? undefined : { status },
	);
}

function transportError(
	jsonResponse: McpJsonResponse,
	id: JsonRpcId,
	code: number,
	message: string,
	status?: number,
): Response {
	return withMcpCors(
		jsonResponse(
			{
				jsonrpc: "2.0",
				id,
				error: { code, message },
			},
			status === undefined ? undefined : { status },
		),
	);
}

function findResource(uri: string): McpResource | undefined {
	const normalized = normalizeResourceUri(uri);
	return mcpResources().find(
		(resource) => normalizeResourceUri(resource.uri) === normalized,
	);
}

async function readResourceText(
	resource: McpResource,
	content: McpSiteContent,
): Promise<string> {
	if (resource.name === "site_overview_full") {
		return content.llmsFullText();
	}
	return content.siteOverviewMarkdown();
}

export async function handleMcp(
	request: Request,
	content: McpSiteContent,
	jsonResponse: McpJsonResponse,
): Promise<Response> {
	const method = request.method.toUpperCase();

	if (method === "OPTIONS") {
		return mcpPreflightResponse();
	}

	if (method !== "POST") {
		// Streamable HTTP: GET is optional SSE. This read-only server does not
		// stream, so unsupported methods (including GET) are 405.
		return withMcpCors(
			new Response("Method Not Allowed", {
				status: 405,
				headers: {
					Allow: "POST",
					"Content-Type": "text/plain; charset=utf-8",
				},
			}),
		);
	}

	let raw: unknown;

	try {
		raw = await request.json();
	} catch {
		return transportError(jsonResponse, null, -32700, "Parse error", 400);
	}

	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
		return transportError(jsonResponse, null, -32600, "Invalid Request", 400);
	}

	const payload = raw as {
		id?: JsonRpcId;
		method?: string;
		params?: Record<string, unknown>;
		jsonrpc?: string;
	};

	if (!Object.hasOwn(payload, "id")) {
		return withMcpCors(
			new Response(null, {
				status: 202,
				headers: withSession(undefined, sessionIdFor(request, false)),
			}),
		);
	}

	const id = payload.id ?? null;
	const sessionId = sessionIdFor(request, payload.method === "initialize");

	if (payload.method === "initialize") {
		return jsonRpcResult(
			request,
			jsonResponse,
			id,
			{
				protocolVersion: "2025-06-18",
				capabilities: {
					tools: {},
					resources: {
						subscribe: false,
						listChanged: false,
					},
				},
				serverInfo: mcpServerCard().serverInfo,
			},
			sessionId,
		);
	}

	if (payload.method === "tools/list") {
		return jsonRpcResult(
			request,
			jsonResponse,
			id,
			{
				tools: mcpToolList(),
			},
			sessionId,
		);
	}

	if (payload.method === "tools/call") {
		const toolName = payload.params?.name;
		if (toolName !== "get_site_overview") {
			return jsonRpcError(
				request,
				jsonResponse,
				id,
				-32602,
				"Unknown tool",
				sessionId,
			);
		}

		return jsonRpcResult(
			request,
			jsonResponse,
			id,
			mcpGetSiteOverviewResult(await content.siteOverviewMarkdown()),
			sessionId,
		);
	}

	if (payload.method === "resources/list") {
		return jsonRpcResult(
			request,
			jsonResponse,
			id,
			{
				resources: mcpResources(),
			},
			sessionId,
		);
	}

	if (payload.method === "resources/templates/list") {
		return jsonRpcResult(
			request,
			jsonResponse,
			id,
			{
				resourceTemplates: [],
			},
			sessionId,
		);
	}

	if (payload.method === "resources/read") {
		const uri = payload.params?.uri;
		if (typeof uri !== "string" || uri.trim() === "") {
			return jsonRpcError(
				request,
				jsonResponse,
				id,
				-32602,
				"Invalid params",
				sessionId,
				{
					reason: "uri is required",
				},
			);
		}

		const resource = findResource(uri);
		if (!resource) {
			return jsonRpcError(
				request,
				jsonResponse,
				id,
				-32002,
				"Resource not found",
				sessionId,
				{
					uri,
				},
			);
		}

		return jsonRpcResult(
			request,
			jsonResponse,
			id,
			{
				contents: [
					{
						uri: resource.uri,
						name: resource.name,
						mimeType: resource.mimeType,
						text: await readResourceText(resource, content),
					},
				],
			},
			sessionId,
		);
	}

	return jsonRpcError(
		request,
		jsonResponse,
		id,
		-32601,
		"Method not found",
		sessionId,
	);
}
