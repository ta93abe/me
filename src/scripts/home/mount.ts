import {
	scheduleWhenIdleOrInteractive,
	type IdleSchedulerHost,
} from "../posthog-boot.ts";
import { prefersReducedMotion } from "./prefs.ts";

/** Lighthouse TBT 予算内に収めるため、重い GSAP/Lenis/Three を初回描画後に読み込む */
export const HOME_MOTION_IDLE_TIMEOUT_MS = 1200;

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
	const [{ initHomeBloom }, { initHomeScroll }] = await Promise.all([
		import("./bloom.ts"),
		import("./scroll.ts"),
	]);

	const bloom = initHomeBloom();
	const scroll = initHomeScroll();

	const teardown = () => {
		bloom?.destroy();
		scroll?.destroy();
	};

	window.addEventListener("pagehide", teardown, { once: true });
}
