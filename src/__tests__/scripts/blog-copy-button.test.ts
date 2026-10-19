/// <reference lib="dom" />
import { afterEach, describe, expect, it, vi } from "vitest";

import { enhanceCodeCopyButtons } from "@/scripts/blog-copy-button";

type CopyRoot = Parameters<typeof enhanceCodeCopyButtons>[0];

describe("enhanceCodeCopyButtons", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("names the copy button and announces the copied state", async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});

		const root = document.createElement("div");
		root.innerHTML = `<pre><code>foo: bar</code></pre>`;
		const copyRoot = root as unknown as CopyRoot;
		enhanceCodeCopyButtons(copyRoot);

		const button = root.querySelector("button.copy-button");
		expect(button).toBeTruthy();
		expect(button?.getAttribute("aria-label")).toBe("コードをコピー");
		expect(button?.getAttribute("type")).toBe("button");

		button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		await Promise.resolve();
		await Promise.resolve();

		expect(writeText).toHaveBeenCalledWith("foo: bar");
		expect(button?.getAttribute("aria-label")).toBe("コピーしました");
		expect(root.querySelector("#blog-copy-status")?.textContent).toBe(
			"コピーしました",
		);

		await vi.advanceTimersByTimeAsync(2000);
		expect(button?.getAttribute("aria-label")).toBe("コードをコピー");
		expect(root.querySelector("#blog-copy-status")?.textContent).toBe("");
	});
});
