/* Memory Match: tutorial, cards dealt face down, "Ready to Memorize?", 7 second preview, centered Ready, 3-2-1-Go,
   timer and cards unlock after the overlay fades. */
(function () {
  var $ = RB.$;
  var SET = [
    { k: "Stress less", img: "illustrations/stressed-at-desk.png" },
    { k: "Talk it out", img: "illustrations/talking-it-through.png" },
    { k: "Healthy mind", img: "illustrations/strong-mind.png" },
    { k: "Move", img: "illustrations/runner.png" }
  ];
  var PREVIEW = 7;
  var grid = $("mm-grid"), go = $("mm-go"), rdy = $("mm-ready"), memo = $("mm-memorize"), tut = $("mm-tutorial"), win = $("mm-win"), count = $("mm-count"), num = $("mm-num");
  var startToken = 0, open = [], moves = 0, pairs = 0, lock = true, phase = "", t0 = 0, tick = 0, cd = 0, timers = [];

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearAll() { clearInterval(tick); clearInterval(cd); timers.forEach(clearTimeout); timers = []; }
  function show(t, isGo) { num.className = ""; void num.offsetWidth; num.textContent = t; num.className = "tick" + (isGo ? " go" : ""); }
  // No leading zeros: "3.45", "42.07", then "1:05.30" once a minute has passed.
  function fmt(ms) {
    var c = Math.floor(ms / 10), s = Math.floor(c / 100), h = String(c % 100).padStart(2, "0");
    return s < 60 ? s + "." + h : Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") + "." + h;
  }

  /* Every picture is loaded and decoded before the cards are dealt, so a slow connection can never
     cost anyone the preview. A loader shows while it waits. */
  var ASSETS = SET.map(function (c) { return c.img; }).concat(["illustrations/rebel-wordmark-white.png"]);
  var loaded = [], loadToken = 0, ready_ = false;
  function loadAll(onProgress) {
    var done = 0;
    return Promise.all(ASSETS.map(function (src) {
      return new Promise(function (resolve, reject) {
        var im = new Image(), timer = setTimeout(function () { reject(new Error("timeout")); }, 25000);
        im.onload = function () {
          clearTimeout(timer);
          (im.decode ? im.decode() : Promise.resolve()).catch(function () {}).then(function () { loaded.push(im); onProgress(++done); resolve(); });
        };
        im.onerror = function () { clearTimeout(timer); reject(new Error("failed " + src)); };
        im.src = src;
      });
    }));
  }
  function whenLoaded() {
    if (ready_) return Promise.resolve();
    var token = ++loadToken, box = $("mm-loading");
    var showTimer = setTimeout(function () { box.hidden = false; $("mm-loadingTitle").textContent = "Loading the cards..."; $("mm-retry").hidden = true; }, 200);
    function progress(n) { $("mm-loadingBar").style.transform = "scaleX(" + (n / ASSETS.length) + ")"; $("mm-loadingCount").textContent = n + " of " + ASSETS.length; }
    progress(0);
    return loadAll(progress).then(function () {
      clearTimeout(showTimer); box.hidden = true; ready_ = true;
    }, function (err) {
      clearTimeout(showTimer);
      if (token === loadToken) {
        box.hidden = false; $("mm-loadingTitle").textContent = "The cards did not load. Check your connection.";
        $("mm-loadingCount").textContent = ""; $("mm-retry").hidden = false;
      }
      throw err;
    });
  }

  /* ---------- Tutorial: a failed match, then a correct one ---------- */
  var tutTimers = [], tutDone = null;
  function tAt(fn, ms) { tutTimers.push(setTimeout(fn, ms)); }
  function tutClear() { tutTimers.forEach(clearTimeout); tutTimers = []; }
  function runTutorial() {
    var cards = tut.querySelectorAll(".tut-card"), badge = $("tutBadge"), cap = $("tutCaption");
    function up(i, on) { cards[i].classList.toggle("up", on); }
    function say(t) { cap.textContent = t; }
    function mark(kind, t) { badge.className = "tut-badge " + kind; badge.textContent = t; }
    function reset() { for (var i = 0; i < cards.length; i++) cards[i].classList.remove("up", "ok", "shake"); badge.className = "tut-badge"; badge.textContent = ""; say("Flip two cards."); }
    reset();
    tAt(function () { up(0, true); }, 900);
    tAt(function () { up(1, true); }, 1700);
    tAt(function () { mark("bad", "\u2717 Not a match"); say("Not a match? They flip back down."); cards[0].classList.add("shake"); cards[1].classList.add("shake"); }, 2500);
    tAt(function () { cards[0].classList.remove("shake"); cards[1].classList.remove("shake"); up(0, false); up(1, false); badge.className = "tut-badge"; }, 4500);
    tAt(function () { say("Try two more."); up(1, true); }, 5200);
    tAt(function () { up(2, true); }, 6000);
    tAt(function () { cards[1].classList.add("ok"); cards[2].classList.add("ok"); mark("good", "\u2713 It's a match!"); say("A match stays face up and turns green."); }, 6800);
    tAt(function () { tutClear(); runTutorial(); }, 10200);
  }
  function openTutorial(done) {
    tutDone = done; tut.hidden = false; runTutorial();
    try { $("tutGo").focus({ preventScroll: true }); } catch (e) {}
  }
  function closeTutorial() { tutClear(); tut.hidden = true; }
  $("tutGo").onclick = function () { var d = tutDone; tutDone = null; closeTutorial(); if (d) d(); };

  function start(withTutorial) {
    withTutorial = withTutorial !== false;
    clearAll(); closeTutorial(); tutDone = null;
    count.classList.remove("on"); rdy.hidden = true; memo.hidden = true; win.hidden = true; go.style.visibility = "";
    open = []; moves = 0; pairs = 0; lock = true; phase = "loading";
    $("mm-moves").textContent = 0; $("mm-pairs").textContent = "0/4"; $("mm-time").textContent = "0.00";
    grid.classList.add("locked"); grid.innerHTML = "";
    go.disabled = true; go.textContent = "Loading";
    var mine = ++startToken;
    whenLoaded().then(function () { if (mine === startToken && phase === "loading") deal(withTutorial); }, function () {});
  }

  // Cards go down face down. First time through, the tutorial plays; then "Ready to Memorize?" starts the preview.
  function deal(withTutorial) {
    RB.shuffle(SET.concat(SET)).forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "mm-card"; b.dataset.k = c.k; b.setAttribute("aria-label", "Face down card");
      b.innerHTML = '<div class="mm-face mm-back"></div><div class="mm-face mm-front"><img src="' + c.img + '" alt=""><span>' + c.k + "</span></div>";
      b.onpointerdown = function (e) { if (e.button === 0) flip(b); };
      b.onclick = function (e) { if (e.detail === 0) flip(b); };
      grid.appendChild(b);
    });
    phase = "pre"; go.style.visibility = "hidden";
    function offer() { if (phase !== "pre") return; memo.hidden = false; try { memo.focus({ preventScroll: true }); } catch (e) {} }
    if (withTutorial) openTutorial(offer); else offer();
  }

  function memorize() {
    memo.hidden = true; phase = "preview"; go.style.visibility = "";
    grid.querySelectorAll(".mm-card").forEach(function (b) { b.classList.add("up"); b.setAttribute("aria-label", b.dataset.k); });
    var n = PREVIEW; go.disabled = true; go.textContent = "Memorize " + n;
    cd = setInterval(function () {
      if (--n > 0) { go.textContent = "Memorize " + n; return; }
      clearInterval(cd);
      grid.querySelectorAll(".mm-card").forEach(function (b) { b.classList.remove("up"); b.setAttribute("aria-label", "Face down card"); });
      phase = "ready"; go.style.visibility = "hidden"; rdy.hidden = false;
      try { rdy.focus({ preventScroll: true }); } catch (e) {}
    }, 1000);
  }

  function ready() {
    phase = "count"; rdy.hidden = true;
    var n = 3; count.classList.add("on"); show(n);
    cd = setInterval(function () {
      if (--n > 0) { show(n); return; }
      clearInterval(cd); show("Go", true);
      later(function () {
        count.classList.remove("on");
        later(function () { if (phase === "count") begin(); }, 300);   // cards unlock only after the fade is done
      }, 600);
    }, 1000);
  }

  function begin() {
    phase = "play"; lock = false; go.style.visibility = ""; go.disabled = false;
    grid.classList.remove("locked"); go.textContent = "New game";
    t0 = performance.now();
    tick = setInterval(function () { $("mm-time").textContent = fmt(performance.now() - t0); }, 31);
  }

  function flip(b) {
    if (lock || phase !== "play" || b.classList.contains("up")) return;
    b.classList.add("up"); b.setAttribute("aria-label", b.dataset.k); open.push(b);
    if (open.length < 2) return;
    $("mm-moves").textContent = ++moves;
    var a = open[0], d = open[1]; open = [];
    if (a.dataset.k === d.dataset.k) {
      a.classList.add("done"); d.classList.add("done"); $("mm-pairs").textContent = (++pairs) + "/4";
      if (pairs === 4) {
        clearInterval(tick); $("mm-time").textContent = fmt(performance.now() - t0);
        phase = "won"; go.textContent = "Play again";
        RB.lastMemory = { time: $("mm-time").textContent, moves: moves };
        later(function () {
          $("mm-winScore").textContent = RB.timeLabel($("mm-time").textContent) + " in " + moves + (moves === 1 ? " move" : " moves");
          win.hidden = false;
          try { $("mm-again").focus({ preventScroll: true }); } catch (e) {}
        }, 700);
      }
    } else {
      lock = true;
      later(function () {
        [a, d].forEach(function (x) { x.classList.remove("up"); x.setAttribute("aria-label", "Face down card"); });
        lock = false;
      }, 850);
    }
  }

  var qrLink = $("mm-qrLink");
  qrLink.addEventListener("click", function (e) {
    e.preventDefault();
    RB.copyAndGo(qrLink.href, RB.timeToSeconds($("mm-time").textContent));
  });
  rdy.onclick = ready;
  memo.onclick = memorize;
  go.onclick = function () { start(false); };
  $("mm-again").onclick = function () { start(false); };
  $("mm-retry").onclick = function () { start(true); };
  RB.memory = { start: start, stop: function () { startToken++; $("mm-loading").hidden = true; memo.hidden = true; closeTutorial(); clearAll(); phase = ""; } };
})();
