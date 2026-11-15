/**
 * CMS インフラ（Alchemy v2）
 *
 * - me-images: 公開メディア（images.ta93abe.com）
 * - me-content: 非公開本文（Worker binding のみ。カスタムドメインなし）
 * - content-events: R2 md/ の create/delete で index を再構築する Queue
 * - me-slides-pdf: スライド PDF を Browser Run で焼く Queue（max_concurrency は wrangler）
 *
 * HMAC シークレットは wrangler secret:
 *   wrangler secret put CONTENT_HMAC_SECRET
 *
 * デプロイ:
 *   pnpm infra:deploy
 */
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

const SITE_ORIGIN = "https://ta93abe.com";
const IMAGES_DOMAIN = "images.ta93abe.com";

export default Alchemy.Stack(
	"me-cms",
	{ providers: Cloudflare.providers(), state: Cloudflare.state() },
	Effect.gen(function* () {
		const content = yield* Cloudflare.R2.Bucket("Content", {
			name: "me-content",
		});

		const contentEvents = yield* Cloudflare.Queues.Queue("ContentEvents", {
			name: "content-events",
		});

		const slidesPdf = yield* Cloudflare.Queues.Queue("SlidesPdf", {
			name: "me-slides-pdf",
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

		// 公開メディア。CORS はブラウザからの直アップロード（記事の添付）のプリフライト用。
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

		return {
			imagesBucket: images.bucketName,
			imagesPublicUrl: `https://${IMAGES_DOMAIN}`,
			contentBucket: content.bucketName,
			contentEventsQueue: contentEvents.queueName,
			slidesPdfQueue: slidesPdf.queueName,
		};
	}),
);
