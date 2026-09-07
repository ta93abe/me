import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { dispatchWorkerQueue } from "../queue-dispatch.ts";
import { handlePdfQueue } from "../slides/pdf-queue.ts";
import { servePdf } from "../slides/pdf-route.ts";
import { PdfWorkflow } from "../slides/pdf-workflow.ts";
import {
	deckVersion,
	PDF_ORIGIN,
	PDF_PAGE,
	PDF_QUEUE_NAME,
	PDF_QUICK_ACTION,
	parseSlidePdfSlug,
	pdfObjectKey,
	pdfWorkflowId,
	printDeckUrl,
} from "../slides/pdf.ts";
import { createMemoryR2 } from "./memory-r2.ts";

const pdfBytes = new TextEncoder().encode("%PDF-1.4 showcase");
const deckHtml = "<html>showcase deck</html>";

const html = (body: string, status = 200) =>
	new Response(body, {
		status,
		headers: { "content-type": "text/html; charset=utf-8" },
	});

const assets = {
	fetch: async (input: RequestInfo | URL) => {
		const url = new URL(input instanceof Request ? input.url : String(input));
		if (url.pathname === "/slides/showcase/index.html") {
			return html(deckHtml);
		}
		return html("missing", 404);
	},
} as Fetcher;

describe("PDF page contract", () => {
	it("uses a 16:9 page without a named paper format", () => {
		expect(PDF_PAGE).toEqual({ width: "13.333in", height: "7.5in" });
		expect(PDF_QUICK_ACTION.pdfOptions).toEqual(
			expect.objectContaining({
				printBackground: true,
				preferCSSPageSize: true,
				width: "13.333in",
				height: "7.5in",
			}),
		);
		expect("format" in PDF_QUICK_ACTION.pdfOptions).toBe(false);
		expect("landscape" in PDF_QUICK_ACTION.pdfOptions).toBe(false);
		expect(PDF_QUICK_ACTION.emulateMediaType).toBe("print");
	});

	it("points Browser Run at the public print URL", () => {
		expect(printDeckUrl(PDF_ORIGIN, "showcase")).toBe(
			"https://ta93abe.com/slides/showcase/print/",
		);
	});

	it("matches /slides/<slug>.pdf without treating the extension as a param name", () => {
		expect(parseSlidePdfSlug("/slides/showcase.pdf")).toBe("showcase");
		expect(parseSlidePdfSlug("/slides/showcase")).toBeNull();
		expect(parseSlidePdfSlug("/slides/Not_Valid.pdf")).toBeNull();
	});

	it("overrides hidden slides in print CSS so one slide is one page", () => {
		const css = readFileSync("src/slides/player/player.css", "utf8");
		const print = css.split("@media print")[1] ?? "";
		expect(print).toContain(".slide[hidden]");
		expect(print).toContain("display: flex !important");
		expect(print).toContain("size: 13.333in 7.5in;");
		expect(print).not.toContain("landscape");
		expect(css).toContain("html.is-print .slide[hidden]");
	});
});

describe("GET /slides/<slug>.pdf", () => {
	it("returns the CONTENT object when the stored version matches the deck", async () => {
		const version = await deckVersion(deckHtml);
		const content = createMemoryR2();
		await content.put(pdfObjectKey("showcase"), pdfBytes, {
			httpMetadata: { contentType: "application/pdf" },
			customMetadata: { version },
		});
		const response = await servePdf(
			new Request("https://ta93abe.com/slides/showcase.pdf"),
			{
				ASSETS: assets,
				CONTENT: content,
				PDF_QUEUE: { send: async () => undefined },
			} as unknown as Env,
			"showcase",
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/pdf");
		expect(response.headers.get("content-disposition")).toContain(
			"showcase.pdf",
		);
		expect(await response.text()).toContain("%PDF");
	});

	it("enqueues generation against production origin and returns 202 when missing", async () => {
		const sent: unknown[] = [];
		const response = await servePdf(
			new Request("https://preview.example/slides/showcase.pdf"),
			{
				ASSETS: assets,
				CONTENT: createMemoryR2(),
				PDF_QUEUE: {
					send: async (body: unknown) => {
						sent.push(body);
					},
				},
			} as unknown as Env,
			"showcase",
		);
		expect(response.status).toBe(202);
		expect(response.headers.get("retry-after")).toBe("3");
		expect(await response.json()).toEqual({
			ok: true,
			status: "generating",
			slug: "showcase",
		});
		expect(sent).toEqual([
			{
				slug: "showcase",
				origin: PDF_ORIGIN,
				version: await deckVersion(deckHtml),
			},
		]);
	});

	it("uses ASSETS 404 for unknown decks", async () => {
		const response = await servePdf(
			new Request("https://ta93abe.com/slides/no-such-deck.pdf"),
			{
				ASSETS: assets,
				CONTENT: createMemoryR2(),
				PDF_QUEUE: { send: async () => undefined },
			} as unknown as Env,
			"no-such-deck",
		);
		expect(response.status).toBe(404);
		expect(await response.text()).toContain("missing");
	});
});

describe("PdfWorkflow", () => {
	it("renders the print URL and stores the PDF in CONTENT", async () => {
		const content = createMemoryR2();
		const calls: unknown[] = [];
		const env = {
			BROWSER: {
				quickAction: async (action: string, options: { url: string }) => {
					calls.push({ action, options });
					return new Response(pdfBytes, {
						headers: { "content-type": "application/pdf" },
					});
				},
			},
			CONTENT: content,
		};
		const workflow = new PdfWorkflow(
			{} as ExecutionContext,
			env as unknown as Env,
		);
		const steps: string[] = [];
		const step = {
			do: async <T>(
				name: string,
				configOrCallback: unknown,
				maybeCallback?: () => Promise<T>,
			) => {
				steps.push(name);
				const callback =
					typeof configOrCallback === "function"
						? (configOrCallback as () => Promise<T>)
						: maybeCallback;
				if (!callback) {
					throw new Error(`missing callback for ${name}`);
				}
				return callback();
			},
		};

		const result = await workflow.run(
			{
				payload: {
					slug: "showcase",
					origin: PDF_ORIGIN,
					version: "abc123",
				},
				timestamp: new Date(),
				instanceId: "pdf-showcase-abc123",
			} as never,
			step as never,
		);

		expect(result).toEqual({ ok: true, key: pdfObjectKey("showcase") });
		expect(steps).toEqual(["render-pdf", "put-r2", "purge-cache"]);
		expect(calls).toEqual([
			{
				action: "pdf",
				options: {
					...PDF_QUICK_ACTION,
					url: "https://ta93abe.com/slides/showcase/print/",
				},
			},
		]);
		const stored = await content.get(pdfObjectKey("showcase"));
		expect(stored?.customMetadata).toEqual({
			version: "abc123",
			slug: "showcase",
		});
		expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(pdfBytes);
	});
});

describe("PDF queue", () => {
	it("starts a durable workflow per job and acks duplicates", async () => {
		const created: unknown[] = [];
		const acks: string[] = [];
		const env = {
			PDF_WORKFLOW: {
				create: async (options: { id: string }) => {
					if (
						created.some((item) => (item as { id: string }).id === options.id)
					) {
						throw new Error("instance already exists");
					}
					created.push(options);
					return { id: options.id };
				},
			},
		};
		const job = {
			slug: "showcase",
			origin: PDF_ORIGIN,
			version: "abc123",
		};
		const message = (id: string) => ({
			id,
			timestamp: new Date(),
			body: job,
			attempts: 1,
			ack: () => {
				acks.push(id);
			},
			retry: () => undefined,
		});

		await handlePdfQueue(
			{ messages: [message("m1"), message("m2")] } as never,
			env as unknown as Env,
		);

		expect(created).toEqual([
			{
				id: pdfWorkflowId("showcase", "abc123"),
				params: job,
			},
		]);
		expect(acks).toEqual(["m1", "m2"]);
	});
});

describe("worker queue dispatch", () => {
	it("keeps content-events on the blog rebuild path", async () => {
		const bucket = createMemoryR2();
		await bucket.put(
			"md/blog/hello.md",
			`---
title: Hello
excerpt: note
date: 2026-08-30
---
body
`,
		);
		await dispatchWorkerQueue(
			{
				queue: "content-events",
				messages: [
					{
						id: "1",
						timestamp: new Date(),
						attempts: 1,
						body: {
							action: "PutObject",
							object: { key: "md/blog/hello.md" },
						},
						ack() {},
						retry() {},
					},
				],
			} as unknown as MessageBatch<unknown>,
			{ CONTENT: bucket } as unknown as Env,
		);
		const index = await bucket.get("index/blog.json");
		expect(index).not.toBeNull();
	});

	it("routes me-slides-pdf to the PDF workflow", async () => {
		const created: unknown[] = [];
		await dispatchWorkerQueue(
			{
				queue: PDF_QUEUE_NAME,
				messages: [
					{
						id: "1",
						timestamp: new Date(),
						attempts: 1,
						body: {
							slug: "showcase",
							origin: PDF_ORIGIN,
							version: "abc123",
						},
						ack() {},
						retry() {},
					},
				],
			} as unknown as MessageBatch<unknown>,
			{
				PDF_WORKFLOW: {
					create: async (options: unknown) => {
						created.push(options);
					},
				},
			} as unknown as Env,
		);
		expect(created).toEqual([
			{
				id: pdfWorkflowId("showcase", "abc123"),
				params: {
					slug: "showcase",
					origin: PDF_ORIGIN,
					version: "abc123",
				},
			},
		]);
	});
});
