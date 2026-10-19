/* Shared helpers. */
(function () {
  var RB = window.RB = {};

  // Set this to your Google Apps Script web app URL once the sheet is ready.
  RB.CONFIG = { endpoint: "" };

  // iOS Safari ignores user-scalable=no, so block pinch gestures directly.
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
  });
  document.addEventListener("touchmove", function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });

  RB.$ = function (id) { return document.getElementById(id); };
  RB.el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  RB.btn = function (cls, text) { var b = RB.el("button", cls, text); b.type = "button"; return b; };
  RB.shuffle = function (a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  RB.sample = function (a, n) { return RB.shuffle(a).slice(0, n); };
  RB.reduceMotion = function () { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };
  RB.newId = function () {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  // "12s" -> "12", "1:05" -> "65": the memory time as plain seconds for the score form.
  RB.timeToSeconds = function (t) {
    var m = /^(\d+):(\d{2})$/.exec(t);
    if (m) return String(parseInt(m[1], 10) * 60 + parseInt(m[2], 10));
    return String(t).replace(/s$/, "");
  };

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  /* Tapping a score QR: copy the score, show a loud notice for 3 seconds, then open the form.
     Opens a new tab; if the browser blocks that (it is no longer a direct tap), it goes to the form in this tab. */
  var WAIT = 3, timer = 0, tickTimer = 0;
  RB.floaterOpen = false;
  RB.copyAndGo = function (url, text) {
    var box = RB.$("copied");
    clearTimeout(timer); clearInterval(tickTimer);
    RB.$("copiedScore").textContent = text;
    RB.$("copiedMsg").innerHTML = "";
    var msg = RB.$("copiedMsg");
    msg.append("Your score has been copied into your clipboard. Please ");
    var s = document.createElement("strong"); s.textContent = "paste it in the submission form."; msg.appendChild(s);
    copyText(text).then(function (ok) {
      if (!ok) { RB.$("copiedTitle").textContent = "Remember your score!"; msg.textContent = "We could not copy it for you. Please type your score into the submission form."; }
    });
    RB.$("copiedTitle").textContent = "Score copied!";
    var bar = RB.$("copiedBar"); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
    box.hidden = false; RB.floaterOpen = true;
    var left = WAIT;
    function label() { RB.$("copiedCount").textContent = "Opening the form in " + left + "..."; }
    label();
    tickTimer = setInterval(function () { if (--left > 0) label(); }, 1000);
    function close() { clearTimeout(timer); clearInterval(tickTimer); box.hidden = true; RB.floaterOpen = false; }
    function go() {
      close();
      var w = null;
      try { w = window.open(url, "_blank"); } catch (e) {}
      if (w) { try { w.opener = null; } catch (e) {} } else { location.assign(url); }
    }
    timer = setTimeout(go, WAIT * 1000);
    RB.$("copiedGo").onclick = go;
    RB.$("copiedCancel").onclick = close;
  };

  // Sends one row to the sheet. With no endpoint set, it logs and reports preview mode.
  RB.send = function (payload) {
    if (!RB.CONFIG.endpoint) {
      try { console.log("[preview] would send", payload); } catch (e) {}
      return Promise.resolve({ ok: true, preview: true });
    }
    return fetch(RB.CONFIG.endpoint, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function () { return { ok: true }; })
      .catch(function () { return { ok: false }; });
  };
})();
