export const WELL_KNOWN_JSON_NOT_FOUND = { error: "not_found" } as const;

export function isWellKnownPath(pathname: string): boolean {
	return pathname === "/.well-known" || pathname.startsWith("/.well-known/");
}

function acceptIncludesJson(acceptHeader: string | null): boolean {
	if (!acceptHeader) {
		return false;
	}

	return acceptHeader
		.toLowerCase()
		.split(",")
		.map((part) => part.split(";")[0]?.trim())
		.includes("application/json");
}

export function wellKnownMissingPrefersJson(
	pathname: string,
	acceptHeader: string | null,
): boolean {
	return (
		pathname.toLowerCase().endsWith(".json") || acceptIncludesJson(acceptHeader)
	);
}

export function wellKnownMissingKind(
	pathname: string,
	acceptHeader: string | null,
): "json" | "text" | null {
	if (!isWellKnownPath(pathname)) {
		return null;
	}

	return wellKnownMissingPrefersJson(pathname, acceptHeader) ? "json" : "text";
}

export function shouldDelegateToAstroHandler(
	method: string,
	pathname: string,
): boolean {
	const normalized = method.toUpperCase();
	if (normalized === "GET" || normalized === "HEAD") {
		return false;
	}
	if (pathname === "/mcp" || pathname === "/agent/auth") {
		return false;
	}
	if (normalized === "OPTIONS" && isWellKnownPath(pathname)) {
		return false;
	}
	return true;
}
