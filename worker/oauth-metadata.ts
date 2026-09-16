/**
 * RFC 8414 Authorization Server metadata and RFC 9728 Protected Resource
 * Metadata. `authorization_servers` must list issuer identifiers, not
 * well-known metadata URLs — clients insert
 * `/.well-known/oauth-authorization-server` themselves (RFC 8414 §3).
 */

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

/**
 * RFC 8414 §3: insert `/.well-known/oauth-authorization-server` between the
 * issuer host and path. A well-known URL used as issuer double-appends.
 */
export function authorizationServerMetadataUrl(issuer: string): string {
	const url = new URL(issuer);
	const path = url.pathname.replace(/\/+$/, "");
	if (path === "") {
		return `${url.origin}/.well-known/oauth-authorization-server`;
	}
	return `${url.origin}/.well-known/oauth-authorization-server${path}`;
}
