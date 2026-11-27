/* מסלול ההרפתקה: 20 שלבים, 5 לבבות לשלב, ושאלת בונוס כל 5 שאלות לקבלת עזרת גיבורי המשפחה */
(function () {
  G.story = function (modeKey, askFn) {
    var N = CONFIG.storySteps || 20;
    var MAX_HEARTS = CONFIG.maxHearts || 5;
    var BONUS_EVERY = CONFIG.bonusEvery || 5;
    var heroes = CONFIG.heroes;
    var familyList = CONFIG.familyHeroes || [];

    var saved = (G.store.load().progress || {})[modeKey] || {};
    var st = {
      hero: saved.hero || 0,
      step: saved.step || 0,
      hearts: typeof saved.hearts === "number" ? saved.hearts : MAX_HEARTS,
      helpers: Array.isArray(saved.helpers) ? saved.helpers.slice() : [],
      bonusPending: !!saved.bonusPending,
      lastBonusStep: typeof saved.lastBonusStep === "number" ? saved.lastBonusStep : -1
    };

    if (st.hero >= heroes.length) st.hero = 0;
    if (st.step >= N) st.step = 0;
    if (st.hearts <= 0 || st.hearts > MAX_HEARTS) st.hearts = MAX_HEARTS;

    /* אם המשתמש חזר למשחק שמור שכבר עבר את שלב 5 ועדיין לא קיבל בונוס בסיבוב הזה - מפעילים בונוס מיד */
    if (!st.bonusPending && st.step >= BONUS_EVERY && st.lastBonusStep < Math.floor(st.step / BONUS_EVERY) * BONUS_EVERY && familyList.length) {
      st.bonusPending = true;
      st.lastBonusStep = Math.floor(st.step / BONUS_EVERY) * BONUS_EVERY;
    }

    var fill, runner, stp, villain, captive, qbox, heartsBox, helpersBox, bannerBox;
    var qToken = 0;
    var busy = false;

    function save() {
      var a = G.store.load();
      a.progress = a.progress || {};
      a.progress[modeKey] = {
        hero: st.hero,
        step: st.step,
        hearts: st.hearts,
        helpers: st.helpers,
        bonusPending: st.bonusPending,
        lastBonusStep: st.lastBonusStep
      };
      G.store.save(a);
    }

    function build() {
      var h = heroes[st.hero];
      G.screen.innerHTML =
        '<section class="story">' +
          '<div class="track">' +
            '<div class="start">🧒</div>' +
            '<div class="barwrap">' +
              '<div class="steps"><b class="stp"></b><span>הצילו את ' + h.name + '</span></div>' +
              '<div class="bar"><div class="fill"></div><div class="runner">🏃</div></div>' +
              '<div class="hud-row">' +
                '<div class="hearts-bar" aria-label="חיים"></div>' +
                '<div class="helpers-bar" aria-label="עזרת המשפחה"></div>' +
              '</div>' +
            '</div>' +
            '<div class="foe">' +
              '<div class="villain">' + G.villainHTML() + '</div>' +
              '<div class="captive"><div class="cage"></div>' + G.charHTML(h) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="bonus-banner" hidden>✨ שאלת בונוס! ענו נכון ותקבלו עזרה מגיבורי המשפחה! ✨</div>' +
          '<div class="qbox"></div>' +
        '</section>';

      var s = G.screen;
      fill = s.querySelector(".fill");
      runner = s.querySelector(".runner");
      stp = s.querySelector(".stp");
      villain = s.querySelector(".villain");
      captive = s.querySelector(".captive");
      qbox = s.querySelector(".qbox");
      heartsBox = s.querySelector(".hearts-bar");
      helpersBox = s.querySelector(".helpers-bar");
      bannerBox = s.querySelector(".bonus-banner");
    }

    function renderHearts() {
      var html = "";
      for (var i = 0; i < MAX_HEARTS; i++) {
        var alive = i < st.hearts;
        html += '<span class="heart ' + (alive ? "alive" : "lost") + '">' + (alive ? "❤️" : "🖤") + '</span>';
      }
      heartsBox.innerHTML = html;
    }

    /* טוען פריים מהווידאו כדי שיוצג אייקון אמיתי גם בטאבלטים ובמובייל */
    function hydrateVideoThumb(videoEl, fallbackEl) {
      if (!videoEl) return;
      videoEl.addEventListener("loadeddata", function () {
        try {
          if (videoEl.duration && videoEl.duration > 0.4) {
            videoEl.currentTime = 0.4;
          }
        } catch (e) {}
      }, { once: true });

      videoEl.addEventListener("seeked", function () {
        videoEl.style.opacity = "1";
        if (fallbackEl) fallbackEl.style.display = "none";
      }, { once: true });

      videoEl.addEventListener("error", function () {
        videoEl.style.display = "none";
        if (fallbackEl) fallbackEl.style.display = "grid";
      }, { once: true });
    }

    function renderHelpers() {
      if (!st.helpers.length) {
        helpersBox.innerHTML = '<span class="helpers-empty">ענו על שאלת בונוס לעזרת המשפחה ⚡</span>';
        return;
      }
      helpersBox.innerHTML = st.helpers.map(function (id, idx) {
        var fh = familyList.find(function (x) { return x.id === id; });
        if (!fh) return "";
        var media = fh.type === "gif"
          ? '<img src="' + G.urlOf(fh.src) + '" alt="' + fh.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'">' +
            '<span class="thumb-fallback" style="display:none">' + fh.icon + '</span>'
          : '<video src="' + G.urlOf(fh.src) + '" muted playsinline webkit-playsinline preload="auto" style="opacity:0"></video>' +
            '<span class="thumb-fallback">' + fh.icon + '</span>';
        return (
          '<button type="button" class="helper-chip" data-idx="' + idx + '" title="' + fh.name + ' - ' + fh.title + '">' +
            '<span class="helper-thumb">' + media + '</span>' +
            '<span class="helper-name">' + fh.name + '</span>' +
          '</button>'
        );
      }).join("");

      helpersBox.querySelectorAll(".helper-chip").forEach(function (btn) {
        var vid = btn.querySelector("video");
        var fb = btn.querySelector(".thumb-fallback");
        if (vid) hydrateVideoThumb(vid, fb);

        btn.onclick = function () {
          if (busy || st.bonusPending) return;
          var idx = parseInt(btn.dataset.idx, 10);
          activateHelper(idx);
        };
      });
    }

    function update() {
      var p = (st.step / N) * 100;
      fill.style.width = p + "%";
      runner.style.right = p + "%";
      stp.textContent = st.bonusPending
        ? "⭐ שאלת בונוס! ⭐"
        : "שלב " + (st.step + 1) + " מתוך " + N;
      bannerBox.hidden = !st.bonusPending;
      qbox.classList.toggle("is-bonus", st.bonusPending);
      renderHearts();
      renderHelpers();
    }

    function playHeroCutscene(fh, onDone) {
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        ov.remove();
        onDone();
      }

      var mediaHTML = fh.type === "gif"
        ? '<img class="hero-media" src="' + G.urlOf(fh.src) + '" alt="' + fh.name + '">'
        : '<video class="hero-media" src="' + G.urlOf(fh.src) + '" autoplay playsinline webkit-playsinline preload="auto"></video>';

      var ov = G.el(
        '<div class="overlay hero-cutscene">' +
          mediaHTML +
          '<div class="hero-fallback-stage" hidden>' +
            '<div class="hero-fallback-ico">' + fh.icon + '</div>' +
          '</div>' +
          '<div class="hero-caption">' +
            '<div class="hero-caption-name">' + fh.icon + ' ' + fh.name + ' בא לעזרה!</div>' +
            '<div class="hero-caption-sub">' + fh.title + '</div>' +
          '</div>' +
          '<button type="button" class="btn small alt hero-skip">המשך ⏭️</button>' +
        '</div>'
      );

      ov.querySelector(".hero-skip").onclick = finish;
      document.body.appendChild(ov);

      var fbStage = ov.querySelector(".hero-fallback-stage");

      if (fh.type === "video") {
        var vid = ov.querySelector("video");
        vid.muted = !!G.muted;
        vid.onended = finish;
        vid.onerror = function () {
          vid.hidden = true;
          fbStage.hidden = false;
          G.speak(fh.name + ", " + fh.title + ", בא לעזור!");
          G.later(finish, 3500);
        };
        try { vid.load(); } catch (e) {}
        var playPromise = vid.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function () {
            /* אם הדפדפן חסם ניגון אוטומטי עם קול - מנגנים מושתק כדי שהווידאו יתנגן חלק */
            vid.muted = true;
            vid.play().catch(function () {
              vid.hidden = true;
              fbStage.hidden = false;
              G.later(finish, 3500);
            });
          });
        }
        G.later(finish, 11000);
      } else {
        var img = ov.querySelector("img");
        img.onerror = function () {
          img.hidden = true;
          fbStage.hidden = false;
        };
        G.speak(fh.name + ", " + fh.title + ", בא לעזור!");
        G.later(finish, 5500);
      }
    }

    function activateHelper(idx) {
      var id = st.helpers[idx];
      var fh = familyList.find(function (x) { return x.id === id; });
      if (!fh) return;

      busy = true;
      qToken++;
      G.clearTimers();
      try { speechSynthesis.cancel(); } catch (e) {}

      st.helpers.splice(idx, 1);
      save();
      renderHelpers();

      playHeroCutscene(fh, function () {
        busy = false;
        G.sfx.ok();
        advanceNormalStep();
      });
    }

    function advanceNormalStep() {
      st.step++;
      if (st.step >= N) {
        fill.style.width = "100%";
        runner.style.right = "100%";
        return win();
      }
      if (st.step > 0 && st.step % BONUS_EVERY === 0 && st.lastBonusStep !== st.step && familyList.length) {
        st.bonusPending = true;
        st.lastBonusStep = st.step;
      }
      save();
      next();
    }

    function failStage() {
      st.step = 0;
      st.hearts = MAX_HEARTS;
      st.bonusPending = false;
      st.lastBonusStep = -1;
      save();
      G.sfx.bad();
      G.dialog({
        art: G.villainHTML(),
        title: "אוי! נגמרו כל הלבבות 💔",
        text: "לא נורא גיבור! חוזרים לתחילת השלב עם 5 לבבות חדשים!",
        buttons: [{ label: "מתחילים מחדש! 💪", onClick: function () { next(); } }]
      });
    }

    function win() {
      var done = heroes[st.hero];
      var last = st.hero >= heroes.length - 1;
      st.hero = last ? 0 : st.hero + 1;
      st.step = 0;
      st.hearts = MAX_HEARTS;
      st.bonusPending = false;
      st.lastBonusStep = -1;
      save();
      stp.textContent = "ניצחנו!";
      G.sfx.win();
      villain.classList.add("beaten");
      captive.classList.add("free");
      G.confetti(90);
      G.later(function () {
        G.dialog({
          art: G.charHTML(done),
          title: "הצלת את " + done.name + "!",
          text: last ? "הצלת את כולם! מתחילים הרפתקה חדשה." : "מי הבא בתור להצלה? בוא נמשיך!",
          buttons: [{ label: "להמשיך", onClick: function () { build(); next(); } }]
        });
      }, 1300);
    }

    function handleBonusResult(ok) {
      st.bonusPending = false;
      if (ok && familyList.length) {
        var picked = G.pick(familyList);
        st.helpers.push(picked.id);
        save();
        G.sfx.win();
        G.confetti(60);
        var previewHTML = picked.type === "gif"
          ? '<img src="' + G.urlOf(picked.src) + '" alt="' + picked.name + '" style="height:100%;border-radius:18px;border:4px solid var(--ink);" onerror="this.outerHTML=\'<div style=font-size:90px>' + picked.icon + '</div>\'">'
          : '<video src="' + G.urlOf(picked.src) + '" autoplay loop muted playsinline webkit-playsinline style="height:100%;border-radius:18px;border:4px solid var(--ink);" onerror="this.outerHTML=\'<div style=font-size:90px>' + picked.icon + '</div>\'"></video>';

        G.dialog({
          art: previewHTML,
          title: "זכית בעזרה של " + picked.name + "! " + picked.icon,
          text: picked.title + " הצטרף אליך! לחץ על התמונה שלו למעלה בכל שאלה שתרצה עזרה.",
          buttons: [{ label: "איזה כיף! קדימה!", onClick: function () { next(); } }]
        });
      } else {
        save();
        G.dialog({
          art: '<div style="font-size:80px;line-height:1;">⭐</div>',
          title: "כמעט!",
          text: "לא זכית בעזרה הפעם, אבל הלבבות שלך נשמרו! ממשיכים במשחק.",
          buttons: [{ label: "ממשיכים", onClick: function () { next(); } }]
        });
      }
    }

    function next() {
      update();
      var token = ++qToken;
      var currentAsk = (st.bonusPending && G.mixAsk) ? G.mixAsk : askFn;

      currentAsk(qbox, st.step, function (ok, meta) {
        if (token !== qToken || busy) return;

        if (st.bonusPending) {
          return handleBonusResult(ok);
        }

        if (ok) {
          advanceNormalStep();
        } else {
          st.hearts = Math.max(0, st.hearts - 1);
          save();
          renderHearts();
          if (st.hearts <= 0) {
            failStage();
          } else if (meta && meta.advanceOnFail) {
            advanceNormalStep();
          } else {
            next();
          }
        }
      });
    }

    build();
    next();
  };
})();
