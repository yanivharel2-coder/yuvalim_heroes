/* משחק המספרים: סופרים פריטים ובוחרים את המספר הנכון */
(function () {
  var last = 0;

  window.Numbers = {
    ask: function (box, step, cb) {
      var max = step < 8 ? 5 : 10;
      var nl = []; for (var q = 1; q <= max; q++) nl.push(q);
      var n = G.deck("num" + max, nl);
      var group = G.deck("numgrp", DATA.countGroups, function (x) { return x.label; });
      var emoji = G.pick(group.e);

      var near = [];
      for (var d = -2; d <= 2; d++) {
        var v = n + d;
        if (v >= 1 && v <= max && v !== n) near.push(v);
      }
      var others = [];
      for (var k = 1; k <= max; k++) if (k !== n && near.indexOf(k) < 0) others.push(k);
      var wrong = G.shuffle(near).concat(G.shuffle(others)).slice(0, 2);
      var opts = G.shuffle([n].concat(wrong));

      var items = "";
      for (var i = 0; i < n; i++) {
        var rot = (G.rand(31) - 15) + "deg";
        items += '<span class="item" style="--r:' + rot + '">' + emoji + '</span>';
      }

      box.innerHTML =
        '<div class="q">' +
          '<div class="prompt">כמה ' + group.label + ' יש?</div>' +
          '<div class="items' + (n > 6 ? " many" : "") + '">' + items + '</div>' +
          '<div class="opts nums">' +
            opts.map(function (o) { return '<button class="num" data-n="' + o + '">' + o + '</button>'; }).join("") +
          '</div>' +
        '</div>';

      var locked = false;
      var btns = box.querySelectorAll(".num");
      btns.forEach(function (b) {
        b.onclick = function () {
          if (locked) return;
          locked = true;
          if (+b.dataset.n === n) {
            b.classList.add("good");
            G.sfx.ok();
            G.speak(String(n));
            G.later(function () { cb(true); }, 1000);
          } else {
            b.classList.add("bad");
            G.sfx.bad();
            btns.forEach(function (x) { if (+x.dataset.n === n) x.classList.add("hint"); });
            G.later(function () { cb(false); }, 1400);
          }
        };
      });
    }
  };
})();
