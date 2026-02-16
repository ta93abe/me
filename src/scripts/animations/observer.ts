const observer = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			}
		}
	},
	{ threshold: 0.1 },
);

for (const el of document.querySelectorAll("[data-animate]")) {
	observer.observe(el);
}
