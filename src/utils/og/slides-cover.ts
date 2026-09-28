import { SITE } from "../../config/site";
import {
	charOgUnit,
	ellipsizeOgLine,
	measureOgTitleUnits,
	OG_PADDING,
	OG_TITLE_MAX_LINES,
	OG_WIDTH,
	type OgCardNode,
} from "./card";

/** Dark deck cover tokens (`src/slides/design-system/tokens.css`). */
export const SLIDES_COVER_OG_COLORS = {
	bg: "#0e0b14",
	ink: "#f4f0ff",
	inkDim: "#b4a8c9",
	accent: "#a78bfa",
	accentDeep: "#7c3aed",
} as const;

export interface SlidesCoverOgOptions {
	title: string;
	/** 日付ラベル or リテラル「Slides」 */
	sublabel: string;
	event?: string;
	siteName?: string;
	hostname?: string;
}

export function slidesCoverTitleFontSize(title: string): number {
	const units = measureOgTitleUnits(title.replace(/\s+/g, " ").trim());
	if (units > 36) {
		return 56;
	}
	if (units > 20) {
		return 68;
	}
	return 80;
}

function wrapSlidesCoverTitle(title: string, fontSize: number): string {
	const normalized = title.replace(/\s+/g, " ").trim();
	if (normalized.length === 0) {
		return "";
	}

	const maxUnits = (OG_WIDTH - OG_PADDING * 2 - 24) / fontSize;
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
			return lines.join("\n");
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

	return lines.join("\n");
}

export function buildSlidesCoverOgElement(
	options: SlidesCoverOgOptions,
): OgCardNode {
	const {
		title,
		sublabel,
		event,
		siteName = SITE.name,
		hostname = new URL(SITE.url).hostname,
	} = options;

	const colors = SLIDES_COVER_OG_COLORS;
	const fontSize = slidesCoverTitleFontSize(title);
	const displayTitle = wrapSlidesCoverTitle(title, fontSize);

	const metaChildren: OgCardNode[] = [];
	if (event) {
		metaChildren.push({
			type: "div",
			props: {
				style: {
					fontSize: "22px",
					fontWeight: "600",
					color: colors.accent,
					letterSpacing: "0.04em",
					lineHeight: 1.4,
				},
				children: event,
			},
		});
	}

	metaChildren.push({
		type: "div",
		props: {
			style: {
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				gap: "8px",
				fontSize: "20px",
				fontWeight: "500",
				color: colors.inkDim,
				letterSpacing: "0.04em",
				lineHeight: 1.5,
			},
			children: [
				{
					type: "span",
					props: {
						style: { color: colors.inkDim },
						children: sublabel,
					},
				},
				{
					type: "span",
					props: {
						style: { opacity: 0.55 },
						children: "·",
					},
				},
				{
					type: "span",
					props: {
						style: { color: colors.inkDim },
						children: siteName,
					},
				},
			],
		},
	});

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
				paddingLeft: `${OG_PADDING + 20}px`,
				backgroundColor: colors.bg,
				backgroundImage: [
					`radial-gradient(1152px 504px at 96% -12%, rgba(167, 139, 250, 0.34), transparent 56%)`,
					`radial-gradient(768px 378px at -8% 108%, rgba(124, 58, 237, 0.22), transparent 52%)`,
				].join(", "),
				fontFamily: "Noto Sans JP",
				position: "relative",
			},
			children: [
				{
					type: "div",
					props: {
						style: {
							position: "absolute",
							left: 0,
							top: 0,
							bottom: 0,
							width: "9px",
							background: colors.accent,
						},
					},
				},
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							maxWidth: "100%",
						},
						children: metaChildren,
					},
				},
				{
					type: "div",
					props: {
						style: {
							display: "flex",
							flexDirection: "column",
							justifyContent: "flex-end",
							flex: 1,
							gap: "20px",
							minHeight: 0,
							paddingBottom: "8px",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										fontSize: `${fontSize}px`,
										fontWeight: "700",
										color: colors.ink,
										lineHeight: 1.22,
										letterSpacing: "0.05em",
										width: `${OG_WIDTH - OG_PADDING * 2 - 24}px`,
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
							justifyContent: "flex-end",
							width: "100%",
						},
						children: [
							{
								type: "div",
								props: {
									style: {
										fontSize: "18px",
										color: colors.accent,
										fontWeight: "600",
										letterSpacing: "0.02em",
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
