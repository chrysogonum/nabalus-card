# Wild Correspondences

A small, growing collection of **natural-history poems** — where a plant, or some quiet corner of the living world, hands over a connection worth keeping.

Live at **https://chrysogonum.github.io/nabalus-card/**

## The poems

- **Cantharophily** — *Magnolia grandiflora.* An epic in deep time, for a magnolia in a jar of tap water: the flower as the first "engagement engine," the beetle it had to flatter, and the long line that runs from a Cretaceous bowl to the feed in your hand. → [`magnolia/`](magnolia/)
- **Snakeroot** — *Nabalus* (once *Prenanthes*). A charm for becoming, after Appalachian folklore — a woodland plant that re-cuts the shape of its leaves as it grows up, and once shed its own name. → [`v2.html`](v2.html)

## How it's built

Each poem is a **single, self-contained HTML page** — no build step, no framework. The only external dependency is Google Fonts, which degrades gracefully to a system serif. Pages reveal gently on scroll, respect `prefers-reduced-motion`, and print cleanly to PDF.

The science is kept honest and flagged where it strays toward art (see, for instance, the note "For the botanists & the beetle-curious" at the foot of *Cantharophily*).

## Contents

- `index.html` — the collection's front page
- `magnolia/` — *Cantharophily* (`index.html` + optimized photo)
- `v2.html` — *Snakeroot*

Full-resolution original photographs are kept locally and excluded from the repository (see `.gitignore`) to keep it lightweight.

> *(The repository is named `nabalus-card` for historical reasons — it began as a single birthday card. The collection has since outgrown the name.)*
