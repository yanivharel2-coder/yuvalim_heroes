/* כלי עזר כלליים: אחסון, צלילים, קונפטי, חלונות */
(function () {
  var G = window.G = {};

  G.$ = function (s, r) { return (r || document).querySelector(s); };
  G.el = function (html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  G.rand = function (n) { return Math.floor(Math.random() * n); };
  G.pick = function (a) { return a[G.rand(a.length)]; };
  /* חפיסה: מחזירה כל פריט פעם אחת לפני שחוזרים על פריט, וזוכרת גם בין ביקורים (localStorage) */
  G.deck = function (key, list, idOf) {
    idOf = idOf || String;
    var K = "yh_deck_" + key, st;
    try { st = JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { st = {}; }
    var seen = Array.isArray(st.seen) ? st.seen : [], last = st.last;
    var rem = list.filter(function (x) { return seen.indexOf(idOf(x)) < 0; });
    if (!rem.length) {
      seen = [];
      rem = list.filter(function (x) { return list.length < 2 || idOf(x) !== last; });
    }
    var x = rem[Math.floor(Math.random() * rem.length)];
    seen.push(idOf(x));
    try { localStorage.setItem(K, JSON.stringify({ seen: seen, last: idOf(x) })); } catch (e) {}
    return x;
  };
  G.shuffle = function (a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = G.rand(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* טיימרים שמתנקים בכל מעבר מסך */
  G.timers = [];
  G.later = function (fn, ms) {
    var t = setTimeout(fn, ms);
    G.timers.push(t);
    return t;
  };
  G.clearTimers = function () {
    G.timers.forEach(clearTimeout);
    G.timers = [];
  };

  /* שמירה בדפדפן */
  var KEY = "heroGames.v1";
  G.store = {
    load: function () {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
    },
    save: function (o) {
      try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    }
  };

  /* צלילים */
  var ctx = null;
  G.muted = !!G.store.load().muted;
  function tone(f, t0, d, type, v) {
    if (G.muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain(), now = ctx.currentTime;
      o.type = type || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.15, now + t0);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + d);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + t0); o.stop(now + t0 + d + 0.02);
    } catch (e) {}
  }
  G.tone = tone;
  G.sfx = {
    ok:    function () { tone(660, 0, 0.12); tone(880, 0.1, 0.2); },
    bad:   function () { tone(220, 0, 0.28, "square", 0.07); },
    flip:  function () { tone(520, 0, 0.06, "triangle", 0.1); },
    match: function () { tone(784, 0, 0.1); tone(988, 0.09, 0.16); },
    win:   function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.28); }); }
  };
  G.speak = function (txt) {
    if (G.muted) return;
    try {
      var u = new SpeechSynthesisUtterance(txt);
      u.lang = "he-IL"; u.rate = 0.85;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  };

  /* קונפטי */
  G.confetti = function (n) {
    n = n || 70;
    var colors = ["#ffd23f", "#ef4136", "#2ec4b6", "#3a86ff", "#ff7bd5", "#ffffff"];
    var wrap = document.createElement("div");
    wrap.className = "confetti";
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = G.pick(colors);
      p.style.animationDuration = (1.8 + Math.random() * 1.6) + "s";
      p.style.animationDelay = (Math.random() * 0.5) + "s";
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 4300);
  };


  /* בחירת תשובה מתוך כמה כפתורים: מסמן נכון/שגוי ומחזיר תוצאה */
  G.choose = function (box, sel, correct, cb, onPick) {
    var locked = false, btns = box.querySelectorAll(sel);
    btns[correct].setAttribute("data-ok", "1");
    btns.forEach(function (b, i) {
      b.onclick = function () {
        if (locked) return;
        locked = true;
        if (onPick) onPick(i);
        if (i === correct) {
          b.classList.add("good"); G.sfx.ok();
          G.later(function () { cb(true); }, 1100);
        } else {
          b.classList.add("bad"); G.sfx.bad();
          btns[correct].classList.add("hint");
          G.later(function () { cb(false); }, 1400);
        }
      };
    });
  };

  /* חלון קופץ */
  G.dialog = function (o) {
    var ov = G.el('<div class="overlay"><div class="dialog" role="dialog">' +
      '<div class="art">' + (o.art || "") + '</div>' +
      '<h2>' + (o.title || "") + '</h2>' +
      (o.text ? '<p>' + o.text + '</p>' : "") +
      '<div class="btns"></div></div></div>');
    var box = ov.querySelector(".btns");
    (o.buttons || []).forEach(function (b) {
      var btn = G.el('<button class="btn ' + (b.cls || "") + '">' + b.label + '</button>');
      btn.onclick = function () { ov.remove(); if (b.onClick) b.onClick(); };
      box.appendChild(btn);
    });
    document.body.appendChild(ov);
    return ov;
  };

  /* טוען תמונה (מחזיר Promise) */
  G.loadImage = function (src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = rej;
      im.src = src;
    });
  };
  G.urlOf = function (src) {
    return /^data:/.test(src) ? src : encodeURI(src);
  };
})();
