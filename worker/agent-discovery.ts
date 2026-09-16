/** WorkOS auth.md / agent_auth block (shared by AS metadata + docs). */
export function agentAuthMetadata(siteUrl: string) {
	return {
		skill: `${siteUrl}/auth.md`,
		register_uri: `${siteUrl}/agent/auth`,
		identity_types_supported: ["anonymous"],
		anonymous: {
			credential_types_supported: ["none"],
		},
	};
}

export function agentAuthRegisterResponse(siteUrl: string) {
	return {
		identity_type: "anonymous",
		credential_type: "none",
		scopes: ["public:read"],
		note: "Public content on ta93abe.com requires no authentication, secret, or bearer token.",
		resources: {
			home: `${siteUrl}/`,
			llms: `${siteUrl}/llms.txt`,
			sitemap: `${siteUrl}/sitemap-index.xml`,
		},
	};
}

export function buildAuthMd(siteUrl: string, siteHost: string): string {
	return `# Auth.md

You are an agent. This service is a **public content site**. Reading public pages does not require authentication, registration, or paid credentials.

## Step 1 — Discover

Fetch Authorization Server and Protected Resource metadata:

\`\`\`http
GET ${siteUrl}/.well-known/oauth-authorization-server
GET ${siteUrl}/.well-known/oauth-protected-resource
\`\`\`

The Authorization Server metadata includes an \`agent_auth\` object. The \`skill\` field points back to this document.

## Step 2 — Pick a method

Supported identity type: **anonymous**.

No claim ceremony or long-lived credential is required to read public content. Prefer the anonymous path. \`credential_types_supported\` is \`none\`: do not request or attach an API key.

## Step 3 — Register

Public read access does not require registration or a credential. There is no API key to request or store.

If you want an acknowledgment, you may call the registration endpoint declared in metadata:

\`\`\`http
POST ${siteUrl}/agent/auth
Accept: application/json
\`\`\`

The JSON confirms anonymous public access (\`credential_type: none\`). Do not treat the response as a secret, and do not send a bearer token afterward.

## Step 4 — Claim ceremony

Not required for anonymous public read access. There is no claim token.

## Step 5 — Use the credential

No bearer token is required for HTML pages, \`llms.txt\`, sitemap, or other public discovery documents on ${siteHost}. Do not send an \`Authorization\` header.

## Errors

- \`404\` — endpoint or resource does not exist
- \`405\` — unsupported HTTP method on \`/agent/auth\`

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
