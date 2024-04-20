import { formatDate, getBlogPosts } from "@/libs/posts";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "ブログ",
	description: "このブログは、技術的なことや日常のことについて書いています。",
};

export default function Posts() {
	const allBlogs = getBlogPosts();
	return (
		<div>
			{allBlogs
				.sort((a, b) => {
					if (
						new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
					) {
						return -1;
					}
					return 1;
				})
				.map((blog) => (
					<Link key={blog.slug} href={`/blog/${blog.slug}`}>
						<div>
							<p>{formatDate(blog.metadata.publishedAt, false)}</p>
							<p>{blog.metadata.title}</p>
						</div>
					</Link>
				))}
		</div>
	);
}
