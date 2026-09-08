import { handleContentQueue } from "./content/queue.ts";
import { PDF_QUEUE_NAME, type PdfJob } from "./slides/pdf.ts";
import { handlePdfQueue } from "./slides/pdf-queue.ts";

export async function dispatchWorkerQueue(
	batch: MessageBatch<unknown>,
	env: Env,
	options?: {
		origin: string;
		purge: (urls: string[]) => Promise<void>;
	},
): Promise<void> {
	if (batch.queue === PDF_QUEUE_NAME) {
		await handlePdfQueue(batch as MessageBatch<PdfJob>, env);
		return;
	}

	await handleContentQueue(batch, env.CONTENT, options);
}
