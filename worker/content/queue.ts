import { blogHtmlCacheUrls, blogSlugsFromMarkdownKeys } from "./blog-cache.ts";
import { discoveryCacheUrls, writeDerivedDiscovery } from "./derived.ts";
import { rebuildContentIndexes } from "./index-store.ts";
import { parseMarkdownKey } from "./keys.ts";

export type R2NotificationMessage = {
	action?: string;
	bucket?: string;
	object?: { key?: string };
};

function notificationKey(body: unknown): string | null {
	if (!body || typeof body !== "object") {
		return null;
	}

	const message = body as R2NotificationMessage & { key?: string };
	if (typeof message.object?.key === "string") {
		return message.object.key;
	}
	if (typeof message.key === "string") {
		return message.key;
	}
	return null;
}

export function shouldRebuildFromQueueBody(body: unknown): boolean {
	const key = notificationKey(body);
	return key !== null && parseMarkdownKey(key) !== null;
}

export async function handleContentQueue(
	batch: MessageBatch<unknown>,
	bucket: R2Bucket,
	options?: {
		origin?: string;
		purge?: (urls: string[]) => Promise<void>;
	},
): Promise<void> {
	let rebuild = false;
	const markdownKeys: string[] = [];

	for (const message of batch.messages) {
		if (shouldRebuildFromQueueBody(message.body)) {
			rebuild = true;
			const key = notificationKey(message.body);
			if (key) {
				markdownKeys.push(key);
			}
		}
		message.ack();
	}

	if (rebuild) {
		await rebuildContentIndexes(bucket);
		await writeDerivedDiscovery(bucket, options?.origin);
	}

	const blogSlugs = blogSlugsFromMarkdownKeys(markdownKeys);
	if ((rebuild || blogSlugs.length > 0) && options?.purge) {
		const origin = options.origin ?? "https://ta93abe.com";
		await options.purge([
			...blogHtmlCacheUrls(origin, blogSlugs),
			...discoveryCacheUrls(origin, blogSlugs),
		]);
	}
}
