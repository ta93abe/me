import { afterEach, describe, expect, it, vi } from "vitest";

import {
	buildAutoReplyEmail,
	buildInboxEmail,
	buildSlackPayload,
	CONTACT_LIMITS,
	handleContactRequest,
	parseContactFields,
} from "../contact.ts";

const validFields = {
	name: "Abe",
	email: "visitor@example.com",
	subject: "Hello",
	message: "This is a message.",
	turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
};

function jsonRequest(body: unknown, init: RequestInit = {}): Request {
	return new Request("https://ta93abe.com/api/contact", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...init.headers },
		body: JSON.stringify(body),
		...init,
	});
}

describe("parseContactFields", () => {
	it("accepts a complete payload", () => {
		const result = parseContactFields(validFields);
		expect(result).toEqual({ ok: true, fields: validFields });
	});

	it("rejects missing name, email, and message", () => {
		expect(parseContactFields({ ...validFields, name: "" }).ok).toBe(false);
		expect(
			parseContactFields({ ...validFields, email: "not-an-email" }).ok,
		).toBe(false);
		expect(parseContactFields({ ...validFields, message: "   " }).ok).toBe(
			false,
		);
	});

	it("rejects over-long fields", () => {
		expect(
			parseContactFields({
				...validFields,
				name: "n".repeat(CONTACT_LIMITS.name + 1),
			}),
		).toMatchObject({ ok: false, error: "name_too_long" });
		expect(
			parseContactFields({
				...validFields,
				subject: "s".repeat(CONTACT_LIMITS.subject + 1),
			}),
		).toMatchObject({ ok: false, error: "subject_too_long" });
		expect(
			parseContactFields({
				...validFields,
				message: "m".repeat(CONTACT_LIMITS.message + 1),
			}),
		).toMatchObject({ ok: false, error: "message_too_long" });
	});

	it("requires a Turnstile token and does not create a workflow payload without it", () => {
		const result = parseContactFields({ ...validFields, turnstileToken: "" });
		expect(result).toMatchObject({ ok: false, error: "turnstile_required" });
	});

	it("allows an empty subject", () => {
		const result = parseContactFields({ ...validFields, subject: "  " });
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.fields.subject).toBe("");
		}
	});
});

describe("email and slack payloads", () => {
	it("sets replyTo to the visitor on the inbox mail and does not use the visitor as from", () => {
		const email = buildInboxEmail({
			fromAddress: "contact@ta93abe.com",
			fromName: "Takumi Abe",
			inboxEmail: "inbox@example.com",
			name: validFields.name,
			email: validFields.email,
			subject: validFields.subject,
			message: validFields.message,
		});

		expect(email.from.email).toBe("contact@ta93abe.com");
		expect(email.to).toBe("inbox@example.com");
		expect(email.replyTo).toBe(validFields.email);
		expect(email.text).toContain(validFields.message);
	});

	it("uses a default subject that includes the visitor name", () => {
		const email = buildInboxEmail({
			fromAddress: "contact@ta93abe.com",
			fromName: "Takumi Abe",
			inboxEmail: "inbox@example.com",
			name: validFields.name,
			email: validFields.email,
			subject: "",
			message: validFields.message,
		});
		expect(email.to).toBe("inbox@example.com");
		expect(email.subject).toContain(validFields.name);
	});

	it("sends a short auto-reply without quoting the message", () => {
		const email = buildAutoReplyEmail({
			fromAddress: "contact@ta93abe.com",
			fromName: "Takumi Abe",
			name: validFields.name,
			email: validFields.email,
		});

		expect(email.to).toBe(validFields.email);
		expect(email.from.email).toBe("contact@ta93abe.com");
		expect(email.replyTo).toBe("contact@ta93abe.com");
		expect(email.text).not.toContain(validFields.message);
		expect(email.html).not.toContain(validFields.message);
	});

	it("builds a Slack payload with a truncated preview", () => {
		const payload = buildSlackPayload({
			name: validFields.name,
			email: validFields.email,
			subject: validFields.subject,
			message: "x".repeat(400),
			submittedAt: "2026-08-27T00:00:00.000Z",
		});
		expect(payload.text).toContain(validFields.name);
		expect(JSON.stringify(payload.blocks)).toContain("…");
	});
});

describe("handleContactRequest", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns 400 without creating a workflow when fields are missing", async () => {
		const create = vi.fn();
		const response = await handleContactRequest(
			jsonRequest({ email: "a@b.com", message: "hi", turnstileToken: "t" }),
			{
				TURNSTILE_SECRET: "secret",
				CONTACT_WORKFLOW: { create },
			},
		);

		expect(response.status).toBe(400);
		expect(create).not.toHaveBeenCalled();
		expect(await response.json()).toMatchObject({ error: "name_required" });
	});

	it("returns 403 without creating a workflow when Turnstile fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({
					success: false,
					"error-codes": ["invalid-input-response"],
				}),
			),
		);
		const create = vi.fn();
		const response = await handleContactRequest(jsonRequest(validFields), {
			TURNSTILE_SECRET: "secret",
			CONTACT_WORKFLOW: { create },
		});

		expect(response.status).toBe(403);
		expect(create).not.toHaveBeenCalled();
	});

	it("creates a workflow and returns 200 immediately when validation passes", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ success: true })),
		);
		const create = vi.fn().mockResolvedValue({ id: "wf-1" });
		const response = await handleContactRequest(jsonRequest(validFields), {
			TURNSTILE_SECRET: "secret",
			CONTACT_WORKFLOW: { create },
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(create).toHaveBeenCalledTimes(1);
		expect(create.mock.calls[0]?.[0].params).toMatchObject({
			name: validFields.name,
			email: validFields.email,
			subject: validFields.subject,
			message: validFields.message,
		});
		expect(create.mock.calls[0]?.[0].params.submittedAt).toEqual(
			expect.any(String),
		);
	});

	it("returns 405 for GET", async () => {
		const response = await handleContactRequest(
			new Request("https://ta93abe.com/api/contact", { method: "GET" }),
			{
				TURNSTILE_SECRET: "secret",
				CONTACT_WORKFLOW: { create: vi.fn() },
			},
		);
		expect(response.status).toBe(405);
	});
});
