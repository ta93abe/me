export function Header() {
	return (
		<nav className="mx-6 md:mx-0">
			<ul className="flex gap-4 py-8">
				<li>
					<a href="/">Top</a>
				</li>
				<li>
					<a href="/crafts">Crafts</a>
				</li>
				<li>
					<a href="/tools">Tools</a>
				</li>
				<li>
					<a href="/blog">Blog</a>
				</li>
				<li>
					<a href="/contact">Contact</a>
				</li>
			</ul>
		</nav>
	);
}
