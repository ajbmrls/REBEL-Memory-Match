/* Memory Match: shuffle, 7 second preview, centered Ready, 3-2-1-Go, timer and cards unlock after the overlay fades. */
(function () {
  var $ = RB.$;
  var SET = [
    { k: "Stress less", img: "illustrations/stressed-at-desk.png" },
    { k: "Talk it out", img: "illustrations/talking-it-through.png" },
    { k: "Healthy mind", img: "illustrations/strong-mind.png" },
    { k: "Move", img: "illustrations/runner.png" }
  ];
  var PREVIEW = 7;
  var grid = $("mm-grid"), go = $("mm-go"), rdy = $("mm-ready"), win = $("mm-win"), count = $("mm-count"), num = $("mm-num");
  var open = [], moves = 0, pairs = 0, lock = true, phase = "", t0 = 0, tick = 0, cd = 0, timers = [];

  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearAll() { clearInterval(tick); clearInterval(cd); timers.forEach(clearTimeout); timers = []; }
  function show(t, isGo) { num.className = ""; void num.offsetWidth; num.textContent = t; num.className = "tick" + (isGo ? " go" : ""); }
  function fmt(ms) {
    var c = Math.floor(ms / 10), s = Math.floor(c / 100);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") + "." + String(c % 100).padStart(2, "0");
  }

  function start() {
    clearAll();
    count.classList.remove("on"); rdy.hidden = true; win.hidden = true; go.style.visibility = "";
    open = []; moves = 0; pairs = 0; lock = true; phase = "preview";
    $("mm-moves").textContent = 0; $("mm-pairs").textContent = "0/4"; $("mm-time").textContent = "0:00.00";
    grid.classList.add("locked"); grid.innerHTML = "";
    RB.shuffle(SET.concat(SET)).forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "mm-card up"; b.dataset.k = c.k; b.setAttribute("aria-label", c.k);
      b.innerHTML = '<div class="mm-face mm-back"></div><div class="mm-face mm-front"><img src="' + c.img + '" alt=""><span>' + c.k + "</span></div>";
      b.onpointerdown = function (e) { if (e.button === 0) flip(b); };
      b.onclick = function (e) { if (e.detail === 0) flip(b); };
      grid.appendChild(b);
    });
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
          $("mm-winScore").textContent = $("mm-time").textContent + " in " + moves + (moves === 1 ? " move" : " moves");
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
  go.onclick = start;
  $("mm-again").onclick = start;
  RB.memory = { start: start, stop: function () { clearAll(); phase = ""; } };
})();
