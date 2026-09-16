const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";

export const MCP_ENDPOINT = `${SITE_URL}/mcp`;

export function mcpResources() {
	return [
		{
			name: "site_overview",
			uri: `${SITE_URL}/llms.txt`,
			mimeType: "text/plain",
			description: "Concise overview of the public site.",
		},
	];
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

export function findMcpTool(name: unknown) {
	if (typeof name !== "string") {
		return undefined;
	}

	return mcpToolList().find((tool) => tool.name === name);
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
