export function buildSiteOverviewMarkdown(options: {
	siteUrl: string;
	siteTitle: string;
	siteDescription: string;
}): string {
	const { siteUrl, siteTitle, siteDescription } = options;
	return `# ${siteTitle}

${siteDescription}

## Primary sections

- About: ${siteUrl}/about/
- Works: ${siteUrl}/works/
- Blog: ${siteUrl}/blog/
- Contact: ${siteUrl}/contact/
- Slides: ${siteUrl}/slides/
- Tools: ${siteUrl}/tools/
- Gadgets: ${siteUrl}/gadgets/
- Links: ${siteUrl}/links/

## Machine-readable resources

- llms.txt: ${siteUrl}/llms.txt
- Full agent notes: ${siteUrl}/llms-full.txt
- API catalog: ${siteUrl}/.well-known/api-catalog
- MCP server card: ${siteUrl}/.well-known/mcp/server-card.json
- [A2A Agent Card](${siteUrl}/.well-known/agent-card.json): A2A Agent Card for agent-to-agent discovery.
- Agent Skills index: ${siteUrl}/.well-known/agent-skills/index.json
- Authentication notes: ${siteUrl}/auth.md
`;
}
