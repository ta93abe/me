const DEFAULT_ORIGIN = "https://ta93abe.com";
const SITE_TITLE = "Takumi Abe / ta93abe";
const SITE_DESCRIPTION =
	"Personal portfolio site for Takumi Abe (ta93abe), including blog posts, slides, tools, gadgets, and social links.";

function originBase(origin: string): string {
	return origin.replace(/\/+$/, "");
}

export function buildSiteOverviewMarkdown(
	origin: string = DEFAULT_ORIGIN,
	blogSection = "",
): string {
	const base = originBase(origin);
	return `# ${SITE_TITLE}

${SITE_DESCRIPTION}

## Primary sections

- About: ${base}/about/
- Works: ${base}/works/
- Blog: ${base}/blog/
- Contact: ${base}/contact/
- Slides: ${base}/slides/
- Tools: ${base}/tools/
- Gadgets: ${base}/gadgets/
- Links: ${base}/links/

## Machine-readable resources

- llms.txt: ${base}/llms.txt
- Full agent notes: ${base}/llms-full.txt
- API catalog: ${base}/.well-known/api-catalog
- MCP server card: ${base}/.well-known/mcp/server-card.json
- Agent Skills index: ${base}/.well-known/agent-skills/index.json
- Authentication notes: ${base}/auth.md
- [RSS](${base}/rss.xml): Blog update feed.
- [Sitemap](${base}/sitemap-index.xml): Crawl index of public pages.

${blogSection}`;
}
