import * as THREE from "three";

interface SceneOptions {
	container: HTMLElement;
	particleCount?: number;
	color?: number;
}

export class ParticleScene {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private particles: THREE.Points;
	private animationId: number | null = null;
	private mouse: THREE.Vector2 = new THREE.Vector2();
	private targetMouse: THREE.Vector2 = new THREE.Vector2();
	private prefersReducedMotion: boolean;
	private boundHandleResize: () => void;
	private boundHandleMouseMove: (event: MouseEvent) => void;

	constructor(options: SceneOptions) {
		this.prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		const { container, particleCount = 3000, color = 0x1a1a1a } = options;

		// Reduce particles on mobile for better performance
		// Mobile devices typically have less GPU power and smaller screens
		const isMobile = window.innerWidth < 768;
		const finalParticleCount = isMobile
			? Math.floor(particleCount / 2)
			: particleCount;

		const width = container.clientWidth;
		const height = container.clientHeight;

		// Scene
		this.scene = new THREE.Scene();

		// Camera
		this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
		this.camera.position.z = 50;

		// Renderer with error handling
		try {
			this.renderer = new THREE.WebGLRenderer({
				alpha: true,
				antialias: true,
				powerPreference: "high-performance",
			});

			// Verify WebGL context was created successfully
			const gl = this.renderer.getContext();
			if (!gl) {
				throw new Error("WebGL context creation failed");
			}

			this.renderer.setSize(width, height);
			this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			container.appendChild(this.renderer.domElement);
		} catch (error) {
			console.error("Failed to initialize Three.js renderer:", error);

			// Show fallback UI
			const fallback = document.createElement("div");
			fallback.className = "three-fallback";
			fallback.textContent = "3D graphics not supported";
			fallback.style.cssText =
				"padding: 2rem; text-align: center; color: #888; font-size: 0.875rem;";
			container.appendChild(fallback);

			throw error;
		}

		// Particles
		this.particles = this.createParticles(finalParticleCount, color);
		this.scene.add(this.particles);

		// Bind event handlers
		this.boundHandleResize = this.handleResize.bind(this);
		this.boundHandleMouseMove = this.handleMouseMove.bind(this);

		// Events
		this.bindEvents();

		// Handle animation based on motion preference
		// - Normal: continuous animation loop
		// - Reduced motion: render static frame at initial position
		if (!this.prefersReducedMotion) {
			this.animate();
		} else {
			this.renderer.render(this.scene, this.camera);
		}
	}

	private createParticles(count: number, color: number): THREE.Points {
		const geometry = new THREE.BufferGeometry();
		const positions = new Float32Array(count * 3);
		const velocities = new Float32Array(count * 3);

		for (let i = 0; i < count * 3; i += 3) {
			positions[i] = (Math.random() - 0.5) * 100;
			positions[i + 1] = (Math.random() - 0.5) * 100;
			positions[i + 2] = (Math.random() - 0.5) * 100;

			velocities[i] = (Math.random() - 0.5) * 0.02;
			velocities[i + 1] = (Math.random() - 0.5) * 0.02;
			velocities[i + 2] = (Math.random() - 0.5) * 0.02;
		}

		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

		const material = new THREE.PointsMaterial({
			color,
			size: 0.5,
			transparent: true,
			opacity: 0.6,
			sizeAttenuation: true,
		});

		return new THREE.Points(geometry, material);
	}

	private bindEvents(): void {
		window.addEventListener("resize", this.boundHandleResize);
		window.addEventListener("mousemove", this.boundHandleMouseMove);
	}

	private handleResize(): void {
		const container = this.renderer.domElement.parentElement;
		if (!container) {
			console.warn(
				"Cannot resize Three.js canvas: container element not found",
			);
			return;
		}

		try {
			const width = container.clientWidth;
			const height = container.clientHeight;

			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(width, height);
		} catch (error) {
			console.error("Error during Three.js resize:", error);
		}
	}

	private handleMouseMove(event: MouseEvent): void {
		this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	}

	private animate(): void {
		this.animationId = requestAnimationFrame(this.animate.bind(this));

		try {
			// Smooth mouse follow
			this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
			this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

			// Apply rotation: constant base rotation + mouse-influenced rotation
			this.particles.rotation.x += 0.0003;
			this.particles.rotation.y += 0.0003;
			this.particles.rotation.x += this.mouse.y * 0.0005;
			this.particles.rotation.y += this.mouse.x * 0.0005;

			// Update particle positions
			const positions = this.particles.geometry.attributes
				.position as THREE.BufferAttribute;
			const velocities = this.particles.geometry.attributes
				.velocity as THREE.BufferAttribute;

			const posArray = positions.array as Float32Array;
			const velArray = velocities.array as Float32Array;

			for (let i = 0; i < positions.count; i++) {
				const i3 = i * 3;
				posArray[i3] += velArray[i3];
				posArray[i3 + 1] += velArray[i3 + 1];
				posArray[i3 + 2] += velArray[i3 + 2];

				// Boundary check: bounce particles at edges by reversing velocity
				for (let j = 0; j < 3; j++) {
					if (Math.abs(posArray[i3 + j]) > 50) {
						velArray[i3 + j] *= -1;
					}
				}
			}

			positions.needsUpdate = true;

			this.renderer.render(this.scene, this.camera);
		} catch (error) {
			console.error("Error in animation loop:", error);
			// Stop animation to prevent error spam
			if (this.animationId) {
				cancelAnimationFrame(this.animationId);
				this.animationId = null;
			}
		}
	}

	public destroy(): void {
		try {
			if (this.animationId) {
				cancelAnimationFrame(this.animationId);
				this.animationId = null;
			}
		} catch (error) {
			console.error("Error canceling animation frame:", error);
		}

		try {
			window.removeEventListener("resize", this.boundHandleResize);
			window.removeEventListener("mousemove", this.boundHandleMouseMove);
		} catch (error) {
			console.error("Error removing event listeners:", error);
		}

		try {
			this.renderer.dispose();
		} catch (error) {
			console.error("Error disposing renderer:", error);
		}

		try {
			this.particles.geometry.dispose();
		} catch (error) {
			console.error("Error disposing geometry:", error);
		}

		try {
			(this.particles.material as THREE.Material).dispose();
		} catch (error) {
			console.error("Error disposing material:", error);
		}
	}
}
