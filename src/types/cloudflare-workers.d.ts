declare module "cloudflare:workers" {
	export const env: {
		CONTENT?: R2Bucket;
		ASSETS?: Fetcher;
		DEPLOY_HOOK_URL?: string;
		BROWSER?: {
			quickAction(
				action: "pdf",
				options: Record<string, unknown>,
			): Promise<Response>;
		};
		PDF_QUEUE?: Queue;
		PDF_WORKFLOW?: Workflow;
	};
}
