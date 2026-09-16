export function agentAuthRegisterResponse(siteUrl: string) {
	return {
		identity_type: "anonymous",
		credential_type: "api_key",
		api_key: "public",
		scopes: ["public:read"],
		note: "Public content on ta93abe.com requires no secret. This key is a no-op acknowledgment for agent_auth anonymous registration.",
		resources: {
			home: `${siteUrl}/`,
			llms: `${siteUrl}/llms.txt`,
			sitemap: `${siteUrl}/sitemap-index.xml`,
		},
	};
}

export function buildAuthMd(siteUrl: string, siteHost: string): string {
	const registerUri = `${siteUrl}/agent/auth`;
	const registration = JSON.stringify(
		agentAuthRegisterResponse(siteUrl),
		null,
		2,
	);

	return `# auth.md

You are an agent. This document is a **self-contained registration flow** for autonomous agents that want to read public content on ${siteHost}. Reading public pages does not require authentication, a paid credential, or a stored secret.

## Contract

Machine-readable registration contract. OAuth metadata is optional; this block is enough to complete the anonymous flow.

\`\`\`yaml
audience: agent
register_uri: ${registerUri}
http_methods:
  - POST
  - GET
  - HEAD
identity_types_supported: ["anonymous"]
anonymous:
  credential_types_supported:
    - api_key
\`\`\`

- Audience: autonomous agents (LLM assistants, crawlers, MCP/A2A clients)
- \`register_uri\`: \`${registerUri}\`
- Allowed methods: **POST** (GET and HEAD return the same JSON)
- Supported method: **anonymous**
- Credentials: not required for public read. Registration returns a no-op \`api_key\` (accept \`apiKey\`) value \`public\`.

## Register

No request body. No authentication.

\`\`\`http
POST /agent/auth HTTP/1.1
Host: ${siteHost}
Accept: application/json
\`\`\`

Response (200):

\`\`\`json
${registration}
\`\`\`

## Use the credential

Public HTML, \`llms.txt\`, sitemap, and other discovery documents on ${siteHost} do **not** require \`Authorization\`. The \`api_key\` / \`apiKey\` value \`public\` is an acknowledgment only; do not store a secret.

If a client still wants to send the no-op key:

\`\`\`http
GET /llms.txt HTTP/1.1
Host: ${siteHost}
Authorization: Bearer public
\`\`\`

That header is ignored. Proceed to public resources without a bearer token.

## Optional OAuth discovery

OAuth Protected Resource Metadata and Authorization Server metadata are published for agents that prefer RFC 8414 / RFC 9728. Those documents advertise the same \`register_uri\`. They are not required to complete this flow.

\`\`\`http
GET /.well-known/oauth-authorization-server HTTP/1.1
Host: ${siteHost}

GET /.well-known/oauth-protected-resource HTTP/1.1
Host: ${siteHost}
\`\`\`

The Authorization Server metadata includes an \`agent_auth\` object. The \`skill\` field points back to this document.

## Claim ceremony

Not required for anonymous public read access.

## Errors

- \`404\` — endpoint or resource does not exist
- \`405\` — unsupported HTTP method on \`/agent/auth\`

Allowed methods on \`/agent/auth\`: \`GET\`, \`POST\`, \`HEAD\`.

## Revocation

There is nothing to revoke for anonymous public read access.

## Public resources

- Homepage: ${siteUrl}/
- Sitemap: ${siteUrl}/sitemap-index.xml
- llms.txt: ${siteUrl}/llms.txt
- API catalog: ${siteUrl}/.well-known/api-catalog
- MCP server card: ${siteUrl}/.well-known/mcp/server-card.json
- Agent skills: ${siteUrl}/.well-known/agent-skills/index.json
- A2A Agent Card: ${siteUrl}/.well-known/agent-card.json
`;
}
