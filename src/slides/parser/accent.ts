import { DeckError } from "./types.ts";

const HEX_RGB = /^#([0-9a-fA-F]{3})$/;
const HEX_RRGGBB = /^#([0-9a-fA-F]{6})$/;

/** Build-time deep accent: HSL lightness scale (no color-mix / runtime libs). */
const DEEP_LIGHTNESS_SCALE = 0.758;

export type ParsedAccent = {
	accent: string;
	accentDeep: string;
};

function rgbToHsl(
	r: number,
	g: number,
	b: number,
): [h: number, s: number, l: number] {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case rn:
				h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
				break;
			case gn:
				h = ((bn - rn) / d + 2) / 6;
				break;
			default:
				h = ((rn - gn) / d + 4) / 6;
		}
	}

	return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	if (s === 0) {
		const v = Math.round(l * 255);
		return [v, v, v];
	}

	const hue2rgb = (p: number, q: number, t: number) => {
		let tt = t;
		if (tt < 0) {
			tt += 1;
		}
		if (tt > 1) {
			tt -= 1;
		}
		if (tt < 1 / 6) {
			return p + (q - p) * 6 * tt;
		}
		if (tt < 1 / 2) {
			return q;
		}
		if (tt < 2 / 3) {
			return p + (q - p) * (2 / 3 - tt) * 6;
		}
		return p;
	};

	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return [
		Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
		Math.round(hue2rgb(p, q, h) * 255),
		Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
	];
}

function toHex(r: number, g: number, b: number): string {
	const clamp = (value: number) => Math.max(0, Math.min(255, value));
	return `#${[clamp(r), clamp(g), clamp(b)]
		.map((channel) => channel.toString(16).padStart(2, "0"))
		.join("")}`;
}

function deriveAccentDeep(r: number, g: number, b: number): string {
	const [h, s, l] = rgbToHsl(r, g, b);
	const [dr, dg, db] = hslToRgb(h, s, l * DEEP_LIGHTNESS_SCALE);
	return toHex(dr, dg, db);
}

function parseHexChannels(raw: string): [number, number, number] {
	const trimmed = raw.trim();
	if (!trimmed.startsWith("#")) {
		throw new DeckError(`accent は #rrggbb または #rgb です: ${raw}`);
	}

	let normalized: string;
	if (HEX_RRGGBB.test(trimmed)) {
		normalized = trimmed.toLowerCase();
	} else if (HEX_RGB.test(trimmed)) {
		const digits = trimmed.slice(1);
		normalized = `#${digits
			.split("")
			.map((digit) => digit + digit)
			.join("")
			.toLowerCase()}`;
	} else {
		throw new DeckError(`accent は #rrggbb または #rgb です: ${raw}`);
	}

	const r = Number.parseInt(normalized.slice(1, 3), 16);
	const g = Number.parseInt(normalized.slice(3, 5), 16);
	const b = Number.parseInt(normalized.slice(5, 7), 16);
	return [r, g, b];
}

export function parseAccent(raw: string): ParsedAccent {
	const [r, g, b] = parseHexChannels(raw);
	const accent = toHex(r, g, b);
	return {
		accent,
		accentDeep: deriveAccentDeep(r, g, b),
	};
}
