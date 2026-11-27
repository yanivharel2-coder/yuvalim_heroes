/* משחק האותיות: מציגים אות, והילד בוחר את התמונה שמתחילה בה */
(function () {
  var LETTERS = DATA.letters;
  var last = null;

  function similar(a, b) {
    if (a === b) return true;
    return DATA.similarSounds.some(function (g) { return g.indexOf(a) > -1 && g.indexOf(b) > -1; });
  }

  window.Letters = {
    ask: function (box, step, cb) {
      var item = G.deck("letters", LETTERS, function (x) { return x.l; });
      var right = G.deck("lw_" + item.l, item.w, function (x) { return x[0]; });
      var pool = [];
      LETTERS.forEach(function (L) {
        if (!similar(L.l, item.l)) L.w.forEach(function (w) { pool.push({ w: w, l: L.l }); });
      });
      var wrong = [];
      G.shuffle(pool).forEach(function (p) {
        if (wrong.length >= 2) return;
        if (wrong.some(function (x) { return similar(x.l, p.l); })) return;
        wrong.push(p);
      });
      var opts = G.shuffle([{ w: right, ok: true }].concat(wrong.map(function (p) { return { w: p.w, ok: false }; })));

      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">באיזו תמונה מתחילה האות?</div>' +
          '<button class="letter-card" id="say" aria-label="הקראת האות">' + item.l + '<span class="speaker">🔊</span></button>' +
          '<div class="opts">' +
            opts.map(function (o, i) {
              return '<button class="opt" data-i="' + i + '" aria-label="תמונה ' + (i + 1) + '"><span class="pic">' + o.w[1] + '</span></button>';
            }).join("") +
          '</div>' +
        '</div>';

      box.querySelector("#say").onclick = function () { G.speak(item.n); };
      G.later(function () { G.speak(item.n); }, 300);

      var locked = false;
      var btns = box.querySelectorAll(".opt");
      btns.forEach(function (b) {
        b.onclick = function () {
          if (locked) return;
          locked = true;
          var o = opts[+b.dataset.i];
          if (o.ok) {
            b.classList.add("good");
            G.sfx.ok();
            G.speak(o.w[0]);
            G.later(function () { cb(true); }, 1100);
          } else {
            b.classList.add("bad");
            G.sfx.bad();
            btns.forEach(function (x, i) { if (opts[i].ok) x.classList.add("hint"); });
            G.later(function () { cb(false); }, 1400);
          }
        };
      });
    }
  };
})();
