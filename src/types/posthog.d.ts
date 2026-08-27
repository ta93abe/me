import type posthog from "posthog-js";

declare global {
	interface Window {
		posthog?: typeof posthog;
		turnstile?: {
			reset: (widget?: string | HTMLElement) => void;
		};
	}
}
