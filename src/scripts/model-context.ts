type ModelContext = {
	registerTool?: (tool: unknown) => void;
	provideContext?: (context: { tools: unknown[] }) => void;
};

type NavigatorWithModelContext = Navigator & {
	modelContext?: ModelContext;
};

const modelContext = (navigator as NavigatorWithModelContext).modelContext;
if (!modelContext) {
	// no-op outside model-context capable browsers
} else {
	const siteOverviewTool = {
		name: "get_site_overview",
		description:
			"Return a concise overview of ta93abe.com, including public sections and machine-readable discovery URLs.",
		inputSchema: {
			type: "object",
			properties: {},
			additionalProperties: false,
		},
		execute: async () => ({
			site: "https://ta93abe.com/",
			sections: [
				"https://ta93abe.com/gallery/",
				"https://ta93abe.com/atelier/",
				"https://ta93abe.com/blog/",
				"https://ta93abe.com/slides/",
				"https://ta93abe.com/bookshelf/",
				"https://ta93abe.com/tools/",
				"https://ta93abe.com/links/",
			],
			discovery: {
				llms: "https://ta93abe.com/llms.txt",
				apiCatalog: "https://ta93abe.com/.well-known/api-catalog",
				mcpServerCard: "https://ta93abe.com/.well-known/mcp/server-card.json",
				agentSkills: "https://ta93abe.com/.well-known/agent-skills/index.json",
				auth: "https://ta93abe.com/auth.md",
			},
		}),
		annotations: {
			readOnlyHint: true,
		},
	};

	if (typeof modelContext.registerTool === "function") {
		modelContext.registerTool(siteOverviewTool);
	} else if (typeof modelContext.provideContext === "function") {
		modelContext.provideContext({ tools: [siteOverviewTool] });
	}
}
