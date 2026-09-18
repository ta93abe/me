import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
	SECURITY_TXT,
	SECURITY_TXT_CONTENT_TYPE,
	SECURITY_TXT_PATH,
} from "../security-txt.ts";

function securityTxtFields(body: string): Map<string, string[]> {
	const fields = new Map<string, string[]>();

	for (const line of body.split("\n")) {
		if (!line || line.startsWith("#")) {
			continue;
		}

		const separator = line.indexOf(":");
		expect(separator).toBeGreaterThan(0);

		const name = line.slice(0, separator);
		const value = line.slice(separator + 1).trim();
		const existing = fields.get(name) ?? [];
		existing.push(value);
		fields.set(name, existing);
	}

	return fields;
}

describe("RFC 9116 security.txt", () => {
	it("lives at /.well-known/security.txt as text/plain", () => {
		expect(SECURITY_TXT_PATH).toBe("/.well-known/security.txt");
		expect(SECURITY_TXT_CONTENT_TYPE.startsWith("text/plain")).toBe(true);
		expect(SECURITY_TXT_CONTENT_TYPE.toLowerCase()).toContain("charset=utf-8");
	});

	it("includes Contact and a future Expires date", () => {
		const fields = securityTxtFields(SECURITY_TXT);
		const contacts = fields.get("Contact") ?? [];
		const expires = fields.get("Expires") ?? [];

		expect(contacts.length).toBeGreaterThan(0);
		expect(contacts[0]).toMatch(/^https:\/\/ta93abe\.com\/contact\/?$/);

		expect(expires).toHaveLength(1);
		const expiresAt = Date.parse(expires[0] ?? "");
		expect(Number.isNaN(expiresAt)).toBe(false);
		expect(expiresAt).toBeGreaterThan(Date.now());
		expect(expiresAt).toBeLessThan(Date.now() + 366 * 24 * 60 * 60 * 1000);
	});

	it("declares Canonical and Preferred-Languages", () => {
		const fields = securityTxtFields(SECURITY_TXT);

		expect(fields.get("Canonical")).toEqual([
			"https://ta93abe.com/.well-known/security.txt",
		]);
		expect(fields.get("Preferred-Languages")).toEqual(["ja, en"]);
	});

	it("is served from the Worker discovery handler", () => {
		const source = readFileSync("worker/index.ts", "utf8");
		expect(source).toContain("SECURITY_TXT_PATH");
		expect(source).toContain("SECURITY_TXT_CONTENT_TYPE");
		expect(source).toContain("/.well-known/security.txt");
	});

	it("matches the public static copy used by astro dev", () => {
		const published = readFileSync("public/.well-known/security.txt", "utf8");
		expect(published).toBe(SECURITY_TXT);
	});
});
