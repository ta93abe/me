import {
	isContentCollection,
	isValidSlug,
	MAX_MARKDOWN_BYTES,
	MAX_MEDIA_BYTES,
} from "./collections.ts";
import type { ContentBindings } from "./env.ts";
import { looksLikeMdx, parseMarkdownDocument } from "./frontmatter.ts";
import { verifyContentHmac } from "./hmac.ts";
import {
	readAllIndex,
	readCollectionIndex,
	rebuildContentIndexes,
} from "./index-store.ts";
import { markdownKey, mediaObjectKey, sanitizeFilename } from "./keys.ts";
import { contentJsonSchema, validateFrontmatter } from "./schema.ts";

function jsonResponse(
	request: Request,
	value: unknown,
	init: ResponseInit = {},
): Response {
	const headers = new Headers(init.headers);
	headers.set("Content-Type", "application/json; charset=utf-8");
	const isHead = request.method.toUpperCase() === "HEAD";
	return new Response(isHead ? null : JSON.stringify(value, null, 2), {
		...init,
		headers,
	});
}

function textResponse(
	request: Request,
	body: string,
	contentType: string,
	init: ResponseInit = {},
): Response {
	const headers = new Headers(init.headers);
	headers.set("Content-Type", contentType);
	const isHead = request.method.toUpperCase() === "HEAD";
	return new Response(isHead ? null : body, { ...init, headers });
}

function errorResponse(
	request: Request,
	status: number,
	error: string,
	extra: Record<string, unknown> = {},
): Response {
	return jsonResponse(request, { error, ...extra }, { status });
}

async function requireHmac(
	request: Request,
	env: ContentBindings,
	pathname: string,
	body: string | Uint8Array,
): Promise<Response | null> {
	const verified = await verifyContentHmac({
		secret: env.CONTENT_HMAC_SECRET,
		pathname,
		body,
		headers: request.headers,
	});
	if (verified.ok) {
		return null;
	}
	return errorResponse(request, verified.status, verified.error);
}

function parseCollectionSlug(
	request: Request,
	collection: string,
	slug: string,
): Response | null {
	if (!isContentCollection(collection)) {
		return errorResponse(request, 400, "unknown collection", {
			collection,
		});
	}
	if (!isValidSlug(slug)) {
		return errorResponse(request, 400, "invalid slug", {
			slug,
			pattern: "^[a-z0-9][a-z0-9-]{0,80}$",
		});
	}
	return null;
}

async function handlePut(
	request: Request,
	env: ContentBindings,
	pathname: string,
	collection: string,
	slug: string,
): Promise<Response> {
	const invalid = parseCollectionSlug(request, collection, slug);
	if (invalid) {
		return invalid;
	}
	if (!isContentCollection(collection) || !isValidSlug(slug)) {
		return errorResponse(request, 400, "invalid collection or slug");
	}

	const body = await request.text();
	const authError = await requireHmac(request, env, pathname, body);
	if (authError) {
		return authError;
	}

	if (new TextEncoder().encode(body).byteLength > MAX_MARKDOWN_BYTES) {
		return errorResponse(request, 400, "markdown exceeds 512 KiB");
	}
	if (looksLikeMdx(body)) {
		return errorResponse(request, 400, "mdx is not accepted in v1");
	}

	let parsed: ReturnType<typeof parseMarkdownDocument>;
	try {
		parsed = parseMarkdownDocument(body);
	} catch (error) {
		return errorResponse(
			request,
			400,
			error instanceof Error ? error.message : "invalid markdown",
		);
	}

	const validated = validateFrontmatter(collection, parsed.frontmatter);
	if (!validated.ok) {
		return errorResponse(request, 400, validated.error, {
			issues: validated.issues,
		});
	}

	await env.CONTENT.put(markdownKey(collection, slug), body, {
		httpMetadata: { contentType: "text/markdown; charset=utf-8" },
	});
	const index = await rebuildContentIndexes(env.CONTENT);

	return jsonResponse(request, {
		ok: true,
		collection,
		slug,
		key: markdownKey(collection, slug),
		indexGeneratedAt: index.generatedAt,
	});
}

async function handleGet(
	request: Request,
	env: ContentBindings,
	collection: string,
	slug: string,
): Promise<Response> {
	const invalid = parseCollectionSlug(request, collection, slug);
	if (invalid) {
		return invalid;
	}
	if (!isContentCollection(collection) || !isValidSlug(slug)) {
		return errorResponse(request, 400, "invalid collection or slug");
	}

	const object = await env.CONTENT.get(markdownKey(collection, slug));
	if (!object) {
		return errorResponse(request, 404, "not found");
	}

	const markdown = await object.text();
	return textResponse(request, markdown, "text/markdown; charset=utf-8", {
		headers: {
			ETag: object.httpEtag,
			"Last-Modified": object.uploaded.toUTCString(),
		},
	});
}

async function handleDelete(
	request: Request,
	env: ContentBindings,
	pathname: string,
	collection: string,
	slug: string,
): Promise<Response> {
	const invalid = parseCollectionSlug(request, collection, slug);
	if (invalid) {
		return invalid;
	}
	if (!isContentCollection(collection) || !isValidSlug(slug)) {
		return errorResponse(request, 400, "invalid collection or slug");
	}

	const body = await request.text();
	const authError = await requireHmac(request, env, pathname, body);
	if (authError) {
		return authError;
	}

	const key = markdownKey(collection, slug);
	const existing = await env.CONTENT.get(key);
	if (!existing) {
		return errorResponse(request, 404, "not found");
	}

	await env.CONTENT.delete(key);
	const index = await rebuildContentIndexes(env.CONTENT);
	return jsonResponse(request, {
		ok: true,
		deleted: key,
		indexGeneratedAt: index.generatedAt,
	});
}

async function handleMedia(
	request: Request,
	env: ContentBindings,
	pathname: string,
	collection: string,
	slug: string,
): Promise<Response> {
	const invalid = parseCollectionSlug(request, collection, slug);
	if (invalid) {
		return invalid;
	}
	if (!isContentCollection(collection) || !isValidSlug(slug)) {
		return errorResponse(request, 400, "invalid collection or slug");
	}

	const bytes = new Uint8Array(await request.arrayBuffer());
	const authError = await requireHmac(request, env, pathname, bytes);
	if (authError) {
		return authError;
	}

	if (bytes.byteLength === 0) {
		return errorResponse(request, 400, "media body is empty");
	}
	if (bytes.byteLength > MAX_MEDIA_BYTES) {
		return errorResponse(request, 400, "media exceeds 20 MiB");
	}

	const filename = sanitizeFilename(request.headers.get("X-Filename") ?? "");
	if (!filename) {
		return errorResponse(
			request,
			400,
			"X-Filename is required and must be a safe name",
		);
	}

	const objectKey = mediaObjectKey(collection, slug, filename);
	const contentType =
		request.headers.get("Content-Type") ?? "application/octet-stream";
	await env.IMAGES.put(objectKey, bytes, {
		httpMetadata: { contentType },
	});

	const origin = env.IMAGES_PUBLIC_ORIGIN.replace(/\/+$/, "");
	return jsonResponse(request, {
		ok: true,
		key: objectKey,
		url: `${origin}/${objectKey}`,
	});
}

export async function handleContentApi(
	request: Request,
	env: ContentBindings,
): Promise<Response | null> {
	const url = new URL(request.url);
	const pathname = url.pathname.replace(/\/+$/, "") || "/";
	if (!pathname.startsWith("/api/content")) {
		return null;
	}

	const method = request.method.toUpperCase();
	const segments = pathname.split("/").filter(Boolean);

	if (segments.length === 2 && segments[1] === "content" && method === "GET") {
		return jsonResponse(request, {
			ok: true,
			endpoints: [
				"GET /api/content/schema",
				"GET /api/content/index",
				"GET /api/content/index/:collection",
				"GET /api/content/:collection/:slug",
				"PUT /api/content/:collection/:slug",
				"DELETE /api/content/:collection/:slug",
				"POST /api/content/:collection/:slug/media",
			],
		});
	}

	if (segments[2] === "schema" && segments.length === 3) {
		if (method !== "GET" && method !== "HEAD") {
			return errorResponse(request, 405, "method not allowed");
		}
		return jsonResponse(request, contentJsonSchema());
	}

	if (segments[2] === "index" && segments.length === 3) {
		if (method !== "GET" && method !== "HEAD") {
			return errorResponse(request, 405, "method not allowed");
		}
		return jsonResponse(request, await readAllIndex(env.CONTENT));
	}

	if (segments[2] === "index" && segments.length === 4) {
		if (method !== "GET" && method !== "HEAD") {
			return errorResponse(request, 405, "method not allowed");
		}
		if (!isContentCollection(segments[3])) {
			return errorResponse(request, 400, "unknown collection", {
				collection: segments[3],
			});
		}
		return jsonResponse(
			request,
			await readCollectionIndex(env.CONTENT, segments[3]),
		);
	}

	if (segments.length === 5 && segments[4] === "media") {
		if (method !== "POST") {
			return errorResponse(request, 405, "method not allowed");
		}
		return handleMedia(request, env, pathname, segments[2], segments[3]);
	}

	if (segments.length === 4) {
		const collection = segments[2];
		const slug = segments[3];
		if (method === "GET" || method === "HEAD") {
			return handleGet(request, env, collection, slug);
		}
		if (method === "PUT") {
			return handlePut(request, env, pathname, collection, slug);
		}
		if (method === "DELETE") {
			return handleDelete(request, env, pathname, collection, slug);
		}
		return errorResponse(request, 405, "method not allowed");
	}

	return errorResponse(request, 404, "not found");
}
