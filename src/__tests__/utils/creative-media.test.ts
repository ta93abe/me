import { describe, expect, it } from "vitest";

import {
	CREATIVE_MEDIA_TYPES,
	getMediaTypeLabel,
	isCreativeMediaType,
	isMediaType,
	MEDIA_TYPES,
} from "@/utils/creative-media";

describe("creative-media", () => {
	it("exposes creative types and project", () => {
		expect(CREATIVE_MEDIA_TYPES).toEqual(["drawing", "photo", "music"]);
		expect(MEDIA_TYPES).toEqual(["drawing", "photo", "music", "project"]);
	});

	it("returns Japanese labels", () => {
		expect(getMediaTypeLabel("drawing")).toBe("絵");
		expect(getMediaTypeLabel("photo")).toBe("写真");
		expect(getMediaTypeLabel("music")).toBe("音楽");
		expect(getMediaTypeLabel("project")).toBe("プロジェクト");
	});

	it("narrows media type strings", () => {
		expect(isMediaType("photo")).toBe(true);
		expect(isMediaType("project")).toBe(true);
		expect(isMediaType("video")).toBe(false);
		expect(isCreativeMediaType("music")).toBe(true);
		expect(isCreativeMediaType("project")).toBe(false);
	});
});
