# louiskotze.dev

Personal site for Louis Kotze — senior full-stack engineer and Linux
kernel contributor.

Hosted at [louiskotze.dev](https://louiskotze.dev).

## Stack

- [Astro](https://astro.build) — static-first, Markdown-native
- [Cloudflare Pages](https://pages.cloudflare.com) — hosting +
  auto-deploy on push
- [Cloudflare DNS](https://dash.cloudflare.com) — DNS for `louiskotze.dev`
- Plain CSS with custom properties; light/dark mode via
  `prefers-color-scheme`
- No JavaScript runtime cost on the client — Astro ships zero JS by
  default for this site

## Structure

```
louiskotze.dev/
├── public/
│   ├── cv/                          # CV PDFs served for download
│   ├── favicon.svg
│   └── favicon.ico
├── src/
│   ├── content/
│   │   └── blog/                    # Markdown posts (one per file)
│   ├── content.config.ts            # blog collection schema
│   ├── components/                  # Hero, OpenSource, Mentorship, Contact
│   ├── layouts/
│   │   └── Base.astro               # shared page chrome
│   ├── pages/
│   │   ├── index.astro              # landing page
│   │   └── blog/
│   │       ├── index.astro          # post list
│   │       └── [...slug].astro      # post page
│   └── styles/
│       └── global.css               # design tokens + base styles
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

## Local development

```bash
npm install
npm run dev
```

Site runs at `http://localhost:4321`.

```bash
npm run build        # builds to ./dist
npm run preview      # serves the built site locally
```

## Adding a blog post

1. Copy `src/content/blog/_template.md` to a real filename
   (e.g. `kernel-first-patch.md`)
2. Edit frontmatter (`title`, `description`, `pubDate`, `tags`)
3. Write the post body in Markdown
4. Set `draft: false` when ready
5. `git commit`, `git push` — Cloudflare Pages auto-deploys

Posts with `draft: true` are excluded from both the list and the
generated routes, so work-in-progress never appears on the live site.

## Licensing

- **Code** (Astro components, configuration, CSS) — MIT, see `LICENSE`
- **Content** (`src/content/`, blog posts, copy) — CC&nbsp;BY&nbsp;4.0,
  see `LICENSE-CONTENT`

Attribution requested; reuse encouraged.
