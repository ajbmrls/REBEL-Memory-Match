/* Shared helpers. */
(function () {
  var RB = window.RB = {};

  // Set this to your Google Apps Script web app URL once the sheet is ready.
  RB.CONFIG = { endpoint: "" };

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
