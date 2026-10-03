# Yumico Otsubo — portfolio prototype 03

An editable, local static website in HTML, CSS, vanilla JavaScript, and Markdown. Open `index.html` or the local preview at http://127.0.0.1:8765/. No installation or build step is required.

## What is here

- `index.html`: English entry page.
- `en/`, `ja/`, `es/`: language editions, each with an index, About page, and 21 practice pages in `projects/`.
- `assets/style.css`: typography, off-white palette, spacing, responsive layouts, photo strips, and information cards.
- `assets/site.js`: slow photo movement where a strip overflows, language anchors, and the keyboard-accessible image viewer.
- `assets/images/`: image derivatives extracted from the supplied CV PDF. Filenames retain page and asset references. The PDF itself is not included.
- `assets/fonts/`: locally hosted Libre Baskerville with its license.
- `docs/`: editable multilingual notes and editorial questions.

Each row shows a title, place, and period. Opening a row reveals its photographs and a “More” control directly below the arrow. That control opens a floating card sliding in from the right, with the same four fields: period/practice, what was done, the perspective that emerged, and possible later development. Rows without photographs are ready for the images Yumico will add later. A dash in a card means the interpretation has not yet been supplied. The question marks from the source table remain question marks here.

The contact icon opens an email to the address in Yumico’s supplied CV. It does not submit a form or send anything automatically.

## Adding photographs

Put the image file in `assets/images/`. Add a `figure` inside that practice’s `.photo-strip[data-gallery]` in `index.html` and the matching `en/`, `ja/`, and `es/` pages. Use an existing image as the markup example: give it the real intrinsic dimensions and a language-appropriate alt description. Then add it to its individual project page. Every image, including single-image projects, uses a standard height (400px on desktop and 260px on narrow screens), keeps its aspect ratio, and touch without a CSS gap. If they overflow, they move slowly; hover, focus, and manual interaction pause movement. Drag or swipe a strip to move it directly; a flick carries momentum that gradually slows. A short click still opens the image viewer. Reduced-motion preferences disable automatic movement. The floating information card closes with its close button, Escape, or a click outside it.

Content is present directly in HTML and works without JavaScript. Markdown notes are human-editable reference files and do not automatically rebuild HTML.

## Publishing with GitHub Pages

Live prototype: https://c-is-creative.github.io/yumico/

Repository: https://github.com/c-is-creative/yumico

GitHub Pages serves the root of the `main` branch. Pushing updates to `main` deploys them automatically. Relative paths and `.nojekyll` support hosting under the repository subpath without a build step.

The prototype retains `noindex,nofollow` during editorial review. Anyone can visit or share the public site. Remove these tags when the content is ready for search engines.
