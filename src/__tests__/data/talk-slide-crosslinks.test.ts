import { describe, expect, it } from "vitest";

import {
	collectTalkSlideCrosslinkIssues,
	validateTalkSlideCrosslinks,
} from "@/data/talk-slide-crosslinks";

function deck(
	slug: string,
	options: { talkSlug?: string; unlisted?: boolean } = {},
) {
	return {
		frontmatter: {
			slug,
			...(options.talkSlug ? { talkSlug: options.talkSlug } : {}),
			...(options.unlisted ? { unlisted: true } : {}),
		},
	};
}

describe("talk ↔ slide crosslinks", () => {
	it("keeps catalog references aligned with git decks", async () => {
		const issues = await validateTalkSlideCrosslinks();
		expect(issues).toEqual([]);
	});

	it("flags a talk whose slideSlug points at an unlisted deck", () => {
		const issues = collectTalkSlideCrosslinkIssues(
			[{ slug: "frosty-friday-live-challenge-vol56", slideSlug: "showcase" }],
			[deck("showcase", { unlisted: true }), deck("snowflake-dbt")],
		);

		expect(issues).toEqual([
			{
				kind: "talk-unlisted-slide",
				from: "frosty-friday-live-challenge-vol56",
				missing: "showcase",
			},
		]);
	});

	it("still flags a missing slideSlug", () => {
		const issues = collectTalkSlideCrosslinkIssues(
			[{ slug: "some-talk", slideSlug: "does-not-exist" }],
			[deck("snowflake-dbt")],
		);

		expect(issues).toEqual([
			{
				kind: "talk-slide",
				from: "some-talk",
				missing: "does-not-exist",
			},
		]);
	});

	it("allows a listed deck as slideSlug", () => {
		const issues = collectTalkSlideCrosslinkIssues(
			[{ slug: "some-talk", slideSlug: "snowflake-dbt" }],
			[deck("snowflake-dbt")],
		);

		expect(issues).toEqual([]);
	});
});
