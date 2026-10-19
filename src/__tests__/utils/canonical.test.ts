import { describe, expect, it } from "vitest";

import {
	canonicalPageUrl,
	permanentRedirectStatus,
	trailingSlashRedirectUrl,
	withTrailingSlash,
	wwwApexRedirectUrl,
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
		expect(canonicalPageUrl("/404.html", site).href).toBe(
			"https://ta93abe.com/404.html",
		);
	});

	it("maps HTML filenames onto trailing-slash canonicals", () => {
		expect(canonicalPageUrl("/about.html", site).href).toBe(
			"https://ta93abe.com/about/",
		);
		expect(canonicalPageUrl("/about/index.html", site).href).toBe(
			"https://ta93abe.com/about/",
		);
		expect(canonicalPageUrl("/index.html", site).href).toBe(
			"https://ta93abe.com/",
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
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/a2a")),
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

	it("301s .html and index.html page URLs onto the slashed canonical", () => {
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/contact.html"))
				?.href,
		).toBe("https://ta93abe.com/contact/");
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/about.html"))?.href,
		).toBe("https://ta93abe.com/about/");
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/about/index.html"))
				?.href,
		).toBe("https://ta93abe.com/about/");
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/index.html"))?.href,
		).toBe("https://ta93abe.com/");
		expect(
			trailingSlashRedirectUrl(
				new URL("https://ta93abe.com/gadgets/mac-studio.html"),
			)?.href,
		).toBe("https://ta93abe.com/gadgets/mac-studio/");
		expect(
			trailingSlashRedirectUrl(
				new URL("https://ta93abe.com/blog/hello-world.html"),
			)?.href,
		).toBe("https://ta93abe.com/blog/hello-world/");
		expect(
			trailingSlashRedirectUrl(
				new URL("https://ta93abe.com/slides/snowflake-dbt.html"),
			)?.href,
		).toBe("https://ta93abe.com/slides/snowflake-dbt/");
	});

	it("keeps query strings when stripping .html", () => {
		expect(
			trailingSlashRedirectUrl(
				new URL("https://ta93abe.com/contact.html?utm=1"),
			)?.href,
		).toBe("https://ta93abe.com/contact/?utm=1");
		expect(
			trailingSlashRedirectUrl(
				new URL("https://ta93abe.com/about/index.html?utm=1"),
			)?.href,
		).toBe("https://ta93abe.com/about/?utm=1");
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/index.html?utm=1"))
				?.href,
		).toBe("https://ta93abe.com/?utm=1");
	});

	it("leaves 404.html as a real asset path", () => {
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/404.html")),
		).toBeNull();
		expect(
			trailingSlashRedirectUrl(new URL("https://ta93abe.com/blog/404.html")),
		).toBeNull();
	});
});

describe("wwwApexRedirectUrl", () => {
	it("sends www root and HTML paths to apex in one hop", () => {
		expect(wwwApexRedirectUrl(new URL("https://www.ta93abe.com/"))?.href).toBe(
			"https://ta93abe.com/",
		);
		expect(
			wwwApexRedirectUrl(new URL("https://www.ta93abe.com/about"))?.href,
		).toBe("https://ta93abe.com/about/");
		expect(
			wwwApexRedirectUrl(new URL("https://www.ta93abe.com/about/"))?.href,
		).toBe("https://ta93abe.com/about/");
	});

	it("keeps query strings and does not slash well-known or files", () => {
		expect(
			wwwApexRedirectUrl(new URL("https://www.ta93abe.com/?utm=1"))?.href,
		).toBe("https://ta93abe.com/?utm=1");
		expect(
			wwwApexRedirectUrl(new URL("https://www.ta93abe.com/about?utm=1"))?.href,
		).toBe("https://ta93abe.com/about/?utm=1");
		expect(
			wwwApexRedirectUrl(
				new URL("https://www.ta93abe.com/.well-known/api-catalog"),
			)?.href,
		).toBe("https://ta93abe.com/.well-known/api-catalog");
		expect(
			wwwApexRedirectUrl(new URL("https://www.ta93abe.com/rss.xml"))?.href,
		).toBe("https://ta93abe.com/rss.xml");
		expect(
			wwwApexRedirectUrl(new URL("https://www.ta93abe.com/mcp"))?.href,
		).toBe("https://ta93abe.com/mcp");
	});

	it("leaves apex and other hosts alone", () => {
		expect(wwwApexRedirectUrl(new URL("https://ta93abe.com/"))).toBeNull();
		expect(wwwApexRedirectUrl(new URL("https://ta93abe.com/about"))).toBeNull();
		expect(
			wwwApexRedirectUrl(new URL("http://127.0.0.1:4321/about")),
		).toBeNull();
	});
});

describe("permanentRedirectStatus", () => {
	it("uses 301 for GET/HEAD and 308 for other methods", () => {
		expect(permanentRedirectStatus("GET")).toBe(301);
		expect(permanentRedirectStatus("head")).toBe(301);
		expect(permanentRedirectStatus("POST")).toBe(308);
		expect(permanentRedirectStatus("OPTIONS")).toBe(308);
	});
});
