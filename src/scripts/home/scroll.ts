import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { prefersReducedMotion } from "./prefs.ts";
import { splitWords } from "./split-text.ts";

export type HomeScrollHandle = {
	destroy: () => void;
};

export function initHomeScroll(): HomeScrollHandle | null {
	if (prefersReducedMotion()) return null;

	const root = document.querySelector(".home-scroll");
	if (!root) return null;

	gsap.registerPlugin(ScrollTrigger);

	const lenis = new Lenis({
		lerp: 0.085,
		smoothWheel: true,
		syncTouch: false,
	});

	lenis.on("scroll", ScrollTrigger.update);

	const onTick = (time: number) => {
		lenis.raf(time * 1000);
	};
	gsap.ticker.add(onTick);
	gsap.ticker.lagSmoothing(0);

	const scroller = document.documentElement;
	ScrollTrigger.scrollerProxy(scroller, {
		scrollTop(value?: number) {
			if (value !== undefined) {
				lenis.scrollTo(value, { immediate: true });
			}
			return lenis.scroll;
		},
		getBoundingClientRect() {
			return {
				top: 0,
				left: 0,
				width: window.innerWidth,
				height: window.innerHeight,
			};
		},
	});

	ScrollTrigger.defaults({ scroller });

	const tagline = root.querySelector<HTMLElement>(".home-hero-tagline");
	if (tagline) {
		splitWords(tagline);
		gsap.from(tagline.querySelectorAll(".home-split-word"), {
			opacity: 0,
			y: 14,
			duration: 0.75,
			stagger: 0.045,
			ease: "power2.out",
			scrollTrigger: {
				trigger: tagline,
				start: "top bottom",
				toggleActions: "play none none none",
			},
		});
	}

	const stage = root.querySelector<HTMLElement>(".home-stage");
	const stageScreen = root.querySelector<HTMLElement>(".home-stage-screen");
	if (stage && stageScreen) {
		gsap.fromTo(
			stageScreen,
			{ y: 32, opacity: 0.85 },
			{
				y: -28,
				opacity: 1,
				ease: "none",
				scrollTrigger: {
					trigger: stage,
					start: "top bottom",
					end: "bottom top",
					scrub: true,
				},
			},
		);

		const bars = root.querySelectorAll<HTMLElement>(".home-stage-bar");
		if (bars.length) {
			gsap.fromTo(
				bars,
				{ x: -20, opacity: 0.35 },
				{
					x: 24,
					opacity: 0.65,
					ease: "none",
					stagger: 0.08,
					scrollTrigger: {
						trigger: stage,
						start: "top 65%",
						end: "bottom 35%",
						scrub: true,
					},
				},
			);
		}

		ScrollTrigger.create({
			trigger: stage,
			start: "top top+=4.5rem",
			end: "+=45%",
			pin: true,
			pinSpacing: true,
			anticipatePin: 1,
		});
	}

	const manifestoInner = root.querySelector<HTMLElement>(
		".home-manifesto-inner",
	);
	if (manifestoInner) {
		const heading = manifestoInner.querySelector<HTMLElement>(
			".home-manifesto-heading",
		);
		if (heading) splitWords(heading);

		gsap.from(manifestoInner.children, {
			opacity: 0,
			y: 24,
			duration: 0.85,
			stagger: 0.1,
			ease: "power2.out",
			scrollTrigger: {
				trigger: manifestoInner,
				start: "top 80%",
				toggleActions: "play none none none",
			},
		});
	}

	const ctaSection = root.querySelector<HTMLElement>(".home-cta-section");
	if (ctaSection) {
		gsap.from(ctaSection, {
			opacity: 0,
			y: 20,
			duration: 0.7,
			ease: "power2.out",
			scrollTrigger: {
				trigger: ctaSection,
				start: "top 88%",
				toggleActions: "play none none none",
			},
		});
	}

	document.documentElement.classList.add("home-motion-ready");

	return {
		destroy: () => {
			lenis.destroy();
			gsap.ticker.remove(onTick);
			for (const trigger of ScrollTrigger.getAll()) {
				trigger.kill();
			}
			document.documentElement.classList.remove("home-motion-ready");
		},
	};
}
