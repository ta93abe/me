import { describe, expect, it, vi } from "vitest";

import {
	handleContentQueue,
	shouldRebuildFromQueueBody,
} from "../content/queue.ts";
import { createMemoryR2 } from "./memory-r2.ts";

describe("content queue", () => {
	it("rebuilds only when md/ keys change", () => {
		expect(
			shouldRebuildFromQueueBody({
				action: "PutObject",
				object: { key: "md/blog/hello.md" },
			}),
		).toBe(true);
		expect(
			shouldRebuildFromQueueBody({
				action: "PutObject",
				object: { key: "index/blog.json" },
			}),
		).toBe(false);
	});

	it("rebuilds indexes from an object-create notification", async () => {
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

		const acked: string[] = [];
		await handleContentQueue(
			{
				messages: [
					{
						id: "1",
						timestamp: new Date(),
						attempts: 1,
						body: { action: "PutObject", object: { key: "md/blog/hello.md" } },
						ack() {
							acked.push("1");
						},
						retry() {},
					},
				],
			} as unknown as MessageBatch<unknown>,
			bucket,
		);

		expect(acked).toEqual(["1"]);
		const index = await bucket.get("index/blog.json");
		expect(index).not.toBeNull();
		const parsed = (await index!.json()) as {
			entries: Array<{ slug: string }>;
		};
		expect(parsed.entries[0]?.slug).toBe("hello");
	});

	it("resolves blog embeds for changed markdown keys", async () => {
		const bucket = createMemoryR2();
		await bucket.put(
			"md/blog/hello.md",
			`---
title: Hello
excerpt: note
publish_date: 2026-08-30
---

https://example.com
`,
		);

		const fetchImpl = vi.fn(async () => {
			return new Response(
				`<!doctype html><html><head>
<meta property="og:title" content="Example">
</head></html>`,
				{ headers: { "content-type": "text/html" } },
			);
		});
		vi.stubGlobal("fetch", fetchImpl);
		try {
			await handleContentQueue(
				{
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
				bucket,
			);

			const listed = await bucket.list({ prefix: "derived/embeds/" });
			expect(listed.objects.length).toBe(1);
			const stored = (await (await bucket.get(
				listed.objects[0]!.key,
			))!.json()) as {
				link?: { title?: string };
			};
			expect(stored.link?.title).toBe("Example");
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
