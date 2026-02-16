# ENS Profile Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `ta93abe.eth` のENSプロフィールをビルド時に取得し、Aboutセクションに3Dインタラクティブカードとして表示する。

**Architecture:** Astroビルド時にviemを使ってCloudflare Ethereum Gateway経由でENSプロフィールを取得。静的HTMLとして出力し、クライアントサイドJSでCSS 3D回転とホログラフィック光沢エフェクトを適用。

**Tech Stack:** viem, Astro, CSS 3D transforms, Cloudflare Ethereum Gateway

**Design Doc:** `docs/plans/2026-02-16-ens-profile-design.md`

---

### Task 1: Install viem and add ENS config

**Files:**
- Modify: `package.json` (add viem dependency)
- Modify: `src/config/site.ts` (add ensName)

**Step 1: Install viem**

Run: `pnpm add viem`

**Step 2: Add ENS name to site config**

In `src/config/site.ts`, add `ensName` to the SITE object:

```ts
export const SITE = {
	name: "Portfolio",
	description: "個人ポートフォリオサイト",
	author: "Takumi Abe",
	url: "https://ta93abe.com",
	slidesUrl: "https://slides.ta93abe.com",
	locale: "ja_JP",
	lang: "ja",
	ensName: "ta93abe.eth",
} as const;
```

**Step 3: Commit**

```bash
gt create -m "feat(web3): add viem and ENS config"
```

---

### Task 2: Create ENS utility with tests (TDD)

**Files:**
- Create: `src/utils/ens.ts`
- Create: `src/__tests__/utils/ens.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/utils/ens.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

// Mock viem before importing
vi.mock("viem", () => ({
	createPublicClient: vi.fn(() => ({
		getEnsAddress: vi.fn(),
		getEnsAvatar: vi.fn(),
		getEnsText: vi.fn(),
	})),
	http: vi.fn(),
}));

vi.mock("viem/chains", () => ({
	mainnet: { id: 1, name: "mainnet" },
}));

import { getEnsProfile } from "../../utils/ens";

describe("getEnsProfile", () => {
	it("should return null when ENS resolution fails", async () => {
		const { createPublicClient } = await import("viem");
		const mockClient = {
			getEnsAddress: vi.fn().mockResolvedValue(null),
			getEnsAvatar: vi.fn().mockResolvedValue(null),
			getEnsText: vi.fn().mockResolvedValue(null),
		};
		vi.mocked(createPublicClient).mockReturnValue(mockClient as any);

		const result = await getEnsProfile("nonexistent.eth");
		expect(result).toBeNull();
	});

	it("should return profile data when ENS resolves", async () => {
		const { createPublicClient } = await import("viem");
		const mockClient = {
			getEnsAddress: vi.fn().mockResolvedValue("0x1234567890abcdef1234567890abcdef12345678"),
			getEnsAvatar: vi.fn().mockResolvedValue("https://example.com/avatar.png"),
			getEnsText: vi.fn().mockImplementation(({ key }: { key: string }) => {
				const records: Record<string, string> = {
					description: "Software Engineer",
					"com.twitter": "ta93abe",
					"com.github": "ta93abe",
					url: "https://ta93abe.com",
				};
				return Promise.resolve(records[key] ?? null);
			}),
		};
		vi.mocked(createPublicClient).mockReturnValue(mockClient as any);

		const result = await getEnsProfile("ta93abe.eth");

		expect(result).not.toBeNull();
		expect(result!.ensName).toBe("ta93abe.eth");
		expect(result!.address).toBe("0x1234567890abcdef1234567890abcdef12345678");
		expect(result!.avatar).toBe("https://example.com/avatar.png");
		expect(result!.description).toBe("Software Engineer");
		expect(result!.twitter).toBe("ta93abe");
		expect(result!.github).toBe("ta93abe");
		expect(result!.url).toBe("https://ta93abe.com");
	});

	it("should handle partial records gracefully", async () => {
		const { createPublicClient } = await import("viem");
		const mockClient = {
			getEnsAddress: vi.fn().mockResolvedValue("0xabcdef"),
			getEnsAvatar: vi.fn().mockResolvedValue(null),
			getEnsText: vi.fn().mockResolvedValue(null),
		};
		vi.mocked(createPublicClient).mockReturnValue(mockClient as any);

		const result = await getEnsProfile("ta93abe.eth");

		expect(result).not.toBeNull();
		expect(result!.address).toBe("0xabcdef");
		expect(result!.avatar).toBeNull();
		expect(result!.description).toBeNull();
	});
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run src/__tests__/utils/ens.test.ts`
Expected: FAIL with "Cannot find module '../../utils/ens'"

**Step 3: Write minimal implementation**

Create `src/utils/ens.ts`:

```ts
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export interface EnsProfile {
	ensName: string;
	address: string;
	avatar: string | null;
	description: string | null;
	twitter: string | null;
	github: string | null;
	url: string | null;
}

const client = createPublicClient({
	chain: mainnet,
	transport: http("https://cloudflare-eth.com"),
});

export async function getEnsProfile(
	ensName: string,
): Promise<EnsProfile | null> {
	try {
		const address = await client.getEnsAddress({ name: ensName });
		if (!address) return null;

		const [avatar, description, twitter, github, url] = await Promise.all([
			client.getEnsAvatar({ name: ensName }),
			client.getEnsText({ name: ensName, key: "description" }),
			client.getEnsText({ name: ensName, key: "com.twitter" }),
			client.getEnsText({ name: ensName, key: "com.github" }),
			client.getEnsText({ name: ensName, key: "url" }),
		]);

		return {
			ensName,
			address,
			avatar,
			description,
			twitter,
			github,
			url,
		};
	} catch {
		return null;
	}
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:run src/__tests__/utils/ens.test.ts`
Expected: PASS (3 tests)

**Step 5: Run linting**

Run: `pnpm assist`

**Step 6: Commit**

```bash
gt create -m "feat(web3): add ENS profile utility with tests"
```

---

### Task 3: Create 3D ENS Profile Card component

**Files:**
- Create: `src/components/landing/EnsProfileCard.astro`

**Step 1: Create the component**

Create `src/components/landing/EnsProfileCard.astro` with:

1. **Props**: ENS profile data (ensName, address, avatar, description, twitter, github, url)
2. **HTML**: Card structure with avatar, name, address, description, social links
3. **CSS**: 3D perspective, holographic gradient, glassmorphism
4. **Client JS** (`<script>` tag):
   - Mouse tracking: calculate `rotateX`/`rotateY` from mouse position relative to card center
   - Holographic overlay: gradient position follows mouse
   - Mobile: `DeviceOrientationEvent` for gyro-based tilt
   - `prefers-reduced-motion`: disable all transforms, show flat card
   - Address truncation: `0x1234...abcd` format

Key CSS properties:
```css
.ens-card-wrapper {
  perspective: 1000px;
}
.ens-card {
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
}
.ens-card-shine {
  /* holographic gradient overlay */
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 219, 112, 0.2) 45%,
    rgba(132, 50, 255, 0.1) 50%,
    transparent 54%
  );
}
```

**Step 2: Verify with dev server**

Run: `pnpm dev`
Manually check that the component renders correctly at localhost:4321 (will integrate in next task)

**Step 3: Commit**

```bash
gt create -m "feat(web3): add 3D ENS profile card component"
```

---

### Task 4: Integrate into AboutSection

**Files:**
- Modify: `src/components/landing/AboutSection.astro`

**Step 1: Import and use EnsProfileCard**

In the frontmatter of `AboutSection.astro`, import the ENS utility and component:

```astro
---
import { SITE } from "../../config/site";
import { getEnsProfile } from "../../utils/ens";
import EnsProfileCard from "./EnsProfileCard.astro";

const ensProfile = await getEnsProfile(SITE.ensName);
---
```

Add the card after the existing `about-content` div, inside `about-container`:

```astro
{ensProfile && (
  <div class="ens-section" data-animate="fade-up">
    <EnsProfileCard profile={ensProfile} />
  </div>
)}
```

Add CSS for `.ens-section`:
```css
.ens-section {
  margin-top: 4rem;
  display: flex;
  justify-content: center;
}
```

**Step 2: Test with dev server**

Run: `pnpm dev`
Open http://localhost:4321 and scroll to About section.
Expected: ENS profile card appears below the stats with 3D tilt effect.

**Step 3: Test build**

Run: `pnpm build`
Expected: Build completes. ENS data fetched at build time and baked into static HTML.

**Step 4: Run all tests**

Run: `pnpm test:run`
Expected: All tests pass.

**Step 5: Run linting**

Run: `pnpm assist`

**Step 6: Commit**

```bash
gt create -m "feat(web3): integrate ENS profile card into About section"
```

---

### Task 5: Final verification and PR

**Step 1: Full build verification**

Run: `pnpm build && pnpm preview`
Open http://localhost:4321 and verify:
- [ ] ENS card appears in About section
- [ ] 3D tilt works on mouse move
- [ ] Holographic shine effect works
- [ ] Address is truncated (0x1234...abcd)
- [ ] Social links are clickable
- [ ] Mobile responsive
- [ ] prefers-reduced-motion works (disable animations in OS settings)

**Step 2: All tests pass**

Run: `pnpm test:run && pnpm assist`

**Step 3: Submit PR**

Run: `gt submit --no-interactive`

**Step 4: Update Linear issue**

Move TA-351 to "In Review" status.
