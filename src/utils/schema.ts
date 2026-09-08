import { FEATURED_WORKS, SITE } from "@/config/site";
import linksData from "@/data/links.json";
import { withTrailingSlash } from "@/utils/canonical";

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

interface ProfilePageSchema {
	"@context": "https://schema.org";
	"@type": "ProfilePage";
	name: string;
	description: string;
	url: string;
	inLanguage: string;
	mainEntity: PersonFields;
	isPartOf: {
		"@type": "WebSite";
		name: string;
		url: string;
	};
}

interface ContactPageSchema {
	"@context": "https://schema.org";
	"@type": "ContactPage";
	name: string;
	description: string;
	url: string;
	inLanguage: string;
	mainEntity: PersonFields;
	isPartOf: {
		"@type": "WebSite";
		name: string;
		url: string;
	};
}

interface BreadcrumbListSchema {
	"@context": "https://schema.org";
	"@type": "BreadcrumbList";
	itemListElement: Array<{
		"@type": "ListItem";
		position: number;
		name: string;
		item: string;
	}>;
}

interface WorksCollectionSchema {
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
		"@type": "SoftwareSourceCode";
		name: string;
		description: string;
		url: string;
		codeRepository: string;
	}>;
}

interface LinksCollectionSchema {
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
		"@type": "WebPage";
		name: string;
		url: string;
	}>;
}

interface ToolsCollectionSchema {
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
		"@type": "SoftwareApplication";
		name: string;
		description: string;
		url: string;
	}>;
}

export type BlogCollectionItem = {
	slug: string;
	title: string;
	excerpt: string;
	date: Date | string;
};

interface BlogCollectionSchema {
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
		"@type": "BlogPosting";
		headline: string;
		description: string;
		url: string;
		datePublished: string;
	}>;
}

interface BlogPostingSchema {
	"@context": "https://schema.org";
	"@type": "BlogPosting";
	headline: string;
	description: string;
	url: string;
	inLanguage: string;
	datePublished: string;
	dateModified: string;
	author: PersonFields;
	publisher: PersonFields;
	image: string;
	mainEntityOfPage: {
		"@type": "WebPage";
		"@id": string;
	};
	isPartOf: {
		"@type": "Blog";
		name: string;
		url: string;
	};
	keywords?: string;
}

function websitePart(origin: string) {
	return {
		"@type": "WebSite" as const,
		name: SITE.name,
		url: origin,
	};
}

function toIsoDate(value: Date | string): string {
	if (value instanceof Date) {
		return value.toISOString();
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export const ABOUT_DESCRIPTION = SITE.tagline;
export const WORKS_COLLECTION_DESCRIPTION =
	"代表作。dbt-jobs、dbt-intro、enbu。";
export const BLOG_COLLECTION_DESCRIPTION =
	"技術ブログ。日々の学びや開発の記録を共有しています。";
export const CONTACT_DESCRIPTION = "SNS から連絡できます。";
export const LINKS_COLLECTION_DESCRIPTION =
	"いま更新している場所。GitHub、Zenn、X、LinkedIn、Speaker Deck、connpass、Substack。";
export const TOOLS_COLLECTION_DESCRIPTION =
	"Nix + Home Manager で管理している開発環境。毎日使っているツールと、そうしている理由。";

export const generateProfilePageSchema = (
	siteUrl: string,
	description: string = ABOUT_DESCRIPTION,
): ProfilePageSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		name: "About",
		description,
		url: `${origin}/about/`,
		inLanguage: SITE.lang,
		mainEntity: personFields(siteUrl),
		isPartOf: websitePart(origin),
	};
};

export const generateContactPageSchema = (
	siteUrl: string,
	description: string = CONTACT_DESCRIPTION,
): ContactPageSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "ContactPage",
		name: "Contact",
		description,
		url: `${origin}/contact/`,
		inLanguage: SITE.lang,
		mainEntity: personFields(siteUrl),
		isPartOf: websitePart(origin),
	};
};

export const generateBreadcrumbSchema = (
	siteUrl: string,
	crumbs: readonly { name: string; path: string }[],
): BreadcrumbListSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Home",
				item: `${origin}/`,
			},
			...crumbs.map((crumb, index) => ({
				"@type": "ListItem" as const,
				position: index + 2,
				name: crumb.name,
				item: `${origin}${withTrailingSlash(crumb.path)}`,
			})),
		],
	};
};

export const generateWorksCollectionSchema = (
	siteUrl: string,
	description: string = WORKS_COLLECTION_DESCRIPTION,
): WorksCollectionSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Works",
		description,
		url: `${origin}/works/`,
		inLanguage: SITE.lang,
		isPartOf: websitePart(origin),
		hasPart: FEATURED_WORKS.map((work) => ({
			"@type": "SoftwareSourceCode",
			name: work.title,
			description: work.excerpt,
			url: work.href,
			codeRepository: work.href,
		})),
	};
};

export const generateLinksCollectionSchema = (
	siteUrl: string,
	description: string = LINKS_COLLECTION_DESCRIPTION,
): LinksCollectionSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Links",
		description,
		url: `${origin}/links/`,
		inLanguage: SITE.lang,
		isPartOf: websitePart(origin),
		hasPart: linksData.links.map((link) => ({
			"@type": "WebPage",
			name: link.name,
			url: link.url,
		})),
	};
};

export type ToolSchemaItem = {
	name: string;
	description: string;
	url: string;
};

export const generateToolsCollectionSchema = (
	siteUrl: string,
	tools: readonly ToolSchemaItem[],
	description: string = TOOLS_COLLECTION_DESCRIPTION,
): ToolsCollectionSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Tools",
		description,
		url: `${origin}/tools/`,
		inLanguage: SITE.lang,
		isPartOf: websitePart(origin),
		hasPart: tools.map((tool) => ({
			"@type": "SoftwareApplication",
			name: tool.name,
			description: tool.description,
			url: tool.url,
		})),
	};
};

export const generateBlogCollectionSchema = (
	siteUrl: string,
	posts: readonly BlogCollectionItem[],
	description: string = BLOG_COLLECTION_DESCRIPTION,
): BlogCollectionSchema => {
	const origin = originBase(siteUrl);
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Blog",
		description,
		url: `${origin}/blog/`,
		inLanguage: SITE.lang,
		isPartOf: websitePart(origin),
		hasPart: posts.map((post) => ({
			"@type": "BlogPosting",
			headline: post.title,
			description: post.excerpt,
			url: `${origin}/blog/${post.slug}/`,
			datePublished: toIsoDate(post.date),
		})),
	};
};

export const generateBlogPostingSchema = (
	siteUrl: string,
	post: BlogCollectionItem & {
		image: string;
		updatedDate?: Date | string;
		tags?: readonly string[];
	},
): BlogPostingSchema => {
	const origin = originBase(siteUrl);
	const url = `${origin}/blog/${post.slug}/`;
	const datePublished = toIsoDate(post.date);
	const schema: BlogPostingSchema = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.excerpt,
		url,
		inLanguage: SITE.lang,
		datePublished,
		dateModified: post.updatedDate
			? toIsoDate(post.updatedDate)
			: datePublished,
		author: personFields(siteUrl),
		publisher: personFields(siteUrl),
		image: post.image,
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": url,
		},
		isPartOf: {
			"@type": "Blog",
			name: "Blog",
			url: `${origin}/blog/`,
		},
	};
	if (post.tags && post.tags.length > 0) {
		schema.keywords = post.tags.join(", ");
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
