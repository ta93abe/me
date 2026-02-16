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
		vi.mocked(createPublicClient).mockReturnValue(
			mockClient as unknown as ReturnType<typeof createPublicClient>,
		);

		const result = await getEnsProfile("nonexistent.eth");
		expect(result).toBeNull();
	});

	it("should return profile data when ENS resolves", async () => {
		const { createPublicClient } = await import("viem");
		const mockClient = {
			getEnsAddress: vi
				.fn()
				.mockResolvedValue("0x1234567890abcdef1234567890abcdef12345678"),
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
		vi.mocked(createPublicClient).mockReturnValue(
			mockClient as unknown as ReturnType<typeof createPublicClient>,
		);

		const result = await getEnsProfile("ta93abe.eth");

		expect(result).not.toBeNull();
		expect(result?.ensName).toBe("ta93abe.eth");
		expect(result?.address).toBe("0x1234567890abcdef1234567890abcdef12345678");
		expect(result?.avatar).toBe("https://example.com/avatar.png");
		expect(result?.description).toBe("Software Engineer");
		expect(result?.twitter).toBe("ta93abe");
		expect(result?.github).toBe("ta93abe");
		expect(result?.url).toBe("https://ta93abe.com");
	});

	it("should handle partial records gracefully", async () => {
		const { createPublicClient } = await import("viem");
		const mockClient = {
			getEnsAddress: vi.fn().mockResolvedValue("0xabcdef"),
			getEnsAvatar: vi.fn().mockResolvedValue(null),
			getEnsText: vi.fn().mockResolvedValue(null),
		};
		vi.mocked(createPublicClient).mockReturnValue(
			mockClient as unknown as ReturnType<typeof createPublicClient>,
		);

		const result = await getEnsProfile("ta93abe.eth");

		expect(result).not.toBeNull();
		expect(result?.address).toBe("0xabcdef");
		expect(result?.avatar).toBeNull();
		expect(result?.description).toBeNull();
	});
});
