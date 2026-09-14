import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "../../styles/global.css"),
	"utf8",
);

function declarations(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

describe("blog article prose", () => {
	it("keeps the opening paragraph the same ink color as the rest of the body", () => {
		expect(declarations(".prose")).toContain("color: var(--text-secondary)");
		expect(declarations(".prose > p:first-of-type")).not.toMatch(
			/color:\s*var\(--text-primary\)/,
		);
	});
});
