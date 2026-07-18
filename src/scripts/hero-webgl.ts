import {
	AdditiveBlending,
	BufferAttribute,
	BufferGeometry,
	Color,
	Mesh,
	PerspectiveCamera,
	PlaneGeometry,
	Points,
	PointsMaterial,
	Scene,
	ShaderMaterial,
	Vector2,
	WebGLRenderer,
} from "three";

export type HeroWebGLHandle = {
	destroy: () => void;
};

const VERT = /* glsl */ `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uInk;
uniform vec3 uOchre;
uniform vec3 uPaper;

varying vec2 vUv;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
	for (int i = 0; i < 5; i++) {
		v += a * noise(p);
		p = m * p;
		a *= 0.5;
	}
	return v;
}

void main() {
	vec2 uv = vUv;
	vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
	vec2 p = (uv - 0.5) * aspect;
	vec2 mouse = (uMouse - 0.5) * aspect;

	float t = uTime * 0.12;
	float ripple = length(p - mouse);
	float warp = fbm(p * 1.8 + vec2(t, -t * 0.7) + mouse * 0.35);
	float field = fbm(p * 2.4 + warp * 1.4 + vec2(-t * 0.5, t * 0.35));
	float ribbons = smoothstep(0.42, 0.78, field + 0.12 * sin(ripple * 8.0 - uTime * 1.4));

	vec3 color = uPaper;
	color = mix(color, uOchre, ribbons * 0.45);
	color = mix(color, uInk, pow(ribbons, 1.8) * 0.38);

	float vignette = smoothstep(1.35, 0.25, length(p * 1.1));
	color = mix(color * 0.96, color, vignette);

	float grain = hash(uv * uResolution + uTime) * 0.035;
	color += grain - 0.015;

	gl_FragColor = vec4(color, 1.0);
}
`;

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function createParticles(count: number): Points {
	const positions = new Float32Array(count * 3);
	const speeds = new Float32Array(count);

	for (let i = 0; i < count; i++) {
		positions[i * 3] = (Math.random() - 0.5) * 14;
		positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
		positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
		speeds[i] = 0.15 + Math.random() * 0.45;
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new BufferAttribute(positions, 3));

	const material = new PointsMaterial({
		color: new Color("#6b4c9a"),
		size: 0.04,
		transparent: true,
		opacity: 0.5,
		depthWrite: false,
		blending: AdditiveBlending,
		sizeAttenuation: true,
	});

	const points = new Points(geometry, material);
	points.userData.speeds = speeds;
	return points;
}

export function initHeroWebGL(
	canvas: HTMLCanvasElement,
): HeroWebGLHandle | null {
	if (prefersReducedMotion()) return null;

	const scene = new Scene();
	const camera = new PerspectiveCamera(45, 1, 0.1, 100);
	camera.position.z = 6;

	let renderer: WebGLRenderer;
	try {
		renderer = new WebGLRenderer({
			canvas,
			antialias: false,
			alpha: true,
			powerPreference: "high-performance",
		});
	} catch {
		return null;
	}

	renderer.setClearColor(0xfaf9f6, 1);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

	const uniforms = {
		uTime: { value: 0 },
		uResolution: { value: new Vector2(1, 1) },
		uMouse: { value: new Vector2(0.5, 0.5) },
		uInk: { value: new Color("#6b4c9a") },
		uOchre: { value: new Color("#8a6d3b") },
		uPaper: { value: new Color("#faf9f6") },
	};

	const bgGeometry = new PlaneGeometry(18, 12);
	const bgMaterial = new ShaderMaterial({
		vertexShader: VERT,
		fragmentShader: FRAG,
		uniforms,
		depthWrite: false,
	});
	const background = new Mesh(bgGeometry, bgMaterial);
	background.position.z = -2;
	background.frustumCulled = false;

	const particles = createParticles(window.innerWidth < 768 ? 70 : 120);
	scene.add(background);
	scene.add(particles);

	const mouseTarget = new Vector2(0.5, 0.5);
	const mouseCurrent = new Vector2(0.5, 0.5);

	let frameId = 0;
	let running = true;
	let inView = true;
	let pageVisible = document.visibilityState === "visible";
	const started = performance.now();

	const canRender = () => inView && pageVisible;

	const resize = () => {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		if (width === 0 || height === 0) return;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height, false);
		uniforms.uResolution.value.set(width, height);

		const viewHeight =
			2 *
			Math.tan((camera.fov * Math.PI) / 360) *
			Math.abs(camera.position.z - background.position.z);
		const viewWidth = viewHeight * camera.aspect;
		background.scale.set(viewWidth / 18, viewHeight / 12, 1);
	};

	const onPointerMove = (event: PointerEvent) => {
		const rect = canvas.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;
		mouseTarget.set(
			(event.clientX - rect.left) / rect.width,
			1 - (event.clientY - rect.top) / rect.height,
		);
	};

	const tick = () => {
		if (!running) return;
		frameId = requestAnimationFrame(tick);
		if (!canRender()) return;

		const elapsed = (performance.now() - started) / 1000;
		uniforms.uTime.value = elapsed;
		mouseCurrent.lerp(mouseTarget, 0.05);
		uniforms.uMouse.value.copy(mouseCurrent);

		const positions = particles.geometry.getAttribute(
			"position",
		) as BufferAttribute;
		const speeds = particles.userData.speeds as Float32Array;
		for (let i = 0; i < speeds.length; i++) {
			const y = positions.getY(i) + speeds[i] * 0.004;
			positions.setY(i, y > 5 ? -5 : y);
			positions.setX(
				i,
				positions.getX(i) + Math.sin(elapsed * 0.8 + i) * 0.0007,
			);
		}
		positions.needsUpdate = true;

		renderer.render(scene, camera);
	};

	const visibilityObserver = new IntersectionObserver(
		([entry]) => {
			inView = entry?.isIntersecting ?? true;
		},
		{ threshold: 0.05 },
	);
	visibilityObserver.observe(canvas);

	const onVisibilityChange = () => {
		pageVisible = document.visibilityState === "visible";
	};

	window.addEventListener("resize", resize);
	window.addEventListener("pointermove", onPointerMove, { passive: true });
	document.addEventListener("visibilitychange", onVisibilityChange);

	resize();
	tick();

	return {
		destroy: () => {
			running = false;
			cancelAnimationFrame(frameId);
			visibilityObserver.disconnect();
			window.removeEventListener("resize", resize);
			window.removeEventListener("pointermove", onPointerMove);
			document.removeEventListener("visibilitychange", onVisibilityChange);

			bgGeometry.dispose();
			bgMaterial.dispose();
			particles.geometry.dispose();
			(particles.material as PointsMaterial).dispose();
			renderer.dispose();
		},
	};
}
