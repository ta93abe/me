import {
	scheduleWhenIdleOrInteractive,
	type IdleSchedulerHost,
} from "../posthog-boot.ts";
import { prefersReducedMotion } from "./prefs.ts";

/** Lighthouse TBT 予算内に収めるため、重い GSAP/Lenis/Paper Shaders を初回描画後に読み込む */
export const HOME_MOTION_IDLE_TIMEOUT_MS = 1200;

/** Paper Shaders は LCP 候補が乗ったあと（またはこのフォールバック）に回す */
export const HOME_BLOOM_IDLE_TIMEOUT_MS = 2000;

/** LCP 後にメインスレッドを譲る上限 */
export const HOME_BLOOM_AFTER_LCP_IDLE_MS = 400;

export type LcpSchedulerHost = IdleSchedulerHost & {
	PerformanceObserver?: typeof PerformanceObserver;
};

/**
 * 最初の LCP エントリのあと idle で callback する。
 * LCP が取れない環境では fallbackMs 後に同じ idle 経路へ落とす。
 */
export function scheduleAfterLcpOrIdle(
	callback: () => void,
	host: LcpSchedulerHost,
	fallbackMs = HOME_BLOOM_IDLE_TIMEOUT_MS,
	idleTimeoutMs = HOME_BLOOM_AFTER_LCP_IDLE_MS,
): void {
	let armed = false;
	const arm = () => {
		if (armed) return;
		armed = true;
		scheduleWhenIdleOrInteractive(callback, host, idleTimeoutMs);
	};

	const Observer = host.PerformanceObserver;
	if (typeof Observer !== "function") {
		scheduleWhenIdleOrInteractive(callback, host, fallbackMs);
		return;
	}

	try {
		const observer = new Observer((list) => {
			if (list.getEntries().length === 0) return;
			observer.disconnect();
			arm();
		});
		observer.observe({
			type: "largest-contentful-paint",
			buffered: true,
		});
		host.setTimeout(() => {
			observer.disconnect();
			arm();
		}, fallbackMs);
	} catch {
		scheduleWhenIdleOrInteractive(callback, host, fallbackMs);
	}
}

export function initHomeExperience(): void {
	if (!document.querySelector(".home-scroll")) return;
	if (prefersReducedMotion()) return;

	scheduleWhenIdleOrInteractive(
		() => {
			void bootHomeMotion();
		},
		window as unknown as IdleSchedulerHost,
		HOME_MOTION_IDLE_TIMEOUT_MS,
	);
}

async function bootHomeMotion(): Promise<void> {
	const { initHomeScroll } = await import("./scroll.ts");
	const scroll = initHomeScroll();

	let bloom: { destroy: () => void } | null = null;
	let cancelled = false;

	scheduleAfterLcpOrIdle(
		() => {
			if (cancelled) return;
			void import("./bloom.ts").then(({ initHomeBloom }) => {
				if (cancelled) return;
				bloom = initHomeBloom();
				if (bloom) {
					document.documentElement.classList.add("home-motion-ready");
				}
			});
		},
		window as unknown as LcpSchedulerHost,
		HOME_BLOOM_IDLE_TIMEOUT_MS,
	);

	window.addEventListener(
		"pagehide",
		() => {
			cancelled = true;
			bloom?.destroy();
			scroll?.destroy();
			document.documentElement.classList.remove("home-motion-ready");
		},
		{ once: true },
	);
}
