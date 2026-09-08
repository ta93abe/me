import {
	deckVersion,
	PDF_ORIGIN,
	pdfObjectKey,
	type PdfJob,
} from "./pdf.ts";

export async function servePdf(
	request: Request,
	env: Env,
	slug: string,
): Promise<Response> {
	const page = await env.ASSETS.fetch(
		new URL(`/slides/${slug}/index.html`, request.url),
	);
	if (page.status === 404) {
		return new Response(page.body, {
			status: 404,
			headers: page.headers,
		});
	}

	const source = await page.text();
	const version = await deckVersion(source);
	const key = pdfObjectKey(slug);
	const stored = await env.CONTENT.get(key);
	if (stored && stored.customMetadata?.version === version) {
		return new Response(stored.body, {
			headers: {
				"content-type":
					stored.httpMetadata?.contentType ?? "application/pdf",
				"content-disposition": `inline; filename="${slug}.pdf"`,
				etag: `"${version}"`,
				"cache-control": "public, max-age=60",
			},
		});
	}

	const job: PdfJob = {
		slug,
		origin: PDF_ORIGIN,
		version,
	};
	await env.PDF_QUEUE.send(job);
	return new Response(
		JSON.stringify({ ok: true, status: "generating", slug }),
		{
			status: 202,
			headers: {
				"content-type": "application/json",
				"retry-after": "3",
			},
		},
	);
}
