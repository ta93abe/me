export const A2A_PATH = "/a2a";
export const A2A_PROTOCOL_VERSION = "0.3.0";
export const A2A_PREFERRED_TRANSPORT = "JSONRPC";

export type A2aCardInput = {
	siteUrl: string;
	name: string;
	description: string;
};

function a2aEndpoint(siteUrl: string): string {
	return `${siteUrl}${A2A_PATH}`;
}

/**
 * Agent Card for both A2A 0.3 clients (top-level protocolVersion / url /
 * preferredTransport / security) and 1.0 clients (supportedInterfaces).
 */
export function a2aAgentCard(input: A2aCardInput) {
	const url = a2aEndpoint(input.siteUrl);

	return {
		protocolVersion: A2A_PROTOCOL_VERSION,
		name: input.name,
		description: input.description,
		url,
		preferredTransport: A2A_PREFERRED_TRANSPORT,
		additionalInterfaces: [
			{
				url,
				transport: A2A_PREFERRED_TRANSPORT,
			},
		],
		provider: {
			organization: input.name,
			url: input.siteUrl,
		},
		version: "1.0.0",
		documentationUrl: `${input.siteUrl}/llms.txt`,
		capabilities: {
			streaming: false,
			pushNotifications: false,
			stateTransitionHistory: false,
			extendedAgentCard: false,
		},
		securitySchemes: {},
		// OpenAPI: an empty requirement object means no authentication.
		security: [{}],
		defaultInputModes: ["text/plain"],
		defaultOutputModes: ["text/plain"],
		supportedInterfaces: [
			{
				url,
				protocolBinding: A2A_PREFERRED_TRANSPORT,
				protocolVersion: "0.3",
			},
		],
		skills: [
			{
				id: "site-overview",
				name: "Site Overview",
				description:
					"Provides a concise overview of the public sections and discovery URLs on ta93abe.com.",
				tags: ["portfolio", "blog", "discovery"],
				examples: [
					"What is ta93abe.com?",
					"List the public sections of this site.",
				],
			},
		],
	};
}

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
	id?: JsonRpcId;
	method?: string;
	params?: Record<string, unknown>;
	jsonrpc?: string;
};

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

function newId(): string {
	return crypto.randomUUID();
}

function siteOverviewMessage(overview: string) {
	return {
		kind: "message",
		role: "agent",
		messageId: newId(),
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
	if (!payload || typeof payload !== "object") {
		return {
			status: 400,
			body: jsonRpcError(null, -32600, "Invalid Request"),
		};
	}

	const request = payload as JsonRpcRequest;
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
