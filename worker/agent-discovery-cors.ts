const DISCOVERY_CORS_ORIGIN = "*";
const DISCOVERY_CORS_METHODS = "GET, HEAD, OPTIONS";

function normalizeDiscoveryPathname(pathname: string): string {
	return pathname.replace(/\/+$/, "") || "/";
}

function isAgentDiscoveryPath(pathname: string): boolean {
	const path = normalizeDiscoveryPathname(pathname);
	if (
		path === "/llms.txt" ||
		path === "/llms-full.txt" ||
		path === "/auth.md"
	) {
		return true;
	}
	return path === "/.well-known" || path.startsWith("/.well-known/");
}

function applyAgentDiscoveryCorsHeaders(
	headers: Headers,
	request?: Request,
): void {
	headers.set("Access-Control-Allow-Origin", DISCOVERY_CORS_ORIGIN);
	headers.set("Access-Control-Allow-Methods", DISCOVERY_CORS_METHODS);
	const requestedHeaders = request?.headers.get(
		"Access-Control-Request-Headers",
	);
	if (requestedHeaders) {
		headers.set("Access-Control-Allow-Headers", requestedHeaders);
	}
}

export function handleAgentDiscoveryPreflight(
	request: Request,
): Response | null {
	if (request.method.toUpperCase() !== "OPTIONS") {
		return null;
	}

	const pathname = normalizeDiscoveryPathname(new URL(request.url).pathname);
	if (!isAgentDiscoveryPath(pathname)) {
		return null;
	}

	const headers = new Headers();
	applyAgentDiscoveryCorsHeaders(headers, request);
	return new Response(null, { status: 204, headers });
}

export function withAgentDiscoveryCors(
	request: Request,
	response: Response,
): Response {
	const pathname = normalizeDiscoveryPathname(new URL(request.url).pathname);
	if (!isAgentDiscoveryPath(pathname)) {
		return response;
	}

	const headers = new Headers(response.headers);
	applyAgentDiscoveryCorsHeaders(headers, request);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
