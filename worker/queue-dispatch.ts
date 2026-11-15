import { handlePdfQueue } from "./slides/pdf-queue.ts";
import { PDF_QUEUE_NAME, type PdfJob } from "./slides/pdf.ts";

/** Worker が消費する Queue はスライド PDF だけ。 */
export async function dispatchWorkerQueue(
	batch: MessageBatch<unknown>,
	env: Env,
): Promise<void> {
	if (batch.queue !== PDF_QUEUE_NAME) {
		throw new Error(`unknown queue: ${batch.queue}`);
	}
	await handlePdfQueue(batch as MessageBatch<PdfJob>, env);
}
