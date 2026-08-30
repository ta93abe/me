/**
 * CMS インフラ（Alchemy v2）
 *
 * - me-images: 公開メディア（images.ta93abe.com）
 * - me-content: 非公開本文（Worker binding のみ。カスタムドメインなし）
 * - content-events: R2 md/ の create/delete で index を再構築する Queue
 * - sveltia-cms-auth: 既存 GitHub OAuth プロキシ（移行完了まで残す）
 *
 * HMAC シークレットは wrangler secret:
 *   wrangler secret put CONTENT_HMAC_SECRET
 *
 * デプロイ:
 *   GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET を環境変数（または --env-file）で渡して
 *   pnpm infra:deploy
 */
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

const SITE_ORIGIN = "https://ta93abe.com";
const AUTH_DOMAIN = "sveltia-auth.ta93abe.com";
const IMAGES_DOMAIN = "images.ta93abe.com";

export default Alchemy.Stack(
	"me-cms",
	{ providers: Cloudflare.providers(), state: Cloudflare.state() },
	Effect.gen(function* () {
		// Sveltia CMS がブラウザから直接アップロードする画像バケット。
		// CORS は AWS Signature v4 のカスタムヘッダーによるプリフライトを通すために必須。
		const content = yield* Cloudflare.R2.Bucket("Content", {
			name: "me-content",
		});

		const contentEvents = yield* Cloudflare.Queues.Queue("ContentEvents", {
			name: "content-events",
		});

		yield* Cloudflare.R2.BucketEventNotification("ContentMarkdownEvents", {
			bucketName: content.bucketName,
			queueId: contentEvents.queueId,
			rules: [
				{
					actions: [
						"PutObject",
						"CopyObject",
						"CompleteMultipartUpload",
						"DeleteObject",
					],
					prefix: "md/",
					suffix: ".md",
					description: "rebuild indexes when published markdown changes",
				},
			],
		});

		const images = yield* Cloudflare.R2.Bucket("Images", {
			name: "me-images",
			domains: [{ name: IMAGES_DOMAIN }],
			cors: [
				{
					allowedMethods: ["GET", "PUT", "HEAD"],
					allowedOrigins: [SITE_ORIGIN, "http://localhost:4321"],
					allowedHeaders: ["*"],
					exposeHeaders: ["ETag"],
					maxAgeSeconds: 3000,
				},
			],
		});

		// GitHub OAuth プロキシ（vendored sveltia-cms-auth）。
		// クライアントシークレットをブラウザに晒さないためのサーバーサイド実装。
		const auth = yield* Cloudflare.Worker("SveltiaAuth", {
			name: "sveltia-cms-auth",
			main: new URL("./sveltia-cms-auth/index.js", import.meta.url).pathname,
			domain: AUTH_DOMAIN,
			env: {
				GITHUB_CLIENT_ID: Config.string("GITHUB_CLIENT_ID"),
				GITHUB_CLIENT_SECRET: Config.redacted("GITHUB_CLIENT_SECRET"),
				// このドメイン以外からの認証要求を拒否する
				ALLOWED_DOMAINS: "ta93abe.com",
			},
		});

		return {
			authUrl: `https://${AUTH_DOMAIN}`,
			authWorkersDevUrl: auth.url,
			imagesBucket: images.bucketName,
			imagesPublicUrl: `https://${IMAGES_DOMAIN}`,
			contentBucket: content.bucketName,
			contentEventsQueue: contentEvents.queueName,
		};
	}),
);
