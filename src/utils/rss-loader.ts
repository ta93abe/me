import Parser from "rss-parser";

export type RSSSource = "Zenn" | "Note" | "Podcast";

interface RSSItem {
	id: string;
	title: string;
	url: string;
	publishedAt: Date;
	excerpt: string;
	source: RSSSource;
}

/**
 * Create an RSS feed loader for Astro content collections
 * @param url - The RSS feed URL
 * @param source - The source name (Zenn, Note, Podcast)
 * @param idPrefix - The prefix for generated IDs (e.g., "zenn", "note", "podcast")
 */
export const createRSSLoader = (
	url: string,
	source: RSSSource,
	idPrefix: string,
) => {
	return async (): Promise<RSSItem[]> => {
		try {
			const parser = new Parser();
			const feed = await parser.parseURL(url);

			if (!feed.items) {
				return [];
			}

			return feed.items
				.filter(
					(
						item,
					): item is typeof item & {
						title: string;
						link: string;
						pubDate: string;
					} =>
						typeof item.title === "string" &&
						typeof item.link === "string" &&
						typeof item.pubDate === "string",
				)
				.map((item, index) => ({
					id: item.guid ?? `${idPrefix}-${index}`,
					title: item.title,
					url: item.link,
					publishedAt: new Date(item.pubDate),
					excerpt: item.contentSnippet ?? item.content ?? "",
					source,
				}));
		} catch (error) {
			console.error(`Error fetching ${source} RSS feed:`, error);
			return [];
		}
	};
};
