/**
 * Lighthouse SEO `robots-txt` safelist, minus `Content-Signal`.
 *
 * `Content-Signal` is sent as an HTTP header (`public/_headers` and the
 * Worker). Putting it in robots.txt trips older Lighthouse / PageSpeed
 * parsers as "Unknown directive".
 *
 * @see https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt
 */
const ROBOTS_DIRECTIVES = new Set([
	"user-agent",
	"disallow",
	"allow",
	"sitemap",
	"crawl-delay",
	"clean-param",
	"host",
	"request-rate",
	"visit-time",
	"noindex",
]);

export function robotsTxtErrors(text: string): string[] {
	const errors: string[] = [];

	for (const [index, raw] of text.split(/\r?\n/).entries()) {
		const line = raw.replace(/#.*$/, "").trim();
		if (!line) {
			continue;
		}

		const colon = line.indexOf(":");
		if (colon === -1) {
			errors.push(`line ${index + 1}: not name: value`);
			continue;
		}

		const name = line.slice(0, colon).trim().toLowerCase();
		const value = line.slice(colon + 1).trim();
		if (!ROBOTS_DIRECTIVES.has(name)) {
			errors.push(`line ${index + 1}: unknown directive "${name}"`);
		}
		if (name === "sitemap" && !/^https?:\/\//i.test(value)) {
			errors.push(`line ${index + 1}: sitemap must be an absolute URL`);
		}
	}

	return errors;
}
