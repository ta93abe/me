export {};

declare global {
	interface Window {
		turnstile?: {
			reset: (widget?: string | HTMLElement) => void;
		};
	}
}
