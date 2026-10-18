/* Quiz engine shared by Know Your Hypertension and Know Your Diabetes.
   A game is run(stage, done, round). done([points...]) adds points and shows the Next button. */
(function () {
  var $ = RB.$, el = RB.el, btn = RB.btn, CONTENT = window.REBEL_CONTENT;
  var topic = null, state = null, keyHandler = null;

  function feedback(ok, title, text, fun) {
    var f = el("div", "fb " + (ok ? "good" : "bad"));
    f.appendChild(el("h3", null, title));
    f.appendChild(el("p", null, text));
    if (fun) f.appendChild(el("p", "fun", fun));
    return f;
  }

  /* ---------- Spring motion ----------
     Starts from the live on-screen value, carries release velocity, can be grabbed mid-flight. */
  function paint(node, x, width) {
    node._x = x;
    node.style.transform = "translate3d(" + x + "px,0,0) rotate(" + (x / 28) + "deg)";
    var out = Math.max(0, Math.abs(x) - width * 0.5) / (width * 0.5);
    node.style.opacity = String(Math.max(0, 1 - out));
  }
  function stopSpring(node) { if (node._raf) { cancelAnimationFrame(node._raf); node._raf = 0; } }
  // response in seconds, damping ratio (1 = no overshoot), velocity in px/s
  function springTo(node, target, o) {
    stopSpring(node);
    var width = o.width || 300, x = node._x || 0, v = o.velocity || 0;
    if (RB.reduceMotion()) { paint(node, target, width); return; }
    var w = 2 * Math.PI / (o.response || 0.4), k = w * w, c = 2 * (o.damping == null ? 1 : o.damping) * w, last = performance.now();
    function step(t) {
      var dt = Math.min((t - last) / 1000, 0.032); last = t;
      v += (-k * (x - target) - c * v) * dt;
      x += v * dt;
      paint(node, x, width);
      if (Math.abs(x - target) < 0.5 && Math.abs(v) < 8) { paint(node, target, width); node._raf = 0; return; }
      node._raf = requestAnimationFrame(step);
    }
    node._raf = requestAnimationFrame(step);
  }
  // Where a flick would come to rest (exponential deceleration, like scrolling).
  function project(v, rate) { rate = rate || 0.998; return (v / 1000) * rate / (1 - rate); }

  /* ---------- Game: Myth or Fact (swipe) ---------- */
  function pickMyths(bank, n) {
    var facts = bank.filter(function (m) { return m.a === "fact"; }), myths = bank.filter(function (m) { return m.a === "myth"; });
    var chosen = [RB.sample(facts, 1)[0], RB.sample(myths, 1)[0]];
    var rest = bank.filter(function (m) { return chosen.indexOf(m) < 0; });
    return RB.shuffle(chosen.concat(RB.sample(rest, n - 2)));
  }

  function runMyth(stage, done, rd) {
    var cards = pickMyths(topic.myths, rd.n);
    var i = 0, hits = [], locked = false, card = null, width = 300;
    var meta = el("div", "count");
    var deck = el("div", "deck");
    var actions = el("div", "swipe");
    var bMyth = btn("btn myth", "← Myth");
    var bFact = btn("btn", "Fact →");
    actions.append(bMyth, bFact);
    var tip = el("p", "swipe-tip", "Swipe the card or press the left and right arrow keys.");
    var fbBox = el("div");
    var nextCard = btn("btn ghost", "Next card");
    nextCard.hidden = true;
    var nw = el("div", "nextwrap"); nw.appendChild(nextCard);
    stage.append(meta, deck, actions, tip, fbBox, nw);

    function mount() {
      deck.innerHTML = ""; fbBox.innerHTML = "";
      nextCard.hidden = true; locked = false;
      bMyth.disabled = false; bFact.disabled = false;
      meta.textContent = "Card " + (i + 1) + " of " + cards.length;
      card = el("div", "qcard", cards[i].t);
      card._x = 0;
      deck.appendChild(card);
      width = deck.offsetWidth || 300;
      var grab = 0, drag = false, hist = [];
      card.addEventListener("pointerdown", function (e) {
        if (locked) return;
        stopSpring(card);                       // grab it mid-flight
        drag = true; hist = [];
        grab = e.clientX - (card._x || 0);      // keep the offset from where it was grabbed
        try { card.setPointerCapture(e.pointerId); } catch (x) {}
      });
      card.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var x = e.clientX - grab;
        hist.push({ t: e.timeStamp, x: x });
        if (hist.length > 6) hist.shift();
        paint(card, x, width);
        card.dataset.dir = x < -24 ? "myth" : x > 24 ? "fact" : "";
      });
      function end() {
        if (!drag) return;
        drag = false;
        var v = 0;
        if (hist.length > 1) {
          var a = hist[0], b = hist[hist.length - 1];
          if (b.t > a.t) v = (b.x - a.x) / (b.t - a.t) * 1000;
        }
        var rest = (card._x || 0) + project(v);   // where the flick is headed
        if (Math.abs(rest) > width * 0.35) decide(rest < 0 ? "myth" : "fact", v);
        else { card.dataset.dir = ""; springTo(card, 0, { velocity: v, response: 0.35, damping: 0.85, width: width }); }
      }
      card.addEventListener("pointerup", end);
      card.addEventListener("pointercancel", end);
    }

    function decide(choice, velocity) {
      if (locked) return;
      locked = true;
      var c = cards[i], ok = choice === c.a, dir = choice === "myth" ? -1 : 1;
      hits.push(ok ? 1 : 0);
      bMyth.disabled = true; bFact.disabled = true;
      card.dataset.dir = choice;
      springTo(card, dir * width * 1.25, { velocity: velocity || 0, response: 0.4, damping: 1, width: width });
      var verdict = c.a === "fact" ? "That one is a fact." : "That one is a myth.";
      var fb = feedback(ok, ok ? "Nailed it" : "Not quite", verdict + " " + c.e, c.f);
      fb.classList.add("in-deck");
      var swap = function () { if (card.parentNode === deck) { deck.removeChild(card); deck.appendChild(fb); } };
      if (RB.reduceMotion()) swap(); else setTimeout(swap, 280);   // result takes the card's place once it has left
      if (i === cards.length - 1) { keyHandler = null; done(hits); }
      else { nextCard.hidden = false; nextCard.focus({ preventScroll: true }); }
    }

    keyHandler = function (e) {
      if (e.key === "ArrowLeft" || e.key === "m") { e.preventDefault(); decide("myth", -600); }
      else if (e.key === "ArrowRight" || e.key === "f") { e.preventDefault(); decide("fact", 600); }
    };
    bMyth.addEventListener("click", function () { decide("myth", -600); });
    bFact.addEventListener("click", function () { decide("fact", 600); });
    nextCard.addEventListener("click", function () { i++; mount(); });
    mount();
  }

  /* ---------- Game: Crowd check ---------- */
  var PERSON = '<svg viewBox="0 0 40 56" aria-hidden="true"><circle cx="20" cy="13" r="10"/><path d="M3 56V42a17 17 0 0 1 17-17 17 17 0 0 1 17 17v14z"/></svg>';

  function runCrowd(stage, done, rd) {
    var cfg = rd.cfg, picked = 0;
    stage.appendChild(el("p", "clue", cfg.prompt));
    var grid = el("div", "crowd"), people = [];
    var tally = el("p", "tries", "You picked 0 of 10");
    var lock = btn("btn", "Lock in my guess");
    lock.disabled = true;
    for (var n = 0; n < 10; n++) {
      var p = btn("person");
      p.innerHTML = PERSON;
      p.setAttribute("aria-pressed", "false");
      p.setAttribute("aria-label", "Person " + (n + 1));
      p.addEventListener("click", function () {
        var on = this.getAttribute("aria-pressed") === "true";
        this.setAttribute("aria-pressed", on ? "false" : "true");
        picked += on ? -1 : 1;
        tally.textContent = "You picked " + picked + " of 10";
        lock.disabled = picked === 0;
      });
      people.push(p); grid.appendChild(p);
    }
    var out = el("div", "stack");
    stage.append(grid, tally, lock, out);
    lock.addEventListener("click", function () {
      people.forEach(function (p) { p.disabled = true; });
      lock.hidden = true;
      var ok = picked >= cfg.accept[0] && picked <= cfg.accept[1];
      out.appendChild(el("p", "label-sm", "The real picture"));
      var real = el("div", "crowd");
      for (var k = 0; k < 10; k++) {
        var r = el("div", "person real" + (k < cfg.full ? "" : k < cfg.full + cfg.part ? " part" : " empty"));
        r.innerHTML = PERSON;
        real.appendChild(r);
      }
      out.appendChild(real);
      out.appendChild(feedback(ok, ok ? "Spot on" : "Not quite", cfg.explain, "You picked " + picked + ". " + cfg.fun));
      state.extra[cfg.key + "Guess"] = picked;
      done([ok ? 1 : 0]);
    });
  }

  /* ---------- Game: Slider ---------- */
  function runSlider(stage, done, rd) {
    var cfg = rd.cfg, pre = cfg.prefix || "", unit = cfg.unit || "";
    function fmt(v) { return pre + v + unit; }
    stage.appendChild(el("p", "clue", cfg.prompt));
    var val = el("div", "year", fmt(cfg.start));
    var s = el("input", "slider");
    s.type = "range"; s.min = cfg.min; s.max = cfg.max; s.step = cfg.step; s.value = cfg.start;
    s.setAttribute("aria-label", cfg.prompt);
    var ticks = el("div", "ticks");
    cfg.ticks.forEach(function (t) { ticks.appendChild(el("span", null, fmt(t))); });
    var lock = btn("btn", "Lock in my answer");
    var out = el("div");
    stage.append(val, s, ticks, lock, out);
    s.addEventListener("input", function () { val.textContent = fmt(s.value); });
    lock.addEventListener("click", function () {
      var v = parseFloat(s.value);
      s.disabled = true; lock.hidden = true;
      var ok = v >= cfg.accept[0] && v <= cfg.accept[1];
      state.extra[cfg.key + "Guess"] = v;
      out.appendChild(feedback(ok, ok ? cfg.good : cfg.bad, cfg.explain, "You said " + fmt(v) + ". " + cfg.fun));
      done([ok ? 1 : 0]);
    });
  }

  /* ---------- Game: Sort the reading ---------- */
  function runSort(stage, done, rd) {
    var names = Object.keys(rd.pool), cards = [], sel = null, checked = false, buckets = {};
    names.forEach(function (n) { RB.sample(rd.pool[n], 2).forEach(function (v) { cards.push({ v: v, ans: n, put: null, node: null }); }); });
    cards = RB.shuffle(cards);
    stage.appendChild(el("p", "clue", "Where does each blood pressure reading belong?"));
    var status = el("p", "tries", "");
    var tray = el("div", "readings");
    var wrap = el("div", "buckets");
    var check = btn("btn", "Check my answers");
    check.disabled = true;
    var out = el("div");

    names.forEach(function (n) {
      var b = el("div", "bucket"), h = btn("bucket-btn", n), list = el("div", "bucket-list");
      b.append(h, list);
      h.addEventListener("click", function () { place(n); });
      buckets[n] = list; wrap.appendChild(b);
    });
    cards.forEach(function (c) {
      var b = btn("reading", c.v);
      b.setAttribute("aria-pressed", "false");
      c.node = b;
      b.addEventListener("click", function () {
        if (checked) return;
        if (c.put) { c.put = null; tray.appendChild(b); }
        select(c); refresh();
      });
      tray.appendChild(b);
    });
    stage.append(status, tray, wrap, check, out);

    function select(c) {
      sel = c;
      cards.forEach(function (x) { var on = x === c; x.node.classList.toggle("sel", on); x.node.setAttribute("aria-pressed", on ? "true" : "false"); });
    }
    function firstFree() { return cards.filter(function (c) { return !c.put; })[0] || null; }
    function place(n) {
      if (checked || !sel) return;
      sel.put = n; buckets[n].appendChild(sel.node);
      var nxt = firstFree();
      select(nxt); refresh();
    }
    function refresh() {
      var free = firstFree();
      check.disabled = !!free;
      status.textContent = sel && !sel.put ? "Now tap a bucket for " + sel.v + "." : free ? "Tap a reading first." : "All sorted. Check your answers.";
      tray.classList.toggle("empty", !free);
    }
    check.addEventListener("click", function () {
      checked = true; check.hidden = true;
      var right = 0;
      cards.forEach(function (c) {
        var ok = c.put === c.ans; if (ok) right++;
        c.node.disabled = true; c.node.classList.remove("sel");
        c.node.classList.add(ok ? "good" : "bad");
        c.node.textContent = ok ? c.v + " ✓" : c.v + " ✗ " + c.ans;
      });
      names.forEach(function (n) { buckets[n].parentNode.querySelector(".bucket-btn").disabled = true; });
      var ok = right >= rd.need;
      state.extra.sortRight = right;
      out.appendChild(feedback(ok, ok ? "Sharp eye" : "Not quite", right + " of " + cards.length + " in the right bucket. " + rd.teach,
        "Normal is under 120/80. Borderline is 120-139 over 80-89. Hypertension starts at 140/90."));
      done([ok ? 1 : 0]);
    });
    select(cards[0]); refresh();
  }

  /* ---------- Game: Early signs ---------- */
  function runSigns(stage, done, rd) {
    var cards = RB.shuffle(RB.sample(rd.real, 5).map(function (t) { return { t: t, real: true }; })
      .concat(rd.decoy.map(function (t) { return { t: t, real: false }; })));
    stage.appendChild(el("p", "clue", "Which of these are real early warning signs?"));
    var grid = el("div", "signs"), tally = el("p", "tries", "0 picked");
    var lock = btn("btn", "Check my picks");
    var out = el("div"), picked = 0;
    cards.forEach(function (c) {
      var b = btn("sign", c.t);
      b.setAttribute("aria-pressed", "false");
      c.node = b;
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        b.setAttribute("aria-pressed", on ? "false" : "true");
        picked += on ? -1 : 1;
        tally.textContent = picked + " picked";
      });
      grid.appendChild(b);
    });
    stage.append(grid, tally, lock, out);
    lock.addEventListener("click", function () {
      lock.hidden = true;
      var miss = 0;
      cards.forEach(function (c) {
        var on = c.node.getAttribute("aria-pressed") === "true", right = on === c.real;
        if (!right) miss++;
        c.node.disabled = true;
        c.node.classList.add(right ? "good" : "bad");
        c.node.textContent = c.t + (c.real ? " (real sign)" : " (not a sign)");
      });
      var ok = miss <= rd.maxMiss;
      state.extra.signsMiss = miss;
      out.appendChild(feedback(ok, ok ? "Good eye" : "Not quite", rd.teach, miss === 0 ? "Perfect picks." : miss + (miss === 1 ? " card was off." : " cards were off.")));
      done([ok ? 1 : 0]);
    });
  }

  var RUN = { myth: runMyth, crowd: runCrowd, slider: runSlider, sort: runSort, signs: runSigns };

  /* ---------- Flow ---------- */
  var sections = ["intro", "game", "result", "thanks"];
  function show(name) {
    sections.forEach(function (s) { $("q-" + s).hidden = s !== name; });
    window.scrollTo(0, 0);
  }

  function renderProgress() {
    var p = $("q-progress");
    p.innerHTML = "";
    p.style.gridTemplateColumns = "repeat(" + topic.rounds.length + ", 1fr)";
    topic.rounds.forEach(function (_, n) {
      var s = document.createElement("span");
      s.className = n < state.r ? "done" : n === state.r ? "now" : "";
      p.appendChild(s);
    });
  }
  function startRound() {
    var rd = topic.rounds[state.r], last = state.r === topic.rounds.length - 1;
    keyHandler = null;
    renderProgress();
    $("q-count").textContent = "Game " + (state.r + 1) + " of " + topic.rounds.length;
    $("q-roundTitle").textContent = rd.name;
    $("q-hint").textContent = rd.hint;
    $("q-stage").innerHTML = "";
    $("q-next").hidden = true;
    $("q-next").textContent = last ? "See my result" : "Next game";
    RUN[rd.type]($("q-stage"), function (points) {
      state.pts = state.pts.concat(points);
      $("q-next").hidden = false;
      $("q-next").focus({ preventScroll: true });
      $("q-next").scrollIntoView({ block: "nearest", behavior: RB.reduceMotion() ? "auto" : "smooth" });
    }, rd);
    $("q-roundTitle").focus({ preventScroll: true });
  }
  function total() { return state.pts.reduce(function (a, b) { return a + b; }, 0); }
  function labelFor(score) {
    var L = topic.labels;
    for (var n = 0; n < L.length; n++) if (score <= L[n].max) return L[n];
    return L[L.length - 1];
  }

  function finish() {
    keyHandler = null;
    var score = total(), lab = labelFor(score), cta = topic.cta;
    $("q-score").textContent = score;
    $("q-label").textContent = lab.name;
    $("q-labelText").textContent = lab.text;
    $("q-ctaTitle").textContent = cta.title;
    $("q-ctaText").textContent = cta.text;
    $("q-ctaNote").textContent = cta.note;
    $("q-raffleNote").textContent = "Every completed game gets one entry, whatever the score. " + topic.raffleNote + " Your name and email stay separate from your answers.";
    var steps = $("q-steps"); steps.innerHTML = "";
    cta.links.forEach(function (l) {
      var a = el("a"); a.href = l.href; a.target = "_blank"; a.rel = "noopener";
      var s = el("span", null, l.title); s.appendChild(el("small", null, l.sub)); a.appendChild(s);
      steps.appendChild(a);
    });
    show("result");
    // Anonymous result row. No name or email.
    var row = { type: "result", topic: topic.id, sessionId: state.sid, score: score, label: lab.name, points: state.pts.join(","), submittedAt: new Date().toISOString() };
    Object.keys(state.extra).forEach(function (k) { row[k] = state.extra[k]; });
    RB.send(row);
  }

  function thanks(title, text, preview) {
    $("q-thanksTitle").textContent = title;
    $("q-thanksText").textContent = text;
    $("q-preview").hidden = !preview;
    show("thanks");
    $("q-thanksTitle").focus({ preventScroll: true });
  }

  function reset() {
    state = { r: 0, pts: [], extra: {}, sid: RB.newId() };
    $("q-form").reset();
    $("q-err").textContent = "";
    $("q-rbtn").disabled = false;
    $("q-rbtn").textContent = "Enter the raffle";
    show("game");
    startRound();
  }

  function open(id) {
    topic = CONTENT[id];
    state = { r: 0, pts: [], extra: {}, sid: RB.newId() };
    keyHandler = null;
    $("q-when").textContent = topic.when;
    $("q-when").hidden = !topic.when;
    $("q-introTitle").textContent = topic.title;
    $("q-lede").textContent = topic.lede;
    show("intro");
    $("q-introTitle").focus({ preventScroll: true });
  }

  $("q-start").addEventListener("click", reset);
  $("q-again").addEventListener("click", reset);
  $("q-menu").addEventListener("click", function () { location.hash = ""; });
  $("q-next").addEventListener("click", function () {
    if (state.r < topic.rounds.length - 1) { state.r++; startRound(); } else finish();
  });
  $("q-skip").addEventListener("click", function () {
    thanks("Thanks for playing.", "Share it with a coworker who might not know the early signs.", !RB.CONFIG.endpoint);
  });
  $("q-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = $("q-name").value.trim(), email = $("q-email").value.trim(), err = $("q-err");
    if (!name) { err.textContent = "Enter your full name."; $("q-name").focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Enter a valid work email, like name@company.com."; $("q-email").focus(); return; }
    err.textContent = "";
    $("q-rbtn").disabled = true;
    $("q-rbtn").textContent = "Sending...";
    // Raffle row has no score and no session id, so it can't be matched to answers.
    RB.send({ type: "raffle", topic: topic.id, name: name, email: email, submittedAt: new Date().toISOString() }).then(function (r) {
      if (r.ok) thanks("You're in the raffle.", topic.raffleNote, !!r.preview);
      else {
        err.textContent = "That didn't go through. Check your connection and try again.";
        $("q-rbtn").disabled = false;
        $("q-rbtn").textContent = "Enter the raffle";
      }
    });
  });

  RB.quiz = {
    open: open,
    title: function () { return topic ? topic.title : ""; },
    onKey: function (e) { if (keyHandler) keyHandler(e); },
    stop: function () { keyHandler = null; }
  };
})();
