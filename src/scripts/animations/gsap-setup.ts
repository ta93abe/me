import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

export function initGSAP(): void {
	try {
		// Register plugins
		gsap.registerPlugin(ScrollTrigger);

		// Check for reduced motion
		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (prefersReducedMotion) {
			// Disable all animations
			gsap.globalTimeline.timeScale(0);
			return;
		}

		// Configure ScrollTrigger
		ScrollTrigger.defaults({
			markers: false,
		});
	} catch (error) {
		console.error("Failed to initialize GSAP:", error);
	}
}

/**
 * Bidirectional integration between Lenis and GSAP/ScrollTrigger
 * - Lenis scroll events trigger ScrollTrigger updates
 * - GSAP ticker drives Lenis RAF loop (time converted from seconds to milliseconds)
 * - Lag smoothing disabled to prevent conflicts between animation systems
 */
export function connectLenisToScrollTrigger(lenis: Lenis): void {
	if (!lenis) {
		console.error(
			"Cannot connect Lenis to ScrollTrigger: Lenis instance is null",
		);
		return;
	}

	try {
		lenis.on("scroll", ScrollTrigger.update);

		gsap.ticker.add((time) => {
			try {
				lenis.raf(time * 1000);
			} catch (error) {
				console.error("Error in GSAP ticker Lenis integration:", error);
			}
		});

		gsap.ticker.lagSmoothing(0);
	} catch (error) {
		console.error("Failed to connect Lenis to ScrollTrigger:", error);
	}
}
