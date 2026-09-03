import { isValidSlug } from "./collections.ts";
import type { ContentIndexEntry } from "./index-store.ts";
import { readCollectionIndex } from "./index-store.ts";

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function parseOgBlogPath(pathname: string): string | null {
	const match = /^\/og\/blog\/([^/]+)\.png$/.exec(pathname);
	if (!match) {
		return null;
	}
	const slug = match[1];
	return isValidSlug(slug) ? slug : null;
}

export function ogTitleFromEntries(
	entries: ContentIndexEntry[],
	slug: string,
): string | null {
	return entries.find((entry) => entry.slug === slug)?.title ?? null;
}

export function buildBlogOgSvg(title: string): string {
	const displayTitle = title.length > 50 ? `${title.slice(0, 47)}...` : title;
	const fontSize =
		displayTitle.length > 30 ? 48 : displayTitle.length > 20 ? 56 : 64;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f6f6f4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="84" cy="84" r="24" fill="#6b4c9a"/>
  <text x="84" y="93" text-anchor="middle" font-size="24" font-weight="700" fill="#0a0a0a" font-family="ui-sans-serif, system-ui, sans-serif">T</text>
  <text x="124" y="94" font-size="24" font-weight="700" fill="#1c1b19" fill-opacity="0.8" font-family="ui-sans-serif, system-ui, sans-serif">Takumi Abe</text>
  <text x="60" y="330" font-size="${fontSize}" font-weight="700" fill="#1c1b19" font-family="ui-sans-serif, system-ui, sans-serif">${escapeXml(displayTitle)}</text>
  <text x="60" y="560" font-size="20" fill="#1c1b19" fill-opacity="0.7" font-family="ui-sans-serif, system-ui, sans-serif">Takumi Abe</text>
  <text x="1140" y="560" text-anchor="end" font-size="18" font-weight="600" fill="#6b4c9a" font-family="ui-sans-serif, system-ui, sans-serif">ta93abe.com</text>
</svg>
`;
}

export async function loadOgTitle(
	bucket: R2Bucket,
	slug: string,
): Promise<string | null> {
	const index = await readCollectionIndex(bucket, "blog");
	return ogTitleFromEntries(index.entries, slug);
}
