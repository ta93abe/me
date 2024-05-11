import type { MicroCMSImage } from "microcms-js-sdk";
import Image from "next/image";
import Link from "next/link";

type Props = {
	thumbnail: MicroCMSImage;
	title: string;
	date: string;
	href: string;
};

export const Card = (props: Props) => {
	return (
		<Link
			href={props.href}
			className="grid grid-rows-subgrid row-span-3 gap-2 rounded-lg shadow-2xl bg-neutral-900 hover:scale-105 transition"
		>
			<Image
				src={props.thumbnail.url}
				alt="Placeholder"
				width={props.thumbnail.width}
				height={props.thumbnail.height}
				className="rounded-t-lg"
			/>
			<div className="px-4 text-sm">{props.date}</div>
			<h2 className="px-4 pb-4 font-bold">{props.title}</h2>
		</Link>
	);
};
