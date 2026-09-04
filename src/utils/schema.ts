import { SITE } from "@/config/site";
import linksData from "@/data/links.json";

interface PersonFields {
	"@type": "Person";
	name: string;
	url: string;
	jobTitle: string;
	description: string;
	sameAs: string[];
}

interface WebSiteSchema {
	"@context": "https://schema.org";
	"@type": "WebSite";
	name: string;
	url: string;
	description: string;
	author: PersonFields;
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
		author: personFields(siteUrl),
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

interface PersonSchema extends PersonFields {
	"@context": "https://schema.org";
}

function originBase(siteUrl: string): string {
	return siteUrl.replace(/\/+$/, "");
}

function personFields(siteUrl: string): PersonFields {
	const origin = originBase(siteUrl);
	return {
		"@type": "Person",
		name: SITE.author,
		url: `${origin}/about`,
		jobTitle: "Software Engineer",
		description: SITE.tagline,
		sameAs: linksData.links.map((link) => link.url),
	};
}

export const generatePersonSchema = (siteUrl: string): PersonSchema => ({
	"@context": "https://schema.org",
	...personFields(siteUrl),
});

/**
 * Safely stringify JSON-LD for embedding in HTML
 * Escapes < characters to prevent script injection
 */
export const stringifySchema = (schema: object): string => {
	return JSON.stringify(schema).replace(/</g, "\\u003c");
};
