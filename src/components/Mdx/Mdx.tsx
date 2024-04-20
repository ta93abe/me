import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React from "react";

type TableProps = {
	data: {
		headers: string[];
		rows: string[][];
	};
};

function Table({ data }: TableProps) {
	const headers = data.headers.map((header) => <th key={header}>{header}</th>);
	const rows = data.rows.map((row) => (
		<tr key={row.length}>
			{row.map((cell) => (
				<td key={cell}>{cell}</td>
			))}
		</tr>
	));
	return (
		<table>
			<thead>
				<tr>{headers}</tr>
			</thead>
			<tbody>{rows}</tbody>
		</table>
	);
}

type CustomLinkProps = {
	href: string;
	children: React.ReactNode;
};

function CustomLink(props: CustomLinkProps) {
	const href = props.href;

	if (href.startsWith("/")) {
		return <Link {...props}>{props.children}</Link>;
	}

	if (href.startsWith("#")) {
		return <a {...props} />;
	}

	return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

type RoundedImageProps = {
	alt: string;
	src: string;
};

function RoundedImage(props: RoundedImageProps) {
	return <Image className="rounded-lg" {...props} />;
}

function Code({ children, ...props }: { children: string }) {
	const codeHTML = highlight(children);
	// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
	return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

function slugify(str: string) {
	return str
		.toString()
		.toLowerCase()
		.trim() // Remove whitespace from both ends of a string
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/&/g, "-and-") // Replace & with 'and'
		.replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
		.replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

type HeadingProps = {
	children: string;
};

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
	const Heading = ({ children }: { children: string }) => {
		const slug = slugify(children);
		return React.createElement(
			`h${level}`,
			{ id: slug },
			[
				React.createElement("a", {
					href: `#${slug}`,
					key: `link-${slug}`,
					className: "anchor",
				}),
			],
			children,
		);
	};

	Heading.displayName = `Heading${level}`;

	return Heading;
}

const components = {
	h1: createHeading(1),
	h2: createHeading(2),
	h3: createHeading(3),
	h4: createHeading(4),
	h5: createHeading(5),
	h6: createHeading(6),
	Image: RoundedImage,
	a: CustomLink,
	code: Code,
	Table,
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const Mdx = (props: any) => {
	return (
		<MDXRemote
			{...props}
			components={{ ...components, ...(props.components || {}) }}
		/>
	);
};
