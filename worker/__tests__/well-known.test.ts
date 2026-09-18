import { describe, expect, it } from "vitest";

import {
	isWellKnownPath,
	shouldDelegateToAstroHandler,
	WELL_KNOWN_JSON_NOT_FOUND,
	wellKnownMissingKind,
	wellKnownMissingPrefersJson,
} from "../well-known.ts";

describe("well-known missing JSON 404", () => {
	it("uses a short JSON error body", () => {
		expect(WELL_KNOWN_JSON_NOT_FOUND).toEqual({ error: "not_found" });
	});

	it("treats missing .json discovery paths as JSON 404", () => {
		expect(wellKnownMissingKind("/.well-known/ai-catalog.json", null)).toBe(
			"json",
		);
		expect(
			wellKnownMissingKind("/.well-known/mcp/server-cards.json", null),
		).toBe("json");
		expect(wellKnownMissingKind("/.well-known/does-not-exist.json", null)).toBe(
			"json",
		);
		expect(
			wellKnownMissingPrefersJson("/.well-known/ACP.JSON", "text/html"),
		).toBe(true);
	});

	it("treats Accept: application/json as JSON 404 under /.well-known/", () => {
		expect(
			wellKnownMissingKind(
				"/.well-known/http-message-signatures-directory",
				"application/json",
			),
		).toBe("json");
		expect(
			wellKnownMissingKind(
				"/.well-known/ucp",
				"application/json; charset=utf-8, text/plain",
			),
		).toBe("json");
	});

	it("keeps a short text 404 for well-known probes that are not JSON", () => {
		expect(
			wellKnownMissingKind(
				"/.well-known/http-message-signatures-directory",
				null,
			),
		).toBe("text");
		expect(wellKnownMissingKind("/.well-known/ucp", "text/html")).toBe("text");
	});

	it("does not rewrite human page 404s", () => {
		expect(isWellKnownPath("/not-a-real-page")).toBe(false);
		expect(wellKnownMissingKind("/not-a-real-page", "application/json")).toBe(
			null,
		);
		expect(wellKnownMissingKind("/openapi.json", null)).toBe(null);
	});

	it("does not treat application/jsonl as JSON", () => {
		expect(
			wellKnownMissingKind(
				"/.well-known/http-message-signatures-directory",
				"application/jsonl",
			),
		).toBe("text");
	});
});

describe("well-known OPTIONS routing", () => {
	it("does not send well-known OPTIONS to the Astro HTML 404", () => {
		expect(
			shouldDelegateToAstroHandler(
				"OPTIONS",
				"/.well-known/mcp/server-card.json",
			),
		).toBe(false);
		expect(
			shouldDelegateToAstroHandler(
				"OPTIONS",
				"/.well-known/mcp/server-cards.json",
			),
		).toBe(false);
		expect(
			shouldDelegateToAstroHandler("options", "/.well-known/ai-catalog.json"),
		).toBe(false);
	});

	it("still delegates page OPTIONS and other methods to Astro", () => {
		expect(shouldDelegateToAstroHandler("OPTIONS", "/not-a-real-page")).toBe(
			true,
		);
		expect(
			shouldDelegateToAstroHandler("POST", "/.well-known/ai-catalog.json"),
		).toBe(true);
		expect(
			shouldDelegateToAstroHandler("GET", "/.well-known/ai-catalog.json"),
		).toBe(false);
		expect(shouldDelegateToAstroHandler("POST", "/mcp")).toBe(false);
		expect(shouldDelegateToAstroHandler("OPTIONS", "/mcp")).toBe(false);
		expect(shouldDelegateToAstroHandler("POST", "/a2a")).toBe(false);
	});
});
