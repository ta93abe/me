const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";

export const MCP_ENDPOINT = `${SITE_URL}/mcp`;

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

function jsonRpcResult(
	jsonResponse: McpJsonResponse,
	id: JsonRpcId,
	result: unknown,
): Response {
	return jsonResponse({
		jsonrpc: "2.0",
		id,
		result,
	});
}

function jsonRpcError(
	jsonResponse: McpJsonResponse,
	id: JsonRpcId,
	code: number,
	message: string,
	data?: unknown,
	status?: number,
): Response {
	return jsonResponse(
		{
			jsonrpc: "2.0",
			id,
			error: data === undefined ? { code, message } : { code, message, data },
		},
		status === undefined ? undefined : { status },
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
	if (request.method.toUpperCase() !== "POST") {
		return jsonResponse(
			{
				name: `${SITE_HOST} MCP endpoint`,
				description:
					"Send JSON-RPC 2.0 POST requests to use read-only tools and resources.",
			},
			{
				headers: {
					Allow: "POST",
				},
			},
		);
	}

	let raw: unknown;

	try {
		raw = await request.json();
	} catch {
		return jsonRpcError(
			jsonResponse,
			null,
			-32700,
			"Parse error",
			undefined,
			400,
		);
	}

	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
		return jsonRpcError(
			jsonResponse,
			null,
			-32600,
			"Invalid Request",
			undefined,
			400,
		);
	}

	const payload = raw as {
		id?: JsonRpcId;
		method?: string;
		params?: Record<string, unknown>;
		jsonrpc?: string;
	};

	if (!Object.hasOwn(payload, "id")) {
		return new Response(null, { status: 202 });
	}

	const id = payload.id ?? null;

	if (payload.method === "initialize") {
		return jsonRpcResult(jsonResponse, id, {
			protocolVersion: "2025-06-18",
			capabilities: {
				tools: {},
				resources: {
					subscribe: false,
					listChanged: false,
				},
			},
			serverInfo: mcpServerCard().serverInfo,
		});
	}

	if (payload.method === "tools/list") {
		return jsonRpcResult(jsonResponse, id, {
			tools: mcpToolList(),
		});
	}

	if (payload.method === "tools/call") {
		const toolName = payload.params?.name;
		if (toolName !== "get_site_overview") {
			return jsonRpcError(jsonResponse, id, -32602, "Unknown tool");
		}

		return jsonRpcResult(jsonResponse, id, {
			content: [
				{
					type: "text",
					text: await content.siteOverviewMarkdown(),
				},
			],
		});
	}

	if (payload.method === "resources/list") {
		return jsonRpcResult(jsonResponse, id, {
			resources: mcpResources(),
		});
	}

	if (payload.method === "resources/templates/list") {
		return jsonRpcResult(jsonResponse, id, {
			resourceTemplates: [],
		});
	}

	if (payload.method === "resources/read") {
		const uri = payload.params?.uri;
		if (typeof uri !== "string" || uri.trim() === "") {
			return jsonRpcError(jsonResponse, id, -32602, "Invalid params", {
				reason: "uri is required",
			});
		}

		const resource = findResource(uri);
		if (!resource) {
			return jsonRpcError(jsonResponse, id, -32002, "Resource not found", {
				uri,
			});
		}

		return jsonRpcResult(jsonResponse, id, {
			contents: [
				{
					uri: resource.uri,
					name: resource.name,
					mimeType: resource.mimeType,
					text: await readResourceText(resource, content),
				},
			],
		});
	}

	return jsonRpcError(jsonResponse, id, -32601, "Method not found");
}
