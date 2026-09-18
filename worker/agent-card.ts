const SITE_URL = "https://ta93abe.com";
const SITE_TITLE = "Takumi Abe / ta93abe";
const MCP_SERVER_CARD = `${SITE_URL}/.well-known/mcp/server-card.json`;
const LLMS_TXT = `${SITE_URL}/llms.txt`;

export type AgentInterface = {
	type?: string;
	url?: string;
	protocolBinding?: string;
	protocolVersion?: string;
};

export type AgentSkill = {
	id: string;
	name: string;
	description: string;
	tags: string[];
	examples?: string[];
};

export type A2AAgentCard = {
	name: string;
	description: string;
	url?: string;
	version: string;
	capabilities: {
		streaming: boolean;
		pushNotifications: boolean;
		stateTransitionHistory: boolean;
	};
	authentication: {
		schemes: string[];
	};
	defaultInputModes: string[];
	defaultOutputModes: string[];
	supportedInterfaces: AgentInterface[];
	skills: AgentSkill[];
};

export function a2aAgentCard(): A2AAgentCard {
	return {
		name: SITE_TITLE,
		description:
			`${SITE_TITLE} portfolio: blog posts, slides, tools, gadgets, and social links. ` +
			"This site does not implement A2A HTTP methods such as message/send. " +
			`Discover content via MCP (${MCP_SERVER_CARD}) or ${LLMS_TXT}.`,
		version: "1.0.0",
		capabilities: {
			streaming: false,
			pushNotifications: false,
			stateTransitionHistory: false,
		},
		authentication: {
			schemes: ["none"],
		},
		defaultInputModes: ["text"],
		defaultOutputModes: ["text"],
		supportedInterfaces: [],
		skills: [
			{
				id: "site-overview",
				name: "Site Overview",
				description:
					"Provides a concise overview of the public sections and discovery URLs on ta93abe.com. " +
					"Use MCP tool get_site_overview or GET /llms.txt. " +
					"Do not send A2A methods such as message/send to /mcp.",
				tags: ["portfolio", "blog", "discovery", "mcp"],
				examples: [
					"What is ta93abe.com?",
					"List the public sections of this site.",
				],
			},
		],
	};
}
