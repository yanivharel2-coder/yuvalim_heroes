/* ציורים: רואים ציור, פותחים מחברת, מציירים ומשווים מהזיכרון */
(function () {
  var PAL = [
    { id: "red",    hex: "#e53935", name: "אדום" },
    { id: "orange", hex: "#fb8c00", name: "כתום" },
    { id: "yellow", hex: "#fdd835", name: "צהוב" },
    { id: "green",  hex: "#43a047", name: "ירוק" },
    { id: "blue",   hex: "#1e88e5", name: "כחול" },
    { id: "purple", hex: "#8e24aa", name: "סגול" },
    { id: "brown",  hex: "#6d4c41", name: "חום" },
    { id: "black",  hex: "#212121", name: "שחור" }
  ];
  var C = {};
  PAL.forEach(function (p) { C[p.id] = p.hex; });
  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  PAL.forEach(function (p) { p.rgb = rgb(p.hex); });

  /* צורות בסיס על לוח של 100x100 */
  function P(c, pts) { return { t: "p", c: c, pts: pts }; }
  function O(c, x, y, r) { return { t: "e", c: c, x: x, y: y, rx: r, ry: r }; }
  function E(c, x, y, rx, ry) { return { t: "e", c: c, x: x, y: y, rx: rx, ry: ry }; }
  function R(c, x, y, w, h) { return P(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); }
  function L(c, x1, y1, x2, y2, w) { return { t: "l", c: c, a: [x1, y1, x2, y2], w: w }; }
  function A(c, x, y, r, w) { return { t: "a", c: c, x: x, y: y, r: r, w: w }; }

  function star(c, cx, cy, ro, ri) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : ro;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return P(c, pts);
  }

  var PICS = [
    { id: "ship", name: "אונייה", s: [R("blue", 0, 72, 100, 28), P("brown", [[12, 52], [88, 52], [74, 76], [26, 76]]), R("black", 48, 14, 4, 38), P("red", [[54, 16], [54, 48], [82, 48]]), P("yellow", [[46, 20], [46, 48], [22, 48]])] },
    { id: "plane", name: "מטוס", s: [E("blue", 50, 52, 42, 12), P("red", [[38, 52], [58, 52], [40, 14], [28, 14]]), P("red", [[38, 52], [58, 52], [40, 90], [28, 90]]), P("red", [[8, 44], [20, 44], [12, 26]]), O("yellow", 62, 50, 4), O("yellow", 76, 50, 4)] },
    { id: "house", name: "בית", s: [R("yellow", 18, 44, 64, 46), P("red", [[10, 46], [50, 12], [90, 46]]), R("brown", 42, 62, 16, 28), R("blue", 24, 54, 12, 12), R("blue", 64, 54, 12, 12)] },
    { id: "sun", name: "שמש", s: [L("orange", 50, 6, 50, 94, 7), L("orange", 6, 50, 94, 50, 7), L("orange", 19, 19, 81, 81, 7), L("orange", 81, 19, 19, 81, 7), O("yellow", 50, 50, 26)] },
    { id: "tree", name: "עץ", s: [R("brown", 43, 52, 14, 42), O("green", 50, 34, 28), O("green", 30, 48, 18), O("green", 70, 48, 18)] },
    { id: "car", name: "מכונית", s: [P("red", [[8, 58], [92, 58], [92, 74], [8, 74]]), P("red", [[24, 58], [34, 36], [68, 36], [80, 58]]), P("blue", [[32, 56], [38, 41], [48, 41], [48, 56]]), P("blue", [[52, 56], [52, 41], [64, 41], [72, 56]]), O("black", 28, 76, 11), O("black", 72, 76, 11)] },
    { id: "fish", name: "דג", s: [E("orange", 42, 50, 34, 22), P("orange", [[70, 50], [96, 28], [96, 72]]), O("black", 26, 44, 4), L("red", 44, 32, 44, 68, 4)] },
    { id: "flower", name: "פרח", s: [R("green", 47, 45, 6, 50), P("green", [[50, 78], [72, 62], [50, 86]]), O("red", 50, 20, 14), O("red", 50, 56, 14), O("red", 28, 38, 14), O("red", 72, 38, 14), O("yellow", 50, 38, 12)] },
    { id: "star", name: "כוכב", s: [star("yellow", 50, 54, 46, 20)] },
    { id: "heart", name: "לב", s: [O("red", 33, 36, 21), O("red", 67, 36, 21), P("red", [[14, 44], [86, 44], [50, 90]])] },
    { id: "apple", name: "תפוח", s: [O("red", 36, 56, 28), O("red", 64, 56, 28), R("brown", 48, 14, 5, 22), P("green", [[54, 22], [78, 12], [70, 34]])] },
    { id: "rocket", name: "רקטה", s: [E("blue", 50, 50, 16, 36), P("red", [[34, 28], [50, 4], [66, 28]]), P("red", [[34, 62], [34, 82], [14, 82]]), P("red", [[66, 62], [66, 82], [86, 82]]), O("yellow", 50, 44, 7), P("orange", [[40, 84], [60, 84], [50, 98]])] },
    { id: "icecream", name: "גלידה", s: [P("brown", [[30, 48], [70, 48], [50, 96]]), O("red", 50, 34, 22), O("orange", 36, 46, 12), O("orange", 64, 46, 12)] },
    { id: "butterfly", name: "פרפר", s: [E("purple", 28, 34, 22, 20), E("purple", 72, 34, 22, 20), E("orange", 30, 68, 16, 16), E("orange", 70, 68, 16, 16), E("black", 50, 50, 5, 34), L("black", 48, 18, 38, 6, 3), L("black", 52, 18, 62, 6, 3)] },
    { id: "train", name: "רכבת", s: [R("blue", 12, 40, 60, 34), R("red", 72, 28, 18, 46), R("red", 20, 22, 10, 18), R("yellow", 20, 48, 14, 12), R("yellow", 42, 48, 14, 12), R("black", 6, 74, 90, 5), O("black", 26, 82, 9), O("black", 54, 82, 9), O("black", 80, 82, 9)] },
    { id: "umbrella", name: "מטרייה", s: [P("red", [[8, 54], [14, 34], [28, 20], [50, 12], [72, 20], [86, 34], [92, 54], [74, 48], [58, 54], [42, 48], [26, 54]]), R("brown", 48, 50, 4, 34), A("brown", 40, 84, 10, 5)] },
    { id: "cat", name: "חתול", s: [P("orange", [[18, 46], [20, 10], [42, 28]]), P("orange", [[82, 46], [80, 10], [58, 28]]), O("orange", 50, 56, 36), O("black", 36, 50, 5), O("black", 64, 50, 5), P("red", [[44, 62], [56, 62], [50, 70]]), L("black", 10, 62, 34, 66, 2), L("black", 90, 62, 66, 66, 2)] },
    { id: "balloon", name: "בלון", s: [E("red", 50, 38, 28, 34), P("red", [[44, 72], [56, 72], [50, 80]]), L("black", 50, 80, 50, 98, 2)] },
    { id: "rainbow", name: "קשת", s: [A("red", 50, 86, 42, 10), A("yellow", 50, 86, 32, 10), A("blue", 50, 86, 22, 10), O("blue", 5, 92, 4), O("blue", 95, 92, 4)] },
    { id: "turtle", name: "צב", s: [E("green", 46, 56, 34, 26), O("green", 84, 52, 10), O("green", 24, 82, 8), O("green", 66, 82, 8), P("green", [[12, 56], [2, 66], [14, 66]]), O("black", 87, 49, 2), L("brown", 46, 32, 46, 80, 3), L("brown", 22, 56, 70, 56, 3)] }
  ];

  function paint(ctx, pic, size) {
    var k = size / 100;
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    pic.s.forEach(function (s) {
      ctx.fillStyle = ctx.strokeStyle = C[s.c];
      if (s.t === "p") {
        ctx.beginPath();
        s.pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0] * k, p[1] * k); else ctx.moveTo(p[0] * k, p[1] * k); });
        ctx.closePath(); ctx.fill();
      } else if (s.t === "e") {
        ctx.beginPath(); ctx.ellipse(s.x * k, s.y * k, s.rx * k, s.ry * k, 0, 0, Math.PI * 2); ctx.fill();
      } else if (s.t === "l") {
        ctx.lineWidth = s.w * k; ctx.beginPath(); ctx.moveTo(s.a[0] * k, s.a[1] * k); ctx.lineTo(s.a[2] * k, s.a[3] * k); ctx.stroke();
      } else {
        ctx.lineWidth = s.w * k; ctx.beginPath(); ctx.arc(s.x * k, s.y * k, s.r * k, Math.PI, 0); ctx.stroke();
      }
    });
    ctx.restore();
  }

  /* ---- השוואה ---- */
  var N = 48, RAD = 2, PR = 2;
  function nearestClass(data) {
    /* מחזיר { m: מסכת דיו, c: מחלקת צבע } לתמונה בגודל NxN */
    var m = new Uint8Array(N * N), c = new Int8Array(N * N).fill(-1);
    for (var i = 0; i < N * N; i++) {
      var a = data[i * 4 + 3];
      if (a < 90) continue;
      m[i] = 1;
      var best = 0, bd = 1e9;
      for (var j = 0; j < PAL.length; j++) {
        var d = Math.pow(data[i * 4] - PAL[j].rgb[0], 2) + Math.pow(data[i * 4 + 1] - PAL[j].rgb[1], 2) + Math.pow(data[i * 4 + 2] - PAL[j].rgb[2], 2);
        if (d < bd) { bd = d; best = j; }
      }
      c[i] = best;
    }
    return { m: m, c: c };
  }
  function sample(srcCanvas) {
    var t = document.createElement("canvas"); t.width = t.height = N;
    var x = t.getContext("2d");
    x.drawImage(srcCanvas, 0, 0, N, N);
    return nearestClass(x.getImageData(0, 0, N, N).data);
  }
  /* מיישר את הציור לתיבה קבועה: אותו מרכז ואותו גודל, כדי שהזזה או הקטנה לא יפגעו בציון */
  function align(o) {
    var x0 = N, y0 = N, x1 = -1, y1 = -1, x, y;
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (o.m[y * N + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    var w = x1 - x0 + 1, h = y1 - y0 + 1, sc = 44 / Math.max(w, h);
    var m = new Uint8Array(N * N), c = new Int8Array(N * N).fill(-1);
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      var sx = Math.floor((x - N / 2) / sc + (x0 + x1 + 1) / 2), sy = Math.floor((y - N / 2) / sc + (y0 + y1 + 1) / 2);
      if (sx < 0 || sy < 0 || sx >= N || sy >= N) continue;
      var i = sy * N + sx;
      if (o.m[i]) { m[y * N + x] = 1; c[y * N + x] = o.c[i]; }
    }
    return { m: m, c: c };
  }
  function nearest(mask, x, y, r) {
    var bd = 1e9, bi = -1;
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
      var xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= N || yy >= N || !mask[yy * N + xx]) continue;
      var d = dx * dx + dy * dy;
      if (d <= r * r && d < bd) { bd = d; bi = yy * N + xx; }
    }
    return bi;
  }

  /* מחזיר ציוני צורה וצבע בין 0 ל-1 */
  function compare(refCanvas, drawCanvas) {
    var ref = sample(refCanvas), usr = sample(drawCanvas);
    var refN = 0, usrN = 0, covered = 0, near = 0, colorOk = 0, i, x, y;
    for (i = 0; i < N * N; i++) { refN += ref.m[i]; usrN += usr.m[i]; }
    if (usrN < 25) return { shape: 0, color: 0, empty: true };
    ref = align(ref); usr = align(usr); refN = 0;
    for (i = 0; i < N * N; i++) { refN += ref.m[i]; }
    usrN = 0; for (i = 0; i < N * N; i++) { usrN += usr.m[i]; }
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      i = y * N + x;
      if (ref.m[i]) {
        var n = nearest(usr.m, x, y, RAD);
        if (n >= 0) { covered++; if (usr.c[n] === ref.c[i]) colorOk++; }
      }
      if (usr.m[i] && nearest(ref.m, x, y, PR) >= 0) near++;
    }
    var cov = covered / refN, prec = near / usrN;
    var shape = 2 * cov * prec / (cov + prec + 1e-9);
    return { shape: shape, color: colorOk / refN, cov: cov, prec: prec };
  }
  var PASS_SHAPE = 0.78, PASS_COLOR = 0.5;

  var bag = [];
  function nextPic() {
    if (!bag.length) bag = G.shuffle(PICS);
    return bag.pop();
  }

  function ask(box, step, cb) {
    var pic = nextPic(), done = false;
    box.innerHTML =
      '<div class="dr-wrap"><div class="dr-title">תסתכלו טוב על הציור וזכרו אותו! 👀</div>' +
      '<canvas class="dr-ref" width="360" height="360"></canvas>' +
      '<button type="button" class="btn big" id="drOpen">📓 פתח מחברת</button></div>';
    var ref = box.querySelector(".dr-ref");
    paint(ref.getContext("2d"), pic, 360);
    box.querySelector("#drOpen").onclick = function () { notebook(); };

    function notebook() {
      var color = "black", width = 8, S = 480, drawing = false, last = null, touched = false;
      box.innerHTML =
        '<div class="dr-wrap dr-nb"><div class="dr-title dr-g-title">ציירו וצבעו את מה שראיתם ✏️</div>' +
        '<div class="dr-tools dr-g-tools"><div class="dr-colors">' +
        PAL.map(function (p) { return '<button type="button" class="dr-col' + (p.id === color ? " on" : "") + '" data-c="' + p.id + '" style="background:' + p.hex + '" aria-label="' + p.name + '"></button>'; }).join("") +
        '</div><div class="dr-widths">' +
        [[3, 6], [8, 12], [18, 20]].map(function (w, i) { return '<button type="button" class="dr-w' + (i === 1 ? " on" : "") + '" data-w="' + w[0] + '" aria-label="עובי"><i style="width:' + w[1] + 'px;height:' + w[1] + 'px"></i></button>'; }).join("") +
        '</div><button type="button" class="btn small alt" id="drClear">🧽 נקה</button></div>' +
        '<canvas class="dr-pad dr-g-pad" width="' + S + '" height="' + S + '"></canvas>' +
        '<button type="button" class="btn big dr-g-done" id="drDone">סיימתי ✅</button></div>';
      var pad = box.querySelector(".dr-pad"), ctx = pad.getContext("2d");
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      function pos(e) {
        var r = pad.getBoundingClientRect();
        return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height];
      }
      pad.addEventListener("pointerdown", function (e) {
        e.preventDefault(); drawing = true; touched = true; last = pos(e);
        try { pad.setPointerCapture(e.pointerId); } catch (x) {}
        ctx.fillStyle = C[color]; ctx.beginPath(); ctx.arc(last[0], last[1], width / 2, 0, Math.PI * 2); ctx.fill();
      });
      pad.addEventListener("pointermove", function (e) {
        if (!drawing) return; e.preventDefault();
        var p = pos(e);
        ctx.strokeStyle = C[color]; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p;
      });
      function up() { drawing = false; }
      pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
      box.querySelectorAll(".dr-col").forEach(function (b) {
        b.onclick = function () {
          color = b.dataset.c;
          box.querySelectorAll(".dr-col").forEach(function (x) { x.classList.toggle("on", x === b); });
        };
      });
      box.querySelectorAll(".dr-w").forEach(function (b) {
        b.onclick = function () {
          width = +b.dataset.w;
          box.querySelectorAll(".dr-w").forEach(function (x) { x.classList.toggle("on", x === b); });
        };
      });
      box.querySelector("#drClear").onclick = function () { ctx.clearRect(0, 0, S, S); };
      box.querySelector("#drDone").onclick = function () {
        var rc = document.createElement("canvas"); rc.width = rc.height = S;
        paint(rc.getContext("2d"), pic, S);
        var r = compare(rc, pad);
        var ok = !r.empty && r.shape >= PASS_SHAPE && r.color >= PASS_COLOR;
        showResult(rc, pad, ok, r);
      };
    }

    function showResult(rc, pad, ok, r) {
      if (done) return; done = true;
      var msg = ok ? "יפה מאוד! הציור דומה לציור המקורי! 🎉"
        : r.empty ? "עוד לא ציירתם כלום. נעבור לשאלה הבאה."
        : "הציור לא היה דומה מספיק, נעבור לשאלה הבאה.";
      box.innerHTML =
        '<div class="dr-wrap"><div class="dr-title">' + msg + '</div>' +
        '<div class="dr-compare"><figure><canvas class="dr-a" width="320" height="320"></canvas><figcaption>המקור</figcaption></figure>' +
        '<figure><canvas class="dr-b" width="320" height="320"></canvas><figcaption>הציור שלכם</figcaption></figure></div>' +
        '<button type="button" class="btn big" id="drNext">המשך ⬅️</button></div>';
      box.querySelector(".dr-a").getContext("2d").drawImage(rc, 0, 0, 320, 320);
      box.querySelector(".dr-b").getContext("2d").drawImage(pad, 0, 0, 320, 320);
      if (ok) { G.sfx.ok(); G.confetti(40); } else G.sfx.bad();
      box.querySelector("#drNext").onclick = function () { cb(ok); };
    }
  }

  window.Draw = { ask: ask, pics: PICS, paint: paint, compare: compare, pal: PAL, _thr: [PASS_SHAPE, PASS_COLOR] };
})();
