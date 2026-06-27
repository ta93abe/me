# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into this Astro static site. A `posthog.astro` initialization component was created and imported into the global `Layout.astro` so PostHog loads on every page. Twelve custom events were instrumented across landing, blog, works, bookshelf, and links sections to track the most meaningful user interactions and content discovery patterns.

| Event name | Description | File |
|---|---|---|
| `blog_post_viewed` | User opens a specific blog post page | `src/pages/blog/[id].astro` |
| `blog_post_shared` | User clicks a share button (X, Bluesky, or LINE) on a blog post | `src/components/blog/ShareButtons.astro` |
| `blog_post_url_copied` | User copies the URL of a blog post using the copy button | `src/components/blog/ShareButtons.astro` |
| `blog_code_copied` | User copies a code snippet from a blog post | `src/pages/blog/[id].astro` |
| `blog_tag_filtered` | User filters blog posts by clicking a tag chip | `src/pages/blog/index.astro` |
| `work_viewed` | User opens a specific work/project detail page | `src/pages/works/[id].astro` |
| `works_tag_filtered` | User filters works by clicking a tag chip | `src/pages/works/index.astro` |
| `bookshelf_tag_filtered` | User filters bookshelf entries by clicking a tag chip | `src/pages/bookshelf/index.astro` |
| `sns_link_clicked` | User clicks on a social/external link in the Links page | `src/components/SnsLinks.astro` |
| `hero_cta_clicked` | User clicks a CTA button in the hero section of the homepage | `src/components/landing/HeroSection.astro` |
| `landing_section_clicked` | User clicks a navigation card in the landing page Navigate section | `src/components/landing/LinksSection.astro` |
| `rss_feed_clicked` | User clicks the RSS feed link on the blog list page | `src/pages/blog/index.astro` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://us.i.posthog.com/project/413494/dashboard/1764634)
  - Blog post views over time
  - Blog engagement actions (shares, URL copies, code copies)
  - Content discovery (SNS links, hero CTA, navigation cards)
  - Works page engagement
  - Filter usage (blog, works, bookshelf)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the PostHog env var names (`PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`) to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
