function agentAuthMetadata(siteUrl: string) {
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
		// RFC 9728 §2: issuer identifiers, not the metadata document URL.
		// Clients insert `/.well-known/oauth-authorization-server` once (RFC 8414 §3).
		authorization_servers: [siteUrl],
		scopes_supported: ["public:read"],
		bearer_methods_supported: ["header"],
		resource_signing_alg_values_supported: [],
		// agent_auth is not an RFC 9728 PRM field. auth.md Step 1 reads it
		// from Authorization Server metadata only.
	};
}
