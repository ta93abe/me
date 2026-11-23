import { describe, expect, it, vi } from "vitest";

import {
	HOME_BLOOM_AFTER_LCP_IDLE_MS,
	HOME_BLOOM_IDLE_TIMEOUT_MS,
	scheduleAfterLcpOrIdle,
	type LcpSchedulerHost,
} from "@/scripts/home/mount";

function createHost(overrides: Partial<LcpSchedulerHost> = {}) {
	const listeners = new Map<string, Set<() => void>>();

	const host: LcpSchedulerHost = {
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

describe("scheduleAfterLcpOrIdle", () => {
	it("runs idle work after the first LCP entry, only once", () => {
		let observerCallback:
			| ((list: PerformanceObserverEntryList) => void)
			| undefined;
		const disconnect = vi.fn();

		class FakeObserver {
			constructor(callback: (list: PerformanceObserverEntryList) => void) {
				observerCallback = callback;
			}
			observe() {}
			disconnect = disconnect;
		}

		let idleCallback: (() => void) | undefined;
		const { host } = createHost({
			PerformanceObserver:
				FakeObserver as unknown as typeof PerformanceObserver,
			requestIdleCallback: vi.fn(
				(callback: () => void, options?: { timeout: number }) => {
					expect(options?.timeout).toBe(HOME_BLOOM_AFTER_LCP_IDLE_MS);
					idleCallback = callback;
					return 4;
				},
			),
			cancelIdleCallback: vi.fn(),
			setTimeout: vi.fn(() => 9),
		});
		const run = vi.fn();

		scheduleAfterLcpOrIdle(run, host);

		expect(run).not.toHaveBeenCalled();
		observerCallback?.({
			getEntries: () => [{ startTime: 180 } as PerformanceEntry],
		} as PerformanceObserverEntryList);
		expect(disconnect).toHaveBeenCalledTimes(1);
		expect(run).not.toHaveBeenCalled();

		idleCallback?.();
		observerCallback?.({
			getEntries: () => [{ startTime: 240 } as PerformanceEntry],
		} as PerformanceObserverEntryList);
		idleCallback?.();

		expect(run).toHaveBeenCalledTimes(1);
	});

	it("falls back to idle after timeout when LCP never arrives", () => {
		const disconnect = vi.fn();
		class FakeObserver {
			observe() {}
			disconnect = disconnect;
		}

		let idleCallback: (() => void) | undefined;
		let timeoutCallback: (() => void) | undefined;
		const { host } = createHost({
			PerformanceObserver:
				FakeObserver as unknown as typeof PerformanceObserver,
			requestIdleCallback: vi.fn((callback: () => void) => {
				idleCallback = callback;
				return 2;
			}),
			cancelIdleCallback: vi.fn(),
			setTimeout: vi.fn((callback: () => void, ms: number) => {
				expect(ms).toBe(HOME_BLOOM_IDLE_TIMEOUT_MS);
				timeoutCallback = callback;
				return 8;
			}),
		});
		const run = vi.fn();

		scheduleAfterLcpOrIdle(run, host, HOME_BLOOM_IDLE_TIMEOUT_MS);
		expect(run).not.toHaveBeenCalled();

		timeoutCallback?.();
		idleCallback?.();
		expect(run).toHaveBeenCalledTimes(1);
		expect(disconnect).toHaveBeenCalled();
	});

	it("uses the idle fallback when PerformanceObserver is missing", () => {
		let idleCallback: (() => void) | undefined;
		const { host } = createHost({
			requestIdleCallback: vi.fn(
				(callback: () => void, options?: { timeout: number }) => {
					expect(options?.timeout).toBe(HOME_BLOOM_IDLE_TIMEOUT_MS);
					idleCallback = callback;
					return 5;
				},
			),
			cancelIdleCallback: vi.fn(),
			setTimeout: vi.fn(() => 1),
		});
		const run = vi.fn();

		scheduleAfterLcpOrIdle(run, host, HOME_BLOOM_IDLE_TIMEOUT_MS);
		expect(run).not.toHaveBeenCalled();
		idleCallback?.();
		expect(run).toHaveBeenCalledTimes(1);
	});
});
