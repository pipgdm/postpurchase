// ===== Pitch surround (shared) — driven by the PITCH config injected above =====
// Reads global PITCH = { chapters:[{tag,h2,p,val,dormant?}], stateChapters:{key:idx} }.
// Builds the stepper + narrative panel, then wraps the engine's global render()
// so the surround tracks whatever state the journey is in. Brand-agnostic.
(function () {
  if (typeof PITCH === 'undefined') return;
  var CHAP = PITCH.chapters || [];
  var STATE_CH = PITCH.stateChapters || {};

  function num(i) { return ('0' + (i + 1)).slice(-2); }

  // Build the right-hand stepper from the chapter list.
  var stepper = document.getElementById('stepper');
  if (stepper) {
    stepper.innerHTML = CHAP.map(function (c, i) {
      var cls = 'row'
        + (c.dormant ? ' dormant' : '')
        + (i === 0 && !c.dormant ? ' active' : '');
      return '<div class="' + cls + '" data-ch="' + i + '">'
        + '<div class="pip">' + num(i) + '</div>'
        + '<div class="lbl">' + c.tag + '</div></div>';
    }).join('');
  }

  // Render one chapter's narrative card.
  var card = document.getElementById('narr-card');
  function cardHTML(i) {
    var c = CHAP[i];
    return '<div class="eyebrow"><span class="num">' + num(i) + '</span>'
      + '<span class="tagtxt">' + c.tag + '</span></div>'
      + '<h2>' + c.h2 + '</h2>'
      + '<p>' + c.p + '</p>'
      + '<div class="value">' + c.val + '</div>';
  }
  // Start on the first non-dormant chapter.
  var first = 0;
  while (first < CHAP.length && CHAP[first].dormant) first++;
  if (first >= CHAP.length) first = 0;
  if (card) card.innerHTML = cardHTML(first);

  var cur = first;
  function setChapter(i) {
    if (i == null || i === cur || !CHAP[i] || CHAP[i].dormant) return;
    cur = i;
    if (stepper) {
      stepper.querySelectorAll('.row').forEach(function (r) {
        if (r.classList.contains('dormant')) return;     // dormant never lights up
        var ci = +r.dataset.ch;
        r.classList.toggle('active', ci === i);
        r.classList.toggle('done', ci < i);
      });
    }
    if (!card) return;
    card.classList.add('out');
    setTimeout(function () {
      card.innerHTML = cardHTML(i);
      card.classList.add('in-prep');
      card.classList.remove('out');
      void card.offsetWidth;        // reflow so the entrance transition runs
      card.classList.remove('in-prep');
    }, 300);
  }

  // Options whose target doesn't move the story forward (config-driven; empty = none).
  var DIM = {};
  (PITCH.dimTargets || []).forEach(function (k) { DIM[k] = 1; });
  function dimOptions() {
    var chat = document.getElementById('chat');
    var cards = chat.querySelectorAll('.opts');
    if (!cards.length) return;
    cards[cards.length - 1].querySelectorAll('[data-next]').forEach(function (b) {
      if (DIM[b.dataset.next]) b.classList.add('dim');
    });
  }

  // Intro coachmark: show once the first options appear, dismiss on first tap.
  var coach = document.getElementById('coach');
  var coachShown = false, coachDismissed = false;
  function showCoach() {
    if (coachShown || coachDismissed || !coach) return;
    coachShown = true;
    coach.classList.add('show');
  }
  function hideCoach() {
    if (!coach) return;
    coachDismissed = true;
    coach.classList.remove('show');
  }
  var chatEl = document.getElementById('chat');
  if (chatEl) chatEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) hideCoach();
  }, true);
  var coachX = document.getElementById('coachX');
  if (coachX) coachX.addEventListener('click', hideCoach);

  // Wrap the engine's global render() so every state change updates the surround.
  if (typeof render === 'function') {
    var _render = render;
    render = function (key) {
      _render(key);
      if (key in STATE_CH) setChapter(STATE_CH[key]);
      dimOptions();
      if (key === 'start') setTimeout(showCoach, 250);
    };
  }
})();
