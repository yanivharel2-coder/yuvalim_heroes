/* פאזל אמיתי: חלקים עם בליטות וחריצים שגוררים אל הלוח ונצמדים למקום הנכון.
   קשה = הכי הרבה חלקים שנכנסים במסך, בינוני = בערך חצי.
   במצב סיפור ראשי: Puzzle.storyRound(box, p, onDone) - p בין 0 (6 חלקים) ל-1 (המקסימום שנכנס) */
(function () {
  var SCENES = [
    { bg: ["#8fd3ff", "#d9f2ff"], items: [["☀️",.85,.18,140],["🏠",.3,.62,260],["🐄",.68,.72,200],["🌳",.9,.6,220],["🌼",.1,.88,100]] },
    { bg: ["#7fd1ff", "#1b6fd1"], items: [["🐠",.3,.4,170],["🐙",.65,.65,220],["🐳",.75,.25,170],["🐚",.2,.85,100],["🌊",.5,.9,140]] },
    { bg: ["#1a1a4a", "#4b2a8a"], items: [["🚀",.5,.5,250],["🌙",.15,.2,150],["⭐",.8,.2,100],["🪐",.85,.75,170],["🌍",.2,.78,150]] },
    { bg: ["#9be39b", "#2e8b57"], items: [["🦁",.35,.62,240],["🐒",.75,.4,170],["🌴",.88,.7,220],["🦜",.15,.3,150],["🌺",.55,.88,100]] },
    { bg: ["#ffd8a8", "#ff9ec4"], items: [["🚒",.3,.65,230],["🏢",.75,.55,280],["🚓",.55,.85,150],["🚁",.6,.2,150],["☁️",.15,.2,130]] },
    { bg: ["#ffe0f0", "#c7a6ff"], items: [["🍦",.3,.55,240],["🍩",.7,.35,190],["🧁",.72,.75,180],["🍭",.12,.2,140],["🍬",.45,.2,110]] },
    { bg: ["#bfe8ff", "#a8e6a1"], items: [["🐶",.25,.6,200],["🐱",.5,.72,200],["🐰",.78,.62,190],["🐥",.5,.3,120],["🦋",.15,.25,100]] },
    { bg: ["#ffe9a8", "#ffb86b"], items: [["🦖",.4,.6,280],["🌋",.85,.5,230],["🥚",.15,.82,120],["🦕",.7,.82,170],["☀️",.15,.2,130]] }
  ];

  var defaults = null;

  function makeDefault(scene) {
    var c = document.createElement("canvas");
    c.width = 800; c.height = 600;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, scene.bg[0]); g.addColorStop(1, scene.bg[1]);
    x.fillStyle = g; x.fillRect(0, 0, 800, 600);
    x.fillStyle = "rgba(255,255,255,.2)";
    for (var i = 0; i < 16; i++) {
      x.beginPath();
      x.arc((i * 211) % 800, (i * 127) % 600, 30 + (i * 17) % 60, 0, Math.PI * 2);
      x.fill();
    }
    x.textAlign = "center"; x.textBaseline = "middle";
    scene.items.forEach(function (it) {
      x.font = it[3] + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      x.fillText(it[0], it[1] * 800, it[2] * 600);
    });
    return c.toDataURL("image/png");
  }

  var cursor = -1;
  function pickSource() {
    var list;
    if (CONFIG.images && CONFIG.images.length) {
      list = CONFIG.images.slice();
    } else {
      if (!defaults) defaults = SCENES.map(makeDefault);
      list = defaults;
    }
    return G.deck("puzzle", list, function (x) { return list.indexOf(x); });
  }

  /* mode: "hard" | "medium" | מספר בין 0 ל-1 (סיפור ראשי: 0 = 6 חלקים, 1 = המקסימום) */
  function gridFor(bw, bh, mini, mode) {
    if (mini) return { c: 3, r: 2 };
    var MIN = CONFIG.minPuzzlePiece;
    var c = Math.max(2, Math.min(6, Math.floor(bw / MIN)));
    var r = Math.max(2, Math.min(5, Math.floor(bh / MIN)));
    while (c * r > CONFIG.maxPuzzlePieces) { if (c >= r) c--; else r--; }
    if (mode === "hard") return { c: c, r: r };

    if (typeof mode === "number") {
      var maxN = c * r, minN = Math.min(6, maxN);
      var want = Math.round(minN + Math.max(0, Math.min(1, mode)) * (maxN - minN));
      var asp = bw / bh, pick = null;
      for (var sc = 2; sc <= c; sc++) {
        for (var sr = 2; sr <= r; sr++) {
          var dn = Math.abs(sc * sr - want), da = Math.abs(sc / sr - asp);
          if (!pick || dn < pick.dn || (dn === pick.dn && da < pick.da)) pick = { c: sc, r: sr, dn: dn, da: da };
        }
      }
      return { c: pick.c, r: pick.r };
    }

    var target = c * r / 2, best = null;
    for (var cc = 2; cc <= c; cc++) {
      for (var rr = 2; rr <= r; rr++) {
        var n = cc * rr;
        if (n >= c * r) continue;
        var d = Math.abs(n - target);
        if (!best || d < best.d || (d === best.d && Math.abs(cc - rr) < Math.abs(best.c - best.r))) {
          best = { c: cc, r: rr, d: d };
        }
      }
    }
    return best ? { c: best.c, r: best.r } : { c: c, r: r };
  }

  var testCtx = document.createElement("canvas").getContext("2d");

  /* צורת חלק: ארבע צלעות, כל אחת שטוחה (שפת הלוח), בליטה או חריץ */
  function addEdge(p, ax, ay, bx, by, nx, ny, s, m) {
    if (!s) { p.lineTo(bx, by); return; }
    var ex = bx - ax, ey = by - ay, k = m * 0.75 * s;
    function P(u, v) { return [ax + ex * u + nx * k * v, ay + ey * u + ny * k * v]; }
    function C(a, b, c) {
      var q = P(a[0], a[1]), w = P(b[0], b[1]), z = P(c[0], c[1]);
      p.bezierCurveTo(q[0], q[1], w[0], w[1], z[0], z[1]);
    }
    var a = P(0.33, 0); p.lineTo(a[0], a[1]);
    C([0.40, 0],    [0.43, 0.04], [0.40, 0.10]);
    C([0.35, 0.17], [0.34, 0.32], [0.50, 0.32]);
    C([0.66, 0.32], [0.65, 0.17], [0.60, 0.10]);
    C([0.57, 0.04], [0.60, 0],    [0.67, 0]);
    p.lineTo(bx, by);
  }

  function play(container, mode, mini, onDone) {
    var story = typeof mode === "number";   /* סיבוב בתוך הסיפור הראשי */
    var short = mini || story;
    container.innerHTML =
      '<section class="puz"><div class="puz-bar">' +
      '<div class="chip on">' + (short ? "הרכיבו את התמונה" : (mode === "hard" ? "פאזל קשה" : "פאזל בינוני")) + '</div>' +
      '<button class="btn small alt" id="peek">👁️ הצצה</button>' +
      (short ? '' : '<button class="btn small alt" id="nextPic" aria-label="תמונה הבאה">🔄 תמונה אחרת</button>') +
      '</div><div class="jig-area"></div></section>';
    var area = container.querySelector(".jig-area");
    var rect0 = area.getBoundingClientRect();
    var W = rect0.width, H = rect0.height;
    var src = pickSource();

    G.loadImage(G.urlOf(src)).catch(function () {
      if (!defaults) defaults = SCENES.map(makeDefault);
      return G.loadImage(defaults[0]);
    }).then(function (img) {
      if (!area.isConnected) return;

      /* גודל ומיקום הלוח */
      var asp = img.naturalWidth / img.naturalHeight;
      var landscape = W >= H * 1.1;
      var maxW = landscape ? W * 0.62 : W * 0.96;
      var maxH = landscape ? H * 0.96 : H * 0.52;
      var bw = Math.min(maxW, maxH * asp), bh = bw / asp;
      bw = Math.floor(bw); bh = Math.floor(bh);
      var bx = landscape ? Math.round(W * 0.02) : Math.round((W - bw) / 2);
      var by = landscape ? Math.round((H - bh) / 2) : Math.round(H * 0.01);

      var g = gridFor(bw, bh, mini, mode);
      var c = g.c, r = g.r, n = c * r;
      var cw = bw / c, ch = bh / r, m = Math.min(cw, ch);
      var t = Math.ceil(m * 0.24) + 3;
      var pw = Math.ceil(cw + 2 * t), ph = Math.ceil(ch + 2 * t);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);

      /* הלוח עם תמונת רפאים וקווי עזר */
      var board = document.createElement("div");
      board.className = "jig-board";
      board.style.cssText = "left:" + bx + "px;top:" + by + "px;width:" + bw + "px;height:" + bh + "px;";
      var ghost = document.createElement("div");
      ghost.className = "jig-ghost";
      ghost.style.backgroundImage = 'url("' + G.urlOf(img.src) + '")';
      ghost.style.setProperty("--cw", cw + "px");
      ghost.style.setProperty("--ch", ch + "px");
      board.appendChild(ghost);
      area.appendChild(board);

      var peekEl = document.createElement("div");
      peekEl.className = "jig-peek";
      peekEl.style.cssText = "left:" + bx + "px;top:" + by + "px;width:" + bw + "px;height:" + bh + "px;" +
        'background-image:url("' + G.urlOf(img.src) + '")';
      area.appendChild(peekEl);

      /* תמונה עם שוליים, ממנה חותכים כל חלק */
      var P = document.createElement("canvas");
      P.width = Math.ceil((bw + 2 * t) * dpr); P.height = Math.ceil((bh + 2 * t) * dpr);
      P.getContext("2d").drawImage(img, t * dpr, t * dpr, bw * dpr, bh * dpr);

      /* בליטות וחריצים אקראיים בין חלקים שכנים */
      var hE = [], vE = [], i, j;
      for (i = 0; i <= r; i++) { hE[i] = []; for (j = 0; j < c; j++) hE[i][j] = (i === 0 || i === r) ? 0 : (G.rand(2) ? 1 : -1); }
      for (i = 0; i < r; i++) { vE[i] = []; for (j = 0; j <= c; j++) vE[i][j] = (j === 0 || j === c) ? 0 : (G.rand(2) ? 1 : -1); }

      function pathFor(row, col) {
        var p = new Path2D(), x0 = t, y0 = t, x1 = t + cw, y1 = t + ch;
        p.moveTo(x0, y0);
        addEdge(p, x0, y0, x1, y0, 0, -1, row > 0 ? -hE[row][col] : 0, m);
        addEdge(p, x1, y0, x1, y1, 1, 0, col < c - 1 ? vE[row][col + 1] : 0, m);
        addEdge(p, x1, y1, x0, y1, 0, 1, row < r - 1 ? hE[row + 1][col] : 0, m);
        addEdge(p, x0, y1, x0, y0, -1, 0, col > 0 ? -vE[row][col] : 0, m);
        p.closePath();
        return p;
      }

      var pieces = [];
      for (i = 0; i < r; i++) {
        for (j = 0; j < c; j++) {
          var cv = document.createElement("canvas");
          cv.className = "jig-piece";
          cv.width = pw * dpr; cv.height = ph * dpr;
          cv.style.width = pw + "px"; cv.style.height = ph + "px";
          var x = cv.getContext("2d");
          x.scale(dpr, dpr);
          var path = pathFor(i, j);
          x.save();
          x.clip(path);
          x.drawImage(P, j * cw * dpr, i * ch * dpr, pw * dpr, ph * dpr, 0, 0, pw, ph);
          x.lineJoin = "round";
          x.strokeStyle = "rgba(255,255,255,.35)"; x.lineWidth = 7; x.stroke(path);
          x.restore();
          x.strokeStyle = "rgba(20,24,58,.85)"; x.lineWidth = 2.5; x.stroke(path);
          area.appendChild(cv);
          pieces.push({ el: cv, path: path, row: i, col: j, x: 0, y: 0,
                        tx: bx + j * cw - t, ty: by + i * ch - t, placed: false, z: 5 });
        }
      }
      area._pieces = pieces;

      function put(pc) { pc.el.style.transform = "translate(" + pc.x + "px," + pc.y + "px)"; }

      /* פיזור החלקים סביב הלוח: מכל כמה מקומות אפשריים בוחרים את הכי רחוק מהחלקים שכבר פוזרו */
      var bRect = { l: bx - 6, t: by - 6, r: bx + bw + 6, b: by + bh + 6 };
      var centers = [];
      G.shuffle(pieces).forEach(function (pc, k) {
        var best = null, bestD = -1;
        for (var tries = 0; tries < 40; tries++) {
          var px = Math.random() * Math.max(1, W - pw);
          var py = Math.random() * Math.max(1, H - ph);
          var a = { l: px + t, t: py + t, r: px + t + cw, b: py + t + ch };
          if (!(a.r < bRect.l || a.l > bRect.r || a.b < bRect.t || a.t > bRect.b)) continue;
          var cx = px + pw / 2, cy = py + ph / 2, d = Infinity;
          for (var q = 0; q < centers.length; q++) d = Math.min(d, Math.hypot(cx - centers[q][0], cy - centers[q][1]));
          if (d > bestD) { bestD = d; best = [px, py]; }
        }
        if (!best) best = [Math.random() * Math.max(1, W - pw), Math.random() * Math.max(1, H - ph)];
        pc.x = best[0]; pc.y = best[1]; pc.z = 5 + k;
        centers.push([pc.x + pw / 2, pc.y + ph / 2]);
        pc.el.style.zIndex = pc.z;
        put(pc);
      });

      /* גרירה */
      var zTop = 100, drag = null, placedCount = 0;

      function finish() {
        area.classList.add("complete");
        peekEl.style.display = "none";
        ghost.style.opacity = 0;
        G.sfx.win();
        G.confetti(short ? 40 : 90);
        if (short) { G.later(onDone, 1400); return; }
        G.later(function () {
          G.dialog({
            art: '<span style="font-size:90px">🧩</span>',
            title: "כל הכבוד! הפאזל הושלם",
            buttons: [
              { label: "פאזל חדש", onClick: function () { play(container, mode, false); } },
              { label: "לבחור רמה", cls: "alt", onClick: function () { Puzzle.start(container); } },
              { label: "תפריט", cls: "alt", onClick: function () { G.go("home"); } }
            ]
          });
        }, 1500);
      }

      area.addEventListener("pointerdown", function (e) {
        if (drag) return;
        var ar = area.getBoundingClientRect();
        var mx = e.clientX - ar.left, my = e.clientY - ar.top;
        var cand = pieces.filter(function (p) { return !p.placed; })
                         .sort(function (a, b) { return b.z - a.z; });
        for (var k = 0; k < cand.length; k++) {
          var pc = cand[k];
          if (testCtx.isPointInPath(pc.path, mx - pc.x, my - pc.y)) {
            e.preventDefault();
            try { area.setPointerCapture(e.pointerId); } catch (err) {}
            drag = { pc: pc, dx: mx - pc.x, dy: my - pc.y, id: e.pointerId };
            pc.z = ++zTop; pc.el.style.zIndex = pc.z; pc.el.classList.add("lift");
            G.sfx.flip();
            return;
          }
        }
      });
      area.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var ar = area.getBoundingClientRect(), pc = drag.pc;
        pc.x = Math.max(-t, Math.min(W - pw + t, e.clientX - ar.left - drag.dx));
        pc.y = Math.max(-t, Math.min(H - ph + t, e.clientY - ar.top - drag.dy));
        put(pc);
      });
      function release(e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        var pc = drag.pc; drag = null;
        pc.el.classList.remove("lift");
        var dist = Math.hypot(pc.x - pc.tx, pc.y - pc.ty);
        if (dist < Math.max(26, m * 0.4)) {
          pc.x = pc.tx; pc.y = pc.ty; pc.placed = true; pc.z = 2;
          pc.el.style.zIndex = 2;
          pc.el.classList.add("snap", "placed");
          put(pc);
          placedCount++;
          G.sfx.match();
          if (placedCount === n) finish();
        }
      }
      area.addEventListener("pointerup", release);
      area.addEventListener("pointercancel", release);

      var nextBtn = container.querySelector("#nextPic");
      if (nextBtn) nextBtn.onclick = function () { G.clearTimers(); play(container, mode, false); };

      container.querySelector("#peek").onclick = function () {
        peekEl.classList.add("on");
        G.later(function () { peekEl.classList.remove("on"); }, 1800);
      };
    });
  }

  window.Puzzle = {
    start: function (container) {
      container.innerHTML =
        '<section class="menu"><h2>פאזל</h2><div class="menu-btns">' +
        '<button class="btn big" data-m="medium">🧩 בינוני</button>' +
        '<button class="btn big red" data-m="hard">🧩🧩 קשה</button></div></section>';
      container.querySelectorAll("[data-m]").forEach(function (b) {
        b.onclick = function () { play(container, b.dataset.m, false); };
      });
    },
    mini: function (box, onDone) { play(box, "medium", true, onDone); },

    /* סיפור ראשי: p בין 0 ל-1 קובע כמה חלקים. 0 = 6 חלקים, 1 = המקסימום שנכנס במסך */
    storyRound: function (box, p, onDone) {
      var q = Math.max(0, Math.min(1, +p || 0));
      play(box, q, false, onDone);
    }
  };
})();
