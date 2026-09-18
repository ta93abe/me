export const POSTHOG_IDLE_TIMEOUT_MS = 2500;

export const POSTHOG_INIT_OPTIONS = {
	defaults: "2026-08-30",
	disable_surveys: true,
	disable_session_recording: true,
	capture_performance: {
		web_vitals: true,
		network_timing: true,
	},
} as const;

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

export type IdleSchedulerHost = {
	requestIdleCallback?: (
		callback: () => void,
		options?: { timeout: number },
	) => number;
	cancelIdleCallback?: (id: number) => void;
	setTimeout: (callback: () => void, ms: number) => number;
	clearTimeout: (id: number) => void;
	addEventListener: EventTarget["addEventListener"];
	removeEventListener: EventTarget["removeEventListener"];
};

export type CaptureSink = {
	capture: (event: string, properties?: Record<string, unknown>) => void;
};

export type PostHogRecorder = {
	startSessionRecording: () => void;
};

export type PostHogInitConfig = {
	api_host: string;
	defaults: "2026-08-30";
	disable_surveys: true;
	disable_session_recording: true;
	capture_performance: {
		web_vitals: true;
		network_timing: true;
	};
	loaded?: (client: PostHogRecorder) => void;
};

export type PostHogClient = CaptureSink &
	PostHogRecorder & {
		init: (apiKey: string, config: PostHogInitConfig) => unknown;
	};

type QueuedCapture = {
	event: string;
	properties?: Record<string, unknown>;
};

export function createCaptureQueue() {
	const items: QueuedCapture[] = [];

	return {
		capture(event: string, properties?: Record<string, unknown>) {
			items.push({ event, properties });
		},
		flush(posthog: CaptureSink) {
			for (const item of items) {
				posthog.capture(item.event, item.properties);
			}
			items.length = 0;
		},
	};
}

export function scheduleWhenIdleOrInteractive(
	callback: () => void,
	host: IdleSchedulerHost,
	timeoutMs = POSTHOG_IDLE_TIMEOUT_MS,
): void {
	let ran = false;
	let idleHandle: number | undefined;
	let timeoutHandle: ReturnType<IdleSchedulerHost["setTimeout"]> | undefined;

	const run = () => {
		if (ran) {
			return;
		}
		ran = true;
		cleanup();
		callback();
	};

	function cleanup() {
		if (idleHandle !== undefined) {
			host.cancelIdleCallback?.(idleHandle);
		}
		if (timeoutHandle !== undefined) {
			host.clearTimeout(timeoutHandle);
		}
		for (const type of INTERACTION_EVENTS) {
			host.removeEventListener(type, run);
		}
	}

	if (typeof host.requestIdleCallback === "function") {
		idleHandle = host.requestIdleCallback(run, { timeout: timeoutMs });
	} else {
		timeoutHandle = host.setTimeout(run, timeoutMs);
	}

	for (const type of INTERACTION_EVENTS) {
		host.addEventListener(type, run, { once: true, passive: true });
	}
}

export async function bootPostHog(options: {
	apiKey: string;
	apiHost: string;
	load: () => Promise<{ posthog: PostHogClient }>;
	assignWindow: (client: PostHogClient) => void;
	queue: ReturnType<typeof createCaptureQueue>;
}): Promise<void> {
	const { posthog } = await options.load();
	posthog.init(options.apiKey, {
		api_host: options.apiHost,
		...POSTHOG_INIT_OPTIONS,
		loaded(client) {
			client.startSessionRecording();
		},
	});
	options.assignWindow(posthog);
	options.queue.flush(posthog);
}
