import { initHeroWebGL, type HeroWebGLHandle } from "../hero-webgl.ts";

export function initHomeBloom(): HeroWebGLHandle | null {
	const canvas =
		document.querySelector<HTMLCanvasElement>("[data-hero-canvas]");
	if (!canvas) return null;
	return initHeroWebGL(canvas);
}
