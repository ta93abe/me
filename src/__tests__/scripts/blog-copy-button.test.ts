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

	it("does not announce success when clipboard write fails", async () => {
		const writeText = vi.fn().mockRejectedValue(new Error("denied"));
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});

		const root = document.createElement("div");
		root.innerHTML = `<pre><code>foo: bar</code></pre>`;
		enhanceCodeCopyButtons(root as unknown as CopyRoot);

		const button = root.querySelector("button.copy-button");
		button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		await Promise.resolve();
		await Promise.resolve();

		expect(button?.getAttribute("aria-label")).toBe("コードをコピー");
		expect(root.querySelector("#blog-copy-status")?.textContent).toBe("");
	});

	it("keeps the latest copied announcement for two seconds", async () => {
		vi.useFakeTimers();
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});

		const root = document.createElement("div");
		root.innerHTML = `<pre><code>one</code></pre><pre><code>two</code></pre>`;
		enhanceCodeCopyButtons(root as unknown as CopyRoot);

		const [first, second] = root.querySelectorAll("button.copy-button");
		first?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		await Promise.resolve();
		await Promise.resolve();
		await vi.advanceTimersByTimeAsync(1000);
		second?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		await Promise.resolve();
		await Promise.resolve();

		expect(root.querySelector("#blog-copy-status")?.textContent).toBe(
			"コピーしました",
		);
		await vi.advanceTimersByTimeAsync(1000);
		expect(first?.getAttribute("aria-label")).toBe("コードをコピー");
		expect(second?.getAttribute("aria-label")).toBe("コピーしました");
		expect(root.querySelector("#blog-copy-status")?.textContent).toBe(
			"コピーしました",
		);
		await vi.advanceTimersByTimeAsync(1000);
		expect(second?.getAttribute("aria-label")).toBe("コードをコピー");
		expect(root.querySelector("#blog-copy-status")?.textContent).toBe("");
	});
});
