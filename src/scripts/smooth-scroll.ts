import Lenis from "lenis";

let lenis: Lenis | null = null;

export function initSmoothScroll(): Lenis | null {
	// Check for reduced motion preference
	// Returns null to indicate smooth scrolling is disabled - browser's native scrolling will be used
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (prefersReducedMotion) {
		return null;
	}

	try {
		lenis = new Lenis({
			duration: 1.2, // Longer duration for smoother scrolling
			easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), // Custom easing for natural deceleration
			orientation: "vertical",
			gestureOrientation: "vertical",
			smoothWheel: true, // Apply smoothing to mouse wheel input
			wheelMultiplier: 1,
			touchMultiplier: 2, // Increased touch sensitivity for mobile
		});

		function raf(time: number) {
			try {
				lenis?.raf(time);
			} catch (error) {
				console.error("Lenis animation frame error:", error);
			}
			requestAnimationFrame(raf);
		}

		requestAnimationFrame(raf);

		return lenis;
	} catch (error) {
		console.error("Failed to initialize Lenis smooth scroll:", error);
		return null;
	}
}

export function getLenis(): Lenis | null {
	return lenis;
}

export function destroySmoothScroll(): void {
	lenis?.destroy();
	lenis = null;
}
