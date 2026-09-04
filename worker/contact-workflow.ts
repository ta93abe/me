import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";

import {
	buildAutoReplyEmail,
	buildInboxEmail,
	buildSlackPayload,
	type ContactWorkflowParams,
} from "./contact.ts";

export class ContactWorkflow extends WorkflowEntrypoint<
	Env,
	ContactWorkflowParams
> {
	override async run(
		event: WorkflowEvent<ContactWorkflowParams>,
		step: WorkflowStep,
	): Promise<{ inbox: string; reply: string; slack: string }> {
		const payload = event.payload;
		const fromAddress = this.env.CONTACT_FROM_ADDRESS;
		const fromName = this.env.CONTACT_FROM_NAME;
		const inboxEmail = this.env.CONTACT_INBOX_EMAIL?.trim() || undefined;

		let inbox: "sent" | "failed" = "failed";
		let reply: "sent" | "failed" = "failed";
		let slack: "sent" | "skipped" | "failed" = "failed";

		if (!inboxEmail) {
			console.error("CONTACT_INBOX_EMAIL is not configured");
		} else {
			try {
				await step.do("notify-inbox", async () => {
					const message = buildInboxEmail({
						fromAddress,
						fromName,
						inboxEmail,
						name: payload.name,
						email: payload.email,
						subject: payload.subject,
						message: payload.message,
					});
					const result = await this.env.EMAIL_INBOX.send(message);
					return { messageId: result.messageId };
				});
				inbox = "sent";
			} catch (error) {
				console.error("contact notify-inbox failed", error);
			}
		}

		try {
			await step.do("auto-reply", async () => {
				const message = buildAutoReplyEmail({
					fromAddress,
					fromName,
					name: payload.name,
					email: payload.email,
				});
				const result = await this.env.EMAIL_REPLY.send(message);
				return { messageId: result.messageId };
			});
			reply = "sent";
		} catch (error) {
			console.error("contact auto-reply failed", error);
		}

		try {
			slack = await step.do("notify-slack", async () => {
				const webhook = this.env.SLACK_WEBHOOK_URL;
				if (!webhook) {
					console.error("SLACK_WEBHOOK_URL is not configured");
					return "skipped" as const;
				}

				const body = buildSlackPayload(payload);
				const response = await fetch(webhook, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					const detail = await response.text();
					throw new Error(
						`slack webhook failed: ${response.status} ${detail}`,
					);
				}

				return "sent" as const;
			});
		} catch (error) {
			console.error("contact notify-slack failed", error);
			slack = "failed";
		}

		return { inbox, reply, slack };
	}
}
