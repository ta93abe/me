import posthog from "posthog-js";

const apiKey = import.meta.env.PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost =
	import.meta.env.PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (import.meta.env.PROD && apiKey) {
	posthog.init(apiKey, {
		api_host: apiHost,
		defaults: "2026-01-30",
	});
	window.posthog = posthog;
}
