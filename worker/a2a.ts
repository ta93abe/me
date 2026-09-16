export const A2A_PATH = "/a2a";
export const A2A_HTTP_INTERFACE_TYPE =
	"https://a2a-protocol.org/schemas/interface/http-v1.json";

const SEND_MESSAGE_METHODS = new Set(["SendMessage", "message/send"]);
const STREAMING_METHODS = new Set([
	"SendStreamingMessage",
	"message/stream",
	"SubscribeToTask",
	"tasks/resubscribe",
]);
const PUSH_CONFIG_METHODS = new Set([
	"CreateTaskPushNotificationConfig",
	"GetTaskPushNotificationConfig",
	"ListTaskPushNotificationConfigs",
	"DeleteTaskPushNotificationConfig",
	"tasks/pushNotificationConfig/set",
	"tasks/pushNotificationConfig/get",
	"tasks/pushNotificationConfig/list",
	"tasks/pushNotificationConfig/delete",
]);
const EXTENDED_CARD_METHODS = new Set([
	"GetExtendedAgentCard",
	"agent/getAuthenticatedExtendedCard",
]);
const GET_TASK_METHODS = new Set(["GetTask", "tasks/get"]);
const LIST_TASK_METHODS = new Set(["ListTasks", "tasks/list"]);
const CANCEL_TASK_METHODS = new Set(["CancelTask", "tasks/cancel"]);

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
	id?: JsonRpcId;
	method?: string;
	params?: Record<string, unknown>;
	jsonrpc?: string;
};

type A2aMessagePart = {
	kind?: string;
	text?: string;
};

type A2aInboundMessage = {
	messageId?: unknown;
	contextId?: unknown;
	taskId?: unknown;
	parts?: unknown;
};

export type A2aHandleResult = {
	body: unknown;
	status?: number;
	headers?: Record<string, string>;
};

export function a2aEndpoint(siteUrl: string): string {
	return `${siteUrl}${A2A_PATH}`;
}

export function a2aAgentCard(site: {
	url: string;
	title: string;
	description: string;
}) {
	const endpoint = a2aEndpoint(site.url);

	return {
		name: site.title,
		description: site.description,
		url: endpoint,
		version: "1.0.0",
		capabilities: {
			streaming: false,
			pushNotifications: false,
			stateTransitionHistory: false,
		},
		authentication: {
			schemes: ["none"],
		},
		defaultInputModes: ["text"],
		defaultOutputModes: ["text"],
		supportedInterfaces: [
			{
				type: A2A_HTTP_INTERFACE_TYPE,
				url: endpoint,
				protocolBinding: "JSONRPC",
				protocolVersion: "1.0",
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

export async function handleA2a(
	request: Request,
	getOverview: () => Promise<string>,
): Promise<A2aHandleResult> {
	if (request.method.toUpperCase() !== "POST") {
		const endpoint = new URL(request.url);
		endpoint.pathname = A2A_PATH;
		endpoint.search = "";
		endpoint.hash = "";

		return {
			body: {
				name: "ta93abe.com A2A endpoint",
				description:
					"Send A2A JSON-RPC 2.0 POST requests (SendMessage / message/send) for a read-only site overview.",
				url: endpoint.toString(),
			},
			headers: {
				Allow: "POST",
			},
		};
	}

	let payload: JsonRpcRequest;
	try {
		payload = await request.json();
	} catch {
		return {
			status: 400,
			body: jsonRpcError(null, -32700, "Parse error"),
		};
	}

	const id = payload.id ?? null;
	const method = payload.method ?? "";

	if (SEND_MESSAGE_METHODS.has(method)) {
		return sendMessage(id, method, payload.params, getOverview);
	}

	if (STREAMING_METHODS.has(method) || EXTENDED_CARD_METHODS.has(method)) {
		return {
			body: jsonRpcError(id, -32004, "Unsupported operation"),
		};
	}

	if (PUSH_CONFIG_METHODS.has(method)) {
		return {
			body: jsonRpcError(id, -32003, "Push notifications are not supported"),
		};
	}

	if (GET_TASK_METHODS.has(method) || CANCEL_TASK_METHODS.has(method)) {
		return {
			body: jsonRpcError(id, -32001, "Task not found"),
		};
	}

	if (LIST_TASK_METHODS.has(method)) {
		return {
			body: {
				jsonrpc: "2.0",
				id,
				result: {
					tasks: [],
					nextPageToken: "",
					pageSize: 50,
					totalSize: 0,
				},
			},
		};
	}

	return {
		body: jsonRpcError(id, -32601, "Method not found"),
	};
}

async function sendMessage(
	id: JsonRpcId,
	method: string,
	params: Record<string, unknown> | undefined,
	getOverview: () => Promise<string>,
): Promise<A2aHandleResult> {
	const inbound = inboundMessage(params);
	if (!inbound) {
		return {
			body: jsonRpcError(id, -32602, "Invalid parameters"),
		};
	}

	if (typeof inbound.taskId === "string" && inbound.taskId.length > 0) {
		return {
			body: jsonRpcError(id, -32001, "Task not found"),
		};
	}

	if (hasUnsupportedParts(inbound.parts)) {
		return {
			body: jsonRpcError(id, -32005, "Content type not supported"),
		};
	}

	const overview = await getOverview();
	const contextId =
		typeof inbound.contextId === "string" && inbound.contextId.length > 0
			? inbound.contextId
			: crypto.randomUUID();
	const messageId = crypto.randomUUID();

	if (method === "message/send") {
		return {
			body: {
				jsonrpc: "2.0",
				id,
				result: {
					kind: "message",
					messageId,
					contextId,
					role: "agent",
					parts: [{ kind: "text", text: overview }],
				},
			},
		};
	}

	return {
		body: {
			jsonrpc: "2.0",
			id,
			result: {
				message: {
					messageId,
					contextId,
					role: "ROLE_AGENT",
					parts: [{ text: overview }],
				},
			},
		},
	};
}

function inboundMessage(
	params: Record<string, unknown> | undefined,
): A2aInboundMessage | null {
	if (!params || typeof params !== "object") {
		return null;
	}

	const message = params.message;
	if (!message || typeof message !== "object") {
		return null;
	}

	return message as A2aInboundMessage;
}

function hasUnsupportedParts(parts: unknown): boolean {
	if (!Array.isArray(parts) || parts.length === 0) {
		return false;
	}

	return parts.some((part) => {
		if (!part || typeof part !== "object") {
			return true;
		}

		const candidate = part as A2aMessagePart & {
			data?: unknown;
			url?: unknown;
			file?: unknown;
			raw?: unknown;
		};
		const hasText = typeof candidate.text === "string";
		const hasNonText =
			candidate.data !== undefined ||
			candidate.url !== undefined ||
			candidate.file !== undefined ||
			candidate.raw !== undefined;
		const kind = candidate.kind;

		if (kind && kind !== "text") {
			return true;
		}

		return hasNonText && !hasText;
	});
}

function jsonRpcError(id: JsonRpcId, code: number, message: string) {
	return {
		jsonrpc: "2.0",
		id,
		error: {
			code,
			message,
		},
	};
}
