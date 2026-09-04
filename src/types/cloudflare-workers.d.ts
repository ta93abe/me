declare module "cloudflare:workers" {
	export const env: {
		CONTENT?: R2Bucket;
		IMAGES?: R2Bucket;
		CONTENT_HMAC_SECRET?: string;
		IMAGES_PUBLIC_ORIGIN?: string;
		ASSETS?: Fetcher;
		DEPLOY_HOOK_URL?: string;
		CONTENT_EVENTS?: Queue;
		TURNSTILE_SECRET?: string;
		SLACK_WEBHOOK_URL?: string;
		CONTACT_INBOX_EMAIL?: string;
		CONTACT_FROM_ADDRESS?: string;
		CONTACT_FROM_NAME?: string;
		EMAIL_INBOX?: {
			send: (message: unknown) => Promise<{ messageId: string }>;
		};
		EMAIL_REPLY?: {
			send: (message: unknown) => Promise<{ messageId: string }>;
		};
		CONTACT_WORKFLOW?: {
			create: (options: { params: unknown }) => Promise<{ id?: string }>;
		};
	};
}
