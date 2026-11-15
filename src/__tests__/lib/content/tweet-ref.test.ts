import { describe, expect, it } from "vitest";

import { parseTweetScale, resolveTweetRef } from "@/lib/content/tweet-ref";

describe("resolveTweetRef", () => {
	it("resolves an id", () => {
		expect(resolveTweetRef({ id: "2098270535855870306" })).toEqual({
			id: "2098270535855870306",
			href: "https://x.com/i/status/2098270535855870306",
		});
		expect(resolveTweetRef({ id: 20 })).toEqual({
			id: "20",
			href: "https://x.com/i/status/20",
		});
	});

	it("resolves x.com and twitter.com URLs", () => {
		expect(
			resolveTweetRef({ url: "https://twitter.com/civitaspo/status/123?s=20" }),
		).toEqual({ id: "123", href: "https://x.com/civitaspo/status/123" });
	});

	it("prefers id over url, keeping the handle when they match", () => {
		expect(
			resolveTweetRef({ id: "123", url: "https://x.com/civitaspo/status/123" }),
		).toEqual({ id: "123", href: "https://x.com/civitaspo/status/123" });
		expect(
			resolveTweetRef({ id: "456", url: "https://x.com/civitaspo/status/123" }),
		).toEqual({ id: "456", href: "https://x.com/i/status/456" });
	});

	it("rejects missing or invalid refs", () => {
		expect(resolveTweetRef({})).toBeNull();
		expect(resolveTweetRef({ id: "abc" })).toBeNull();
		expect(resolveTweetRef({ url: "https://example.com/status/1" })).toBeNull();
	});
});

describe("parseTweetScale", () => {
	it("accepts numbers between 0.25 and 3", () => {
		expect(parseTweetScale(undefined)).toBeUndefined();
		expect(parseTweetScale("0.8")).toBe(0.8);
		expect(parseTweetScale(2)).toBe(2);
	});

	it("returns NaN for anything else", () => {
		expect(parseTweetScale("big")).toBeNaN();
		expect(parseTweetScale("0.1")).toBeNaN();
		expect(parseTweetScale("4")).toBeNaN();
	});
});
