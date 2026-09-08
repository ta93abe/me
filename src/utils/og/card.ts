import { SITE } from "../../config/site";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_PADDING = 60;
export const OG_TITLE_MAX_LINES = 3;

export type OgImageType = "blog" | "works" | "slides" | "default";

export const OG_COLOR_SCHEMES = {
	blog: {
		background: "linear-gradient(135deg, #ffffff 0%, #f6f6f4 100%)",
		accent: "#6b4c9a",
		text: "#1c1b19",
	},
	works: {
		background: "linear-gradient(135deg, #ffffff 0%, #eeeeeb 100%)",
		accent: "#8a6d3b",
		text: "#1c1b19",
	},
	slides: {
		background: "linear-gradient(135deg, #ffffff 0%, #f0eef6 100%)",
		accent: "#6b4c9a",
		text: "#1c1b19",
	},
	default: {
		background: "linear-gradient(135deg, #ffffff 0%, #f6f6f4 100%)",
		accent: "#6b4c9a",
		text: "#1c1b19",
	},
} as const satisfies Record<
	OgImageType,
	{ background: string; accent: string; text: string }
>;

export interface OgCardNode {
	type: string;
	props: {
		style?: Record<string, unknown>;
		children?: string | OgCardNode | OgCardNode[];
		[prop: string]: unknown;
	};
}

export interface OgCardOptions {
	title: string;
	subtitle?: string;
	type?: OgImageType;
	siteName?: string;
	hostname?: string;
}

export function isWideOgChar(char: string): boolean {
	const code = char.codePointAt(0) ?? 0;
	return code > 0xff;
}

export function charOgUnit(char: string): number {
	return isWideOgChar(char) ? 1 : 0.55;
}

export function measureOgTitleUnits(title: string): number {
	let units = 0;
	for (const char of title) {
		units += charOgUnit(char);
	}
	return units;
}

export function ogTitleFontSize(title: string): number {
	const units = measureOgTitleUnits(title.replace(/\s+/g, " ").trim());
	if (units > 36) {
		return 48;
	}
	if (units > 20) {
		return 56;
	}
	return 64;
}

export function ellipsizeOgLine(line: string, maxUnits: number): string {
	const ellipsis = "…";
	const budget = maxUnits - charOgUnit(ellipsis);
	let units = 0;
	let out = "";
	for (const char of line) {
		const next = charOgUnit(char);
		if (units + next > budget) {
			break;
		}
		out += char;
		units += next;
	}
	return `${out.trimEnd()}${ellipsis}`;
}

export function wrapOgTitle(title: string, fontSize?: number): string[] {
	const normalized = title.replace(/\s+/g, " ").trim();
	if (normalized.length === 0) {
		return [""];
	}

	const size = fontSize ?? ogTitleFontSize(normalized);
	const maxUnits = (OG_WIDTH - OG_PADDING * 2) / size;
	const chars = [...normalized];
	const lines: string[] = [];
	let line = "";
	let units = 0;
	let index = 0;

	while (index < chars.length) {
		const char = chars[index]!;
		const charUnits = charOgUnit(char);

		if (line.length === 0 && char === " ") {
			index += 1;
			continue;
		}

		if (units + charUnits <= maxUnits) {
			line += char;
			units += charUnits;
			index += 1;
			continue;
		}

		if (lines.length === OG_TITLE_MAX_LINES - 1) {
			lines.push(ellipsizeOgLine(line.length > 0 ? line : char, maxUnits));
			return lines;
		}

		const space = line.lastIndexOf(" ");
		if (char !== " " && space > 0) {
			lines.push(line.slice(0, space));
			line = line.slice(space + 1);
			units = measureOgTitleUnits(line);
			continue;
		}

		if (line.length === 0) {
			lines.push(ellipsizeOgLine(char, maxUnits));
			index += 1;
			continue;
		}

		lines.push(line);
		line = "";
		units = 0;
	}

	if (line.length > 0) {
		lines.push(line);
	}

	return lines.length > 0 ? lines : [normalized];
}

export function buildOgCardElement(options: OgCardOptions): OgCardNode {
	const {
		title,
		subtitle = SITE.author,
		type = "default",
		siteName = SITE.name,
		hostname = new URL(SITE.url).hostname,
	} = options;

	const colors = OG_COLOR_SCHEMES[type];
	const fontSize = ogTitleFontSize(title);
	const displayTitle = wrapOgTitle(title, fontSize).join("\n");

	return {
		type: "div",
		props: {
			style: {
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: `${OG_PADDING}px`,
				background: colors.background,
				fontFamily: "Noto Sans JP",
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							alignItems: "center",
							gap: "16px",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										width: "48px",
										height: "48px",
										borderRadius: "50%",
										background: colors.accent,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "24px",
										fontWeight: "700",
										color: "#0a0a0a",
									},
									children: "T",
								},
							},
							{
								type: "div",
								props: {
									style: {
										fontSize: "24px",
										fontWeight: "700",
										color: colors.text,
										opacity: 0.8,
									},
									children: siteName,
								},
							},
						],
					},
				},
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "16px",
							flex: 1,
							justifyContent: "center",
							width: "100%",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										fontSize: `${fontSize}px`,
										fontWeight: "700",
										color: colors.text,
										lineHeight: 1.3,
										letterSpacing: "-0.02em",
										width: `${OG_WIDTH - OG_PADDING * 2}px`,
										whiteSpace: "pre-wrap",
										wordBreak: "break-word",
									},
									children: displayTitle,
								},
							},
						],
					},
				},
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										fontSize: "20px",
										color: colors.text,
										opacity: 0.7,
									},
									children: subtitle,
								},
							},
							{
								type: "div",
								props: {
									style: {
										fontSize: "18px",
										color: colors.accent,
										fontWeight: "600",
									},
									children: hostname,
								},
							},
						],
					},
				},
			],
		},
	};
}
