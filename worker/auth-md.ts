/** Auth.md served at `/auth.md` — self-contained agent registration notes. */
export function authMarkdown(siteUrl: string, siteHost: string): string {
	return `# auth.md

You are an agent. This file is a **self-contained registration flow** for AI agents. Complete registration from this document alone; you do not need OAuth metadata first.

## Audience

Agent audience: AI agents that want to read public content on ${siteUrl}. Browser visitors can ignore this file.

This service is a public content site. Reading public pages does not require authentication, paid credentials, or a long-lived secret.

## Self-contained registration flow

Standalone registration — audience, register endpoint, method, and credential use:

1. **Audience** — AI agents (see above).
2. **Supported method** — \`anonymous\`. \`identity_types_supported\` is \`["anonymous"]\`.
3. **Registration endpoint** — \`register_uri\` is \`${siteUrl}/agent/auth\`. HTTP method: \`POST\`.
4. **Credential use** — public read does not require a secret credential. Do not send an \`Authorization\` header for HTML pages, \`llms.txt\`, sitemap, or other public discovery documents on ${siteHost}. If registration returns \`api_key: "public"\`, treat that credential as a no-op acknowledgment, not a secret.

Register:

\`\`\`http
POST ${siteUrl}/agent/auth
Accept: application/json
Content-Type: application/json

{
  "identity_type": "anonymous"
}
\`\`\`

Example credential response:

\`\`\`json
{
  "identity_type": "anonymous",
  "credential_type": "api_key",
  "api_key": "public",
  "scopes": ["public:read"],
  "note": "Public content on ta93abe.com requires no secret. This key is a no-op acknowledgment for agent_auth anonymous registration."
}
\`\`\`

After that response, proceed to public resources without storing a secret credential.

## Optional OAuth discovery

Machine-readable metadata is optional. The Authorization Server \`issuer\` is \`${siteUrl}\`. If you want the \`agent_auth\` object as JSON, fetch:

\`\`\`http
GET ${siteUrl}/.well-known/oauth-protected-resource
GET ${siteUrl}/.well-known/oauth-authorization-server
\`\`\`

Prefer this document when those metadata documents are missing or incomplete. They must not contradict this standalone flow: public read stays anonymous and credential-free.

## Claim ceremony

Not required for anonymous public read access.

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
