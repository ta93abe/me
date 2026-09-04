import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mountForm(): HTMLFormElement {
	document.body.innerHTML = `
		<form id="contact-form">
			<input id="contact-name" name="name" value="Abe" />
			<input id="contact-email" name="email" value="visitor@example.com" />
			<input id="contact-subject" name="subject" value="" />
			<textarea id="contact-message" name="message">Hello</textarea>
			<button type="submit">送信する</button>
			<p id="contact-status" data-tone="idle"></p>
		</form>
	`;
	return document.querySelector("#contact-form") as HTMLFormElement;
}

describe("bindContactForm", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	afterEach(() => {
		document.body.innerHTML = "";
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("shows success without waiting on delivery when the API accepts the form", async () => {
		mountForm();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(Response.json({ ok: true }, { status: 200 })),
		);

		const { bindContactForm } = await import("@/scripts/contact-form.ts");
		expect(bindContactForm()).toBe(true);

		const form = document.querySelector<HTMLFormElement>("#contact-form");
		form?.dispatchEvent(
			new Event("submit", { bubbles: true, cancelable: true }),
		);

		await vi.waitFor(() => {
			expect(document.querySelector("#contact-status")?.textContent).toContain(
				"送信しました",
			);
		});
		expect(form?.dataset.ready).toBe("true");
	});

	it("shows an error when the API rejects the submission", async () => {
		mountForm();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json(
					{
						ok: false,
						error: "turnstile_failed",
						message: "認証に失敗しました。もう一度お試しください。",
					},
					{ status: 403 },
				),
			),
		);

		const { bindContactForm } = await import("@/scripts/contact-form.ts");
		bindContactForm();

		document
			.querySelector("#contact-form")
			?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

		await vi.waitFor(() => {
			expect(document.querySelector("#contact-status")?.textContent).toContain(
				"認証に失敗",
			);
		});
	});
});
