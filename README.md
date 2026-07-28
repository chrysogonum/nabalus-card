# Wild Correspondences

A small, growing collection of **natural-history poems**.

Live at **https://wild.ppr3.com** (moved 2026-07-28 from
`https://chrysogonum.github.io/nabalus-card/`, which now redirects here)

## The poems

- **Snakeroot** — *Nabalus* (once *Prenanthes*). A charm for becoming, after Appalachian folklore — a woodland plant that re-cuts the shape of its leaves as it grows up, and once shed its own name. → [`v2.html`](v2.html)
- **Cantharophily** — *Magnolia grandiflora.* An epic in deep time, for a magnolia in a jar of tap water: the flower as the first "engagement engine," the beetle it had to flatter, and the long line that runs from a Cretaceous bowl to the feed in your hand. → [`magnolia/`](magnolia/)

## Contents

- `index.html` — the collection's front page
- `magnolia/` — *Cantharophily* (`index.html` + optimized photo), plus a printable edition:
  `print.html` and `cantharophily-print.pdf` (13pp US Letter — light ground, the hover glosses
  moved into the margins, and the two chronologies set as facing strips with their notes as
  endnotes), the line-drawn plate `images/bloom-line.svg`, and `build-print.py`, which
  regenerates `print.html` from `index.html` so the verse cannot drift between the two
- `v2.html` — *Snakeroot*

Full-resolution original photographs are kept locally and excluded from the repository (see `.gitignore`) to keep it lightweight.

> *(The repository is named `nabalus-card` for historical reasons — it began as a single birthday card. The collection has since outgrown the name.)*

## Deploying

**`git push` is the deploy.** GitHub Pages publishes from `main` at the repo root; the site is
live at https://wild.ppr3.com about a minute after a push. No build step, no wrangler command.

⚠ **Do not delete the `CNAME` file at the repo root.** It contains `wild.ppr3.com` and is what binds the
subdomain — GitHub wrote it on 2026-07-28 when the custom domain was set, so it can read as stray.
Deleting it unbinds the domain and the site falls back to `chrysogonum.github.io/nabalus-card/` (which
currently 301-redirects here).

*Note: `PROJECT_STATE.md` is gitignored in this repo, so this guard is repeated here to survive a
fresh clone.*
