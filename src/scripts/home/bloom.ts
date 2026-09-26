import {
	initHeroPaperShader,
	type HeroPaperShaderHandle,
} from "../hero-paper-shader.ts";

export function initHomeBloom(): HeroPaperShaderHandle | null {
	const mount = document.querySelector<HTMLElement>("[data-hero-shader]");
	if (!mount) return null;
	return initHeroPaperShader(mount);
}
