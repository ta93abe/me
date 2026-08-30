declare module "cloudflare:workers" {
	export const env: {
		CONTENT?: R2Bucket;
		IMAGES?: R2Bucket;
		CONTENT_HMAC_SECRET?: string;
		IMAGES_PUBLIC_ORIGIN?: string;
		ASSETS?: Fetcher;
		DEPLOY_HOOK_URL?: string;
		CONTENT_EVENTS?: Queue;
	};
}
