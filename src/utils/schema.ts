import { SITE } from "@/config/site";

interface WebSiteSchema {
	"@context": "https://schema.org";
	"@type": "WebSite";
	name: string;
	url: string;
	description: string;
	author: {
		"@type": "Person";
		name: string;
		url: string;
	};
	inLanguage: string;
	potentialAction?: {
		"@type": "SearchAction";
		target: {
			"@type": "EntryPoint";
			urlTemplate: string;
		};
		"query-input": string;
	};
}

interface WebSiteSchemaOptions {
	/**
	 * サイト内検索が実在する場合のみ true。
	 * 既定は false（幽霊 SearchAction を出さない）。
	 */
	includeSearchAction?: boolean;
	/** SearchAction の URL テンプレート（includeSearchAction 時） */
	searchUrlTemplate?: string;
}

/**
 * Generate WebSite JSON-LD schema
 * @param siteUrl - Base URL for the site
 * @param options - Optional configuration
 */
export const generateWebSiteSchema = (
	siteUrl: string,
	options: WebSiteSchemaOptions = {},
): WebSiteSchema => {
	const {
		includeSearchAction = false,
		searchUrlTemplate = `${siteUrl}search?q={search_term_string}`,
	} = options;

	const schema: WebSiteSchema = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE.name,
		url: siteUrl,
		description: SITE.description,
		author: {
			"@type": "Person",
			name: SITE.author,
			url: siteUrl,
		},
		inLanguage: SITE.lang,
	};

	if (includeSearchAction) {
		schema.potentialAction = {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: searchUrlTemplate,
			},
			"query-input": "required name=search_term_string",
		};
	}

	return schema;
};

/**
 * Safely stringify JSON-LD for embedding in HTML
 * Escapes < characters to prevent script injection
 */
export const stringifySchema = (schema: object): string => {
	return JSON.stringify(schema).replace(/</g, "\\u003c");
};
