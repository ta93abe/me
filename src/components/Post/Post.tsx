"use client";

import { useTina } from "tinacms/dist/react";
import type {
	PostConnectionQuery,
	PostConnectionQueryVariables,
} from "../../../tina/__generated__/types";

type Props = {
	posts: {
		data: PostConnectionQuery;
		query: string;
		variables: PostConnectionQueryVariables;
	};
};

export const Post = ({ posts }: Props) => {
	const { data } = useTina({
		query: posts.query,
		variables: posts.variables,
		data: posts.data,
	});
	return (
		<ul>
			{data.postConnection.edges?.map((post) => {
				if (!post?.node) return null;

				const {
					node: { id, title },
				} = post;
				return (
					<li key={id}>
						<a href={`/blog/${id}`}>{title}</a>
					</li>
				);
			})}
		</ul>
	);
};
