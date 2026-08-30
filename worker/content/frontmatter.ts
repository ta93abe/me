export type FrontmatterValue =
	| string
	| number
	| boolean
	| FrontmatterValue[]
	| { [key: string]: FrontmatterValue };

export type ParsedMarkdown = {
	frontmatter: Record<string, FrontmatterValue>;
	body: string;
};

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function unquote(value: string): string {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

function parseScalar(raw: string): FrontmatterValue {
	const value = raw.trim();
	if (value === "true") {
		return true;
	}
	if (value === "false") {
		return false;
	}
	if (value === "null" || value === "~" || value === "") {
		return "";
	}
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return Number(value);
	}
	if (value.startsWith("[") && value.endsWith("]")) {
		const inner = value.slice(1, -1).trim();
		if (!inner) {
			return [];
		}
		return inner.split(",").map((item) => parseScalar(item));
	}
	return unquote(value);
}

function parseYamlBlock(source: string): Record<string, FrontmatterValue> {
	const result: Record<string, FrontmatterValue> = {};
	const lines = source.replace(/\r\n/g, "\n").split("\n");
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim() || line.trimStart().startsWith("#")) {
			index += 1;
			continue;
		}

		const match = /^(?!-)([\w.-]+):\s*(.*)$/.exec(line);
		if (!match) {
			throw new Error(`unsupported frontmatter line: ${line}`);
		}

		const key = match[1];
		const rest = match[2];
		if (rest.length > 0) {
			result[key] = parseScalar(rest);
			index += 1;
			continue;
		}

		const items: FrontmatterValue[] = [];
		index += 1;
		while (index < lines.length) {
			const nested = lines[index];
			const item = /^\s+-\s+(.*)$/.exec(nested);
			if (!item) {
				break;
			}
			items.push(parseScalar(item[1]));
			index += 1;
		}
		result[key] = items;
	}

	return result;
}

export function parseMarkdownDocument(markdown: string): ParsedMarkdown {
	const match = FRONTMATTER_PATTERN.exec(markdown);
	if (!match) {
		throw new Error(
			"markdown must start with YAML frontmatter delimited by ---",
		);
	}

	return {
		frontmatter: parseYamlBlock(match[1]),
		body: match[2].replace(/^\n/, ""),
	};
}

export function looksLikeMdx(markdown: string): boolean {
	return (
		/^\s*import\s+/.test(markdown) || /<[A-Z][A-Za-z0-9]*[\s/>]/.test(markdown)
	);
}
