import Image from "next/image";
import { notFound } from "next/navigation";
import client from "../../../../tina/__generated__/client";

type Props = {
	params: {
		slug: string;
	};
};

export async function generateStaticParams() {
	const posts = await client.queries.postConnection();
	const edges = posts.data.postConnection.edges;
	if (!edges) {
		return [];
	}
	return edges.map((edge) => {
		if (!edge?.node?._sys) {
			return;
		}
		return {
			params: {
				slug: edge?.node._sys.filename,
			},
		};
	});
}

export default async function Blog({ params }: Props) {
	const blog = await client.queries.post({ relativePath: `${params.slug}.md` });
	if (!blog) {
		notFound();
	}

	return (
		<main>
			<Image
				src={blog.data.post.thumbnail}
				alt={blog.data.post.title}
				width={400}
				height={400}
			/>
			<h1>{blog.data.post.title}</h1>
		</main>
	);
}
