import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
	POSTHOG_IDLE_TIMEOUT_MS,
	POSTHOG_INIT_OPTIONS,
	bootPostHog,
	createCaptureQueue,
	scheduleWhenIdleOrInteractive,
	type IdleSchedulerHost,
	type PostHogClient,
	type PostHogRecorder,
} from "@/scripts/posthog-boot";

function createHost(overrides: Partial<IdleSchedulerHost> = {}) {
	const listeners = new Map<string, Set<() => void>>();

	const host: IdleSchedulerHost = {
		setTimeout: vi.fn((callback: () => void, _ms: number) => {
			callback();
			return 1;
		}),
		clearTimeout: vi.fn(),
		addEventListener: vi.fn((type: string, listener: () => void) => {
			const bucket = listeners.get(type) ?? new Set();
			bucket.add(listener);
			listeners.set(type, bucket);
		}),
		removeEventListener: vi.fn((type: string, listener: () => void) => {
			listeners.get(type)?.delete(listener);
		}),
		...overrides,
	};

	return { host, listeners };
}

describe("POSTHOG_INIT_OPTIONS", () => {
	it("disables surveys and defers session recording while keeping web vitals", () => {
		expect(POSTHOG_INIT_OPTIONS.disable_surveys).toBe(true);
		expect(POSTHOG_INIT_OPTIONS.disable_session_recording).toBe(true);
		expect(POSTHOG_INIT_OPTIONS.capture_performance).toEqual({
			web_vitals: true,
			network_timing: true,
		});
		expect(POSTHOG_INIT_OPTIONS.defaults).toBe("2026-08-30");
	});
});

describe("createCaptureQueue", () => {
	it("holds captures until PostHog is ready, then flushes once", () => {
		const queue = createCaptureQueue();
		const posthog = { capture: vi.fn() };

		queue.capture("blog_post_viewed", { post_title: "Hello" });
		queue.capture("home_cta_clicked");
		expect(posthog.capture).not.toHaveBeenCalled();

		queue.flush(posthog);
		expect(posthog.capture).toHaveBeenCalledTimes(2);
		expect(posthog.capture).toHaveBeenNthCalledWith(1, "blog_post_viewed", {
			post_title: "Hello",
		});
		expect(posthog.capture).toHaveBeenNthCalledWith(
			2,
			"home_cta_clicked",
			undefined,
		);

		queue.flush(posthog);
		expect(posthog.capture).toHaveBeenCalledTimes(2);
	});
});

describe("scheduleWhenIdleOrInteractive", () => {
	it("runs on requestIdleCallback and only once", () => {
		let idleCallback: (() => void) | undefined;
		const { host, listeners } = createHost({
			requestIdleCallback: vi.fn(
				(callback: () => void, options?: { timeout: number }) => {
					expect(options?.timeout).toBe(POSTHOG_IDLE_TIMEOUT_MS);
					idleCallback = callback;
					return 7;
				},
			),
			cancelIdleCallback: vi.fn(),
			setTimeout: vi.fn(() => 1),
		});
		const run = vi.fn();

		scheduleWhenIdleOrInteractive(run, host);

		expect(run).not.toHaveBeenCalled();
		expect(host.setTimeout).not.toHaveBeenCalled();
		idleCallback?.();
		idleCallback?.();
		listeners.get("pointerdown")?.forEach((listener) => listener());

		expect(run).toHaveBeenCalledTimes(1);
		expect(host.cancelIdleCallback).toHaveBeenCalledWith(7);
		expect(host.removeEventListener).toHaveBeenCalled();
	});

	it("runs on the first pointerdown before idle", () => {
		const { host, listeners } = createHost({
			requestIdleCallback: vi.fn(() => 3),
			cancelIdleCallback: vi.fn(),
			setTimeout: vi.fn(() => 1),
		});
		const run = vi.fn();

		scheduleWhenIdleOrInteractive(run, host);
		listeners.get("pointerdown")?.forEach((listener) => listener());

		expect(run).toHaveBeenCalledTimes(1);
		expect(host.cancelIdleCallback).toHaveBeenCalledWith(3);
	});

	it("falls back to setTimeout when requestIdleCallback is missing", () => {
		let timeoutCallback: (() => void) | undefined;
		const { host } = createHost({
			setTimeout: vi.fn((callback: () => void, ms: number) => {
				expect(ms).toBe(POSTHOG_IDLE_TIMEOUT_MS);
				timeoutCallback = callback;
				return 11;
			}),
		});
		const run = vi.fn();

		scheduleWhenIdleOrInteractive(run, host);

		expect(run).not.toHaveBeenCalled();
		timeoutCallback?.();
		expect(run).toHaveBeenCalledTimes(1);
		expect(host.clearTimeout).toHaveBeenCalledWith(11);
	});
});

describe("bootPostHog", () => {
	it("inits with the deferred config and starts recording only after loaded", async () => {
		let loaded: ((client: PostHogRecorder) => void) | undefined;
		const posthog: PostHogClient = {
			init: vi.fn((_apiKey, config) => {
				loaded = config.loaded;
			}),
			capture: vi.fn(),
			startSessionRecording: vi.fn(),
		};
		const queue = createCaptureQueue();
		queue.capture("blog_post_viewed", { post_url: "/blog/hello" });
		const assignWindow = vi.fn();

		await bootPostHog({
			apiKey: "phc_test",
			apiHost: "https://us.i.posthog.com",
			load: async () => ({ posthog }),
			assignWindow,
			queue,
		});

		expect(posthog.init).toHaveBeenCalledWith(
			"phc_test",
			expect.objectContaining({
				api_host: "https://us.i.posthog.com",
				disable_surveys: true,
				disable_session_recording: true,
				capture_performance: { web_vitals: true, network_timing: true },
			}),
		);
		expect(posthog.startSessionRecording).not.toHaveBeenCalled();
		expect(assignWindow).toHaveBeenCalledWith(posthog);
		expect(posthog.capture).toHaveBeenCalledWith("blog_post_viewed", {
			post_url: "/blog/hello",
		});

		loaded?.(posthog);
		expect(posthog.startSessionRecording).toHaveBeenCalledTimes(1);
	});
});

describe("posthog entry script", () => {
	it("does not statically import posthog-js so the recorder can stay off the critical path", () => {
		const source = readFileSync(
			path.resolve(process.cwd(), "src/scripts/posthog.ts"),
			"utf8",
		);

		expect(source).not.toMatch(
			/import\s+\{[^}]*posthog[^}]*\}\s+from\s+["']posthog-js["']/,
		);
		expect(source).toMatch(/import\(\s*["']posthog-js["']\s*\)/);
		expect(source).toContain("scheduleWhenIdleOrInteractive");
	});
});
