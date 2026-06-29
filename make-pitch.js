// make-pitch.js — wrap a built, self-contained brand demo (<brand>-demo.html) with
// the Stampfree "demo / pitch" surround: stampfree topbar, a narrative panel that
// swaps as the journey advances, a journey stepper, and an intro coachmark.
//
// The surround is shared (pitch/surround.css + pitch/surround.js). Everything that
// differs per brand lives in pitch/<brand>.json (which built demo to wrap, the
// chapter copy, and which journey states map to which chapter).
//
// Usage:   node make-pitch.js <brand>
//   e.g.   node make-pitch.js crocs
//          node make-pitch.js myprotein
//
// Output is a single self-contained <brand>-demo-pitch.html (no external refs),
// so it still works by double-click / email / drop-on-a-server.

const fs = require('fs');
const path = require('path');

const dir = __dirname;
const brand = process.argv[2];

if (!brand) {
  console.error('Usage: node make-pitch.js <brand>   (configs available: '
    + fs.readdirSync(path.join(dir, 'pitch')).filter(f => f.endsWith('.json')).map(f => f.replace('.json', '')).join(', ') + ')');
  process.exit(1);
}

const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

// --- load config + shared parts -------------------------------------------------
let cfg;
try {
  cfg = JSON.parse(read(path.join('pitch', brand + '.json')));
} catch (e) {
  console.error('Could not read pitch/' + brand + '.json: ' + e.message);
  process.exit(1);
}

const surroundCSS = read(path.join('pitch', 'surround.css'));
const surroundJS  = read(path.join('pitch', 'surround.js'));

const logoUri = 'data:image/png;base64,'
  + fs.readFileSync(path.join(dir, 'stampfree-logo.png')).toString('base64');

let html;
try {
  html = read(cfg.source);
} catch (e) {
  console.error('Could not read source demo "' + cfg.source + '": ' + e.message);
  process.exit(1);
}

// --- helpers --------------------------------------------------------------------
// Replace the FIRST occurrence of `anchor` using a replacer fn (so $ in the
// inserted text is never treated as a special replacement pattern). Throws if the
// anchor is missing, so a changed source layout fails loudly instead of silently.
function injectAt(anchor, build, label) {
  if (html.indexOf(anchor) === -1) {
    throw new Error('Anchor not found (' + label + '): ' + JSON.stringify(anchor)
      + '\nThe source demo layout may have changed; update make-pitch.js anchors.');
  }
  html = html.replace(anchor, () => build(anchor));
}

const esc = (s) => String(s == null ? '' : s);

// --- 1. inline the surround CSS into the demo's <style> -------------------------
injectAt('</style>', () => '\n/* --- pitch surround --- */\n' + surroundCSS + '\n</style>', 'css');

// --- 2. page title --------------------------------------------------------------
if (/<title>[\s\S]*?<\/title>/.test(html)) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => '<title>' + esc(cfg.title) + '</title>');
}

// --- 3. open the stage: topbar + left narrative rail, before the phone ----------
const wrapperOpen =
  '\n<header class="topbar">\n'
  + '  <a class="brand" href="https://stampfree.ai" target="_blank" rel="noopener">'
  + '<img class="brandlogo" src="' + logoUri + '" alt="Stampfree"></a>\n'
  + '  <div class="meta">' + esc(cfg.meta) + '</div>\n'
  + '</header>\n\n'
  + '<div class="stage">\n'
  + '  <aside class="rail"><div class="narr"><div class="card" id="narr-card"></div></div></aside>\n\n'
  + '  ';
injectAt('<div class="phone">', () => wrapperOpen + '<div class="phone">', 'phone-open');

// --- 4. close the stage: stepper + coachmark, after the phone (before filepick) -
const wrapperClose =
  '\n  <nav class="stepper" id="stepper" aria-label="Journey progress"></nav>\n'
  + '  <div class="coach" id="coach"><span class="ctext">' + esc(cfg.coach)
  + '<button class="cx" id="coachX" type="button" aria-label="Dismiss">×</button></span></div>\n'
  + '</div>\n<!-- /stage -->\n';
injectAt('<input type="file" id="filepick"',
  () => wrapperClose + '<input type="file" id="filepick"', 'phone-close');

// --- 5. inject PITCH config + the shared surround script, before </body> --------
const pitchData = {
  chapters: cfg.chapters || [],
  stateChapters: cfg.stateChapters || {},
  dimTargets: cfg.dimTargets || [],
  coach: cfg.coach || ''
};
const scriptBlock =
  '<script>\nconst PITCH = ' + JSON.stringify(pitchData) + ';\n</script>\n'
  + '<script>\n' + surroundJS + '\n</script>\n';
injectAt('</body>', () => scriptBlock + '</body>', 'body-close');

// --- write + sanity-check -------------------------------------------------------
const out = cfg.out || (brand + '-demo-pitch.html');
const outPath = path.join(dir, out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);

// Flag any relative refs that would break the offline single-file promise
// (data:, http(s):, in-page # links are fine; the [^"'+] class skips JS string
// concatenation like src="'+IMG.product+'" inside the inlined journey).
const leftovers = (html.match(/(?:href|src)="(?!data:|https?:|#)[^"'+]+"/g) || []);
const dormant = (cfg.chapters || []).some(c => c.dormant);
console.log('Built ' + out + ' (' + Math.round(html.length / 1024) + ' KB) from ' + cfg.source);
console.log('  chapters: ' + (cfg.chapters || []).length + (dormant ? ' (incl. 1+ dormant)' : ''));
console.log(leftovers.length
  ? '  WARNING — relative refs remain (not self-contained): ' + leftovers.slice(0, 5).join(', ')
  : '  Self-contained: no relative references.');
