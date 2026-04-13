interface Env {
	DEPLOY_HOOK_URL: string;
}

export default {
	async scheduled(_event, env): Promise<void> {
		const res = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
		if (!res.ok) {
			console.error(`deploy hook failed: ${res.status} ${await res.text()}`);
		}
	},
} satisfies ExportedHandler<Env>;
