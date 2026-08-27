import { SITE, SITE_SAME_AS } from "@/config/site";

const originFrom = (siteUrl: string): string => siteUrl.replace(/\/$/, "");

export interface PersonSchema {
	"@context": "https://schema.org";
	"@type": "Person";
	"@id": string;
	name: string;
	alternateName: string;
	url: string;
	jobTitle: string;
	description: string;
	sameAs: string[];
	knowsAbout: string[];
}

interface WebSiteSchema {
	"@context": "https://schema.org";
	"@type": "WebSite";
	name: string;
	url: string;
	description: string;
	author: {
		"@type": "Person";
		"@id": string;
		name: string;
		url: string;
		jobTitle: string;
		sameAs: string[];
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

export const personId = (siteUrl: string): string =>
	`${originFrom(siteUrl)}/#person`;

export const personPageUrl = (siteUrl: string): string =>
	`${originFrom(siteUrl)}/about/`;

/**
 * Generate Person JSON-LD schema
 * jobTitle / sameAs / url をトップレベル Person として出す。
 */
export const generatePersonSchema = (siteUrl: string): PersonSchema => {
	const origin = originFrom(siteUrl);

	return {
		"@context": "https://schema.org",
		"@type": "Person",
		"@id": personId(origin),
		name: SITE.author,
		alternateName: SITE.alternateName,
		url: personPageUrl(origin),
		jobTitle: SITE.jobTitle,
		description: SITE.tagline,
		sameAs: [...SITE_SAME_AS],
		knowsAbout: [...SITE.interests],
	};
};

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

	const person = generatePersonSchema(siteUrl);

	const schema: WebSiteSchema = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE.name,
		url: siteUrl,
		description: SITE.description,
		author: {
			"@type": "Person",
			"@id": person["@id"],
			name: person.name,
			url: person.url,
			jobTitle: person.jobTitle,
			sameAs: person.sameAs,
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
