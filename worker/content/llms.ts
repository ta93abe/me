const DEFAULT_ORIGIN = "https://ta93abe.com";

export type LlmsFileListItem = {
	name: string;
	path: string;
	description: string;
};

export const LLMS_SITE_TITLE = "Takumi Abe / ta93abe";
export const LLMS_SITE_DESCRIPTION =
	"Personal portfolio site for Takumi Abe (ta93abe), including blog posts, slides, tools, gadgets, and social links.";

export const LLMS_PRIMARY_SECTIONS: readonly LlmsFileListItem[] = [
	{
		name: "About",
		path: "/about/",
		description: "Profile of Takumi Abe.",
	},
	{
		name: "Works",
		path: "/works/",
		description: "Featured software projects.",
	},
	{
		name: "Blog",
		path: "/blog/",
		description: "Technical notes and development logs.",
	},
	{
		name: "Contact",
		path: "/contact/",
		description: "How to get in touch.",
	},
	{
		name: "Slides",
		path: "/slides/",
		description: "Public talk and lightning-talk decks.",
	},
	{
		name: "Tools",
		path: "/tools/",
		description: "Development tools in daily use.",
	},
	{
		name: "Gadgets",
		path: "/gadgets/",
		description: "Hardware and everyday objects.",
	},
	{
		name: "Links",
		path: "/links/",
		description: "Social and publishing profiles.",
	},
];

export const LLMS_MACHINE_RESOURCES: readonly LlmsFileListItem[] = [
	{
		name: "llms.txt",
		path: "/llms.txt",
		description: "Concise site overview for agents.",
	},
	{
		name: "Full agent notes",
		path: "/llms-full.txt",
		description:
			"Same overview plus agent guidance and content-usage preference.",
	},
	{
		name: "API catalog",
		path: "/.well-known/api-catalog",
		description: "Machine-readable API catalog.",
	},
	{
		name: "ARD capability manifest",
		path: "/.well-known/ai-catalog.json",
		description: "Agentic Resource Discovery capability manifest.",
	},
	{
		name: "MCP server card",
		path: "/.well-known/mcp/server-card.json",
		description: "MCP server discovery card.",
	},
	{
		name: "Agent Skills index",
		path: "/.well-known/agent-skills/index.json",
		description: "Agent Skills discovery index.",
	},
	{
		name: "Authentication notes",
		path: "/auth.md",
		description: "Public-read authentication notes for agents.",
	},
];

function originBase(origin: string): string {
	return origin.replace(/\/+$/, "");
}

export function formatLlmsFileListItem(
	item: LlmsFileListItem,
	origin: string = DEFAULT_ORIGIN,
): string {
	return `- [${item.name}](${originBase(origin)}${item.path}): ${item.description}`;
}

function formatFileList(
	items: readonly LlmsFileListItem[],
	origin: string,
): string {
	return items.map((item) => formatLlmsFileListItem(item, origin)).join("\n");
}

export function buildLlmsOverviewMarkdown(
	origin: string,
	blogSection: string,
): string {
	const base = originBase(origin);
	return `# ${LLMS_SITE_TITLE}

${LLMS_SITE_DESCRIPTION}

## Primary sections

${formatFileList(LLMS_PRIMARY_SECTIONS, base)}

## Machine-readable resources

${formatFileList(LLMS_MACHINE_RESOURCES, base)}

${blogSection}`;
}

function buildLlmsGuidance(options: {
	siteUrl: string;
	siteHost: string;
	contentSignal: string;
}): string {
	const siteUrl = originBase(options.siteUrl);
	return `## Agent guidance

- This is a public content site. No authentication is required to read the public pages.
- Prefer canonical URLs on ${options.siteHost}.
- Use the sitemap at ${siteUrl}/sitemap.xml for crawl discovery.
- Respect robots.txt and Content-Signal directives.

## Content usage preference

Content-Signal: ${options.contentSignal}
`;
}

export function buildLlmsFullText(
	overview: string,
	options: {
		siteUrl: string;
		siteHost: string;
		contentSignal: string;
	},
): string {
	return `${overview}\n${buildLlmsGuidance(options)}`;
}
