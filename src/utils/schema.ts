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

export type SlideDeckListItem = {
	slug: string;
	title: string;
	description: string;
	date: string;
};

interface CollectionPageSchema {
	"@context": "https://schema.org";
	"@type": "CollectionPage";
	name: string;
	description: string;
	url: string;
	inLanguage: string;
	isPartOf: {
		"@type": "WebSite";
		name: string;
		url: string;
	};
	hasPart: Array<{
		"@type": "PresentationDigitalDocument";
		name: string;
		description: string;
		url: string;
		datePublished: string;
	}>;
}

interface SlideDeckSchema {
	"@context": "https://schema.org";
	"@type": "PresentationDigitalDocument";
	name: string;
	description: string;
	url: string;
	inLanguage: string;
	datePublished: string;
	author: PersonFields;
	image: string;
	isPartOf: {
		"@type": "CollectionPage";
		name: string;
		url: string;
	};
	encoding: {
		"@type": "MediaObject";
		encodingFormat: "application/pdf";
		contentUrl: string;
	};
}

export const SLIDES_COLLECTION_DESCRIPTION =
	"登壇やLTで使用したスライドの一覧です。";

export const generateSlidesCollectionSchema = (
	siteUrl: string,
	decks: readonly SlideDeckListItem[],
	description: string = SLIDES_COLLECTION_DESCRIPTION,
): CollectionPageSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Slides",
		description,
		url: `${origin}/slides/`,
		inLanguage: SITE.lang,
		isPartOf: {
			"@type": "WebSite",
			name: SITE.name,
			url: origin,
		},
		hasPart: decks.map((deck) => ({
			"@type": "PresentationDigitalDocument",
			name: deck.title,
			description: deck.description,
			url: `${origin}/slides/${deck.slug}/`,
			datePublished: deck.date,
		})),
	};
};

export const generateSlideDeckSchema = (
	siteUrl: string,
	deck: SlideDeckListItem,
): SlideDeckSchema => {
	const origin = originBase(siteUrl);
	const url = `${origin}/slides/${deck.slug}/`;
	return {
		"@context": "https://schema.org",
		"@type": "PresentationDigitalDocument",
		name: deck.title,
		description: deck.description,
		url,
		inLanguage: SITE.lang,
		datePublished: deck.date,
		author: personFields(siteUrl),
		image: `${origin}/og/slides/${deck.slug}.png`,
		isPartOf: {
			"@type": "CollectionPage",
			name: "Slides",
			url: `${origin}/slides/`,
		},
		encoding: {
			"@type": "MediaObject",
			encodingFormat: "application/pdf",
			contentUrl: `${origin}/slides/${deck.slug}.pdf`,
		},
	};
};

/**
 * Safely stringify JSON-LD for embedding in HTML
 * Escapes < characters to prevent script injection
 */
export const stringifySchema = (schema: object): string => {
	return JSON.stringify(schema).replace(/</g, "\\u003c");
};
