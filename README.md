# xiaoranyang.com

Source for my personal academic homepage, [xiaoranyang.com](https://xiaoranyang.com).

It is a static site generated with Next.js from the [PRISM](https://github.com/xyjoey/PRISM) template (v1.3.3), with a few additions: a 3D visitor globe, a "liquid glass" navigation indicator, PDF links and award badges on publications, and an "Attending" card.

## Editing content

Everything you normally change lives in `content/`. No code changes are needed.

| To change | Edit |
| --- | --- |
| Name, title, avatar, social links, navigation | `content/config.toml` |
| Intro paragraph on the home page | `content/bio.md` |
| Research interests, "Attending" list, order of home page sections | `content/about.toml` |
| The highlighted notice on the home page (the gold card: its wording, topics and buttons) | the section with `type = "notice"` in `content/about.toml`; delete that block to take the notice down |
| News | `content/news.toml` |
| Publications | `content/publications.bib` |
| The "Resume" page (education, experience, skills, awards) | `content/resume.toml` |

Images and PDFs go in `public/` and are served from the site root, so `public/figures/x.png` is `/figures/x.png`. Everything in `public/` is published, so it holds only what the site shows. The originals that web images were made from (a figure's source PDF, a full-size logo) are kept in `sources/`, which is not published.

### Publications

`content/publications.bib` is ordinary BibTeX plus a few extra fields that control how an entry is shown. They are stripped from the BibTeX that visitors can copy.

One ordinary field also adds a button: `url = {https://…}`, the paper at its publisher's (IEEE Xplore, the ACM Digital Library…), becomes the "Link" button on the Publications page. It is part of the citation, so it stays in the BibTeX.

| Field | Effect |
| --- | --- |
| `selected = {true}` | Also list the paper on the home page |
| `preview = {/figures/x.webp}` | Figure. On the Publications page it is a thumbnail cropped to a fixed shape; the whole figure, at its own proportions, is in the panel that the entry's "More" button opens. Use PNG, JPG or WebP; a PDF cannot be displayed and has to be exported as an image first |
| `description = {...}` | Short summary, shown in the "More" panel |
| `pdf = {/papers/x.pdf}` | The paper itself, a PDF in `public/papers/`. Adds a "PDF" button, which opens a page of this site showing the paper (`/publications/<citation key>/`). An address elsewhere (`https://…`) is linked to directly instead |
| `award = {...}` | Adds an award badge |
| `venue_icon = {a.webp, b.svg}` | Logo, or several, shown instead of the venue's name in the two publication lists (the "More" panel always gives the name in words). File names are looked up in `public/figures/Conference Icon/`. Use SVG, PNG or WebP, trimmed to the artwork and with a transparent background; all logos are shown at the same height. A logo drawn in dark colours is hard to read on the dark theme: put a lighter version beside it as `a-dark.webp` (or `.svg`, `.png`) and it is used there automatically. Without this field the venue's name and year are shown in words |
| `paper_type = {Poster}` | Kind of paper, written next to the logo |
| `code = {https://...}` | Adds a "Code" button |

Your name in the author list is highlighted automatically (it is matched against `author.name` in `config.toml`).

### Adding a page

Create `content/<name>.toml` with `type = "text"` (Markdown), `"card"` (list of cards) or `"publication"`, then add it to `[[navigation]]` in `content/config.toml`.

## Local development

Requires Node.js 22 or later.

```bash
npm install
npm run dev      # http://localhost:3000, reloads on change
npm run build    # writes the static site to ./out
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes `out/` to GitHub Pages. This needs **Settings → Pages → Build and deployment → Source** set to **GitHub Actions**.

The custom domain is configured in the same settings page; `public/CNAME` is kept as a record of it.

## Visitor map

The globe in the left column of the home page shows where recent visitors came from; hover a bar to see the place and its visit count. Each page load on the live site stores one row (approximate location from the visitor's IP) in a Supabase table; the globe reads the most recent 1,000 rows. Nothing is recorded during local development.

Connection settings are in `content/config.toml` under `[visitor_map]`: `show_globe = false` hides the globe but keeps logging, `enabled = false` turns off both. Database setup and the recommended access rules are described in [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## Layout of the repository

```
content/          Site content (TOML, Markdown, BibTeX)
public/           Static files: figures, papers, globe textures, redirects for old URLs
sources/          Originals of figures and logos (PDFs, full-size images). Not published
src/app/          Routes and global styles
src/components/   React components
src/lib/          Content loaders, BibTeX parser, visitor logging
docs/             Supabase setup notes
```

## Credits

Built on [PRISM](https://github.com/xyjoey/PRISM) by Jiale Liu, used under the MIT license (see `LICENSE-PRISM`). Globe rendering by [globe.gl](https://github.com/vasturiano/globe.gl); earth imagery from NASA Blue Marble.
