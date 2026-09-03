const form = document.querySelector<HTMLFormElement>("#contact-form");
const statusEl = document.querySelector<HTMLElement>("#contact-status");
const submitButton = form?.querySelector<HTMLButtonElement>(
	'button[type="submit"]',
);

if (form && statusEl && submitButton) {
	const idleLabel = submitButton.textContent ?? "送信する";

	const setStatus = (message: string, tone: "idle" | "error" | "success") => {
		statusEl.textContent = message;
		statusEl.dataset.tone = tone;
	};

	const setSubmitting = (submitting: boolean) => {
		submitButton.disabled = submitting;
		submitButton.textContent = submitting ? "送信中…" : idleLabel;
		submitButton.classList.toggle("opacity-50", submitting);
		submitButton.classList.toggle("cursor-not-allowed", submitting);
		form.setAttribute("aria-busy", submitting ? "true" : "false");
	};

	const resetTurnstile = () => {
		const widget = form.querySelector<HTMLElement>(".cf-turnstile");
		if (widget) {
			window.turnstile?.reset(widget);
		} else {
			window.turnstile?.reset();
		}
	};

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		setSubmitting(true);
		setStatus("送信しています…", "idle");

		const formData = new FormData(form);
		const payload = {
			name: String(formData.get("name") ?? ""),
			email: String(formData.get("email") ?? ""),
			subject: String(formData.get("subject") ?? ""),
			message: String(formData.get("message") ?? ""),
			turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
		};

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const result = (await response.json()) as {
				ok?: boolean;
				message?: string;
			};

			if (!response.ok || !result.ok) {
				setStatus(
					result.message ?? "送信に失敗しました。もう一度お試しください。",
					"error",
				);
				resetTurnstile();
				window.posthog?.capture("contact_form_submitted", {
					status: "error",
					http_status: response.status,
				});
				return;
			}

			form.reset();
			resetTurnstile();
			setStatus("送信しました。確認のメールをお送りしています。", "success");
			window.posthog?.capture("contact_form_submitted", { status: "success" });
		} catch {
			setStatus(
				"送信に失敗しました。ネットワークを確認してもう一度お試しください。",
				"error",
			);
			resetTurnstile();
			window.posthog?.capture("contact_form_submitted", {
				status: "network_error",
			});
		} finally {
			setSubmitting(false);
		}
	});
}
