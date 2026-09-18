export const DISCOVERY_CACHE_CONTROL =
	"public, max-age=300, s-maxage=300, stale-while-revalidate=86400";

export async function sha256Hex(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export async function sha256Digest(value: string): Promise<string> {
	return `sha256:${await sha256Hex(value)}`;
}

export function etagFromHex(hex: string): string {
	return `"${hex}"`;
}

export function ifNoneMatchHits(header: string | null, etag: string): boolean {
	if (!header) {
		return false;
	}

	const expected = stripWeak(etag);
	for (const token of header.split(",")) {
		const candidate = token.trim();
		if (!candidate) {
			continue;
		}
		if (candidate === "*") {
			return true;
		}
		if (stripWeak(candidate) === expected) {
			return true;
		}
	}

	return false;
}

export async function discoveryResponse(
	request: Request,
	body: string,
	contentType: string,
	init: ResponseInit = {},
): Promise<Response> {
	const etag = etagFromHex(await sha256Hex(body));
	const headers = new Headers(init.headers);
	headers.set("Cache-Control", DISCOVERY_CACHE_CONTROL);
	headers.set("ETag", etag);

	if (ifNoneMatchHits(request.headers.get("If-None-Match"), etag)) {
		headers.delete("Content-Type");
		return new Response(null, {
			status: 304,
			headers,
		});
	}

	headers.set("Content-Type", contentType);
	return new Response(isHead(request) ? null : body, {
		...init,
		headers,
	});
}

function isHead(request: Request): boolean {
	return request.method.toUpperCase() === "HEAD";
}

function stripWeak(tag: string): string {
	const trimmed = tag.trim();
	if (trimmed.startsWith("W/") || trimmed.startsWith("w/")) {
		return trimmed.slice(2).trim();
	}
	return trimmed;
}
