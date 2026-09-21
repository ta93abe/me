import { handle } from "@astrojs/cloudflare/handler";

import { pageAliasRedirect } from "../src/config/redirects.ts";
import { isRetiredSitePath } from "../src/lib/content/retired-paths.ts";
import { isSitemapIndexDocument } from "../src/lib/content/sitemap-aliases.ts";
import { trailingSlashRedirectUrl } from "../src/utils/canonical.ts";
import { A2A_PATH, a2aAgentCard, handleA2a } from "./agent-card.ts";
import {
	handleAgentDiscoveryPreflight,
	withAgentDiscoveryCors,
} from "./agent-discovery-cors.ts";
import {
	AGENT_SKILL_MARKDOWN,
	AGENT_SKILL_PATH,
	agentSkillsIndex,
} from "./agent-skills.ts";
import { API_CATALOG_MEDIA_TYPE, buildApiCatalog } from "./api-catalog.ts";
import { agentAuthRegisterResponse, authMarkdown } from "./auth-md.ts";
import { handleContentApi } from "./content/api.ts";
import { BLOG_HTML_CACHE_CONTROL } from "./content/blog-cache.ts";
import { loadSitemapIndexXml, readLlmsBlogSection } from "./content/derived.ts";
import {
	buildLlmsFullText,
	buildLlmsOverviewMarkdown,
} from "./content/llms.ts";
import { renderBlogOgPng } from "./content/og-png.ts";
import { loadOgTitle, parseOgBlogPath } from "./content/og.ts";
import { discoveryResponse } from "./discovery-cache.ts";
import {
	CONTENT_SIGNAL,
	addPublicHtmlDiscoveryHeaders,
} from "./discovery-headers.ts";
import {
	DID_WEB_PATH,
	aiCatalog,
	didWebDocument,
} from "./discovery/ai-catalog.ts";
import {
	appendHeaderToken,
	htmlOriginRequest,
	negotiateHtmlMarkdown,
} from "./markdown-response.ts";
import { handleMcp, mcpServerCard } from "./mcp.ts";
import {
	AUTH_MD_OIDC_PARAGRAPH,
	OPENID_CONFIGURATION_PATH,
} from "./oauth-discovery.ts";
import {
	oauthAuthorizationServer,
	oauthProtectedResource,
} from "./oauth-metadata.ts";
import { dispatchWorkerQueue } from "./queue-dispatch.ts";
import {
	SECURITY_TXT,
	SECURITY_TXT_CONTENT_TYPE,
	SECURITY_TXT_PATH,
} from "./security-txt.ts";
import { servePdf } from "./slides/pdf-route.ts";
import {
	isPrintQuery,
	parseSlideDeckSlug,
	parseSlidePdfSlug,
} from "./slides/pdf.ts";
import {
	WELL_KNOWN_JSON_NOT_FOUND,
	shouldDelegateToAstroHandler,
	wellKnownMissingKind,
} from "./well-known.ts";

type CacheStore = { default: Cache };

function defaultCache(): Cache {
	return (caches as unknown as CacheStore).default;
}

const SITE_URL = "https://ta93abe.com";
const SITE_HOST = "ta93abe.com";
const AGENT_CLAIM_PATH = "/agent/claim";
const AGENT_AUTH_ALLOW = "GET, HEAD, POST, OPTIONS";

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

export { PdfWorkflow } from "./slides/pdf-workflow.ts";

async function siteOverviewMarkdown(env: Env): Promise<string> {
	const blogSection = await readLlmsBlogSection(env.CONTENT, SITE_URL);
	return buildLlmsOverviewMarkdown(SITE_URL, blogSection);
}

async function llmsFullText(env: Env): Promise<string> {
	return buildLlmsFullText(await siteOverviewMarkdown(env), {
		siteUrl: SITE_URL,
		siteHost: SITE_HOST,
		contentSignal: CONTENT_SIGNAL,
	});
}

const AUTH_MD = authMarkdown(SITE_URL, SITE_HOST, AUTH_MD_OIDC_PARAGRAPH);

function isHead(request: Request): boolean {
	return request.method.toUpperCase() === "HEAD";
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

function binaryResponse(
	request: Request,
	body: Uint8Array,
	contentType: string,
	init: ResponseInit = {},
): Response {
	const headers = new Headers(init.headers);
	headers.set("Content-Type", contentType);
	headers.set("Content-Length", String(body.byteLength));
	setGeneratedHeaders(headers);

	const payload = new ArrayBuffer(body.byteLength);
	new Uint8Array(payload).set(body);

	return new Response(isHead(request) ? null : payload, {
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

async function discoveryTextResponse(
	request: Request,
	body: string,
	contentType: string,
	init: ResponseInit = {},
): Promise<Response> {
	const headers = new Headers(init.headers);
	setGeneratedHeaders(headers);
	return discoveryResponse(request, body, contentType, {
		...init,
		headers,
	});
}

async function discoveryJsonResponse(
	request: Request,
	value: unknown,
	init: ResponseInit = {},
): Promise<Response> {
	return discoveryTextResponse(
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

async function serveFallbackBlogOg(
	request: Request,
	env: Env,
): Promise<Response | null> {
	if (!env.ASSETS) {
		return null;
	}

	try {
		const fallback = await env.ASSETS.fetch(
			new Request(new URL("/og/blog.png", request.url)),
		);
		if (!fallback.ok) {
			return null;
		}

		const headers = new Headers(fallback.headers);
		headers.set("Content-Type", "image/png");
		headers.set("Cache-Control", BLOG_HTML_CACHE_CONTROL);
		setGeneratedHeaders(headers);

		return new Response(isHead(request) ? null : fallback.body, {
			status: 200,
			headers,
		});
	} catch (error) {
		console.error("blog OG fallback failed", error);
		return null;
	}
}

function agentAuthClaimResponse() {
	return {
		identity_type: "anonymous",
		claimed: true,
		status: "complete",
		credential_required: false,
		scopes: ["public:read"],
		note: "Public content on ta93abe.com requires no claim ceremony or secret. This acknowledgment completes immediately.",
		resources: {
			home: `${SITE_URL}/`,
			llms: `${SITE_URL}/llms.txt`,
			sitemap: `${SITE_URL}/sitemap-index.xml`,
		},
	};
}

function isBlogHtmlPath(pathname: string): boolean {
	return pathname === "/blog" || pathname.startsWith("/blog/");
}

function shouldCacheBlogHtml(request: Request): boolean {
	const host = new URL(request.url).hostname;
	return host !== "localhost" && host !== "127.0.0.1";
}

async function fetchAstro(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response> {
	const url = new URL(request.url);
	const pathname = url.pathname.replace(/\/+$/, "") || "/";
	const method = request.method.toUpperCase();

	if (
		shouldCacheBlogHtml(request) &&
		isBlogHtmlPath(pathname) &&
		(method === "GET" || method === "HEAD")
	) {
		const cached = await defaultCache().match(request);
		if (cached) {
			return cached;
		}
	}

	const response = await handle(request, env, ctx);
	const contentType = response.headers.get("Content-Type") ?? "";
	if (
		shouldCacheBlogHtml(request) &&
		isBlogHtmlPath(pathname) &&
		(method === "GET" || method === "HEAD") &&
		response.ok &&
		contentType.includes("text/html")
	) {
		const headers = new Headers(response.headers);
		headers.set("Cache-Control", BLOG_HTML_CACHE_CONTROL);
		headers.set("Vary", appendHeaderToken(headers.get("Vary"), "Accept"));
		const cached = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
		ctx.waitUntil(defaultCache().put(request, cached.clone()));
		return cached;
	}

	return response;
}

async function handleSiteRequest(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response> {
	const url = new URL(request.url);
	const pathname = url.pathname.replace(/\/+$/, "") || "/";

	const contentResponse = await handleContentApi(request, env);
	if (contentResponse) {
		return contentResponse;
	}

	const pdfSlug = parseSlidePdfSlug(pathname);
	if (pdfSlug && (request.method === "GET" || request.method === "HEAD")) {
		return servePdf(request, env, pdfSlug);
	}

	const printSlug = parseSlideDeckSlug(pathname);
	if (
		printSlug &&
		isPrintQuery(url.searchParams.get("print")) &&
		(request.method === "GET" || request.method === "HEAD")
	) {
		return Response.redirect(
			new URL(`/slides/${printSlug}/print/`, request.url),
			301,
		);
	}

	if (
		isRetiredSitePath(pathname) &&
		(request.method === "GET" || request.method === "HEAD")
	) {
		return Response.redirect(new URL("/", url), 301);
	}

	if (request.method === "GET" || request.method === "HEAD") {
		const alias = pageAliasRedirect(pathname);
		if (alias) {
			return Response.redirect(new URL(alias, url), 301);
		}
		const location = trailingSlashRedirectUrl(url);
		if (location) {
			return Response.redirect(location, 301);
		}
	}

	if (shouldDelegateToAstroHandler(request.method, pathname)) {
		return handle(request, env, ctx);
	}

	if (pathname === "/llms.txt") {
		return textResponse(
			request,
			await siteOverviewMarkdown(env),
			"text/plain; charset=utf-8",
			{
				headers: { "Cache-Control": BLOG_HTML_CACHE_CONTROL },
			},
		);
	}

	if (pathname === "/llms-full.txt") {
		return textResponse(
			request,
			await llmsFullText(env),
			"text/plain; charset=utf-8",
			{
				headers: { "Cache-Control": BLOG_HTML_CACHE_CONTROL },
			},
		);
	}

	if (
		isSitemapIndexDocument(pathname) &&
		(request.method === "GET" || request.method === "HEAD")
	) {
		let xml: string | undefined;
		let lastModified: string | null = null;
		try {
			const staticSitemap = await env.ASSETS.fetch(
				new URL("/sitemap-0.xml", request.url),
			);
			if (staticSitemap.ok) {
				xml = await staticSitemap.text();
				lastModified = staticSitemap.headers.get("Last-Modified");
			}
		} catch {
			// fall through to the request-time lastmod fallback
		}
		return textResponse(
			request,
			await loadSitemapIndexXml(env.CONTENT, SITE_URL, {
				xml,
				lastModified,
			}),
			"application/xml; charset=utf-8",
			{
				headers: { "Cache-Control": BLOG_HTML_CACHE_CONTROL },
			},
		);
	}

	const ogSlug = parseOgBlogPath(pathname);
	if (ogSlug && (request.method === "GET" || request.method === "HEAD")) {
		try {
			const title = await loadOgTitle(env.CONTENT, ogSlug);
			if (title) {
				if (shouldCacheBlogHtml(request)) {
					const cached = await defaultCache().match(request);
					if (cached) {
						return cached;
					}
				}
				const png = await renderBlogOgPng(title);
				const response = binaryResponse(request, png, "image/png", {
					headers: { "Cache-Control": BLOG_HTML_CACHE_CONTROL },
				});
				if (shouldCacheBlogHtml(request) && request.method === "GET") {
					ctx.waitUntil(defaultCache().put(request, response.clone()));
				}
				return response;
			}
		} catch (error) {
			console.error("blog OG render failed", error);
		}

		const fallback = await serveFallbackBlogOg(request, env);
		if (fallback) {
			return fallback;
		}
	}

	if (pathname === "/auth.md") {
		return discoveryTextResponse(
			request,
			AUTH_MD,
			"text/markdown; charset=utf-8",
		);
	}

	if (pathname === "/agent/auth" || pathname === AGENT_CLAIM_PATH) {
		const method = request.method.toUpperCase();
		if (method === "OPTIONS") {
			const headers = new Headers({ Allow: AGENT_AUTH_ALLOW });
			setGeneratedHeaders(headers);
			return new Response(null, { status: 204, headers });
		}
		if (method !== "GET" && method !== "POST" && method !== "HEAD") {
			return textResponse(
				request,
				"Method Not Allowed",
				"text/plain; charset=utf-8",
				{
					status: 405,
					headers: { Allow: AGENT_AUTH_ALLOW },
				},
			);
		}
		return jsonResponse(
			request,
			pathname === AGENT_CLAIM_PATH
				? agentAuthClaimResponse()
				: agentAuthRegisterResponse(SITE_URL),
			{ headers: { Allow: AGENT_AUTH_ALLOW } },
		);
	}

	if (pathname === SECURITY_TXT_PATH) {
		// RFC 9116: /.well-known/security.txt
		return textResponse(request, SECURITY_TXT, SECURITY_TXT_CONTENT_TYPE);
	}

	if (pathname === "/.well-known/api-catalog") {
		return discoveryTextResponse(
			request,
			JSON.stringify(buildApiCatalog(SITE_URL), null, 2),
			API_CATALOG_MEDIA_TYPE,
		);
	}

	if (pathname === DID_WEB_PATH) {
		return discoveryTextResponse(
			request,
			JSON.stringify(didWebDocument(), null, 2),
			"application/did+json; charset=utf-8",
		);
	}

	if (
		pathname === "/.well-known/ai-catalog.json" ||
		pathname === "/.well-known/ard.json"
	) {
		return discoveryJsonResponse(request, aiCatalog());
	}

	if (
		pathname === "/.well-known/mcp/server-card.json" ||
		pathname === "/.well-known/mcp.json"
	) {
		return discoveryJsonResponse(request, mcpServerCard());
	}

	if (pathname === "/.well-known/agent-skills/index.json") {
		return discoveryJsonResponse(
			request,
			await agentSkillsIndex(SITE_URL, AGENT_SKILL_MARKDOWN),
		);
	}

	if (pathname === AGENT_SKILL_PATH.replace(/\/+$/, "")) {
		return discoveryTextResponse(
			request,
			AGENT_SKILL_MARKDOWN,
			"text/markdown; charset=utf-8",
		);
	}

	if (
		pathname === "/.well-known/agent-card.json" ||
		pathname === "/.well-known/agent.json"
	) {
		return discoveryJsonResponse(request, a2aAgentCard());
	}

	if (pathname === "/.well-known/oauth-authorization-server") {
		return jsonResponse(request, oauthAuthorizationServer(SITE_URL));
	}

	if (pathname === "/.well-known/oauth-protected-resource") {
		return jsonResponse(request, oauthProtectedResource(SITE_URL));
	}

	if (pathname === "/mcp") {
		return handleMcp(
			request,
			{
				siteOverviewMarkdown: () => siteOverviewMarkdown(env),
				llmsFullText: () => llmsFullText(env),
			},
			(value, init) => jsonResponse(request, value, init),
		);
	}

	if (pathname === A2A_PATH) {
		return handleA2a(request, await siteOverviewMarkdown(env), (value, init) =>
			jsonResponse(request, value, init),
		);
	}

	// この host は OIDC OP ではない。AS metadata の複製を置かない。
	if (pathname === OPENID_CONFIGURATION_PATH) {
		return jsonResponse(request, WELL_KNOWN_JSON_NOT_FOUND, { status: 404 });
	}

	// Catch-all after the implemented discovery routes above.
	const wellKnownMissing = wellKnownMissingKind(
		pathname,
		request.headers.get("Accept"),
	);
	if (wellKnownMissing === "json") {
		return jsonResponse(request, WELL_KNOWN_JSON_NOT_FOUND, { status: 404 });
	}
	if (wellKnownMissing === "text") {
		return notFoundResponse(request);
	}

	// Explicit 404 for optional endpoints this site does not implement.
	if (
		pathname === "/openapi.json" ||
		pathname === "/api/v1" ||
		pathname === "/api"
	) {
		return notFoundResponse(request);
	}

	const astroRequest = htmlOriginRequest(request);
	const response = await fetchAstro(astroRequest, env, ctx);
	const negotiated = await negotiateHtmlMarkdown(request, response, {
		contentSignal: CONTENT_SIGNAL,
	});
	return addPublicHtmlDiscoveryHeaders(request, negotiated);
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const preflight = handleAgentDiscoveryPreflight(request);
		if (preflight) {
			return preflight;
		}

		const response = await handleSiteRequest(request, env, ctx);
		return withAgentDiscoveryCors(request, response);
	},

	async queue(batch, env): Promise<void> {
		await dispatchWorkerQueue(batch, env, {
			origin: SITE_URL,
			purge: async (urls) => {
				await Promise.all(urls.map((target) => defaultCache().delete(target)));
			},
		});
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
