import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * ScrollTrigger configuration:
 * - start: "top 85%" - animation begins when element's top reaches 85% down the viewport
 * - toggleActions: "play none none reverse" - play on enter, reverse on leave
 */
export function initScrollAnimations(): void {
	// Check for reduced motion
	const prefersReducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (prefersReducedMotion) {
		// Make all elements visible without animation
		document.querySelectorAll('[data-animate="fade-up"]').forEach((el) => {
			(el as HTMLElement).style.opacity = "1";
		});
		document
			.querySelectorAll('[data-animate="stagger"]')
			.forEach((container) => {
				for (const child of container.children) {
					(child as HTMLElement).style.opacity = "1";
				}
			});
		return;
	}

	// Register ScrollTrigger
	try {
		gsap.registerPlugin(ScrollTrigger);
	} catch (error) {
		console.error("Failed to register ScrollTrigger plugin:", error);
		return;
	}

	// Fade in sections
	try {
		const fadeUpElements = gsap.utils.toArray<HTMLElement>(
			'[data-animate="fade-up"]',
		);
		if (fadeUpElements.length === 0) {
			console.warn("No elements found with data-animate='fade-up'");
		}
		fadeUpElements.forEach((el) => {
			gsap.fromTo(
				el,
				{
					opacity: 0,
					y: 50,
				},
				{
					opacity: 1,
					y: 0,
					duration: 1,
					ease: "power2.out",
					scrollTrigger: {
						trigger: el,
						start: "top 85%",
						end: "top 50%",
						toggleActions: "play none none reverse",
					},
				},
			);
		});
	} catch (error) {
		console.error("Failed to setup fade-up animations:", error);
	}

	// Stagger children
	try {
		const staggerContainers = gsap.utils.toArray<HTMLElement>(
			'[data-animate="stagger"]',
		);
		if (staggerContainers.length === 0) {
			console.warn("No elements found with data-animate='stagger'");
		}
		staggerContainers.forEach((container) => {
			const children = container.children;
			if (children.length === 0) {
				console.warn("Stagger container has no children:", container);
				return;
			}
			gsap.fromTo(
				children,
				{
					opacity: 0,
					y: 30,
				},
				{
					opacity: 1,
					y: 0,
					duration: 0.6,
					stagger: 0.1,
					ease: "power2.out",
					scrollTrigger: {
						trigger: container,
						start: "top 85%",
						toggleActions: "play none none reverse",
					},
				},
			);
		});
	} catch (error) {
		console.error("Failed to setup stagger animations:", error);
	}

	// Text reveal animation
	try {
		const textRevealElements = gsap.utils.toArray<HTMLElement>(
			'[data-animate="text-reveal"]',
		);
		textRevealElements.forEach((el) => {
			gsap.fromTo(
				el,
				{
					clipPath: "inset(0 100% 0 0)",
					opacity: 0,
				},
				{
					clipPath: "inset(0 0% 0 0)",
					opacity: 1,
					duration: 1.2,
					ease: "power4.out",
					scrollTrigger: {
						trigger: el,
						start: "top 85%",
						toggleActions: "play none none reverse",
					},
				},
			);
		});
	} catch (error) {
		console.error("Failed to setup text-reveal animations:", error);
	}

	// Scale up animation
	try {
		const scaleUpElements = gsap.utils.toArray<HTMLElement>(
			'[data-animate="scale-up"]',
		);
		scaleUpElements.forEach((el) => {
			gsap.fromTo(
				el,
				{
					opacity: 0,
					scale: 0.8,
				},
				{
					opacity: 1,
					scale: 1,
					duration: 0.8,
					ease: "power2.out",
					scrollTrigger: {
						trigger: el,
						start: "top 85%",
						toggleActions: "play none none reverse",
					},
				},
			);
		});
	} catch (error) {
		console.error("Failed to setup scale-up animations:", error);
	}
}
