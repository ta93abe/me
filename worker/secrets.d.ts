/**
 * `wrangler secret put` とダッシュボード var で渡す値。
 * wrangler.jsonc には書かないので、`wrangler types` の Env とマージする。
 */
interface Env {
	DEPLOY_HOOK_URL: string;
	CONTENT_HMAC_SECRET: string;
	TURNSTILE_SECRET: string;
	SLACK_WEBHOOK_URL: string;
	CONTACT_INBOX_EMAIL?: string;
}
