# Post-purchase demos

Interactive WhatsApp post-purchase journeys with a Stampfree **demo / pitch** wrapper —
the live phone demo sits in the centre while an explainer panel and journey stepper
update around it as you tap through.

## Layout

```
demos/                 self-contained brand phone demos (the interactive bit)
pitch/                 the demo/pitch build system  (see pitch/README.md)
  surround.css         shared styles
  surround.js          shared logic
  <brand>.json         per-brand config (chapters + state→chapter map)
  builds/              generated, self-contained pitch pages  ← served by Pages
make-pitch.js          builder:  node make-pitch.js <brand>
stampfree-logo.png     topbar logo (inlined at build time)
```

## Build a pitch page

```
node make-pitch.js crocs
node make-pitch.js myprotein
```

Output: `pitch/builds/<brand>-demo-pitch.html` (self-contained — works by double-click,
email, or static host). To add a new brand, see **pitch/README.md**.

## Live (GitHub Pages)

- MyProtein pitch — `pitch/builds/myprotein-demo-pitch.html`
- Crocs pitch — `pitch/builds/crocs-demo-pitch.html`
