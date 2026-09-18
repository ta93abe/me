import { getSiteOverview } from "../config/site-overview";

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
		execute: async () => getSiteOverview(),
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
