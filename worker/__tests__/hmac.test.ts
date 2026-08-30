import { describe, expect, it } from "vitest";

import { signContentRequest, verifyContentHmac } from "../content/hmac.ts";

const secret = "test-hmac-secret";
const pathname = "/api/content/blog/hello";
const body = "---\ntitle: Hello\n---\n";

describe("content hmac", () => {
	it("accepts a matching signature inside the 5 minute window", async () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await signContentRequest(
			secret,
			timestamp,
			pathname,
			body,
		);
		const result = await verifyContentHmac({
			secret,
			pathname,
			body,
			headers: new Headers({
				"X-Content-Timestamp": timestamp,
				"X-Content-Signature": signature,
			}),
		});
		expect(result).toEqual({ ok: true });
	});

	it("accepts Authorization: HMAC-SHA256 <hex>", async () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const signature = await signContentRequest(
			secret,
			timestamp,
			pathname,
			body,
		);
		const result = await verifyContentHmac({
			secret,
			pathname,
			body,
			headers: new Headers({
				"X-Content-Timestamp": timestamp,
				Authorization: `HMAC-SHA256 ${signature}`,
			}),
		});
		expect(result.ok).toBe(true);
	});

	it("rejects a wrong signature", async () => {
		const timestamp = String(Math.floor(Date.now() / 1000));
		const result = await verifyContentHmac({
			secret,
			pathname,
			body,
			headers: new Headers({
				"X-Content-Timestamp": timestamp,
				"X-Content-Signature": "ab".repeat(32),
			}),
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(401);
		}
	});

	it("rejects timestamps older than 5 minutes", async () => {
		const timestamp = String(Math.floor(Date.now() / 1000) - 301);
		const signature = await signContentRequest(
			secret,
			timestamp,
			pathname,
			body,
		);
		const result = await verifyContentHmac({
			secret,
			pathname,
			body,
			headers: new Headers({
				"X-Content-Timestamp": timestamp,
				"X-Content-Signature": signature,
			}),
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toContain("5 minute");
		}
	});

	it("rejects missing headers", async () => {
		const result = await verifyContentHmac({
			secret,
			pathname,
			body,
			headers: new Headers(),
		});
		expect(result.ok).toBe(false);
	});
});
