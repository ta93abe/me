interface Env {
	DEPLOY_HOOK_URL: string;
}

export default {
	async scheduled(_event, env): Promise<void> {
		try {
			const res = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
			if (!res.ok) {
				console.error(
					`deploy hook failed: ${res.status} ${await res.text()}`,
				);
			}
		} catch (error) {
			console.error("deploy hook request failed", error);
		}
	},
} satisfies ExportedHandler<Env>;
