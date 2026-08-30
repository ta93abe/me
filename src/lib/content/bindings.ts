export async function getContentBucket(): Promise<R2Bucket | undefined> {
	try {
		const { env } = await import("cloudflare:workers");
		const content = (env as { CONTENT?: R2Bucket }).CONTENT;
		return content;
	} catch {
		return undefined;
	}
}
