import { describe, expect, it } from "vitest";

import {
	getMediaTypeLabel,
	isMediaType,
	MEDIA_TYPES,
} from "../../utils/creative-media";

describe("creative-media", () => {
	it("exposes drawing, photo, and music", () => {
		expect(MEDIA_TYPES).toEqual(["drawing", "photo", "music"]);
	});

	it("returns Japanese labels", () => {
		expect(getMediaTypeLabel("drawing")).toBe("絵");
		expect(getMediaTypeLabel("photo")).toBe("写真");
		expect(getMediaTypeLabel("music")).toBe("音楽");
	});

	it("narrows media type strings", () => {
		expect(isMediaType("photo")).toBe(true);
		expect(isMediaType("video")).toBe(false);
	});
});
