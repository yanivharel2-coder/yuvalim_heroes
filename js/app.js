/* ניווט ומסך הבית */
(function () {
  G.screen = document.getElementById("screen");
  G.current = "home";
  G.cleanup = null;

  /* משחקי שאלות: לכל אחד 20 שלבים להצלת דמות */
  var ASK = {
    letters:   Letters.ask,
    numbers:   Numbers.ask,
    trace:     Trace.ask,
    build:     Build.ask,
    rhyme:     Rhyme.ask,
    addsub:    AddSub.ask,
    pattern:   Pattern.ask,
    moreless:  MoreLess.ask,
    shapes:    Shapes.ask,
    odd:       Odd.ask,
    opposites: Opposites.ask,
    draw:      Draw.ask
  };

  var TITLES = {
    home: "", mainstory: "סיפור ראשי", letters: "אותיות", numbers: "מספרים", memory: "משחק זיכרון", puzzle: "פאזל", mix: "מיקס",
    trace: "מעקב אחרי אות ומספר", build: "הרכבת מילה", rhyme: "חריזה", addsub: "חיבור וחיסור",
    pattern: "המשך את התבנית", moreless: "יותר או פחות", shapes: "צורות בתמונה",
    odd: "מה לא שייך", opposites: "הפכים", draw: "ציורים", simon: "סיימון", maze: "מבוך באצבע"
  };

  /* מיקס: כל המשחקים. זיכרון, פאזל, סיימון ומבוך מופיעים כגרסאות קצרות */
  var MIX = Object.keys(ASK).concat(["memory", "puzzle", "simon", "maze"]);
  var lastMix = null;
  function mixAsk(box, step, cb) {
    var kind;
    do { kind = G.pick(MIX); } while (kind === lastMix);
    lastMix = kind;
    if (ASK[kind]) ASK[kind](box, step, cb);
    else if (kind === "memory") Memory.mini(box, function () { cb(true); });
    else if (kind === "puzzle") Puzzle.mini(box, function () { cb(true); });
    else if (kind === "simon") Simon.mini(box, cb);
    else Maze.mini(box, function () { cb(true); });
  }
  G.mixAsk = mixAsk;

  var SECTIONS = [
    { title: "קריאה וכתיבה", tiles: [
      { go: "letters", ico: "א",  lbl: "אותיות",              bg: "#ffd23f" },
      { go: "trace",   ico: "✍️", lbl: "מעקב אחרי אות ומספר", bg: "#ffb86b" },
      { go: "build",   ico: "🔡", lbl: "הרכבת מילה",          bg: "#ffe58a" },
      { go: "rhyme",   ico: "🎶", lbl: "חריזה",               bg: "#ffc2d9" } ] },
    { title: "חשבון וצורות", tiles: [
      { go: "numbers",  ico: "123", lbl: "מספרים",           bg: "#ff8a65" },
      { go: "addsub",   ico: "➕",  lbl: "חיבור וחיסור",      bg: "#ffab91" },
      { go: "pattern",  ico: "🔴🔵", lbl: "המשך את התבנית",   bg: "#ffcc80" },
      { go: "moreless", ico: "⚖️",  lbl: "יותר או פחות",     bg: "#f48fb1" },
      { go: "shapes",   ico: "🔺",  lbl: "צורות בתמונה",     bg: "#ef9a9a" } ] },
    { title: "חשיבה וזיכרון", tiles: [
      { go: "odd",       ico: "🤔", lbl: "מה לא שייך",  bg: "#52e0cf" },
      { go: "opposites", ico: "↔️", lbl: "הפכים",        bg: "#80deea" },
      { go: "memory",    ico: "🃏", lbl: "משחק זיכרון", bg: "#a5d6a7" },
      { go: "puzzle",    ico: "🧩", lbl: "פאזל",         bg: "#b9a0ff" },
      { go: "draw",      ico: "🎨", lbl: "ציורים",       bg: "#ffab76" } ] },
    { title: "משחקי כיף", tiles: [
      { go: "simon", ico: "🎹", lbl: "סיימון",       bg: "#ce93d8" },
      { go: "maze",  ico: "🏁", lbl: "מבוך באצבע",   bg: "#90caf9" } ] }
  ];

  function tileHTML(t) {
    return '<button class="tile" data-go="' + t.go + '" style="background:' + t.bg + '">' +
      '<span class="ico">' + t.ico + '</span><span class="lbl">' + t.lbl + '</span></button>';
  }

  function home() {
    G.screen.innerHTML =
      '<section class="home">' +
        '<div class="hero-row">' + CONFIG.heroes.map(G.charHTML).join("") + G.villainHTML() + '</div>' +
        '<h1 class="title">משחקי הגיבורים</h1>' +
        '<div class="sec"><div class="tiles">' +
          tileHTML({ go: "mainstory", ico: "🏰", lbl: "סיפור ראשי", bg: "linear-gradient(135deg,#ef4136,#ff8a65 50%,#ffd23f)" }) +
          tileHTML({ go: "mix", ico: "🎲", lbl: "מיקס: כל המשחקים", bg: "linear-gradient(135deg,#ffd23f,#ff8a65 35%,#b9a0ff 70%,#52e0cf)" }) +
        '</div></div>' +
        SECTIONS.map(function (s) {
          return '<div class="sec"><h2 class="sec-title">' + s.title + '</h2><div class="tiles">' + s.tiles.map(tileHTML).join("") + '</div></div>';
        }).join("") +
      '</section>';
    G.screen.querySelectorAll("[data-go]").forEach(function (b) {
      b.onclick = function () { G.go(b.dataset.go); };
    });
  }

  var screens = {
    home: home,
    mainstory: function () { MainStory.start(); },
    mix:    function () { G.story("mix", mixAsk); },
    memory: function () { Memory.start(G.screen); },
    puzzle: function () { Puzzle.start(G.screen); },
    simon:  function () { Simon.start(G.screen); },
    maze:   function () { Maze.start(G.screen); }
  };
  Object.keys(ASK).forEach(function (k) {
    screens[k] = function () { G.story(k, ASK[k]); };
  });

  G.go = function (name) {
    G.clearTimers();
    if (G.cleanup) { try { G.cleanup(); } catch (e) {} G.cleanup = null; }
    document.querySelectorAll(".overlay,.confetti").forEach(function (e) { e.remove(); });
    try { speechSynthesis.cancel(); } catch (e) {}
    G.current = name;
    G.screen.scrollTop = 0;
    document.getElementById("homeBtn").style.visibility = name === "home" ? "hidden" : "visible";
    document.getElementById("crumb").textContent = TITLES[name] || "";
    screens[name]();
  };

  document.getElementById("homeBtn").onclick = function () { G.go("home"); };

  var mute = document.getElementById("muteBtn");
  function paintMute() { mute.textContent = G.muted ? "🔇" : "🔊"; }
  mute.onclick = function () {
    G.muted = !G.muted;
    var a = G.store.load(); a.muted = G.muted; G.store.save(a);
    try { if (G.muted) speechSynthesis.cancel(); } catch (e) {}
    paintMute();
  };
  paintMute();

  /* אם מסובבים את הטאבלט באמצע משחק, בונים את הלוח מחדש */
  var w = window.innerWidth, t;
  var REBUILD = ["memory", "puzzle", "mix", "trace", "maze", "simon", "shapes"];
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      if (Math.abs(window.innerWidth - w) > 120) {
        w = window.innerWidth;
        if (REBUILD.indexOf(G.current) > -1) G.go(G.current);
      }
    }, 300);
  });

  G.go("home");
})();
