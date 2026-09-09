export type HighlightMeta = {
	always: number[];
	steps: number[][];
};

function parseLineRange(spec: string): number[] {
	const lines: number[] = [];
	for (const part of spec.split(",")) {
		const trimmed = part.trim();
		if (trimmed === "") {
			continue;
		}
		const range = trimmed.match(/^(\d+)-(\d+)$/);
		if (range) {
			const start = Number(range[1]);
			const end = Number(range[2]);
			const from = Math.min(start, end);
			const to = Math.max(start, end);
			for (let line = from; line <= to; line += 1) {
				lines.push(line);
			}
			continue;
		}
		if (/^\d+$/.test(trimmed)) {
			lines.push(Number(trimmed));
		}
	}
	return lines;
}

export function parseCodeFenceMeta(meta: string): HighlightMeta {
	const match = meta.match(/\{([^}]+)\}/);
	if (!match) {
		return { always: [], steps: [] };
	}
	const inner = match[1].trim();
	if (inner.includes("|")) {
		return {
			always: [],
			steps: inner.split("|").map(parseLineRange),
		};
	}
	return { always: parseLineRange(inner), steps: [] };
}

export function countHighlightClicks(html: string): number {
	let max = 0;
	for (const match of html.matchAll(/data-click-highlight="(\d+)"/g)) {
		max = Math.max(max, Number(match[1]));
	}
	return max;
}
