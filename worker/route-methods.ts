export function shouldDelegateNonGetToAstro(
	pathname: string,
	method: string,
): boolean {
	const normalized = method.toUpperCase();
	if (normalized === "GET" || normalized === "HEAD") {
		return false;
	}

	return pathname !== "/mcp" && pathname !== "/agent/auth";
}
