import { initHomeBloom } from "./bloom.ts";
import { prefersReducedMotion } from "./prefs.ts";
import { initHomeScroll } from "./scroll.ts";

export function initHomeExperience(): void {
	if (!document.querySelector(".home-scroll")) return;
	if (prefersReducedMotion()) return;

	const bloom = initHomeBloom();
	const scroll = initHomeScroll();

	const teardown = () => {
		bloom?.destroy();
		scroll?.destroy();
	};

	window.addEventListener("pagehide", teardown, { once: true });
}
