interface Env {
	ASSETS: Fetcher;
	DEPLOY_HOOK_URL: string;
}

const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";
const SITE_TITLE = "Takumi Abe / ta93abe";
const SITE_DESCRIPTION =
	"Personal portfolio site for Takumi Abe (ta93abe), including gallery pieces and projects, atelier studies, blog posts, slides, books, tools, and social links.";
const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";
const MCP_ENDPOINT = `${SITE_URL}/mcp`;
const AGENT_SKILL_PATH = "/.well-known/agent-skills/site-overview/SKILL.md";

const DISCOVERY_LINKS = [
	`</llms.txt>; rel="describedby"; type="text/plain"`,
	`</llms-full.txt>; rel="describedby"; type="text/plain"`,
	`</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
	`</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"`,
	`</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"`,
	`</.well-known/agent-card.json>; rel="service-desc"; type="application/json"`,
].join(", ");

// HTML ページの CSP は Astro security.csp（meta）に委譲。
// Worker 生成レスポンス（JSON / text）向けのベースラインのみ維持する。
const SECURITY_HEADERS = {
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy":
		"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
	// HTML ページの CSP は Astro security.csp（meta）と public/_headers に委譲。
	// Worker 生成レスポンス（JSON / text）向けのベースラインのみ維持する。
	"Content-Security-Policy":
		"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
} as const;

const SITE_OVERVIEW_MARKDOWN = `# ${SITE_TITLE}

${SITE_DESCRIPTION}

## Primary sections

- Gallery: ${SITE_URL}/gallery/
- Atelier: ${SITE_URL}/atelier/
- Blog: ${SITE_URL}/blog/
- Slides: ${SITE_URL}/slides/
- Bookshelf: ${SITE_URL}/bookshelf/
- Tools: ${SITE_URL}/tools/
- Links: ${SITE_URL}/links/

## Machine-readable resources

- llms.txt: ${SITE_URL}/llms.txt
- Full agent notes: ${SITE_URL}/llms-full.txt
- API catalog: ${SITE_URL}/.well-known/api-catalog
- MCP server card: ${SITE_URL}/.well-known/mcp/server-card.json
- Agent Skills index: ${SITE_URL}/.well-known/agent-skills/index.json
- Authentication notes: ${SITE_URL}/auth.md
`;

const LLMS_FULL_TEXT = `${SITE_OVERVIEW_MARKDOWN}
## Agent guidance

- This is a public content site. No authentication is required to read the public pages.
- Prefer canonical URLs on ${SITE_HOST}.
- Use the sitemap at ${SITE_URL}/sitemap-index.xml for crawl discovery.
- Respect robots.txt and Content-Signal directives.

## Content usage preference

Content-Signal: ${CONTENT_SIGNAL}
`;

const AUTH_MD = `# Auth.md

You are an agent. This service is a **public content site**. Reading public pages does not require authentication, registration, or paid credentials.

## Step 1 — Discover

Fetch Authorization Server and Protected Resource metadata:

\`\`\`http
GET ${SITE_URL}/.well-known/oauth-authorization-server
GET ${SITE_URL}/.well-known/oauth-protected-resource
\`\`\`

The Authorization Server metadata includes an \`agent_auth\` object. The \`skill\` field points back to this document.

## Step 2 — Pick a method

Supported identity type: **anonymous**.

No claim ceremony or long-lived credential is required to read public content. Prefer the anonymous path.

## Step 3 — Register

Call the registration endpoint declared in metadata:

\`\`\`http
POST ${SITE_URL}/agent/auth
Accept: application/json
\`\`\`

The response confirms anonymous public access. You may proceed without storing a secret.

## Step 4 — Claim ceremony

Not required for anonymous public read access.

## Step 5 — Use the credential

No bearer token is required for HTML pages, \`llms.txt\`, sitemap, or other public discovery documents on ${SITE_HOST}.

## Errors

- \`404\` — endpoint or resource does not exist
- \`405\` — unsupported HTTP method on \`/agent/auth\`

## Revocation

There is nothing to revoke for anonymous public read access.

## Public resources

- Homepage: ${SITE_URL}/
- Sitemap: ${SITE_URL}/sitemap-index.xml
- llms.txt: ${SITE_URL}/llms.txt
- API catalog: ${SITE_URL}/.well-known/api-catalog
- MCP server card: ${SITE_URL}/.well-known/mcp/server-card.json
- Agent skills: ${SITE_URL}/.well-known/agent-skills/index.json
- A2A Agent Card: ${SITE_URL}/.well-known/agent-card.json
`;

/** WorkOS auth.md / agent_auth block (shared by AS metadata + docs). */
function agentAuthMetadata() {
	return {
		skill: `${SITE_URL}/auth.md`,
		register_uri: `${SITE_URL}/agent/auth`,
		identity_types_supported: ["anonymous"],
		anonymous: {
			credential_types_supported: ["api_key"],
		},
	};
}

const AGENT_SKILL_MARKDOWN = `# Site Overview

Use this skill when an agent needs to understand or summarize ${SITE_HOST}.

## What this site contains

- Gallery exhibitions, creative pieces, and portfolio projects.
- Atelier studies and work-in-progress pieces.
- Technical blog posts.
- Public slide links.
- Bookshelf notes.
- Tool and social-link directories.

## How to use

1. Start with ${SITE_URL}/llms.txt for a concise overview.
2. Use ${SITE_URL}/sitemap-index.xml for URL discovery.
3. Respect robots.txt and Content-Signal preferences.
`;

function isHead(request: Request): boolean {
	return request.method.toUpperCase() === "HEAD";
}

function acceptsMarkdown(request: Request): boolean {
	return (
		request.headers.get("Accept")?.toLowerCase().includes("text/markdown") ??
		false
	);
}

function appendHeaderToken(value: string | null, token: string): string {
	if (!value) {
		return token;
	}

	const tokens = value
		.split(",")
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);

	return tokens.includes(token.toLowerCase()) ? value : `${value}, ${token}`;
}

function setGeneratedHeaders(headers: Headers): void {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		headers.set(name, value);
	}
	headers.set("Content-Signal", CONTENT_SIGNAL);
}

function textResponse(
	request: Request,
	body: string,
	contentType: string,
	init: ResponseInit = {},
): Response {
	const headers = new Headers(init.headers);
	headers.set("Content-Type", contentType);
	setGeneratedHeaders(headers);

	return new Response(isHead(request) ? null : body, {
		...init,
		headers,
	});
}

function jsonResponse(
	request: Request,
	value: unknown,
	init: ResponseInit = {},
): Response {
	return textResponse(
		request,
		JSON.stringify(value, null, 2),
		"application/json; charset=utf-8",
		init,
	);
}

function notFoundResponse(request: Request): Response {
	return textResponse(request, "Not Found", "text/plain; charset=utf-8", {
		status: 404,
	});
}

function addHomepageDiscoveryHeaders(
	request: Request,
	response: Response,
): Response {
	const url = new URL(request.url);
	if (url.pathname !== "/" && url.pathname !== "/index.html") {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.set(
		"Link",
		headers.get("Link")
			? `${headers.get("Link")}, ${DISCOVERY_LINKS}`
			: DISCOVERY_LINKS,
	);
	headers.set("Vary", appendHeaderToken(headers.get("Vary"), "Accept"));
	headers.set("Content-Signal", CONTENT_SIGNAL);

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

async function sha256Digest(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return `sha256:${[...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")}`;
}

function apiCatalog() {
	return {
		linkset: [
			{
				anchor: SITE_URL,
				"service-doc": [
					{
						href: `${SITE_URL}/llms.txt`,
						type: "text/plain",
					},
					{
						href: `${SITE_URL}/llms-full.txt`,
						type: "text/plain",
					},
					{
						href: `${SITE_URL}/auth.md`,
						type: "text/markdown",
					},
				],
				"auth-endpoint": [
					{
						href: `${SITE_URL}/agent/auth`,
						type: "application/json",
					},
				],
				"service-desc": [
					{
						href: `${SITE_URL}/.well-known/mcp/server-card.json`,
						type: "application/json",
					},
					{
						href: `${SITE_URL}/.well-known/agent-card.json`,
						type: "application/json",
					},
				],
				describedby: [
					{
						href: `${SITE_URL}/.well-known/agent-skills/index.json`,
						type: "application/json",
					},
				],
				status: [
					{
						href: SITE_URL,
					},
				],
			},
		],
	};
}

function mcpServerCard() {
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
		resources: [
			{
				name: "site_overview",
				uri: `${SITE_URL}/llms.txt`,
				mimeType: "text/plain",
				description: "Concise overview of the public site.",
			},
		],
	};
}

function a2aAgentCard() {
	return {
		name: SITE_TITLE,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
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
				type: "https://a2a-protocol.org/schemas/interface/http-v1.json",
				url: `${SITE_URL}/mcp`,
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

function oauthAuthorizationServer() {
	return {
		issuer: SITE_URL,
		// Public-read site: no interactive OAuth login or token minting.
		// Agents should follow agent_auth.register_uri instead.
		response_types_supported: ["none"],
		grant_types_supported: ["urn:workos:agent-auth:grant-type:claim"],
		token_endpoint_auth_methods_supported: ["none"],
		agent_auth: agentAuthMetadata(),
	};
}

function oauthProtectedResource() {
	return {
		resource: SITE_URL,
		authorization_servers: [
			`${SITE_URL}/.well-known/oauth-authorization-server`,
		],
		scopes_supported: ["public:read"],
		bearer_methods_supported: ["header"],
		resource_signing_alg_values_supported: [],
		agent_auth: {
			required: false,
			skill: `${SITE_URL}/auth.md`,
			description:
				"ta93abe.com is a public content site. No authentication is required to access public resources.",
		},
	};
}

function agentAuthRegisterResponse() {
	return {
		identity_type: "anonymous",
		credential_type: "api_key",
		api_key: "public",
		scopes: ["public:read"],
		note: "Public content on ta93abe.com requires no secret. This key is a no-op acknowledgment for agent_auth anonymous registration.",
		resources: {
			home: `${SITE_URL}/`,
			llms: `${SITE_URL}/llms.txt`,
			sitemap: `${SITE_URL}/sitemap-index.xml`,
		},
	};
}

async function agentSkillsIndex() {
	return {
		$schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
		skills: [
			{
				name: "site-overview",
				type: "skill-md",
				description:
					"Understand the public content, discovery files, and crawl preferences for ta93abe.com.",
				url: AGENT_SKILL_PATH,
				digest: await sha256Digest(AGENT_SKILL_MARKDOWN),
			},
		],
	};
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

async function handleMcp(request: Request): Promise<Response> {
	if (request.method.toUpperCase() !== "POST") {
		return jsonResponse(
			request,
			{
				name: `${SITE_HOST} MCP endpoint`,
				description: "Send JSON-RPC 2.0 POST requests to use read-only tools.",
			},
			{
				headers: {
					Allow: "POST",
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
		return jsonResponse(
			request,
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
		return jsonResponse(request, {
			jsonrpc: "2.0",
			id,
			result: {
				protocolVersion: "2025-06-18",
				capabilities: {
					tools: {},
					resources: {},
				},
				serverInfo: mcpServerCard().serverInfo,
			},
		});
	}

	if (payload.method === "tools/list") {
		return jsonResponse(request, {
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
			return jsonResponse(request, {
				jsonrpc: "2.0",
				id,
				error: {
					code: -32602,
					message: "Unknown tool",
				},
			});
		}

		return jsonResponse(request, {
			jsonrpc: "2.0",
			id,
			result: {
				content: [
					{
						type: "text",
						text: SITE_OVERVIEW_MARKDOWN,
					},
				],
			},
		});
	}

	return jsonResponse(request, {
		jsonrpc: "2.0",
		id,
		error: {
			code: -32601,
			message: "Method not found",
		},
	});
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname.replace(/\/+$/, "") || "/";

		if (
			request.method !== "GET" &&
			request.method !== "HEAD" &&
			pathname !== "/mcp"
		) {
			return env.ASSETS.fetch(request);
		}

		if (pathname === "/" && acceptsMarkdown(request)) {
			return textResponse(
				request,
				SITE_OVERVIEW_MARKDOWN,
				"text/markdown; charset=utf-8",
				{
					headers: {
						Link: DISCOVERY_LINKS,
						Vary: "Accept",
						"X-Markdown-Tokens": String(
							SITE_OVERVIEW_MARKDOWN.split(/\s+/).filter(Boolean).length,
						),
					},
				},
			);
		}

		if (pathname === "/llms.txt") {
			return textResponse(
				request,
				SITE_OVERVIEW_MARKDOWN,
				"text/plain; charset=utf-8",
			);
		}

		if (pathname === "/llms-full.txt") {
			return textResponse(request, LLMS_FULL_TEXT, "text/plain; charset=utf-8");
		}

		if (pathname === "/auth.md") {
			return textResponse(request, AUTH_MD, "text/markdown; charset=utf-8");
		}

		if (pathname === "/agent/auth") {
			const method = request.method.toUpperCase();
			if (method !== "GET" && method !== "POST" && method !== "HEAD") {
				return textResponse(
					request,
					"Method Not Allowed",
					"text/plain; charset=utf-8",
					{
						status: 405,
						headers: { Allow: "GET, POST, HEAD" },
					},
				);
			}
			return jsonResponse(request, agentAuthRegisterResponse());
		}

		if (pathname === "/.well-known/api-catalog") {
			return textResponse(
				request,
				JSON.stringify(apiCatalog(), null, 2),
				"application/linkset+json; charset=utf-8",
			);
		}

		if (
			pathname === "/.well-known/mcp/server-card.json" ||
			pathname === "/.well-known/mcp.json"
		) {
			return jsonResponse(request, mcpServerCard());
		}

		if (pathname === "/.well-known/agent-skills/index.json") {
			return jsonResponse(request, await agentSkillsIndex());
		}

		if (pathname === AGENT_SKILL_PATH.replace(/\/+$/, "")) {
			return textResponse(
				request,
				AGENT_SKILL_MARKDOWN,
				"text/markdown; charset=utf-8",
			);
		}

		if (pathname === "/.well-known/agent-card.json") {
			return jsonResponse(request, a2aAgentCard());
		}

		if (
			pathname === "/.well-known/oauth-authorization-server" ||
			pathname === "/.well-known/openid-configuration"
		) {
			return jsonResponse(request, oauthAuthorizationServer());
		}

		if (pathname === "/.well-known/oauth-protected-resource") {
			return jsonResponse(request, oauthProtectedResource());
		}

		if (pathname === "/mcp") {
			return handleMcp(request);
		}

		// Explicit 404 for optional discovery/protocol endpoints this site does not implement.
		if (
			pathname === "/.well-known/http-message-signatures-directory" ||
			pathname === "/.well-known/ucp" ||
			pathname === "/.well-known/acp.json" ||
			pathname === "/openapi.json" ||
			pathname === "/api/v1" ||
			pathname === "/api"
		) {
			return notFoundResponse(request);
		}

		const response = await env.ASSETS.fetch(request);
		return addHomepageDiscoveryHeaders(request, response);
	},

	async scheduled(_event, env): Promise<void> {
		try {
			const res = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
			if (!res.ok) {
				console.error(`deploy hook failed: ${res.status} ${await res.text()}`);
			}
		} catch (error) {
			console.error("deploy hook request failed", error);
		}
	},
} satisfies ExportedHandler<Env>;
