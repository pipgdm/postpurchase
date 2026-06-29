# Demo / pitch combo — build system

Wraps a **built, self-contained brand phone demo** (`<brand>-demo.html`) with the
Stampfree pitch surround: a sticky topbar (stampfree logo + brand line), a
narrative panel on the left that swaps as the journey advances, a journey stepper
on the right, and an intro coachmark over the phone.

The phone demo stays untouched in the centre. The surround reacts to it by wrapping
the demo engine's global `render(key)` function — so when the user taps an option
and the chat advances, the narrative + stepper move with it.

## Folder layout

```
demos/
  <brand>-demo.html   INPUT — the built, self-contained brand phone demos
pitch/
  surround.css        shared styles (layout, coachmark, stepper) — edit once, applies to all brands
  surround.js         shared logic (builds stepper + narrative from config, wraps render) — brand-agnostic
  <brand>.json        per-brand config: which demo to wrap, chapter copy, state→chapter map
  builds/             OUTPUT — generated <brand>-demo-pitch.html files (self-contained, double-clickable)
make-pitch.js         the builder (lives at repo root)
stampfree-logo.png    topbar logo, inlined at build time
```

## Build a pitch page

```
node make-pitch.js crocs
node make-pitch.js myprotein
```

Output lands in `pitch/builds/<brand>-demo-pitch.html`.

## Add a NEW brand

1. **Get the brand's phone demo** as a self-contained `<brand>-demo.html` in `demos/`
   (same shape as the others: a `.phone` block, `#chat`, a global `render()`,
   assets inlined as base64). This is the existing per-brand demo — the pitch system
   does not build it, it wraps it.

2. **Create `pitch/<brand>.json`** (copy `crocs.json` as a starting point):

   ```jsonc
   {
     "source": "demos/<brand>-demo.html",            // input demo in demos/
     "out": "pitch/builds/<brand>-demo-pitch.html",  // output path
     "title": "<Brand> × Stampfree — interactive post-purchase demo",
     "meta": "<Brand> × Stampfree · post-purchase journey",   // shown top-right
     "coach": "This is an interactive demo 👉 choose options to continue",
     "dimTargets": [],            // option targets to grey out, e.g. ["start","optout"] (usually [])
     "chapters": [                // one per pitch step shown in the panel + stepper
       { "tag": "...", "h2": "...", "p": "...", "val": "<b>...</b> ...",
         "dormant": false }       // dormant:true => shown greyed in stepper, never activates
     ],
     "stateChapters": {           // map EVERY reachable journey state key → chapter index
       "start": 0, "pickup": 1, "qrcode": 2, "delivered": 3, "sale": 4
     }
   }
   ```

3. **Map the chapters.** `chapters` is the story (left panel + stepper labels).
   `stateChapters` tells the surround which chapter to show for each journey state.
   - List the brand's flow state keys (open `<brand>-demo.html`, find `const flow={…}`).
   - Point each key at the chapter it belongs to.
   - If a chapter has no reachable state (e.g. the brand's demo has no AI step), mark
     that chapter `"dormant": true` so it shows greyed in the stepper but never lights up.

4. **Build:** `node make-pitch.js <brand>`  → `pitch/builds/<brand>-demo-pitch.html`.

## Change the look for ALL brands

Edit `surround.css` (layout, coachmark, stepper) or `surround.js` (behaviour) and
re-run `make-pitch.js` for each brand. One source of truth — no per-file copy-paste.

## Notes

- Output files are fully self-contained (all assets inlined as `data:` URIs); the
  builder warns if any relative reference survives.
- The builder finds its insertion points by anchor (`<div class="phone">`, the
  filepick `<input>`, `</body>`, `</style>`). If a future demo changes that markup,
  the build fails loudly rather than producing a broken page.
