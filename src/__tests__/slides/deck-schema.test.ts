import { describe, expect, it } from "vitest";

import { parseDeckFrontmatter } from "@/slides/load-decks";
import { DeckError } from "@/slides/parser/types";

function source(frontmatter: string): string {
	return `---\n${frontmatter}\n---\n\n# a\n`;
}

const base = "title: Demo\ndate: 2026-09-06\ndescription: demo\nslug: demo";

describe("deck frontmatter", () => {
	it("defaults theme to dark and normalizes the date", () => {
		const deck = parseDeckFrontmatter(source(base), "demo");
		expect(deck.frontmatter).toEqual({
			title: "Demo",
			date: "2026-09-06",
			description: "demo",
			slug: "demo",
			theme: "dark",
		});
	});

	it("accepts theme light, effect, event, talkSlug, and unlisted", () => {
		const deck = parseDeckFrontmatter(
			source(
				`${base}\ntheme: light\neffect: snow\nevent: 勉強会\ntalkSlug: demo-talk\nunlisted: true`,
			),
			"demo",
		);
		expect(deck.frontmatter).toMatchObject({
			theme: "light",
			effect: "snow",
			event: "勉強会",
			talkSlug: "demo-talk",
			unlisted: true,
		});
	});

	it("computes a deep accent at build time", () => {
		const deck = parseDeckFrontmatter(
			source(`${base}\naccent: "#0f766e"`),
			"demo",
		);
		expect(deck.frontmatter.accent).toBe("#0f766e");
		expect(deck.frontmatter.accentDeep).toMatch(/^#[0-9a-f]{6}$/);
	});

	it.each([
		["unknown keys", `${base}\nbackground: "#000"`],
		["unknown theme", `${base}\ntheme: sepia`],
		["unknown effect", `${base}\neffect: rain`],
		[
			"bad slug",
			"title: Demo\ndate: 2026-09-06\ndescription: demo\nslug: Demo_1",
		],
		["bad date", "title: Demo\ndate: 9/6\ndescription: demo\nslug: demo"],
		["missing description", "title: Demo\ndate: 2026-09-06\nslug: demo"],
		["bad accent", `${base}\naccent: purple`],
	])("rejects %s", (_name, frontmatter) => {
		expect(() => parseDeckFrontmatter(source(frontmatter), "demo")).toThrow(
			DeckError,
		);
	});

	it("rejects a slug that differs from the filename", () => {
		expect(() => parseDeckFrontmatter(source(base), "other")).toThrow(
			/ファイル名 other.mdx と slug demo が一致しません/,
		);
	});
});
