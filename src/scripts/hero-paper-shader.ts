import {
	defaultObjectSizing,
	getShaderColorFromString,
	meshGradientFragmentShader,
	ShaderFitOptions,
	ShaderMount,
} from "@paper-design/shaders";

export type HeroPaperShaderHandle = {
	destroy: () => void;
};

/** Hero 1画面分のピクセル上限（Three 版の低 DPR 方針に合わせる） */
const HERO_MAX_PIXEL_COUNT = 1_280 * 720 * 1.25 * 1.25;
const HERO_MIN_PIXEL_RATIO = 1;

/**
 * 0 固定。Paper の ShaderMount は speed 0 で rAF を止め、静的なシェーダーは
 * 再描画コストを持たない（resize と再表示のときだけ描く）。
 * 0 以外だと描画が終わらず、Speed Index が収束しないので戻さないこと。
 */
const HERO_SHADER_SPEED = 0;

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readHomeMeshColors(): string[] {
	const themeStyle = getComputedStyle(document.body);
	const pick = (token: string, fallback: string) =>
		themeStyle.getPropertyValue(token).trim() || fallback;

	return [
		pick("--home-paper", "#f4eef8"),
		pick("--home-bloom-hot", "#a855f7"),
		pick("--home-bloom", "#7c3aed"),
		pick("--home-field", "#6b21a8"),
		pick("--home-dither", "#86198f"),
	];
}

function buildMeshGradientUniforms(colors: string[]) {
	const sizing = defaultObjectSizing;
	return {
		u_colors: colors.map(getShaderColorFromString),
		u_colorsCount: colors.length,
		u_distortion: 0.85,
		u_swirl: 0.72,
		u_grainMixer: 0.08,
		u_grainOverlay: 0.12,
		u_fit: ShaderFitOptions.cover,
		u_rotation: sizing.rotation,
		u_scale: 1.05,
		u_offsetX: sizing.offsetX,
		u_offsetY: sizing.offsetY,
		u_originX: sizing.originX,
		u_originY: sizing.originY,
		u_worldWidth: sizing.worldWidth,
		u_worldHeight: sizing.worldHeight,
	};
}

export function initHeroPaperShader(
	mount: HTMLElement,
): HeroPaperShaderHandle | null {
	if (prefersReducedMotion()) return null;

	let shader: ShaderMount;
	try {
		shader = new ShaderMount(
			mount,
			meshGradientFragmentShader,
			buildMeshGradientUniforms(readHomeMeshColors()),
			{
				alpha: true,
				antialias: false,
				powerPreference: "low-power",
			},
			HERO_SHADER_SPEED,
			0,
			HERO_MIN_PIXEL_RATIO,
			HERO_MAX_PIXEL_COUNT,
		);
	} catch {
		return null;
	}

	return {
		destroy: () => {
			shader.dispose();
		},
	};
}
