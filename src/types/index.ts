/**
 * Type definitions for the portfolio site
 * コンテンツコレクションと共通Props型の定義
 */

import type { CollectionEntry } from "astro:content";

// =============================================================================
// Content Collection Types
// =============================================================================

export type BlogPost = CollectionEntry<"blog">;
export type Work = CollectionEntry<"works">;
export type Book = CollectionEntry<"books">;
export type About = CollectionEntry<"about">;
export type Talk = CollectionEntry<"talks">;
export type ZennArticle = CollectionEntry<"zenn">;
export type NoteArticle = CollectionEntry<"note">;
export type PodcastEpisode = CollectionEntry<"podcast">;

// =============================================================================
// SEO Types
// =============================================================================

export interface SEOProps {
	title: string;
	description: string;
	ogType?: "website" | "article" | "book" | "profile";
	ogImage?: string;
	ogImageAlt?: string;
	canonicalURL?: string;
	noindex?: boolean;
}

// =============================================================================
// Navigation Types
// =============================================================================

export interface NavLink {
	href: string;
	text: string;
	external?: boolean;
}

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

// =============================================================================
// Content Card Types
// =============================================================================

export interface CardProps {
	title: string;
	description?: string;
	href: string;
	date?: Date;
	tags?: string[];
	image?: ImageMetadata;
}

// =============================================================================
// Utility Types
// =============================================================================

/** Image metadata from Astro's image optimization */
export interface ImageMetadata {
	src: string;
	width: number;
	height: number;
	format: string;
}

/** Date range for works/projects */
export interface DateRange {
	start: Date;
	end?: Date;
}

/** Reading status for books */
export type ReadingStatus = "read" | "reading" | "stacked";

/** External article source */
export type ExternalSource = "Zenn" | "Note" | "Podcast";
