import { AUTH_MD_OIDC_PARAGRAPH } from "./oauth-discovery.ts";

/** Auth.md served at `/auth.md` — self-contained agent registration notes. */
export function authMarkdown(
	siteUrl: string,
	siteHost: string,
	oidcParagraph: string = AUTH_MD_OIDC_PARAGRAPH,
): string {
	return `# auth.md

You are an agent. This file is a **self-contained registration flow** for AI agents. Complete registration from this document alone; you do not need OAuth metadata first.

This service is a **public content site**. Reading public pages does not require authentication, registration, or paid credentials.

${oidcParagraph}

## Audience

Agent audience: AI agents that want to read public content on ${siteUrl}. Browser visitors can ignore this file.

## Self-contained registration flow

Standalone registration — audience, register endpoint, method, and credential use:

1. **Audience** — AI agents (see above).
2. **Supported method** — \`anonymous\`. \`identity_types_supported\` is \`["anonymous"]\`. \`anonymous.credential_types_supported\` is \`["none"]\`.
3. **Registration endpoint** — \`register_uri\` is \`${siteUrl}/agent/auth\`. HTTP method: \`POST\`.
4. **Credential use** — public read does not require a secret credential. Do not send an \`Authorization\` header for HTML pages, \`llms.txt\`, sitemap, or other public discovery documents on ${siteHost}. Registration returns \`credential_type: none\`. Treat that as confirmation, not a secret.

Register:

\`\`\`http
POST ${siteUrl}/agent/auth
Accept: application/json
Content-Type: application/json

{
  "identity_type": "anonymous"
}
\`\`\`

Example response:

\`\`\`json
{
  "identity_type": "anonymous",
  "credential_type": "none",
  "scopes": ["public:read"],
  "note": "Public content on ta93abe.com requires no authentication, secret, or bearer token."
}
\`\`\`

GET returns the same JSON. OPTIONS advertises \`Allow: GET, HEAD, POST, OPTIONS\`. Do not treat the response as a secret, and do not send a bearer token afterward.

## Step 1 — Discover

Fetch Authorization Server and Protected Resource metadata (optional; this document stays self-contained if they are missing):

\`\`\`http
GET ${siteUrl}/.well-known/oauth-authorization-server
GET ${siteUrl}/.well-known/oauth-protected-resource
\`\`\`

The Authorization Server \`issuer\` is \`${siteUrl}\`. Metadata includes an \`agent_auth\` object. The \`skill\` field points back to this document.

## Step 2 — Pick a method

Supported identity type: **anonymous**.

Authorization Server metadata advertises \`identity_types_supported: ["anonymous"]\`, \`anonymous.credential_types_supported: ["none"]\`, and \`anonymous.claim_uri\`. No long-lived secret is required to read public content. Prefer the anonymous path. Do not request or attach an API key.

## Step 3 — Register

Call the registration endpoint declared in metadata (\`agent_auth.register_uri\`):

\`\`\`http
POST ${siteUrl}/agent/auth
Accept: application/json
\`\`\`

The JSON confirms anonymous public access (\`credential_type: none\`).

## Step 4 — Claim

Anonymous public read does not require a user-in-the-loop claim ceremony. \`agent_auth.anonymous.claim_uri\` is a no-op that completes immediately and issues no credential.

\`\`\`http
POST ${siteUrl}/agent/claim
Accept: application/json
\`\`\`

GET returns the same JSON. Do not wait for a \`user_code\`, and do not poll a token endpoint. There is no secret to store.

## Step 5 — Use the credential

No bearer token is required for HTML pages, \`llms.txt\`, sitemap, or other public discovery documents on ${siteHost}. Do not send an \`Authorization\` header.

## Errors

- \`404\` — endpoint or resource does not exist
- \`405\` — unsupported HTTP method on \`/agent/auth\` or \`/agent/claim\`

## Revocation

There is nothing to revoke for anonymous public read access.

## Public resources

- Homepage: ${siteUrl}/
- Sitemap: ${siteUrl}/sitemap.xml
- llms.txt: ${siteUrl}/llms.txt
- API catalog: ${siteUrl}/.well-known/api-catalog
- ARD capability manifest: ${siteUrl}/.well-known/ai-catalog.json
- MCP server card: ${siteUrl}/.well-known/mcp/server-card.json
- Agent skills: ${siteUrl}/.well-known/agent-skills/index.json
- A2A Agent Card: ${siteUrl}/.well-known/agent-card.json
- security.txt: ${siteUrl}/.well-known/security.txt
`;
}
