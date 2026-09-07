export type PdfJob = {
	slug: string;
	origin: string;
	version: string;
};

export const PDF_ORIGIN = "https://ta93abe.com";
export const PDF_QUEUE_NAME = "me-slides-pdf";

export const PDF_PAGE = {
	width: "13.333in",
	height: "7.5in",
} as const;

export const PDF_QUICK_ACTION = {
	cacheTTL: 0,
	emulateMediaType: "print",
	gotoOptions: {
		waitUntil: "networkidle0" as const,
		timeout: 45_000,
	},
	waitForSelector: {
		selector: "[data-print-ready]",
		visible: true as const,
	},
	viewport: {
		width: 1920,
		height: 1080,
	},
	pdfOptions: {
		printBackground: true,
		preferCSSPageSize: true,
		width: PDF_PAGE.width,
		height: PDF_PAGE.height,
		margin: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		},
	},
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PDF_PATH = /^\/slides\/([^/]+)\.pdf$/;
const DECK_PATH = /^\/slides\/([^/]+)$/;

export function pdfObjectKey(slug: string): string {
	return `derived/slides/pdf/${slug}.pdf`;
}

export function pdfStagingKey(slug: string, version: string): string {
	return `derived/slides/pdf/${slug}.${version}.partial`;
}

export function pdfWorkflowId(slug: string, version: string): string {
	const id = `pdf-${slug}-${version}`;
	return id.length <= 64 ? id : `pdf-${version}-${slug}`.slice(0, 64);
}

export function printDeckUrl(origin: string, slug: string): string {
	return `${origin.replace(/\/$/, "")}/slides/${slug}/print/`;
}

export function pdfPublicUrl(origin: string, slug: string): string {
	return `${origin.replace(/\/$/, "")}/slides/${slug}.pdf`;
}

export function parseSlidePdfSlug(pathname: string): string | null {
	const match = PDF_PATH.exec(pathname);
	if (!match) {
		return null;
	}
	const slug = match[1];
	return SLUG_PATTERN.test(slug) ? slug : null;
}

export function parseSlideDeckSlug(pathname: string): string | null {
	const match = DECK_PATH.exec(pathname);
	if (!match) {
		return null;
	}
	const slug = match[1];
	return SLUG_PATTERN.test(slug) ? slug : null;
}

export async function deckVersion(html: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(html),
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 16);
}

export function isAlreadyExistsError(error: unknown): boolean {
	return error instanceof Error && /already exists/i.test(error.message);
}

type CacheStore = { default: Cache };

export async function purgePdfCache(url: string): Promise<void> {
	if (typeof caches === "undefined") {
		return;
	}
	await (caches as unknown as CacheStore).default.delete(url);
}

export function isPrintQuery(value: string | null | undefined): boolean {
	return value !== undefined && value !== null && value !== "" && value !== "0" && value !== "false";
}
