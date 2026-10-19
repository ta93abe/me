import { describe, expect, it } from "vitest";

import { validateTalkSlideCrosslinks } from "@/data/talk-slide-crosslinks";

describe("talk ↔ slide crosslinks", () => {
	it("keeps catalog references aligned with git decks", async () => {
		const issues = await validateTalkSlideCrosslinks();
		expect(issues).toEqual([]);
	});
});
