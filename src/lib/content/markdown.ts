import { Marked } from "marked";
import Prism from "prismjs";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-diff.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-markdown.js";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-yaml.js";

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

const marked = new Marked({
	gfm: true,
	renderer: {
		code({ text, lang }) {
			const language = lang?.split(/\s+/)[0] ?? "";
			const grammar = language ? Prism.languages[language] : undefined;
			const highlighted = grammar
				? Prism.highlight(text, grammar, language)
				: escapeHtml(text);
			const className = language ? `language-${language}` : "";
			return `<pre class="${className}"><code class="${className}">${highlighted}</code></pre>\n`;
		},
	},
});

export function renderBlogMarkdown(markdown: string): string {
	return marked.parse(markdown, { async: false }) as string;
}
