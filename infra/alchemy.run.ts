/**
 * CMS インフラ（Alchemy v2）
 *
 * - me-images: 公開メディア（images.ta93abe.com）
 * - me-content: 非公開。スライド PDF の置き場（Worker binding のみ。カスタムドメインなし）
 * - me-slides-pdf: スライド PDF を Browser Run で焼く Queue（max_concurrency は wrangler）
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

		const slidesPdf = yield* Cloudflare.Queues.Queue("SlidesPdf", {
			name: "me-slides-pdf",
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
			slidesPdfQueue: slidesPdf.queueName,
		};
	}),
);
