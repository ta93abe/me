export const ARTICLE_BODY_MAX_CHARS = 5000;

/**
 * マークダウン源を、JSON-LD の articleBody / wordCount 向けプレーンテキストにする。
 */
export function markdownToPlainText(markdown: string): string {
	const withoutFences = markdown.replace(/```[\s\S]*?```/g, (block) => {
		return block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "");
	});

	return withoutFences
		.replace(/^[ \t]*#{1,6}[ \t]+/gm, "")
		.replace(/!\[[^\]]*]\([^)]*\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/__([^_]+)__/g, "$1")
		.replace(/~~([^~]+)~~/g, "$1")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/(^|[^\w*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
		.replace(/(^|[^\w_])_([^_\n]+)_(?!_)/g, "$1$2")
		.replace(/^[ \t]*[-*+][ \t]+/gm, "")
		.replace(/^[ \t]*\d+\.[ \t]+/gm, "")
		.replace(/^[ \t]*>[ \t]?/gm, "")
		.replace(/<[^>]+>/g, "")
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export function countWords(text: string): number {
	const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
	let count = 0;
	for (const segment of segmenter.segment(text)) {
		if (segment.isWordLike) {
			count += 1;
		}
	}
	return count;
}

export function articleBodyText(plain: string, canonicalUrl: string): string {
	if (plain.length <= ARTICLE_BODY_MAX_CHARS) {
		return plain;
	}
	return `${plain.slice(0, ARTICLE_BODY_MAX_CHARS)}\n${canonicalUrl}`;
}

/**
 * 本文の核になっている短い箇条書き（製品・サービス名）を取り出す。
 * 3 件未満や、コードフェンス内のリストは対象外。
 */
export function extractShortListItems(markdown: string): string[] {
	const withoutFences = markdown.replace(/```[\s\S]*?```/g, "\n");
	const lists: string[][] = [];
	let current: string[] = [];

	const flush = () => {
		if (current.length >= 3) {
			lists.push(current);
		}
		current = [];
	};

	for (const line of withoutFences.split("\n")) {
		if (!line.trim()) {
			flush();
			continue;
		}
		const match = /^(?:[-*+])[ \t]+(.+)$/.exec(line);
		if (!match?.[1]) {
			flush();
			continue;
		}
		const name = listItemName(match[1]);
		if (!name || name.length > 80) {
			flush();
			continue;
		}
		current.push(name);
	}
	flush();

	return lists.reduce<string[]>(
		(longest, list) => (list.length > longest.length ? list : longest),
		[],
	);
}

function listItemName(raw: string): string {
	return raw
		.replace(/!\[[^\]]*]\([^)]*\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\s*[(（][^)）]+[)）]\s*$/u, "")
		.trim();
}
