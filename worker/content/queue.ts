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
): Promise<void> {
	let rebuild = false;

	for (const message of batch.messages) {
		if (shouldRebuildFromQueueBody(message.body)) {
			rebuild = true;
		}
		message.ack();
	}

	if (rebuild) {
		await rebuildContentIndexes(bucket);
	}
}
