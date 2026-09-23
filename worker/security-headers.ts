/**
 * Shared security response headers for Worker-generated bodies and
 * `public/_headers` (keep values aligned).
 *
 * HSTS rollout: see docs/hsts-cloudflare.md
 */
export const STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains";

export const SECURITY_HEADERS = {
	"Strict-Transport-Security": STRICT_TRANSPORT_SECURITY,
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy":
		"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
	"Content-Security-Policy":
		"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
} as const;

/** Fill missing baseline headers; keep Astro / `_headers` CSP and other existing values. */
export function applyBaselineSecurityHeaders(headers: Headers): void {
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!headers.has(name)) {
			headers.set(name, value);
		}
	}
}

export function withBaselineSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	applyBaselineSecurityHeaders(headers);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
