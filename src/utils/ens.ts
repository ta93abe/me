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

function getClient() {
	return createPublicClient({
		chain: mainnet,
		transport: http("https://cloudflare-eth.com"),
	});
}

export async function getEnsProfile(
	ensName: string,
): Promise<EnsProfile | null> {
	try {
		const client = getClient();
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
	} catch (error) {
		console.error(`[ENS] Failed to fetch profile for ${ensName}:`, error);
		return null;
	}
}
