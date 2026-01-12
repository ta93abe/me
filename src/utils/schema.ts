import { SITE } from "../config/site";

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbListItem {
	"@type": "ListItem";
	position: number;
	name: string;
	item?: string;
}

interface BreadcrumbListSchema {
	"@context": "https://schema.org";
	"@type": "BreadcrumbList";
	itemListElement: BreadcrumbListItem[];
}

/**
 * Generate BreadcrumbList JSON-LD schema
 * @param items - Array of breadcrumb items with label and optional href
 * @param siteUrl - Base URL for absolute URLs
 */
export const generateBreadcrumbSchema = (
	items: BreadcrumbItem[],
	siteUrl: string,
): BreadcrumbListSchema => {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => {
			const listItem: BreadcrumbListItem = {
				"@type": "ListItem",
				position: index + 1,
				name: item.label,
			};
			// Only add item URL if href is provided (not the current page)
			if (item.href) {
				listItem.item = new URL(item.href, siteUrl).href;
			}
			return listItem;
		}),
	};
};

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
	includeSearchAction?: boolean;
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
	const { includeSearchAction = true } = options;

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
				urlTemplate: `${siteUrl}tools?q={search_term_string}`,
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
