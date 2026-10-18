/* Router and keyboard. Routes: "" (menu), #memory, #hypertension, #diabetes. */
(function () {
  var $ = RB.$;
  var VIEWS = { menu: $("v-menu"), memory: $("v-memory"), quiz: $("v-quiz") };
  var TITLES = { memory: "Memory Match", hypertension: "Know Your Hypertension", diabetes: "Know Your Diabetes" };
  var current = "";

  function route() {
    var h = location.hash.replace("#", "");
    var view = h === "memory" ? "memory" : h === "hypertension" || h === "diabetes" ? "quiz" : "menu";
    if (current === "memory" && view !== "memory") RB.memory.stop();
    if (current === "quiz" && view !== "quiz") RB.quiz.stop();
    Object.keys(VIEWS).forEach(function (k) { VIEWS[k].hidden = k !== view; });
    $("backBtn").hidden = view === "menu";
    document.title = (TITLES[h] ? TITLES[h] + " | " : "") + "REBEL Games";
    document.body.dataset.view = view;
    var v = VIEWS[view];
    v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter");
    window.scrollTo(0, 0);
    if (view === "memory") RB.memory.start();
    else if (view === "quiz") RB.quiz.open(h);
    else { var t = v.querySelector("h1"); if (t) t.focus({ preventScroll: true }); }
    if (view === "memory") { var m = $("mm-title"); if (m) m.focus({ preventScroll: true }); }
    current = view;
  }

  function typing(e) { var t = e.target && e.target.tagName; return t === "INPUT" || t === "TEXTAREA" || t === "SELECT"; }

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
    if (current === "menu") {
      if (e.key === "1") location.hash = "memory";
      else if (e.key === "2") location.hash = "hypertension";
      else if (e.key === "3") location.hash = "diabetes";
    } else if (e.key === "Escape") {
      location.hash = "";
    } else if (current === "quiz") {
      RB.quiz.onKey(e);
    }
  });

  $("backBtn").addEventListener("click", function () { location.hash = ""; });
  window.addEventListener("hashchange", route);
  route();
})();
