import { describe, expect, it } from "vitest";

import {
	canonicalPageUrl,
	trailingSlashRedirectUrl,
	withTrailingSlash,
} from "@/utils/canonical";

describe("withTrailingSlash", () => {
	it("leaves root and already-slashed paths alone", () => {
		expect(withTrailingSlash("/")).toBe("/");
		expect(withTrailingSlash("/about/")).toBe("/about/");
	});

	it("adds a trailing slash to directory paths", () => {
		expect(withTrailingSlash("/about")).toBe("/about/");
		expect(withTrailingSlash("about")).toBe("/about/");
		expect(withTrailingSlash("/blog/hello-world")).toBe("/blog/hello-world/");
	});
});

describe("canonicalPageUrl", () => {
	const site = "https://ta93abe.com";

	it("normalizes HTML paths to trailing slashes", () => {
		expect(canonicalPageUrl("/about", site).href).toBe(
			"https://ta93abe.com/about/",
		);
		expect(canonicalPageUrl("/about/", site).href).toBe(
			"https://ta93abe.com/about/",
		);
		expect(canonicalPageUrl("/blog/hello-world", site).href).toBe(
			"https://ta93abe.com/blog/hello-world/",
		);
	});

	it("keeps the site root as a single slash", () => {
		expect(canonicalPageUrl("/", site).href).toBe("https://ta93abe.com/");
	});

	it("does not rewrite file URLs", () => {
		expect(canonicalPageUrl("/og/blog.png", site).href).toBe(
			"https://ta93abe.com/og/blog.png",
		);
		expect(canonicalPageUrl("/rss.xml", site).href).toBe(
			"https://ta93abe.com/rss.xml",
		);
	});

	it("drops hash and query from the canonical", () => {
		expect(canonicalPageUrl("/about?utm=1#top", site).href).toBe(
			"https://ta93abe.com/about/",
		);
	});
});

describe("trailingSlashRedirectUrl", () => {
	it("301s HTML directory paths onto a trailing slash", () => {
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/about"))?.href,
		).toBe("https://ta93abe.com/about/");
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/blog/hello-world"))
				?.href,
		).toBe("https://ta93abe.com/blog/hello-world/");
	});

	it("keeps query strings on the slashed URL", () => {
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/about?utm=1"))
				?.href,
		).toBe("https://ta93abe.com/about/?utm=1");
	});

	it("leaves the site root and already-slashed pages alone", () => {
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/")),
		).toBeNull();
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/about/")),
		).toBeNull();
	});

	it("does not rewrite files or agent/API endpoints", () => {
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/rss.xml")),
		).toBeNull();
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/og/blog.png")),
		).toBeNull();
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/mcp")),
		).toBeNull();
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/agent/auth")),
		).toBeNull();
		expect(
			trailingSlashRedirectUrl(
				new URL("https://ta93abe.com/.well-known/api-catalog"),
			),
		).toBeNull();
		expect(
			trailingSlashRedirectUrl(
				new URL("https://ta93abe.com/api/content/schema"),
			),
		).toBeNull();
	});
});
