/** WorkOS auth.md / agent_auth block (shared by AS metadata + docs). */
export function agentAuthMetadata(siteUrl: string) {
	return {
		skill: `${siteUrl}/auth.md`,
		register_uri: `${siteUrl}/agent/auth`,
		identity_types_supported: ["anonymous"],
		anonymous: {
			credential_types_supported: ["api_key"],
		},
	};
}

export function oauthAuthorizationServer(siteUrl: string) {
	return {
		issuer: siteUrl,
		// Public-read site: no interactive OAuth login or token minting.
		// Agents should follow agent_auth.register_uri instead.
		response_types_supported: ["none"],
		grant_types_supported: ["urn:workos:agent-auth:grant-type:claim"],
		token_endpoint_auth_methods_supported: ["none"],
		agent_auth: agentAuthMetadata(siteUrl),
	};
}

export function oauthProtectedResource(siteUrl: string) {
	return {
		resource: siteUrl,
		// RFC 9728: issuer identifiers (RFC 8414), not well-known metadata URLs.
		authorization_servers: [siteUrl],
		scopes_supported: ["public:read"],
		bearer_methods_supported: ["header"],
		resource_signing_alg_values_supported: [],
		agent_auth: {
			required: false,
			skill: `${siteUrl}/auth.md`,
			description:
				"ta93abe.com is a public content site. No authentication is required to access public resources.",
		},
	};
}
