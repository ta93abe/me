/**
 * RFC 8414 Authorization Server metadata for a public content site.
 *
 * This host is not an OpenID Connect Provider. Do not clone this document to
 * `/.well-known/openid-configuration`.
 *
 * authorization_endpoint / token_endpoint are omitted on purpose: RFC 8414
 * requires those fields only when advertised grant types use them. This site
 * advertises no OAuth grants and does not mint tokens.
 */

export const OPENID_CONFIGURATION_PATH = "/.well-known/openid-configuration";

export const AUTH_MD_OIDC_PARAGRAPH =
	"This site is **not** an OpenID Connect Provider and does not publish `/.well-known/openid-configuration`. Authorization Server metadata at `/.well-known/oauth-authorization-server` is **agent_auth discovery only**: there is no OAuth authorization endpoint, token endpoint, or ID token. Registration via `/agent/auth` is optional; public content can be read without it.";

export type OauthAuthorizationServerMetadata = {
	issuer: string;
	response_types_supported: string[];
	grant_types_supported: string[];
	token_endpoint_auth_methods_supported: string[];
	service_documentation: string;
	note: string;
	agent_auth: unknown;
};

export function oauthAuthorizationServerMetadata(input: {
	issuer: string;
	documentationUrl: string;
	agentAuth: unknown;
}): OauthAuthorizationServerMetadata {
	return {
		issuer: input.issuer,
		// "none" signals that no interactive authorization response is issued.
		response_types_supported: ["none"],
		// Empty on purpose. An omitted list defaults to authorization_code +
		// implicit, which would require authorization_endpoint / token_endpoint.
		// Do not advertise urn:workos:agent-auth:grant-type:claim — that grant
		// is used at a token endpoint this site does not operate.
		grant_types_supported: [],
		token_endpoint_auth_methods_supported: ["none"],
		service_documentation: input.documentationUrl,
		note: "agent_auth discovery only. This host is not an OpenID Connect Provider and does not mint OAuth access tokens.",
		agent_auth: input.agentAuth,
	};
}
