/* משחק זיכרון: 10 שלבים ברמת קושי עולה, שחקן אחד או שניים.
   במצב סיפור ראשי: Memory.storyRound(box, p, onDone) - p בין 0 (קל) ל-1 (קשה) */
(function () {
  var GAP = 10;

  /* 10 שלבים: עמודות, שורות, מספר קלפים, שם שלב */
  var MEMORY_LEVELS = [
    { c: 2, r: 2, label: "חימום קל (4 קלפים)" },
    { c: 3, r: 2, label: "מתחילים (6 קלפים)" },
    { c: 4, r: 2, label: "צעד קדימה (8 קלפים)" },
    { c: 4, r: 3, label: "אתגר בינוני (12 קלפים)" },
    { c: 4, r: 4, label: "זיכרון חד (16 קלפים)" },
    { c: 5, r: 4, label: "אלופי הזיכרון (20 קלפים)" },
    { c: 6, r: 4, label: "גיבורי על (24 קלפים)" },
    { c: 7, r: 4, label: "מאסטר הזיכרון (28 קלפים)" },
    { c: 8, r: 4, label: "אגדת הגיבורים (32 קלפים)" },
    { c: 8, r: 5, label: "האתגר הגדול (40 קלפים)" }
  ];

  function cardFaces(pairs) {
    var pool = (CONFIG.memoryImages && CONFIG.memoryImages.length) ? CONFIG.memoryImages : (CONFIG.images || []);
    var user = G.shuffle(pool).slice(0, pairs).map(function (src) {
      return '<img src="' + G.urlOf(src) + '" alt="">';
    });
    var need = pairs - user.length;
    var emo = G.shuffle(DATA.emojiPool).slice(0, Math.max(0, need)).map(function (e) {
      return '<span class="emo">' + e + '</span>';
    });
    return G.shuffle(user.concat(emo));
  }

  function layoutForLevel(W, H, lvIdx) {
    var spec = MEMORY_LEVELS[Math.max(0, Math.min(lvIdx, MEMORY_LEVELS.length - 1))];
    var portrait = H > W;
    var c = portrait ? Math.min(spec.c, spec.r) : Math.max(spec.c, spec.r);
    var r = portrait ? Math.max(spec.c, spec.r) : Math.min(spec.c, spec.r);
    var n = c * r;
    var cell = Math.floor(Math.min((W - GAP * (c - 1)) / c, (H - GAP * (r - 1)) / r, 200));
    return { c: c, r: r, n: n, cell: Math.max(44, cell), label: spec.label };
  }

  function loadLevel(players) {
    var a = G.store.load();
    var key = players === 2 ? "memoryLevel2P" : "memoryLevel1P";
    var lv = typeof a[key] === "number" ? a[key] : 0;
    return Math.max(0, Math.min(lv, MEMORY_LEVELS.length - 1));
  }

  function saveLevel(players, lv) {
    var a = G.store.load();
    var key = players === 2 ? "memoryLevel2P" : "memoryLevel1P";
    a[key] = Math.max(0, Math.min(lv, MEMORY_LEVELS.length - 1));
    G.store.save(a);
  }

  /* story = true: סיבוב אחד בתוך הסיפור הראשי, בלי תפריטי שלבים ובלי חלון סיום */
  function play(container, players, lv, mini, onDone, story) {
    container.innerHTML =
      '<section class="mem"><div class="scorebar"></div>' +
      '<div class="mem-area"><div class="mem-grid"></div></div></section>';
    var bar = container.querySelector(".scorebar");
    var area = container.querySelector(".mem-area");
    var grid = container.querySelector(".mem-grid");
    var rect = area.getBoundingClientRect();

    var lay;
    if (mini) {
      var cell = Math.floor(Math.min((rect.width - GAP * 2) / 3, (rect.height - GAP) / 2, 170));
      lay = { c: 3, r: 2, n: 6, cell: Math.max(60, cell) };
    } else {
      lay = layoutForLevel(rect.width, rect.height, lv);
    }

    var faces = cardFaces(lay.n / 2);
    var deck = [];
    faces.forEach(function (h, i) { deck.push({ id: i, h: h }); deck.push({ id: i, h: h }); });
    deck = G.shuffle(deck);

    grid.style.gridTemplateColumns = "repeat(" + lay.c + "," + lay.cell + "px)";
    grid.style.gridAutoRows = lay.cell + "px";
    grid.style.gap = GAP + "px";
    grid.style.setProperty("--cell", lay.cell + "px");

    var cards = deck.map(function (d, i) {
      var b = G.el('<button class="mcard" aria-label="קלף"><span class="in"><span class="f b">⭐</span><span class="f fr">' + d.h + '</span></span></button>');
      b.dataset.i = i;
      grid.appendChild(b);
      return b;
    });

    var scores = players === 2 ? [0, 0] : [0];
    var turn = 0, found = 0, open = [], lock = false;
    var total = lay.n / 2;

    function paintBar() {
      if (mini) { bar.innerHTML = '<div class="chip on">מצאו את הזוגות</div>'; return; }
      if (story) { bar.innerHTML = '<div class="chip on">זוגות: ' + scores[0] + ' מתוך ' + total + '</div>'; return; }
      var lvBadge = '<div class="chip">שלב ' + (lv + 1) + ' מתוך ' + MEMORY_LEVELS.length + '</div>';
      var resetBtn = '<button class="btn small alt" id="memLevelsBtn">🎯 שלבים</button>';
      if (players === 1) {
        bar.innerHTML = lvBadge + '<div class="chip on">זוגות: ' + scores[0] + ' מתוך ' + total + '</div>' + resetBtn;
      } else {
        bar.innerHTML =
          lvBadge +
          '<div class="chip p1' + (turn === 0 ? " on" : "") + '">שחקן 1: ' + scores[0] + '</div>' +
          '<div class="chip p2' + (turn === 1 ? " on" : "") + '">שחקן 2: ' + scores[1] + '</div>' +
          resetBtn;
      }
      var btn = bar.querySelector("#memLevelsBtn");
      if (btn) btn.onclick = function () { pickLevel(container, players); };
    }
    paintBar();

    function finish() {
      G.sfx.win();
      G.confetti(mini || story ? 40 : 90);
      if (mini || story) { G.later(onDone, 1000); return; }

      var isLast = lv >= MEMORY_LEVELS.length - 1;
      var nextLv = isLast ? 0 : lv + 1;
      saveLevel(players, nextLv);

      var title, text = "";
      if (players === 1) {
        title = isLast ? "אלוף! סיימת את כל 10 השלבים! 🏆" : "כל הכבוד! עברת את שלב " + (lv + 1) + "!";
        text = isLast ? "מצאת את כל 40 הקלפים!" : "מוכן לשלב " + (nextLv + 1) + " (" + MEMORY_LEVELS[nextLv].label + ")?";
      } else if (scores[0] === scores[1]) {
        title = "תיקו!"; text = "שניכם מצאתם " + scores[0] + " זוגות.";
      } else {
        var w = scores[0] > scores[1] ? 1 : 2;
        title = "שחקן " + w + " ניצח!"; text = scores[0] + " מול " + scores[1];
      }

      G.later(function () {
        G.dialog({
          art: '<span style="font-size:90px">' + (isLast ? "👑" : "🏆") + '</span>',
          title: title,
          text: text,
          buttons: [
            { label: isLast ? "מההתחלה 🔄" : "שלב הבא ⬅️", onClick: function () { play(container, players, nextLv, false); } },
            { label: "שוב אותו שלב", cls: "alt", onClick: function () { play(container, players, lv, false); } },
            { label: "תפריט", cls: "alt", onClick: function () { G.go("home"); } }
          ]
        });
      }, 900);
    }

    cards.forEach(function (card, idx) {
      card.onclick = function () {
        if (lock || card.classList.contains("up") || card.classList.contains("done")) return;
        card.classList.add("up");
        G.sfx.flip();
        open.push(idx);
        if (open.length < 2) return;
        lock = true;
        var a = open[0], b = open[1];
        if (deck[a].id === deck[b].id) {
          G.later(function () {
            cards[a].classList.add("done"); cards[b].classList.add("done");
            G.sfx.match();
            scores[turn]++; found++;
            open = []; lock = false;
            paintBar();
            if (found === total) finish();
          }, 500);
        } else {
          G.later(function () {
            cards[a].classList.remove("up"); cards[b].classList.remove("up");
            open = []; lock = false;
            if (players === 2) turn = 1 - turn;
            paintBar();
          }, 1100);
        }
      };
    });
  }

  function pickLevel(container, players) {
    var current = loadLevel(players);
    var btns = MEMORY_LEVELS.map(function (spec, i) {
      var cls = i === current ? "btn" : "btn alt";
      return '<button class="' + cls + ' lv-btn" data-lv="' + i + '">שלב ' + (i + 1) + ' (' + (spec.c * spec.r) + ')</button>';
    }).join("");
    container.innerHTML =
      '<section class="menu">' +
        '<h2>בחרו שלב (' + (players === 1 ? "שחקן אחד" : "שני שחקנים") + ')</h2>' +
        '<div class="level-grid">' + btns + '</div>' +
      '</section>';
    container.querySelectorAll("[data-lv]").forEach(function (b) {
      b.onclick = function () {
        var chosen = +b.dataset.lv;
        saveLevel(players, chosen);
        play(container, players, chosen, false);
      };
    });
  }

  window.Memory = {
    start: function (container) {
      var lv1 = loadLevel(1) + 1;
      var lv2 = loadLevel(2) + 1;
      container.innerHTML =
        '<section class="menu"><h2>משחק זיכרון (10 שלבים)</h2><div class="menu-btns">' +
        '<button class="btn big" data-p="1">👤 שחקן אחד (שלב ' + lv1 + ')</button>' +
        '<button class="btn big alt" data-p="2">👥 שני שחקנים (שלב ' + lv2 + ')</button></div></section>';
      container.querySelectorAll("[data-p]").forEach(function (b) {
        b.onclick = function () {
          var p = +b.dataset.p;
          play(container, p, loadLevel(p), false);
        };
      });
    },
    mini: function (box, onDone) { play(box, 1, 1, true, onDone); },

    /* סיפור ראשי: p בין 0 ל-1 קובע את הקושי. 0 = שלב 1 (4 קלפים), 1 = שלב 10 (40 קלפים) */
    storyRound: function (box, p, onDone) {
      var q = Math.max(0, Math.min(1, +p || 0));
      var lv = Math.min(MEMORY_LEVELS.length - 1, Math.floor(q * MEMORY_LEVELS.length));
      play(box, 1, lv, false, onDone, true);
    }
  };
})();
