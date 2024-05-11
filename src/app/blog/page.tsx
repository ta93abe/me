import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "ブログ",
	description: "このブログは、技術的なことや日常のことについて書いています。",
};

export default async function Posts() {
	return <main>MAIN</main>;
}
