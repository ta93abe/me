import type { LinkCardData } from "./link-card.ts";
import type { TweetEmbedData } from "./tweet.ts";
import type { YoutubeEmbedData } from "./youtube.ts";

export const EMBED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type BlogEmbedTweet = {
	kind: "tweet";
	id: string;
	href: string;
};

export type BlogEmbedYoutube = {
	kind: "youtube";
	id: string;
	href: string;
};

export type BlogEmbedLink = {
	kind: "link";
	href: string;
};

export type BlogEmbed = BlogEmbedTweet | BlogEmbedYoutube | BlogEmbedLink;

export type EmbedCacheRecord = {
	url: string;
	kind: "link" | "tweet" | "youtube";
	fetchedAt: string;
	expiresAt: string;
	link?: LinkCardData;
	tweet?: TweetEmbedData | null;
	youtube?: YoutubeEmbedData | null;
};

export type EmbedLookups = {
	tweets: Map<string, TweetEmbedData | null>;
	videos: Map<string, YoutubeEmbedData | null>;
	links: Map<string, LinkCardData>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function nonEmptyString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}

export async function embedObjectKey(url: string): Promise<string> {
	return `derived/embeds/${await sha256Hex(url)}.json`;
}

export function isFreshEmbed(
	record: EmbedCacheRecord,
	now: Date = new Date(),
): boolean {
	return Date.parse(record.expiresAt) > now.getTime();
}

function parseLinkData(value: unknown): LinkCardData | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const href = nonEmptyString(value.href);
	const title = typeof value.title === "string" ? value.title : undefined;
	const description =
		typeof value.description === "string" ? value.description : undefined;
	const domain = typeof value.domain === "string" ? value.domain : undefined;
	const favicon = typeof value.favicon === "string" ? value.favicon : undefined;
	if (!href || title === undefined || description === undefined || !domain) {
		return undefined;
	}
	const image =
		typeof value.image === "string" && value.image.startsWith("https:")
			? value.image
			: undefined;
	return {
		href,
		title,
		description,
		image,
		domain,
		favicon: favicon ?? "",
	};
}

function parseTweetData(value: unknown): TweetEmbedData | null | undefined {
	if (value === null) {
		return null;
	}
	if (!isRecord(value)) {
		return undefined;
	}
	const id = nonEmptyString(value.id);
	const url = nonEmptyString(value.url);
	const text = typeof value.text === "string" ? value.text : undefined;
	const createdAt = nonEmptyString(value.createdAt);
	const author = isRecord(value.author) ? value.author : null;
	const name = author ? nonEmptyString(author.name) : undefined;
	const screenName = author ? nonEmptyString(author.screenName) : undefined;
	if (!id || !url || text === undefined || !createdAt || !name || !screenName) {
		return undefined;
	}
	return value as TweetEmbedData;
}

function parseYoutubeData(value: unknown): YoutubeEmbedData | null | undefined {
	if (value === null) {
		return null;
	}
	if (!isRecord(value)) {
		return undefined;
	}
	const id = nonEmptyString(value.id);
	const url = nonEmptyString(value.url);
	const title = typeof value.title === "string" ? value.title : undefined;
	const authorName =
		typeof value.authorName === "string" ? value.authorName : undefined;
	const thumbnailUrl = nonEmptyString(value.thumbnailUrl);
	if (!id || !url || title === undefined || authorName === undefined) {
		return undefined;
	}
	return {
		id,
		url,
		title,
		authorName,
		thumbnailUrl: thumbnailUrl ?? "",
	};
}

export function parseEmbedRecord(value: unknown): EmbedCacheRecord | null {
	if (!isRecord(value)) {
		return null;
	}
	const url = nonEmptyString(value.url);
	const kind =
		value.kind === "link" || value.kind === "tweet" || value.kind === "youtube"
			? value.kind
			: null;
	const fetchedAt = nonEmptyString(value.fetchedAt);
	const expiresAt = nonEmptyString(value.expiresAt);
	if (!url || !kind || !fetchedAt || !expiresAt) {
		return null;
	}

	const record: EmbedCacheRecord = {
		url,
		kind,
		fetchedAt,
		expiresAt,
	};
	if (kind === "link") {
		record.link = parseLinkData(value.link);
	}
	if (kind === "tweet" && "tweet" in value) {
		const tweet = parseTweetData(value.tweet);
		if (tweet !== undefined) {
			record.tweet = tweet;
		}
	}
	if (kind === "youtube" && "youtube" in value) {
		const youtube = parseYoutubeData(value.youtube);
		if (youtube !== undefined) {
			record.youtube = youtube;
		}
	}
	return record;
}

export async function loadEmbedLookups(
	bucket: R2Bucket,
	embeds: BlogEmbed[],
): Promise<EmbedLookups> {
	const tweets = new Map<string, TweetEmbedData | null>();
	const videos = new Map<string, YoutubeEmbedData | null>();
	const links = new Map<string, LinkCardData>();

	await Promise.all(
		embeds.map(async (embed) => {
			const object = await bucket.get(await embedObjectKey(embed.href));
			if (!object) {
				return;
			}
			let payload: unknown;
			try {
				payload = await object.json();
			} catch {
				return;
			}
			const record = parseEmbedRecord(payload);
			if (!record) {
				return;
			}
			if (embed.kind === "tweet" && record.kind === "tweet") {
				tweets.set(embed.id, record.tweet ?? null);
			}
			if (embed.kind === "youtube" && record.kind === "youtube") {
				videos.set(embed.id, record.youtube ?? null);
			}
			if (embed.kind === "link" && record.kind === "link" && record.link) {
				links.set(embed.href, record.link);
			}
		}),
	);

	return { tweets, videos, links };
}
