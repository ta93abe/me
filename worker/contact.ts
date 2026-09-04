export const CONTACT_LIMITS = {
	name: 100,
	email: 254,
	subject: 200,
	message: 5000,
} as const;

export const CONTACT_MAX_BODY_BYTES = 32_768;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TURNSTILE_SITEVERIFY =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

const ERROR_MESSAGES: Record<string, string> = {
	invalid_payload: "送信内容を確認してください。",
	payload_too_large: "送信内容が長すぎます。",
	name_required: "名前を入力してください。",
	name_too_long: "名前が長すぎます。",
	email_required: "メールアドレスを入力してください。",
	email_invalid: "メールアドレスの形式が正しくありません。",
	subject_too_long: "件名が長すぎます。",
	message_required: "本文を入力してください。",
	message_too_long: "本文が長すぎます。",
	turnstile_required: "認証を完了してください。",
	turnstile_failed: "認証に失敗しました。もう一度お試しください。",
	method_not_allowed: "このメソッドは使えません。",
	misconfigured: "フォームを受け付けられませんでした。",
	workflow_failed:
		"送信に失敗しました。しばらくしてからもう一度お試しください。",
};

export type ContactFields = {
	name: string;
	email: string;
	subject: string;
	message: string;
	turnstileToken: string;
};

export type ContactWorkflowParams = {
	name: string;
	email: string;
	subject: string;
	message: string;
	submittedAt: string;
};

export type ContactParseResult =
	| { ok: true; fields: ContactFields }
	| { ok: false; status: number; error: string };

export type ContactBindings = {
	TURNSTILE_SECRET: string;
	CONTACT_WORKFLOW: {
		create: (options: {
			params: ContactWorkflowParams;
		}) => Promise<{ id?: string }>;
	};
};

export type ContactEmailMessage = {
	from: { name: string; email: string };
	to: string;
	replyTo: string;
	subject: string;
	text: string;
	html: string;
};

export function errorMessage(code: string): string {
	return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.invalid_payload;
}

function readString(value: unknown): string {
	if (typeof value !== "string") {
		return "";
	}
	return value.trim();
}

export function parseContactFields(input: unknown): ContactParseResult {
	if (typeof input !== "object" || input === null) {
		return { ok: false, status: 400, error: "invalid_payload" };
	}

	const record = input as Record<string, unknown>;
	const name = readString(record.name);
	const email = readString(record.email);
	const subject = readString(record.subject);
	const message = readString(record.message);
	const turnstileToken = readString(
		record.turnstileToken ?? record["cf-turnstile-response"],
	);

	if (!name) {
		return { ok: false, status: 400, error: "name_required" };
	}
	if (name.length > CONTACT_LIMITS.name) {
		return { ok: false, status: 400, error: "name_too_long" };
	}
	if (!email) {
		return { ok: false, status: 400, error: "email_required" };
	}
	if (email.length > CONTACT_LIMITS.email || !EMAIL_PATTERN.test(email)) {
		return { ok: false, status: 400, error: "email_invalid" };
	}
	if (subject.length > CONTACT_LIMITS.subject) {
		return { ok: false, status: 400, error: "subject_too_long" };
	}
	if (!message) {
		return { ok: false, status: 400, error: "message_required" };
	}
	if (message.length > CONTACT_LIMITS.message) {
		return { ok: false, status: 400, error: "message_too_long" };
	}
	if (!turnstileToken) {
		return { ok: false, status: 400, error: "turnstile_required" };
	}

	return {
		ok: true,
		fields: { name, email, subject, message, turnstileToken },
	};
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function htmlParagraphs(value: string): string {
	return escapeHtml(value).replaceAll("\n", "<br />");
}

export function buildInboxEmail(input: {
	fromAddress: string;
	fromName: string;
	inboxEmail: string;
	name: string;
	email: string;
	subject: string;
	message: string;
}): ContactEmailMessage {
	const subjectLine = input.subject
		? `[Contact] ${input.subject}`
		: `[Contact] ${input.name} さんからお問い合わせ`;
	const text = [
		`名前: ${input.name}`,
		`メール: ${input.email}`,
		`件名: ${input.subject || "(なし)"}`,
		"",
		input.message,
	].join("\n");

	return {
		from: { name: input.fromName, email: input.fromAddress },
		to: input.inboxEmail,
		replyTo: input.email,
		subject: subjectLine,
		text,
		html: [
			`<p><strong>名前:</strong> ${escapeHtml(input.name)}</p>`,
			`<p><strong>メール:</strong> ${escapeHtml(input.email)}</p>`,
			`<p><strong>件名:</strong> ${escapeHtml(input.subject || "(なし)")}</p>`,
			`<p>${htmlParagraphs(input.message)}</p>`,
		].join(""),
	};
}

export function buildAutoReplyEmail(input: {
	fromAddress: string;
	fromName: string;
	name: string;
	email: string;
}): ContactEmailMessage {
	const text = [
		`${input.name} さん`,
		"",
		"お問い合わせありがとうございます。受け取りました。",
		"内容を確認し、必要であればご連絡します。",
		"",
		`— ${input.fromName}`,
		"https://ta93abe.com",
	].join("\n");

	return {
		from: { name: input.fromName, email: input.fromAddress },
		to: input.email,
		replyTo: input.fromAddress,
		subject: "お問い合わせを受け付けました",
		text,
		html: [
			`<p>${escapeHtml(input.name)} さん</p>`,
			"<p>お問い合わせありがとうございます。受け取りました。</p>",
			"<p>内容を確認し、必要であればご連絡します。</p>",
			`<p>— ${escapeHtml(input.fromName)}<br />https://ta93abe.com</p>`,
		].join(""),
	};
}

export function truncate(value: string, max: number): string {
	if (value.length <= max) {
		return value;
	}
	return `${value.slice(0, max)}…`;
}

export function slackEscape(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

export function buildSlackPayload(input: {
	name: string;
	email: string;
	subject: string;
	message: string;
	submittedAt: string;
}): {
	text: string;
	blocks: unknown[];
} {
	const preview = slackEscape(truncate(input.message, 300));
	const subject = slackEscape(input.subject || "(なし)");
	const name = slackEscape(input.name);
	const email = slackEscape(input.email);

	return {
		text: `お問い合わせ: ${input.name} <${input.email}>`,
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "新しいお問い合わせ",
					emoji: true,
				},
			},
			{
				type: "section",
				fields: [
					{ type: "mrkdwn", text: `*名前*\n${name}` },
					{ type: "mrkdwn", text: `*メール*\n${email}` },
				],
			},
			{
				type: "section",
				text: { type: "mrkdwn", text: `*件名*\n${subject}` },
			},
			{
				type: "section",
				text: { type: "mrkdwn", text: `*本文*\n${preview}` },
			},
			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: slackEscape(input.submittedAt),
					},
				],
			},
		],
	};
}

export async function verifyTurnstile(input: {
	secret: string;
	token: string;
	remoteIp?: string | null;
}): Promise<boolean> {
	const payload: Record<string, string> = {
		secret: input.secret,
		response: input.token,
	};
	if (input.remoteIp) {
		payload.remoteip = input.remoteIp;
	}

	const response = await fetch(TURNSTILE_SITEVERIFY, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		return false;
	}

	const outcome = (await response.json()) as { success?: boolean };
	return outcome.success === true;
}

function jsonResponse(
	request: Request,
	value: unknown,
	status = 200,
	extraHeaders?: HeadersInit,
): Response {
	const headers = new Headers({
		"Content-Type": "application/json; charset=utf-8",
		"X-Content-Type-Options": "nosniff",
		"Cache-Control": "no-store",
	});
	if (extraHeaders) {
		new Headers(extraHeaders).forEach((headerValue, name) => {
			headers.set(name, headerValue);
		});
	}
	const body = JSON.stringify(value);
	return new Response(request.method.toUpperCase() === "HEAD" ? null : body, {
		status,
		headers,
	});
}

function errorResponse(
	request: Request,
	error: string,
	status: number,
	extraHeaders?: HeadersInit,
): Response {
	return jsonResponse(
		request,
		{ ok: false, error, message: errorMessage(error) },
		status,
		extraHeaders,
	);
}

type ContactBodyResult =
	| { ok: true; input: unknown }
	| { ok: false; status: number; error: string };

async function readContactInput(request: Request): Promise<ContactBodyResult> {
	const contentLength = Number(request.headers.get("content-length"));
	if (
		Number.isFinite(contentLength) &&
		contentLength > CONTACT_MAX_BODY_BYTES
	) {
		return { ok: false, status: 413, error: "payload_too_large" };
	}

	const contentType = request.headers.get("content-type") ?? "";

	try {
		if (
			contentType.includes("application/x-www-form-urlencoded") ||
			contentType.includes("multipart/form-data")
		) {
			const form = await request.formData();
			return {
				ok: true,
				input: {
					name: form.get("name"),
					email: form.get("email"),
					subject: form.get("subject"),
					message: form.get("message"),
					turnstileToken:
						form.get("cf-turnstile-response") ?? form.get("turnstileToken"),
				},
			};
		}

		const text = await request.text();
		if (text.length > CONTACT_MAX_BODY_BYTES) {
			return { ok: false, status: 413, error: "payload_too_large" };
		}
		if (!text) {
			return { ok: false, status: 400, error: "invalid_payload" };
		}
		return { ok: true, input: JSON.parse(text) as unknown };
	} catch {
		return { ok: false, status: 400, error: "invalid_payload" };
	}
}

export async function handleContactRequest(
	request: Request,
	env: ContactBindings,
): Promise<Response> {
	const method = request.method.toUpperCase();
	if (method !== "POST") {
		return errorResponse(request, "method_not_allowed", 405, {
			Allow: "POST",
		});
	}

	if (!env.TURNSTILE_SECRET) {
		console.error("TURNSTILE_SECRET is not configured");
		return errorResponse(request, "misconfigured", 503);
	}

	const parsedBody = await readContactInput(request);
	if (!parsedBody.ok) {
		return errorResponse(request, parsedBody.error, parsedBody.status);
	}

	const parsed = parseContactFields(parsedBody.input);
	if (!parsed.ok) {
		return errorResponse(request, parsed.error, parsed.status);
	}

	const { fields } = parsed;
	const remoteIp = request.headers.get("CF-Connecting-IP");
	const turnstileOk = await verifyTurnstile({
		secret: env.TURNSTILE_SECRET,
		token: fields.turnstileToken,
		remoteIp,
	});
	if (!turnstileOk) {
		return errorResponse(request, "turnstile_failed", 403);
	}

	try {
		await env.CONTACT_WORKFLOW.create({
			params: {
				name: fields.name,
				email: fields.email,
				subject: fields.subject,
				message: fields.message,
				submittedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("CONTACT_WORKFLOW.create failed", error);
		return errorResponse(request, "workflow_failed", 503);
	}

	return jsonResponse(request, { ok: true });
}
