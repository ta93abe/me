import { describe, expect, it } from "vitest";

import {
	DISCOVERY_CACHE_CONTROL,
	discoveryResponse,
	etagFromHex,
	ifNoneMatchHits,
	sha256Digest,
	sha256Hex,
} from "../discovery-cache.ts";

function request(
	path = "/.well-known/agent-card.json",
	init: RequestInit = {},
): Request {
	return new Request(`https://ta93abe.com${path}`, init);
}

describe("discovery cache helper", () => {
	it("sets Cache-Control and a body-hash ETag", async () => {
		const body = '{"ok":true}';
		const response = await discoveryResponse(
			request(),
			body,
			"application/json; charset=utf-8",
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Cache-Control")).toBe(DISCOVERY_CACHE_CONTROL);
		expect(response.headers.get("ETag")).toBe(
			etagFromHex(await sha256Hex(body)),
		);
		expect(await response.text()).toBe(body);
	});

	it("returns 304 when If-None-Match matches the body ETag", async () => {
		const body = "# auth\n";
		const etag = etagFromHex(await sha256Hex(body));
		const response = await discoveryResponse(
			request("/auth.md", { headers: { "If-None-Match": etag } }),
			body,
			"text/markdown; charset=utf-8",
		);

		expect(response.status).toBe(304);
		expect(response.headers.get("ETag")).toBe(etag);
		expect(response.headers.get("Cache-Control")).toBe(DISCOVERY_CACHE_CONTROL);
		expect(response.headers.get("Content-Type")).toBeNull();
		expect(await response.text()).toBe("");
	});

	it("returns 304 for a weak If-None-Match of the same tag", async () => {
		const body = "stable";
		const etag = etagFromHex(await sha256Hex(body));
		const response = await discoveryResponse(
			request("/", { headers: { "If-None-Match": `W/${etag}` } }),
			body,
			"text/plain; charset=utf-8",
		);

		expect(response.status).toBe(304);
	});

	it("returns 200 when If-None-Match does not match", async () => {
		const body = "current";
		const response = await discoveryResponse(
			request("/", { headers: { "If-None-Match": '"deadbeef"' } }),
			body,
			"text/plain; charset=utf-8",
		);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe(body);
	});

	it("omits the body on HEAD while keeping validators", async () => {
		const body = "head-body";
		const response = await discoveryResponse(
			request("/", { method: "HEAD" }),
			body,
			"text/plain; charset=utf-8",
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("ETag")).toBe(
			etagFromHex(await sha256Hex(body)),
		);
		expect(await response.text()).toBe("");
	});

	it("treats If-None-Match: * as a hit", () => {
		expect(ifNoneMatchHits("*", '"abc"')).toBe(true);
		expect(ifNoneMatchHits('"other", "abc"', '"abc"')).toBe(true);
		expect(ifNoneMatchHits(null, '"abc"')).toBe(false);
	});
});

describe("agent skill digest alignment", () => {
	it("keeps index digest, SKILL.md SHA-256, and ETag on the same hash", async () => {
		const markdown = "# Site Overview\n\nUse this skill.\n";
		const hex = await sha256Hex(markdown);
		const indexBody = JSON.stringify(
			{
				skills: [
					{ name: "site-overview", digest: await sha256Digest(markdown) },
				],
			},
			null,
			2,
		);

		const skill = await discoveryResponse(
			request("/.well-known/agent-skills/site-overview/SKILL.md"),
			markdown,
			"text/markdown; charset=utf-8",
		);
		const index = await discoveryResponse(
			request("/.well-known/agent-skills/index.json"),
			indexBody,
			"application/json; charset=utf-8",
		);

		expect(JSON.parse(indexBody).skills[0].digest).toBe(`sha256:${hex}`);
		expect(skill.headers.get("ETag")).toBe(etagFromHex(hex));
		expect(index.headers.get("ETag")).not.toBe(skill.headers.get("ETag"));
	});

	it("changes SKILL.md ETag and index ETag together when markdown changes", async () => {
		const original = "# overview\n";
		const updated = "# overview\n\nupdated\n";
		const originalIndex = JSON.stringify({
			digest: await sha256Digest(original),
		});
		const updatedIndex = JSON.stringify({
			digest: await sha256Digest(updated),
		});

		const originalSkill = await discoveryResponse(
			request(),
			original,
			"text/markdown; charset=utf-8",
		);
		const updatedSkill = await discoveryResponse(
			request(),
			updated,
			"text/markdown; charset=utf-8",
		);
		const originalIndexResponse = await discoveryResponse(
			request(),
			originalIndex,
			"application/json; charset=utf-8",
		);
		const updatedIndexResponse = await discoveryResponse(
			request(),
			updatedIndex,
			"application/json; charset=utf-8",
		);

		expect(await sha256Digest(original)).not.toBe(await sha256Digest(updated));
		expect(originalSkill.headers.get("ETag")).not.toBe(
			updatedSkill.headers.get("ETag"),
		);
		expect(originalIndexResponse.headers.get("ETag")).not.toBe(
			updatedIndexResponse.headers.get("ETag"),
		);
	});
});
