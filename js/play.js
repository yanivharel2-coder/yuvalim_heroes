/* משחקי אינטראקציה: מעקב אחרי אות ומספר, סיימון, מבוך באצבע.
   במצב סיפור ראשי: Simon.storyRound / Maze.storyRound(box, p, ...) - p בין 0 (קל) ל-1 (קשה) */
(function () {

  /* ===================== מעקב אחרי אות ומספר ===================== */
  var lastGlyph = null;
  window.Trace = {
    ask: function (box, step, cb) {
      var letters = DATA.letters.map(function (x) { return x.l; });
      var digits = "123456789".split("");
      var isNum = Math.random() < 0.5, g;
      do { g = G.pick(isNum ? digits : letters); } while (g === lastGlyph);
      lastGlyph = g;

      box.innerHTML =
        '<div class="q"><div class="prompt">עברו עם האצבע על ' + (isNum ? "המספר" : "האות") + '</div>' +
        '<div class="trace-wrap"><canvas class="trace-cv"></canvas></div>' +
        '<button class="btn small alt" id="trClear">🔄 מחדש</button></div>';
      var wrap = box.querySelector(".trace-wrap"), cv = box.querySelector("canvas");
      var rc = wrap.getBoundingClientRect();
      var size = Math.floor(Math.max(160, Math.min(rc.width - 16, rc.height - 16, 440)));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = size * dpr; cv.height = size * dpr;
      cv.style.width = size + "px"; cv.style.height = size + "px";
      var ctx = cv.getContext("2d");
      var font = "bold " + Math.round(size * 0.86) + 'px "Secular One","Rubik",Arial,sans-serif';
      var cy = size / 2 + size * 0.04;

      /* מסכה של הצורה, לחישוב כמה מהאות כבר כוסה */
      var mk = document.createElement("canvas"); mk.width = size; mk.height = size;
      var mx = mk.getContext("2d");
      mx.font = font; mx.textAlign = "center"; mx.textBaseline = "middle";
      mx.fillText(g, size / 2, cy);
      var data = mx.getImageData(0, 0, size, size).data;
      var sp = Math.max(5, Math.round(size / 55)), pts = [];
      for (var y = sp; y < size; y += sp)
        for (var x = sp; x < size; x += sp)
          if (data[(y * size + x) * 4 + 3] > 128) pts.push([x, y]);
      cv._pts = pts;
      if (pts.length < 10) { G.later(function () { cb(true); }, 300); return; }

      var covered, nCov, done = false;
      var Rr = size * 0.06;

      function base(fill) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = fill || "#e3e9ff";
        ctx.fillText(g, size / 2, cy);
        ctx.setLineDash([10, 9]); ctx.lineWidth = 3; ctx.strokeStyle = "#14183a";
        ctx.strokeText(g, size / 2, cy);
        ctx.setLineDash([]);
      }
      function reset() { covered = new Array(pts.length).fill(false); nCov = 0; done = false; base(); }
      reset();

      function mark(px, py) {
        var lim = Rr * Rr * 1.3;
        for (var i = 0; i < pts.length; i++) {
          if (covered[i]) continue;
          var dx = pts[i][0] - px, dy = pts[i][1] - py;
          if (dx * dx + dy * dy <= lim) { covered[i] = true; nCov++; }
        }
      }
      function seg(a, b) {
        var d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        var n = Math.max(1, Math.ceil(d / (Rr * 0.5)));
        for (var k = 0; k <= n; k++) mark(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n);
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.strokeStyle = "#ef4136"; ctx.lineWidth = Rr * 1.5;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      function pos(e) {
        var r = cv.getBoundingClientRect();
        return [(e.clientX - r.left) * size / r.width, (e.clientY - r.top) * size / r.height];
      }
      function check() {
        if (!done && nCov / pts.length >= 0.82) {
          done = true; drawing = false;
          base("#9be8b7");
          G.sfx.ok(); G.confetti(30);
          G.later(function () { cb(true); }, 1100);
        }
      }

      var drawing = false, prev = null;
      cv.addEventListener("pointerdown", function (e) {
        if (done) return;
        e.preventDefault();
        try { cv.setPointerCapture(e.pointerId); } catch (err) {}
        drawing = true; prev = pos(e); seg(prev, prev); check();
      });
      cv.addEventListener("pointermove", function (e) {
        if (!drawing || done) return;
        var p = pos(e); seg(prev, p); prev = p; check();
      });
      function up() { drawing = false; }
      cv.addEventListener("pointerup", up);
      cv.addEventListener("pointercancel", up);
      box.querySelector("#trClear").onclick = reset;
    }
  };

  /* ===================== סיימון ===================== */
  var PADS = [["#ef4136", "#ff9a8f", 262], ["#2f6fed", "#8fb4ff", 330], ["#2fbf71", "#9bf0c0", 392], ["#ffd23f", "#fff0a0", 523]];

  /* mini = גרסה קצרה (רצף אחד). fixedLen = אורך רצף קבוע (סיפור ראשי: 3 עד 7) */
  function simon(container, mini, onDone, fixedLen) {
    container.innerHTML =
      '<section class="simon"><div class="sim-round"></div><div class="sim-status"></div><div class="sim-pads">' +
      PADS.map(function (c, i) {
        return '<button class="pad" data-i="' + i + '" style="--c:' + c[0] + ';--l:' + c[1] + '" aria-label="צבע ' + (i + 1) + '"></button>';
      }).join("") + '</div></section>';
    var st = container.querySelector(".sim-status"), rd = container.querySelector(".sim-round");
    var pads = container.querySelectorAll(".pad");
    var seq = [], idx = 0, busy = true;
    var fixed = typeof fixedLen === "number";
    var startLen = fixed ? fixedLen : (mini ? 3 : 2);
    var maxLen = fixed ? fixedLen : (mini ? 3 : 6);
    var len = startLen;
    container._simon = { seq: function () { return seq; }, busy: function () { return busy; } };

    function light(i, ms) {
      pads[i].classList.add("lit");
      G.tone(PADS[i][2], 0, ms / 1000, "triangle", 0.18);
      G.later(function () { pads[i].classList.remove("lit"); }, ms);
    }
    function show() {
      busy = true; idx = 0;
      st.textContent = "מסתכלים…";
      seq.forEach(function (p, k) { G.later(function () { light(p, 450); }, 800 + k * 700); });
      G.later(function () { busy = false; st.textContent = "תורך!"; }, 800 + seq.length * 700);
    }
    function round() {
      while (seq.length < len) seq.push(G.rand(4));
      rd.textContent = mini ? "" : "סיבוב " + (len - startLen + 1) + " מתוך " + (maxLen - startLen + 1);
      show();
    }
    pads.forEach(function (p, i) {
      p.onclick = function () {
        if (busy) return;
        light(i, 260);
        if (i === seq[idx]) {
          idx++;
          if (idx === seq.length) {
            busy = true;
            if (len >= maxLen) {
              st.textContent = "מעולה!";
              G.sfx.win(); G.confetti(mini ? 30 : 90);
              if (mini) { G.later(function () { onDone(true); }, 1000); return; }
              G.later(function () {
                G.dialog({
                  art: '<span style="font-size:90px">🎉</span>', title: "כל הכבוד! זכרת הכול",
                  buttons: [
                    { label: "עוד פעם", onClick: function () { simon(container, false); } },
                    { label: "תפריט", cls: "alt", onClick: function () { G.go("home"); } }
                  ]
                });
              }, 1200);
            } else {
              st.textContent = "כל הכבוד!"; G.sfx.ok(); len++;
              G.later(round, 1200);
            }
          }
        } else {
          busy = true; G.sfx.bad();
          if (mini) { st.textContent = "אופס!"; G.later(function () { onDone(false); }, 1000); }
          else { st.textContent = "אופס! מסתכלים שוב"; G.later(show, 1500); }
        }
      };
    });
    round();
  }
  window.Simon = {
    start: function (container) { simon(container, false); },
    mini: function (box, cb) { simon(box, true, cb); },

    /* סיפור ראשי: אורך הרצף עולה עם p. 0 = 3 צבעים, 1 = 7 צבעים */
    storyRound: function (box, p, cb) {
      var q = Math.max(0, Math.min(1, +p || 0));
      simon(box, true, cb, 3 + Math.round(q * 4));
    }
  };

  /* ===================== מבוך באצבע (20 שלבים ברמת קושי עולה) ===================== */
  var LEVELS = [
    [4, 3],   /* שלב 1 */
    [5, 3],   /* שלב 2 */
    [5, 4],   /* שלב 3 */
    [6, 4],   /* שלב 4 */
    [7, 4],   /* שלב 5 */
    [7, 5],   /* שלב 6 */
    [8, 5],   /* שלב 7 */
    [8, 6],   /* שלב 8 */
    [9, 6],   /* שלב 9 */
    [10, 6],  /* שלב 10 */
    [10, 7],  /* שלב 11 */
    [11, 7],  /* שלב 12 */
    [11, 8],  /* שלב 13 */
    [12, 8],  /* שלב 14 */
    [13, 8],  /* שלב 15 */
    [13, 9],  /* שלב 16 */
    [14, 9],  /* שלב 17 */
    [14, 10], /* שלב 18 */
    [15, 10], /* שלב 19 */
    [16, 11]  /* שלב 20 */
  ];

  function genMaze(cols, rows) {
    var Rw = [], Bw = [], vis = [], r, c;
    for (r = 0; r < rows; r++) {
      Rw[r] = []; Bw[r] = []; vis[r] = [];
      for (c = 0; c < cols; c++) { Rw[r][c] = true; Bw[r][c] = true; vis[r][c] = false; }
    }
    var stack = [[0, 0]]; vis[0][0] = true;
    while (stack.length) {
      var cur = stack[stack.length - 1]; r = cur[0]; c = cur[1];
      var nb = [];
      if (r > 0 && !vis[r - 1][c]) nb.push([r - 1, c, "u"]);
      if (r < rows - 1 && !vis[r + 1][c]) nb.push([r + 1, c, "d"]);
      if (c > 0 && !vis[r][c - 1]) nb.push([r, c - 1, "l"]);
      if (c < cols - 1 && !vis[r][c + 1]) nb.push([r, c + 1, "r"]);
      if (!nb.length) { stack.pop(); continue; }
      var n = G.pick(nb);
      if (n[2] === "u") Bw[r - 1][c] = false;
      else if (n[2] === "d") Bw[r][c] = false;
      else if (n[2] === "l") Rw[r][c - 1] = false;
      else Rw[r][c] = false;
      vis[n[0]][n[1]] = true; stack.push([n[0], n[1]]);
    }
    return { R: Rw, B: Bw };
  }

  function pickMazeLevel(container) {
    var current = Math.max(0, Math.min(G.store.load().mazeLevel || 0, LEVELS.length - 1));
    var btns = LEVELS.map(function (_, i) {
      var cls = i === current ? "btn" : "btn alt";
      return '<button class="' + cls + ' lv-btn" data-lv="' + i + '">שלב ' + (i + 1) + '</button>';
    }).join("");
    container.innerHTML =
      '<section class="menu">' +
        '<h2>בחרו מבוך (20 שלבים)</h2>' +
        '<div class="level-grid">' + btns + '</div>' +
      '</section>';
    container.querySelectorAll("[data-lv]").forEach(function (b) {
      b.onclick = function () {
        var chosen = +b.dataset.lv;
        var a = G.store.load(); a.mazeLevel = chosen; G.store.save(a);
        maze(container, chosen, false);
      };
    });
  }

  /* mini = מבוך קטן קבוע (מיקס). story = סיבוב בתוך הסיפור הראשי: בגודל של השלב lv, בלי כפתורים ובלי חלון סיום */
  function maze(container, lv, mini, onDone, story) {
    var safeLv = Math.max(0, Math.min(lv, LEVELS.length - 1));
    var short = mini || story;
    var dims = mini ? LEVELS[0] : LEVELS[safeLv];
    container.innerHTML =
      '<section class="maze"><div class="puz-bar"><div class="chip on">' + (short ? "הובילו אל הכוכב" : "מבוך " + (safeLv + 1) + " מתוך " + LEVELS.length) + '</div>' +
      (short ? "" : '<button class="btn small alt" id="mzNew">🔄 מבוך חדש</button><button class="btn small alt" id="mzLevels">🎯 שלבים</button>') + '</div>' +
      '<div class="maze-area"><canvas class="maze-cv"></canvas></div></section>';
    var area = container.querySelector(".maze-area"), cv = container.querySelector("canvas");
    var rc = area.getBoundingClientRect();
    var portrait = rc.height > rc.width;
    var cols = portrait ? dims[1] : dims[0];
    var rows = portrait ? dims[0] : dims[1];

    /* התאמת גודל תא לטאבלט: מקטינים רק את הממד שמגביל, כדי שהמבוך יישאר גדול ככל האפשר.
       בסיפור הראשי האזור נמוך יותר, ולכן התא המינימלי גדול יותר (נוח לאצבע) */
    var minCell = story ? 44 : 30;
    function fitCell() {
      return Math.floor(Math.min((rc.width - 12) / cols, (rc.height - 12) / rows, 120));
    }
    var cs = fitCell();
    while (cs < minCell && (cols > 4 || rows > 3)) {
      var csW = (rc.width - 12) / cols, csH = (rc.height - 12) / rows;
      if (csH <= csW && rows > 3) rows--;
      else if (cols > 4) cols--;
      else if (rows > 3) rows--;
      else break;
      cs = fitCell();
    }
    cs = Math.max(cs, 28);
    var Wd = cols * cs, Ht = rows * cs, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Wd * dpr; cv.height = Ht * dpr; cv.style.width = Wd + "px"; cv.style.height = Ht + "px";
    var ctx = cv.getContext("2d");
    var M = genMaze(cols, rows);
    var th = Math.max(5, Math.round(cs * 0.12));

    /* קירות כקטעים וכמלבני התנגשות */
    var segs = [[0, 0, Wd, 0], [0, Ht, Wd, Ht], [0, 0, 0, Ht], [Wd, 0, Wd, Ht]], r, c;
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      if (M.R[r][c] && c < cols - 1) segs.push([(c + 1) * cs, r * cs, (c + 1) * cs, (r + 1) * cs]);
      if (M.B[r][c] && r < rows - 1) segs.push([c * cs, (r + 1) * cs, (c + 1) * cs, (r + 1) * cs]);
    }
    var rects = segs.map(function (s) {
      return [Math.min(s[0], s[2]) - th / 2, Math.min(s[1], s[3]) - th / 2, Math.max(s[0], s[2]) + th / 2, Math.max(s[1], s[3]) + th / 2];
    });
    var mr = Math.max(7, cs * 0.22);
    var px = (cols - 1) * cs + cs / 2, py = cs / 2;         /* התחלה: למעלה מימין */
    var gx = cs / 2, gy = (rows - 1) * cs + cs / 2;          /* סוף: למטה משמאל */
    var trail = [[px, py]], won = false;

    cv._maze = { R: M.R, B: M.B, cs: cs, cols: cols, rows: rows, pos: function () { return [px, py]; }, won: function () { return won; } };

    function hit(x, y) {
      for (var i = 0; i < rects.length; i++) {
        var q = rects[i];
        var nx = Math.max(q[0], Math.min(x, q[2])), ny = Math.max(q[1], Math.min(y, q[3]));
        if ((x - nx) * (x - nx) + (y - ny) * (y - ny) < mr * mr) return true;
      }
      return false;
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, Wd, Ht);
      ctx.fillStyle = "rgba(47,191,113,.22)"; ctx.fillRect((cols - 1) * cs, 0, cs, cs);
      ctx.fillStyle = "rgba(255,210,63,.45)"; ctx.fillRect(0, (rows - 1) * cs, cs, cs);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(239,65,54,.45)"; ctx.lineWidth = mr * 0.9;
      ctx.beginPath();
      trail.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.stroke();
      ctx.strokeStyle = "#14183a"; ctx.lineWidth = th; ctx.lineCap = "square";
      ctx.beginPath();
      segs.forEach(function (s) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); });
      ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = Math.round(cs * 0.52) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.fillText("⭐", gx, gy);
      ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "#14183a"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(px, py, mr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = Math.round(mr * 1.5) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.fillStyle = "#14183a";
      ctx.fillText("😀", px, py + 1);
    }
    draw();

    function moveTo(tx, ty) {
      var guard = 0;
      while (guard++ < 500) {
        var dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy);
        if (d < 1) break;
        var s = Math.min(2.5, d), sx = dx / d * s, sy = dy / d * s, moved = false;
        if (!hit(px + sx, py)) { px += sx; moved = true; }
        if (!hit(px, py + sy)) { py += sy; moved = true; }
        if (!moved) break;
      }
      trail.push([px, py]);
    }
    function pos(e) {
      var r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * Wd / r.width, (e.clientY - r.top) * Ht / r.height];
    }
    function win() {
      won = true; G.sfx.win(); G.confetti(short ? 30 : 85);
      if (short) { G.later(function () { onDone(true); }, 1000); return; }
      var last = safeLv >= LEVELS.length - 1;
      var next = last ? 0 : safeLv + 1;
      var a = G.store.load(); a.mazeLevel = next; G.store.save(a);
      G.later(function () {
        G.dialog({
          art: '<span style="font-size:90px">' + (last ? "👑" : "🌟") + '</span>',
          title: last ? "אלוף המבוכים! סיימת את כל 20 השלבים!" : "כל הכבוד! עברת את מבוך " + (safeLv + 1) + "!",
          text: last ? "עברת את כל המבוכים בהצלחה!" : "מוכן למבוך " + (next + 1) + " מתוך " + LEVELS.length + "?",
          buttons: [
            { label: last ? "מתחילים מחדש 🔄" : "מבוך הבא ⬅️", onClick: function () { maze(container, next, false); } },
            { label: "שוב אותו מבוך", cls: "alt", onClick: function () { maze(container, safeLv, false); } },
            { label: "תפריט", cls: "alt", onClick: function () { G.go("home"); } }
          ]
        });
      }, 1000);
    }

    var drag = null;
    cv.addEventListener("pointerdown", function (e) {
      if (won) return;
      var p = pos(e);
      if (Math.hypot(p[0] - px, p[1] - py) < Math.max(46, cs * 0.95)) {
        e.preventDefault();
        try { cv.setPointerCapture(e.pointerId); } catch (err) {}
        drag = { ox: px - p[0], oy: py - p[1] };
      }
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drag || won) return;
      var p = pos(e);
      moveTo(p[0] + drag.ox, p[1] + drag.oy);
      draw();
      if (Math.hypot(px - gx, py - gy) < cs * 0.35) { drag = null; draw(); win(); }
    });
    function up() { drag = null; }
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    var nb = container.querySelector("#mzNew");
    if (nb) nb.onclick = function () { maze(container, safeLv, false); };
    var lb = container.querySelector("#mzLevels");
    if (lb) lb.onclick = function () { pickMazeLevel(container); };
  }

  window.Maze = {
    start: function (container) {
      var lv = G.store.load().mazeLevel || 0;
      maze(container, lv % LEVELS.length, false);
    },
    mini: function (box, cb) { maze(box, 0, true, cb); },

    /* סיפור ראשי: p בין 0 ל-1. 0 = מבוך 1 (קטן), 1 = מבוך 18 (גדול ומפותל) */
    storyRound: function (box, p, onDone) {
      var q = Math.max(0, Math.min(1, +p || 0));
      var lv = Math.round(q * (LEVELS.length - 3));
      maze(box, lv, false, onDone, true);
    }
  };
})();
