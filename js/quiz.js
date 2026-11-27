/* משחקי שאלות: הרכבת מילה, חריזה, חיבור וחיסור, תבנית, יותר או פחות, צורות, מה לא שייך, הפכים.
   לכל משחק פונקציה ask(box, step, cb) שמחזירה true/false דרך cb. */
(function () {
  var D = DATA;
  var last = {};

  function fresh(key, list, idOf) {
    var x, t = 0;
    do { x = G.pick(list); t++; } while (last[key] !== undefined && idOf(x) === last[key] && t < 30);
    last[key] = idOf(x);
    return x;
  }
  function optsHTML(items, withCap, cls) {
    return '<div class="opts ' + (cls || "") + '">' + items.map(function (it, i) {
      return '<button class="opt' + (withCap ? " capd" : "") + '" data-i="' + i + '"><span class="pic">' + it.e + '</span>' +
        (withCap ? '<span class="cap">' + it.w + '</span>' : "") + '</button>';
    }).join("") + '</div>';
  }
  function numOptsHTML(nums) {
    return '<div class="opts nums">' + nums.map(function (n) {
      return '<button class="num" data-n="' + n + '">' + n + '</button>';
    }).join("") + '</div>';
  }
  function itemsHTML(emoji, n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<span class="it">' + emoji + '</span>';
    return s;
  }

  /* ===== הרכבת מילה ===== */
  var ENDS = { "כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ" };
  var BASE = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  function normalize(w) {
    var ch = w.split("");
    return ch.map(function (c, i) {
      var b = BASE[c] || c;
      return i === ch.length - 1 ? (ENDS[b] || b) : b;
    });
  }

  /* רמה קשה: מילים של 4 עד 6 אותיות (מרשימת ההרכבה ומרשימת האותיות) */
  function hardWords() {
    var all = D.build.slice();
    D.letters.forEach(function (L) { L.w.forEach(function (w) { all.push(w); }); });
    var seen = {};
    return all.filter(function (w) {
      var n = w[0].length;
      if (n < 4 || n > 6 || seen[w[0]]) return false;
      seen[w[0]] = 1; return true;
    });
  }

  window.Build = {
    ask: function (box, step, cb, level) {
      var hard = level === "hard";
      var list = hard ? hardWords() : D.build.filter(function (w) { return step < 8 ? w[0].length === 2 : true; });
      var item = fresh("build", list, function (x) { return x[0]; });
      var chars = normalize(item[0]);
      var baseSet = chars.map(function (c) { return BASE[c] || c; });
      var pool = D.letters.map(function (L) { return L.l; }).filter(function (l) { return baseSet.indexOf(l) < 0; });
      var tiles = G.shuffle(chars.concat(G.shuffle(pool).slice(0, hard ? 3 : 2)));

      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">הרכיבו את המילה</div>' +
          '<button class="pic-card" id="sayw" aria-label="הקראת המילה">' + item[1] + '<span class="speaker">🔊</span></button>' +
          '<div class="slots">' + chars.map(function () { return '<span class="slot"></span>'; }).join("") + '</div>' +
          '<div class="lts">' + tiles.map(function (c) { return '<button class="lt" data-c="' + c + '">' + c + '</button>'; }).join("") + '</div>' +
        '</div>';
      box._chars = chars;
      box.querySelector("#sayw").onclick = function () { G.speak(item[0]); };
      G.later(function () { G.speak(item[0]); }, 300);

      var slots = box.querySelectorAll(".slot"), pos = 0, mistakes = 0;
      box.querySelectorAll(".lt").forEach(function (t) {
        t.onclick = function () {
          if (t.disabled || pos >= chars.length) return;
          if (t.dataset.c === chars[pos]) {
            slots[pos].textContent = chars[pos];
            slots[pos].classList.add("fill");
            t.disabled = true; t.classList.add("used");
            pos++; G.sfx.match();
            if (pos === chars.length) {
              box.querySelector(".slots").classList.add("good");
              G.sfx.ok(); G.speak(item[0]);
              G.later(function () { cb(mistakes === 0); }, 1400);
            }
          } else {
            mistakes++; G.sfx.bad();
            t.classList.remove("bad"); void t.offsetWidth; t.classList.add("bad");
            G.later(function () { t.classList.remove("bad"); }, 500);
          }
        };
      });
    }
  };

  /* ===== כפל וחילוק (מספרים עד 10) ===== */
  window.MulDiv = {
    ask: function (box, step, cb) {
      var mul = Math.random() < 0.5, a = 2 + G.rand(9), b = 2 + G.rand(9), prod = a * b, res, text;
      if (mul) { res = prod; text = a + " × " + b + " = ?"; }
      else { res = b; text = prod + " ÷ " + a + " = ?"; }
      var pool = [];
      var cand = mul ? [prod + a, prod - a, prod + b, prod - b, (a + 1) * b, a * (b + 1), (a - 1) * b, a * (b - 1)] : [b + 1, b - 1, b + 2, b - 2, a, b * 2, prod - b];
      cand.forEach(function (n) { if (n > 0 && n !== res && pool.indexOf(n) < 0) pool.push(n); });
      var nums = G.shuffle([res].concat(G.shuffle(pool).slice(0, 2)));
      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">' + (mul ? "כמה זה?" : "כמה זה? (חילוק)") + '</div>' +
          '<div class="eq"><div class="sign" style="font-size:clamp(40px,10vmin,84px);color:#fff;direction:ltr">' + text + '</div></div>' +
          numOptsHTML(nums) +
        '</div>';
      G.choose(box, ".num", nums.indexOf(res), cb, function (i) { G.speak(String(nums[i])); });
    }
  };

  /* ===== חריזה ===== */
  window.Rhyme = {
    ask: function (box, step, cb) {
      var sets = D.rhymeSets;
      var si = fresh("rhyme", sets.map(function (_, i) { return i; }), function (x) { return x; });
      var set = G.shuffle(sets[si]);
      var target = set[0], right = set[1];
      var otherIdx = [];
      sets.forEach(function (_, i) { if (i !== si) otherIdx.push(i); });
      var wrong = G.shuffle(otherIdx).slice(0, 2).map(function (i) { return G.pick(sets[i]); });
      var opts = G.shuffle([{ w: right[0], e: right[1], ok: true }].concat(wrong.map(function (x) { return { w: x[0], e: x[1], ok: false }; })));

      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">מה מתחרז עם…</div>' +
          '<button class="target" id="tg"><span class="pic">' + target[1] + '</span><b>' + target[0] + '</b><span class="speaker">🔊</span></button>' +
          optsHTML(opts, true) +
        '</div>';
      box.querySelector("#tg").onclick = function () { G.speak(target[0]); };
      G.later(function () { G.speak(target[0]); }, 300);
      var correct = opts.findIndex(function (o) { return o.ok; });
      G.choose(box, ".opt", correct, cb, function (i) { G.speak(opts[i].w); });
    }
  };

  /* ===== חיבור וחיסור בתמונות ===== */
  window.AddSub = {
    ask: function (box, step, cb) {
      var max = step < 8 ? 5 : 10, add = Math.random() < 0.6, a, b, res;
      if (add) { a = 1 + G.rand(max - 1); b = 1 + G.rand(max - a); res = a + b; }
      else { a = 2 + G.rand(max - 1); b = 1 + G.rand(a - 1); res = a - b; }
      var grp = G.pick(D.countGroups), emoji = G.pick(grp.e);
      var wrongPool = [];
      for (var k = 1; k <= max; k++) if (k !== res) wrongPool.push(k);
      var nums = G.shuffle([res].concat(G.shuffle(wrongPool).slice(0, 2)));

      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">' + (add ? "כמה יש ביחד?" : "כמה נשארו?") + '</div>' +
          '<div class="eq">' +
            '<div class="grp">' + itemsHTML(emoji, a) + '</div>' +
            '<div class="sign">' + (add ? "+" : "−") + '</div>' +
            '<div class="grp' + (add ? "" : " minus") + '">' + itemsHTML(emoji, b) + '</div>' +
            '<div class="sign">=</div><div class="sign qm">?</div>' +
          '</div>' +
          numOptsHTML(nums) +
        '</div>';
      G.choose(box, ".num", nums.indexOf(res), cb, function (i) { G.speak(String(nums[i])); });
    }
  };

  /* ===== המשך את התבנית ===== */
  var THEMES = [
    ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"],
    ["⭐", "❤️", "🔷", "🌙", "🔺", "🟩"],
    ["🍎", "🍌", "🍇", "🍓", "🍊", "🍉"],
    ["🐶", "🐱", "🐸", "🐰", "🐷", "🐥"],
    ["🚗", "🚲", "✈️", "🚂", "🚢", "🚁"]
  ];
  window.Pattern = {
    ask: function (box, step, cb) {
      var types = step < 7 ? ["AB"] : step < 14 ? ["AB", "AAB", "ABB"] : ["ABC", "AAB", "ABB", "ABC"];
      var unit = G.pick(types), theme = G.shuffle(G.pick(THEMES));
      var map = { A: theme[0], B: theme[1], C: theme[2] };
      var L = 6, seq = [];
      for (var i = 0; i < L; i++) seq.push(map[unit[i % unit.length]]);
      var answer = seq[L - 1], shown = seq.slice(0, L - 1);
      var used = [];
      shown.forEach(function (x) { if (used.indexOf(x) < 0) used.push(x); });
      var cand = used.filter(function (x) { return x !== answer; });
      theme.forEach(function (x) { if (x !== answer && cand.indexOf(x) < 0) cand.push(x); });
      var opts = G.shuffle([answer].concat(cand.slice(0, 2))).map(function (e) { return { e: e }; });

      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">מה בא אחר כך?</div>' +
          '<div class="seq">' + shown.map(function (e) { return '<span class="si">' + e + '</span>'; }).join("") + '<span class="si q">?</span></div>' +
          optsHTML(opts, false) +
        '</div>';
      G.choose(box, ".opt", opts.findIndex(function (o) { return o.e === answer; }), cb);
    }
  };

  /* ===== יותר או פחות ===== */
  window.MoreLess = {
    ask: function (box, step, cb) {
      var max = step < 8 ? 5 : 9;
      var a = 1 + G.rand(max), b;
      do { b = 1 + G.rand(max); } while (b === a);
      var more = Math.random() < 0.65;
      var grp = G.pick(D.countGroups);
      var e1 = G.pick(grp.e), e2 = G.pick(grp.e);
      var correct = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">איפה יש ' + (more ? "יותר" : "פחות") + '?</div>' +
          '<div class="cmps">' +
            '<button class="cmp">' + itemsHTML(e1, a) + '</button>' +
            '<button class="cmp">' + itemsHTML(e2, b) + '</button>' +
          '</div>' +
        '</div>';
      G.choose(box, ".cmp", correct, cb);
    }
  };

  /* ===== זיהוי צורות בתוך תמונה ===== */
  var SHAPE_NAME = { circle: "העיגול", triangle: "המשולש", square: "הריבוע", rectangle: "המלבן" };
  function R(t, x, y, w, h, f) { return '<rect data-t="' + t + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="' + f + '"/>'; }
  function C(cx, cy, r, f) { return '<circle data-t="circle" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"/>'; }
  function T(pts, f) { return '<polygon data-t="triangle" points="' + pts + '" fill="' + f + '"/>'; }
  var PICTURES = [
    /* בית */
    R("rectangle", 160, 42, 22, 50, "#8d6e63") + T("55,120 130,48 205,120", "#ef5350") +
      R("square", 70, 118, 120, 120, "#ffcc80") + R("rectangle", 112, 168, 36, 70, "#6d4c41") +
      C(96, 150, 14, "#81d4fa") + C(162, 150, 14, "#81d4fa") + C(250, 50, 26, "#ffd54f"),
    /* חללית */
    T("120,70 180,70 150,18", "#ef5350") + R("rectangle", 120, 70, 60, 110, "#cfd8dc") + C(150, 118, 17, "#4fc3f7") +
      T("120,140 120,200 80,200", "#ef5350") + T("180,140 180,200 220,200", "#ef5350") + T("130,180 170,180 150,225", "#ffb300") +
      C(40, 40, 10, "#ffd54f") + C(250, 70, 8, "#ffd54f"),
    /* איש שלג */
    C(150, 190, 52, "#ffffff") + C(150, 118, 38, "#ffffff") + C(150, 64, 28, "#ffffff") +
      R("rectangle", 112, 32, 76, 9, "#37474f") + R("rectangle", 128, 6, 44, 28, "#37474f") +
      T("150,64 190,70 150,78", "#ff7043") + R("square", 144, 100, 12, 12, "#455a64") + R("square", 144, 126, 12, 12, "#455a64"),
    /* רובוט */
    T("140,22 160,22 150,2", "#ffca28") + R("square", 110, 22, 80, 80, "#90a4ae") + C(135, 56, 11, "#4dd0e1") + C(165, 56, 11, "#4dd0e1") +
      R("rectangle", 128, 80, 44, 9, "#37474f") + R("rectangle", 100, 106, 100, 84, "#78909c") + R("square", 140, 125, 20, 20, "#ef5350") +
      R("rectangle", 62, 116, 34, 14, "#546e7a") + R("rectangle", 204, 116, 34, 14, "#546e7a") +
      R("rectangle", 114, 194, 26, 46, "#546e7a") + R("rectangle", 160, 194, 26, 46, "#546e7a"),
    /* משאית */
    T("56,70 96,70 76,36", "#ffca28") + R("rectangle", 30, 70, 130, 100, "#42a5f5") + R("square", 160, 100, 70, 70, "#ef5350") +
      R("square", 176, 110, 34, 34, "#b3e5fc") + C(80, 180, 24, "#37474f") + C(190, 180, 24, "#37474f")
  ];
  window.Shapes = {
    ask: function (box, step, cb) {
      var pi = fresh("shapes", PICTURES.map(function (_, i) { return i; }), function (x) { return x; });
      var svg = PICTURES[pi];
      var present = [];
      (svg.match(/data-t="(\w+)"/g) || []).forEach(function (m) {
        var t = m.slice(8, -1);
        if (present.indexOf(t) < 0) present.push(t);
      });
      var tgt = G.pick(present);
      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">לחצו על <b>' + SHAPE_NAME[tgt] + '</b></div>' +
          '<svg class="shp" viewBox="0 0 300 260" role="img" aria-label="תמונה מצורות">' + svg + '</svg>' +
        '</div>';
      var el = box.querySelector("svg");
      el.querySelectorAll('[data-t="' + tgt + '"]').forEach(function (s) { s.setAttribute("data-ok", "1"); });
      G.later(function () { G.speak("לחצו על " + SHAPE_NAME[tgt]); }, 300);
      var locked = false;
      el.addEventListener("click", function (e) {
        var s = e.target.closest ? e.target.closest("[data-t]") : null;
        if (!s || locked) return;
        locked = true;
        if (s.getAttribute("data-t") === tgt) {
          el.querySelectorAll('[data-t="' + tgt + '"]').forEach(function (x) { x.classList.add("hl"); });
          G.sfx.ok(); G.later(function () { cb(true); }, 1100);
        } else {
          s.classList.add("badc"); G.sfx.bad();
          el.querySelectorAll('[data-t="' + tgt + '"]').forEach(function (x) { x.classList.add("hl"); });
          G.later(function () { cb(false); }, 1500);
        }
      });
    }
  };

  /* ===== מה לא שייך ===== */
  window.Odd = {
    ask: function (box, step, cb) {
      var cats = D.oddCats;
      var main = G.pick(cats);
      var other = G.pick(cats.filter(function (c) { return c.f !== main.f; }));
      var three = G.shuffle(main.e).slice(0, 3);
      var odd = G.pick(other.e);
      var items = G.shuffle(three.map(function (e) { return { e: e, ok: false }; }).concat([{ e: odd, ok: true }]));
      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">מה לא שייך?</div>' +
          optsHTML(items, false, "four") +
        '</div>';
      G.choose(box, ".opt", items.findIndex(function (x) { return x.ok; }), cb);
    }
  };

  /* ===== הפכים ===== */
  window.Opposites = {
    ask: function (box, step, cb) {
      var list = D.opposites;
      var pair = fresh("opp", list, function (x) { return x[0]; });
      var side = G.rand(2);
      var tgt = side ? [pair[2], pair[3]] : [pair[0], pair[1]];
      var right = side ? [pair[0], pair[1]] : [pair[2], pair[3]];
      var others = G.shuffle(list.filter(function (p) { return p !== pair; })).slice(0, 2).map(function (p) {
        var s = G.rand(2); return s ? [p[2], p[3]] : [p[0], p[1]];
      });
      var opts = G.shuffle([{ w: right[0], e: right[1], ok: true }].concat(others.map(function (x) { return { w: x[0], e: x[1], ok: false }; })));
      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">מה ההפך?</div>' +
          '<button class="target" id="tg"><span class="pic">' + tgt[1] + '</span><b>' + tgt[0] + '</b><span class="speaker">🔊</span></button>' +
          optsHTML(opts, true) +
        '</div>';
      box.querySelector("#tg").onclick = function () { G.speak(tgt[0]); };
      G.later(function () { G.speak(tgt[0]); }, 300);
      G.choose(box, ".opt", opts.findIndex(function (o) { return o.ok; }), cb, function (i) { G.speak(opts[i].w); });
    }
  };
})();
