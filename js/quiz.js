/* Quiz engine shared by Know Your Hypertension and Know Your Diabetes.
   A game is run(stage, done, round). done([points...]) adds points and shows the Next button. */
(function () {
  var $ = RB.$, el = RB.el, btn = RB.btn, CONTENT = window.REBEL_CONTENT;
  var topic = null, state = null, keyHandler = null, carried = null, doubled = false, lastScore = 0;

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
    var nextCard = btn("btn next-in-place", "Next card");
    nextCard.hidden = true;
    actions.append(bMyth, bFact, nextCard);   // the next button takes the place of Myth and Fact
    var tip = el("p", "swipe-tip", "Swipe the card or press the left and right arrow keys.");
    var fbBox = el("div");
    stage.append(meta, deck, actions, tip, fbBox);

    function mount() {
      deck.innerHTML = ""; fbBox.innerHTML = "";
      nextCard.hidden = true; locked = false;
      bMyth.hidden = false; bFact.hidden = false;
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
      bMyth.hidden = true; bFact.hidden = true;
      card.dataset.dir = choice;
      springTo(card, dir * width * 1.25, { velocity: velocity || 0, response: 0.4, damping: 1, width: width });
      var verdict = c.a === "fact" ? "That one is a fact." : "That one is a myth.";
      var fb = feedback(ok, ok ? "Nailed it" : "Not quite", verdict + " " + c.e, c.f);
      fb.classList.add("in-deck");
      var swap = function () { if (card.parentNode === deck) { deck.removeChild(card); deck.appendChild(fb); } };
      if (RB.reduceMotion()) swap(); else setTimeout(swap, 280);   // result takes the card's place once it has left
      nextCard.hidden = false;
      if (i === cards.length - 1) {
        keyHandler = null; done(hits);
        var nx = $("q-next"); nextCard.textContent = nx.textContent; nx.hidden = true;   // same spot, so the pointer stays put
        nextCard.onclick = function () { nx.click(); };
      } else { nextCard.textContent = "Next card"; nextCard.onclick = function () { i++; mount(); }; }
      nextCard.focus({ preventScroll: true });
    }

    keyHandler = function (e) {
      if (e.key === "ArrowLeft" || e.key === "m") { e.preventDefault(); decide("myth", -600); }
      else if (e.key === "ArrowRight" || e.key === "f") { e.preventDefault(); decide("fact", 600); }
    };
    bMyth.addEventListener("click", function () { decide("myth", -600); });
    bFact.addEventListener("click", function () { decide("fact", 600); });
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
    // If the browser cancels a touch part way through, drop focus so the slider cannot stay "held".
    ["pointercancel", "touchcancel", "lostpointercapture"].forEach(function (t) { s.addEventListener(t, function () { s.blur(); }); });
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
    var names = Object.keys(rd.pool), cards = [], sel = null, checked = false, buckets = {}, boxes = {}, suppress = false;
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
      buckets[n] = list; boxes[n] = b; wrap.appendChild(b);
    });
    cards.forEach(function (c) {
      var b = btn("reading", c.v);
      b.setAttribute("aria-pressed", "false");
      c.node = b;
      b.addEventListener("click", function () {
        if (checked || suppress) { suppress = false; return; }
        if (c.put) { c.put = null; tray.appendChild(b); }
        select(c); refresh();
      });
      attachDrag(c);
      tray.appendChild(b);
    });
    stage.append(status, tray, wrap, check, out);

    /* Drag a reading into a bucket. Tracks the pointer 1:1 from where it was grabbed, picks the bucket under the
       pointer on release, and springs home (carrying the release velocity) if it was dropped nowhere useful. */
    function dragTransform(node) { node.style.transform = "translate3d(" + node._dx + "px," + node._dy + "px,0) scale(1.06)"; }
    function clearDrag(node) { node.style.transform = ""; node.style.zIndex = ""; node.classList.remove("dragging"); node._dx = node._dy = 0; }
    function springHome(node, vx, vy) {
      var x = node._dx || 0, y = node._dy || 0;
      if (RB.reduceMotion()) { clearDrag(node); return; }
      var w = 2 * Math.PI / 0.38, k = w * w, cc = 2 * w, last = performance.now();
      function step(t) {
        var dt = Math.min((t - last) / 1000, 0.032); last = t;
        vx += (-k * x - cc * vx) * dt; vy += (-k * y - cc * vy) * dt;
        x += vx * dt; y += vy * dt;
        node._dx = x; node._dy = y;
        if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5 && Math.abs(vx) < 8 && Math.abs(vy) < 8) { node._raf = 0; clearDrag(node); return; }
        dragTransform(node);
        node._raf = requestAnimationFrame(step);
      }
      node._raf = requestAnimationFrame(step);
    }
    function zoneAt(node, x, y) {
      var els = document.elementsFromPoint(x, y);
      for (var i = 0; i < els.length; i++) {
        if (node.contains(els[i])) continue;
        for (var n in boxes) if (boxes[n] === els[i] || boxes[n].contains(els[i])) return n;
        if (els[i] === tray) return "";
      }
      return null;
    }
    function hot(n) { names.forEach(function (k) { boxes[k].classList.toggle("hot", k === n); }); }
    function attachDrag(c) {
      var node = c.node, sx = 0, sy = 0, ox = 0, oy = 0, active = false, moved = false, hist = [];
      node._dx = node._dy = 0;
      node.addEventListener("pointerdown", function (e) {
        if (checked || e.button !== 0) return;
        if (node._raf) { cancelAnimationFrame(node._raf); node._raf = 0; }   // grab it mid-flight
        active = true; moved = !!(node._dx || node._dy); hist = [];
        sx = e.clientX; sy = e.clientY; ox = node._dx || 0; oy = node._dy || 0;
        try { node.setPointerCapture(e.pointerId); } catch (x) {}
      });
      node.addEventListener("pointermove", function (e) {
        if (!active) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (!moved && Math.hypot(dx, dy) < 8) return;   // a small wobble is still a tap
        if (!moved) { moved = true; select(c); refresh(); node.classList.add("dragging"); node.style.zIndex = "30"; }
        node._dx = ox + dx; node._dy = oy + dy;
        dragTransform(node);
        hist.push({ t: e.timeStamp, x: e.clientX, y: e.clientY }); if (hist.length > 6) hist.shift();
        var z = zoneAt(node, e.clientX, e.clientY); hot(z && boxes[z] ? z : null);
      });
      function end(e) {
        if (!active) return;
        active = false; hot(null);
        if (!moved) return;                 // plain tap: the click handler takes over
        suppress = true; setTimeout(function () { suppress = false; }, 0);
        var vx = 0, vy = 0;
        if (hist.length > 1) { var a = hist[0], b = hist[hist.length - 1]; if (b.t > a.t) { vx = (b.x - a.x) / (b.t - a.t) * 1000; vy = (b.y - a.y) / (b.t - a.t) * 1000; } }
        var z = e.type === "pointercancel" ? null : zoneAt(node, e.clientX, e.clientY);
        if (z && boxes[z]) {
          clearDrag(node); select(c); place(z);
          node.classList.add("landed"); setTimeout(function () { node.classList.remove("landed"); }, 260);
        } else if (z === "" && c.put) {
          clearDrag(node); c.put = null; tray.appendChild(node); select(c); refresh();
        } else springHome(node, vx, vy);
      }
      node.addEventListener("pointerup", end);
      node.addEventListener("pointercancel", end);
    }

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
  var sections = ["intro", "game", "result"];
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
    lastScore = score;
    renderScores();
    renderDouble();
    var link = $("q-qrLink"); link.href = topic.qrUrl; link.innerHTML = "";
    link.onclick = function (e) { e.preventDefault(); RB.copyAndGo(topic.qrUrl, scoreString()); };
    link.appendChild(images.score || makeQr(topic.qr, "QR code to log your score and enter the raffle"));
    link.appendChild(el("span", "qr-cap", SCORE_CAP)); edges(link);
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

  // QR images are created as soon as a quiz opens, so they are loaded and decoded before anyone taps for them.
  var images = {};
  function makeQr(src, alt) { var im = el("img"); im.decoding = "sync"; im.src = src; im.alt = alt; im.width = 260; im.height = 260; return im; }
  function preload() {
    images.program = makeQr(topic.program.qr, "QR code to sign up for the free " + topic.program.label);
    images.score = makeQr(topic.qr, "QR code to log your score and enter the raffle");
  }

  // A bold frame around each QR that says it can be clicked, on all four sides.
  function edges(link) {
    ["t", "b", "l", "r"].forEach(function (s) { var i = el("i", "qe " + s, "You can click the QR code"); i.setAttribute("aria-hidden", "true"); link.appendChild(i); });
  }
  var SCORE_CAP = "On a phone? Tap the code to open the score and raffle form.";
  var PROGRAM_CAP = "On a phone? Tap the code to open the sign-up form.";

  function free(t) { return el("strong", "free", t); }   // highlights the free part of the offer

  // The scores shown on the result screen.
  function renderScores() {
    var list = $("q-logScores"); list.innerHTML = "";
    function item(name, val) { var li = el("li"); li.appendChild(el("span", null, name)); li.appendChild(el("b", null, val)); list.appendChild(li); }
    if (carried && carried.memory) item("Memory Match", RB.timeLabel(carried.memory.time) + " in " + carried.memory.moves + (carried.memory.moves === 1 ? " move" : " moves"));
    item(topic.title, lastScore + " out of 7");
    if (doubled) item("Prevention program", "Applied to " + topic.program.abbr);
  }
  // The text copied for the score form, e.g. "12.5 + 2/7 + applied to HP".
  function scoreString() {
    var parts = [];
    if (carried && carried.memory) parts.push(RB.scoreTime(carried.memory.time));
    parts.push(lastScore + "/7");
    if (doubled) parts.push("applied to " + topic.program.abbr);
    return parts.join(" + ");
  }

  function renderDouble() {
    var b = $("q-double");
    b.disabled = doubled; b.classList.toggle("doubled", doubled);
    b.textContent = doubled ? "\u2713 Entries doubled" : "Double your entries";
    var dn = $("q-doubleNote"); dn.textContent = "";
    if (doubled) dn.append("Your entries are doubled. Scan the code to log your score.");
    else dn.append("Sign up for the ", free("free"), " " + topic.program.label + " to double your chances.");
  }
  var sheet = $("q-sheet");
  function openSheet() {
    var p = topic.program;
    var st = $("q-sheetText"); st.textContent = "";
    st.append("Scan the code to sign up for the ", free("free"), " " + p.label + ".");
    $("q-sheetDone").hidden = true;   // only appears once they have opened the sign-up form
    var l = $("q-progLink"); l.href = p.url; l.innerHTML = "";
    l.onclick = function () {
      st.textContent = "Finish the form, then come back here and tap done.";
      $("q-sheetDone").hidden = false;
    };
    l.appendChild(images.program || makeQr(p.qr, "QR code to sign up for the free " + p.label));   // already loaded by open()
    l.appendChild(el("span", "qr-cap", PROGRAM_CAP)); edges(l);
    sheet.showModal();
    // The sheet grows out of the button that opened it.
    var r = $("q-double").getBoundingClientRect(), s = sheet.getBoundingClientRect();
    sheet.style.transformOrigin = (r.left + r.width / 2 - s.left) + "px " + (r.top + r.height / 2 - s.top) + "px";
    $("q-sheetClose").focus({ preventScroll: true });
  }
  function closeSheet() { if (sheet.open) sheet.close(); }

  function reset() {
    state = { r: 0, pts: [], extra: {}, sid: RB.newId() };
    show("game");
    startRound();
  }

  function open(id, carry) {
    topic = CONTENT[id];
    carried = carry || null; doubled = false; closeSheet(); preload();
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
  $("q-double").addEventListener("click", openSheet);
  $("q-sheetDone").addEventListener("click", function () { doubled = true; closeSheet(); renderDouble(); renderScores(); $("q-qrLink").focus({ preventScroll: true }); });
  $("q-sheetClose").addEventListener("click", closeSheet);
  sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });   // tap outside to dismiss
  $("q-menu").addEventListener("click", function () { location.hash = ""; });
  $("q-next").addEventListener("click", function () {
    if (state.r < topic.rounds.length - 1) { state.r++; startRound(); } else finish();
  });

  RB.quiz = {
    open: open,
    title: function () { return topic ? topic.title : ""; },
    onKey: function (e) { if (keyHandler) keyHandler(e); },
    stop: function () { keyHandler = null; closeSheet(); }
  };
})();
