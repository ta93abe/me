document
	.querySelectorAll<HTMLElement>("[data-filter-sort]")
	.forEach((filterComponent) => {
		const containerId = filterComponent.dataset.container;
		if (!containerId) return;

		const container = document.getElementById(containerId);
		if (!container) return;

		const items = Array.from(
			container.querySelectorAll<HTMLElement>("[data-item]"),
		);
		const filterChips =
			filterComponent.querySelectorAll<HTMLElement>(".filter-chip");
		const resultCount = filterComponent.querySelector(".result-count");
		const activeFilterArea = filterComponent.querySelector(
			".active-filter-area",
		);
		const activeFilterTag = filterComponent.querySelector(".active-filter-tag");
		const resetFilterBtn = filterComponent.querySelector(".reset-filter-btn");
		const emptyState = filterComponent.querySelector(".empty-state");
		const resetAllBtn = filterComponent.querySelector(".reset-all-btn");

		let currentTag = "all";

		function resetToAll() {
			currentTag = "all";
			filterChips.forEach((chip) => {
				chip.classList.remove("active");
				if (chip.dataset.tag === "all") {
					chip.classList.add("active");
				}
			});
			applyFilter();
		}

		function updateActiveFilterArea() {
			if (!activeFilterArea || !activeFilterTag) return;

			if (currentTag === "all") {
				activeFilterArea.classList.add("hidden");
				activeFilterArea.classList.remove("flex");
			} else {
				activeFilterArea.classList.remove("hidden");
				activeFilterArea.classList.add("flex");
				activeFilterTag.textContent = currentTag;
			}
		}

		function updateResultCount(count: number, total: number) {
			if (!resultCount) return;
			if (currentTag === "all") {
				resultCount.textContent = `${total}件を表示中`;
			} else {
				resultCount.textContent = `${count} / ${total}件を表示中`;
			}
		}

		function updateEmptyState(count: number) {
			if (!emptyState) return;

			if (count === 0) {
				emptyState.classList.remove("hidden");
				container?.classList.add("hidden");
			} else {
				emptyState.classList.add("hidden");
				container?.classList.remove("hidden");
			}
		}

		function applyFilter() {
			const filteredItems = items.filter((item) => {
				if (currentTag === "all") return true;
				const itemTags = item.dataset.tags ? item.dataset.tags.split(",") : [];
				return itemTags.includes(currentTag);
			});

			items.forEach((item) => {
				if (filteredItems.includes(item)) {
					item.classList.remove("filter-hidden");
				} else {
					item.classList.add("filter-hidden");
				}
			});

			updateResultCount(filteredItems.length, items.length);
			updateActiveFilterArea();
			updateEmptyState(filteredItems.length);
		}

		filterChips.forEach((chip) => {
			chip.addEventListener("click", () => {
				currentTag = chip.dataset.tag ?? "all";
				filterChips.forEach((c) => {
					c.classList.remove("active");
				});
				chip.classList.add("active");
				applyFilter();
			});
		});

		resetFilterBtn?.addEventListener("click", resetToAll);
		resetAllBtn?.addEventListener("click", resetToAll);

		applyFilter();
	});
