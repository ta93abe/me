import { Header } from "@/components/Header";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/libs/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "ta93abe",
	description: "ta93abe's personal website",
};

type Props = Readonly<{
	children: React.ReactNode;
}>;

export default function RootLayout({ children }: Props) {
	return (
		<html lang="en">
			<body
				className={cn(
					"bg-neutral-800 text-neutral-200 flex flex-col min-h-screen max-w-3xl mx-auto",
					inter.className,
				)}
			>
				<Header />
				<main>{children}</main>
			</body>
		</html>
	);
}
