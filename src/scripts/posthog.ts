import {
	bootPostHog,
	createCaptureQueue,
	scheduleWhenIdleOrInteractive,
	type IdleSchedulerHost,
} from "./posthog-boot";

const apiKey = import.meta.env.PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost =
	import.meta.env.PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (import.meta.env.PROD && apiKey) {
	const queue = createCaptureQueue();
	window.posthog = {
		capture: (event, properties) => {
			queue.capture(event, properties);
		},
	};

	scheduleWhenIdleOrInteractive(
		() => {
			void bootPostHog({
				apiKey,
				apiHost,
				load: () => import("posthog-js"),
				assignWindow: (client) => {
					window.posthog = client;
				},
				queue,
			}).catch(() => {
				// posthog-js の読み込みに失敗してもページ動作は止めない
			});
		},
		window as unknown as IdleSchedulerHost,
	);
}
