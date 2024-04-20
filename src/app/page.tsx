import { cn } from "@/libs/utils";
import { Inspiration } from "next/font/google";

const inspiration = Inspiration({ weight: "400", subsets: ["latin"] });

export default function Home() {
	return (
		<div
			className={cn(
				inspiration.className,
				"text-9xl grid place-content-center place-items-center",
			)}
		>
			<h2>Takumi Abe</h2>
			<h2>Bokuh Ito</h2>
		</div>
	);
}
