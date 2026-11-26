(function () {
  var posterCache = {};

  function loadPlayerPoster(player, imgEl) {
    if (posterCache[player.src]) { imgEl.src = posterCache[player.src]; return; }
    var url = G.urlOf(player.src);
    if (/\.gif$/i.test(player.src)) { posterCache[player.src] = url; imgEl.src = url; return; }
    var v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    v.addEventListener("loadeddata", function () { try { v.currentTime = Math.min(0.5, (v.duration || 1) * 0.25); } catch (e) {} }, { once: true });
    v.addEventListener("seeked", function () {
      try {
        var c = document.createElement("canvas"); c.width = v.videoWidth || 300; c.height = v.videoHeight || 400;
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        var dataUrl = c.toDataURL("image/jpeg", 0.85); posterCache[player.src] = dataUrl; imgEl.src = dataUrl;
      } catch (e) {}
    }, { once: true });
  }

  function hydrateVideoThumb(videoEl, fallbackEl) {
    if (!videoEl) return;
    videoEl.addEventListener("loadeddata", function () {
      try { if (videoEl.duration && videoEl.duration > 0.4) videoEl.currentTime = 0.4; } catch (e) {}
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

  function selectMode() {
    G.screen.innerHTML =
      '<section class="menu"><h2>סיפור ראשי: מצילים את החיות! 🐾</h2><div class="menu-btns">' +
      '<button class="btn big" id="msSingle">🦸 שחקן יחיד</button>' +
      '<button class="btn big alt" id="msTeam">🦸‍♂️🦸‍♀️ עבודת צוות</button></div></section>';
    G.screen.querySelector("#msSingle").onclick = function () { selectPlayers("single"); };
    G.screen.querySelector("#msTeam").onclick = function () { selectPlayers("team"); };
  }

  function selectPlayers(mode) {
    var players = CONFIG.mainStoryPlayers || [], selected = {};
    G.screen.innerHTML =
      '<section class="ms-select"><h2>' + (mode === "single" ? "בחרו גיבור אחד" : "בחרו את גיבורי הצוות") + '</h2>' +
      '<div class="ms-grid">' + players.map(function (p) {
        return '<button type="button" class="ms-card" data-id="' + p.id + '"><div class="ms-avatar"><img alt="' + p.name + '" data-pid="' + p.id + '"><span class="ms-ico-fb">' + p.icon + '</span></div><div class="ms-name">' + p.name + '</div></button>';
      }).join("") + '</div><div class="menu-btns">' +
      (mode === "team" ? '<button type="button" class="btn alt" id="msSelectAll">✨ בחר את כולם</button>' : '') +
      '<button type="button" class="btn big" id="msStartStory" disabled>התחילו את הסיפור! ▶️</button></div></section>';

    players.forEach(function (p) {
      var img = G.screen.querySelector('img[data-pid="' + p.id + '"]');
      if (img) { img.onload = function () { img.classList.add("ready"); }; loadPlayerPoster(p, img); }
    });

    var startBtn = G.screen.querySelector("#msStartStory");
    function refreshCards() {
      var count = 0;
      G.screen.querySelectorAll(".ms-card").forEach(function (card) {
        var on = !!selected[card.dataset.id]; card.classList.toggle("on", on); if (on) count++;
      });
      startBtn.disabled = count === 0;
    }
    G.screen.querySelectorAll(".ms-card").forEach(function (card) {
      card.onclick = function () {
        var id = card.dataset.id;
        if (mode === "single") { selected = {}; selected[id] = true; } else { selected[id] = !selected[id]; }
        refreshCards();
      };
    });
    var allBtn = G.screen.querySelector("#msSelectAll");
    if (allBtn) allBtn.onclick = function () { players.forEach(function (p) { selected[p.id] = true; }); refreshCards(); };
    startBtn.onclick = function () { var chosen = players.filter(function (p) { return selected[p.id]; }); if (chosen.length) playIntroStoryboard(chosen); };
  }

  function playIntroStoryboard(chosenPlayers) {
    var art = CONFIG.mainStoryArt, slides = art.intro.slice(), idx = 0, autoTimer = null;
    function renderSlide() {
      clearTimeout(autoTimer);
      if (idx < slides.length) {
        var s = slides[idx];
        G.screen.innerHTML =
          '<section class="sb-stage"><div class="sb-frame"><img class="sb-img ken-burns" src="' + G.urlOf(s.img) + '" alt=""><div class="sb-caption">' + s.text + '</div></div>' +
          '<div class="sb-controls"><button type="button" class="btn small alt" id="sbSkip">דלג למשחק ⏭️</button><span class="sb-dots">' + (idx + 1) + ' / ' + (slides.length + 1) + '</span><button type="button" class="btn small" id="sbNext">הבא ⬅️</button></div></section>';
        G.screen.querySelector("#sbNext").onclick = function () { idx++; renderSlide(); };
        G.screen.querySelector("#sbSkip").onclick = function () { startStage(chosenPlayers, 0, []); };
        autoTimer = G.later(function () { idx++; renderSlide(); }, 3600);
      } else {
        G.screen.innerHTML =
          '<section class="sb-stage"><div class="sb-frame"><img class="sb-img" src="' + G.urlOf(art.heroHill) + '" alt="">' +
          '<div class="sb-bubble">קדימה להציל את החיות! 🐾⚡</div><div class="sb-heroes-line">' +
          chosenPlayers.map(function (p) { return '<div class="sb-hero-badge"><img data-pid="' + p.id + '" alt="' + p.name + '"><span>' + p.name + '</span></div>'; }).join("") +
          '</div></div><div class="sb-controls"><button type="button" class="btn big" id="sbPlayNow">יוצאים למשימה! 🚀</button></div></section>';
        chosenPlayers.forEach(function (p) { var img = G.screen.querySelector('img[data-pid="' + p.id + '"]'); if (img) loadPlayerPoster(p, img); });
        G.sfx.win();
        G.screen.querySelector("#sbPlayNow").onclick = function () { startStage(chosenPlayers, 0, []); };
      }
    }
    renderSlide();
  }

  function playStageTransition(chosenPlayers, stageIdx, carriedHelpers) {
    var stages = CONFIG.mainStoryArt.stages || [];
    var stageSpec = stages[stageIdx];
    var slides = (stageSpec && stageSpec.transitionIntro) ? stageSpec.transitionIntro.slice() : [];
    if (!slides.length) {
      return startStage(chosenPlayers, stageIdx, carriedHelpers);
    }
    var idx = 0, autoTimer = null;
    function renderSlide() {
      clearTimeout(autoTimer);
      if (idx < slides.length) {
        var s = slides[idx];
        G.screen.innerHTML =
          '<section class="sb-stage"><div class="sb-frame"><img class="sb-img ken-burns" src="' + G.urlOf(s.img) + '" alt=""><div class="sb-caption">' + s.text + '</div></div>' +
          '<div class="sb-controls"><button type="button" class="btn small alt" id="sbSkip">דלג לשלב ' + (stageIdx + 1) + ' ⏭️</button><span class="sb-dots">' + (idx + 1) + ' / ' + slides.length + '</span><button type="button" class="btn small" id="sbNext">' + (idx === slides.length - 1 ? "התחל שלב " + (stageIdx + 1) + " 🚀" : "הבא ⬅️") + '</button></div></section>';
        G.screen.querySelector("#sbNext").onclick = function () {
          idx++;
          if (idx >= slides.length) startStage(chosenPlayers, stageIdx, carriedHelpers);
          else renderSlide();
        };
        G.screen.querySelector("#sbSkip").onclick = function () { startStage(chosenPlayers, stageIdx, carriedHelpers); };
        autoTimer = G.later(function () {
          idx++;
          if (idx >= slides.length) startStage(chosenPlayers, stageIdx, carriedHelpers);
          else renderSlide();
        }, 3800);
      }
    }
    renderSlide();
  }

  var STORY_GAMES = ["letters", "rhyme", "numbers", "moreless", "memory", "odd", "opposites", "puzzle", "simon", "maze"];
  var lastKind = null;

  /* קושי עולה לאורך כל הסיפור: 0 = השאלה הראשונה בשלב 1, 1 = השאלה האחרונה בשלב האחרון.
     לפי זה נקבעים: מספר קלפי הזיכרון, מספר חלקי הפאזל, אורך רצף סיימון וגודל המבוך */
  function storyProgress(step, stageIdx) {
    var N = CONFIG.storySteps || 20;
    var stagesCount = Math.max(1, ((CONFIG.mainStoryArt || {}).stages || []).length);
    var total = Math.max(1, stagesCount * N - 1);
    return Math.max(0, Math.min(1, ((stageIdx || 0) * N + step) / total));
  }

  function askStoryMiniGame(box, step, stageIdx, cb) {
    var p = storyProgress(step, stageIdx);
    var kind;
    do { kind = G.pick(STORY_GAMES); } while (kind === lastKind);
    lastKind = kind;
    if (kind === "letters")   return Letters.ask(box, step, cb);
    if (kind === "rhyme")     return Rhyme.ask(box, step, cb);
    if (kind === "numbers")   return Numbers.ask(box, step, cb);
    if (kind === "moreless")  return MoreLess.ask(box, step, cb);
    if (kind === "odd")       return Odd.ask(box, step, cb);
    if (kind === "opposites") return Opposites.ask(box, step, cb);
    if (kind === "memory")    return Memory.storyRound(box, p, function () { cb(true); });
    if (kind === "puzzle")    return Puzzle.storyRound(box, p, function () { cb(true); });
    if (kind === "simon")     return Simon.storyRound(box, p, cb);
    return Maze.storyRound(box, p, function () { cb(true); });
  }

  function startStage(chosenPlayers, stageIdx, initialHelpers) {
    var art = CONFIG.mainStoryArt;
    var stages = art.stages || [];
    var stageSpec = stages[stageIdx] || stages[0];
    var isLastStage = stageIdx >= stages.length - 1;

    var N = CONFIG.storySteps || 20;
    var MAX_HEARTS = CONFIG.maxHearts || 5;
    var BONUS_EVERY = CONFIG.bonusEvery || 5;
    var familyList = CONFIG.familyHeroes || [];

    var step = 0;
    var hearts = MAX_HEARTS;
    var helpers = Array.isArray(initialHelpers) ? initialHelpers.slice() : [];
    var bonusPending = false;
    var lastBonusStep = -1;
    var qToken = 0;
    var busy = false;

    var origSpeak = G.speak;
    G.speak = function () {};
    G.cleanup = function () { G.speak = origSpeak; };

    G.screen.innerHTML =
      '<section class="story">' +
        '<div class="track">' +
          '<div class="start ms-runner-avatar"><img id="msStartImg" alt=""></div>' +
          '<div class="barwrap">' +
            '<div class="steps"><b class="stp"></b><span>שלב ' + (stageIdx + 1) + ': הצילו את ' + stageSpec.animalName + '! ' + stageSpec.animalEmoji + '</span></div>' +
            '<div class="bar"><div class="fill"></div><div class="runner">🏃</div></div>' +
            '<div class="hud-row">' +
              '<div class="hearts-bar" aria-label="חיים"></div>' +
              '<div class="helpers-bar" aria-label="עזרת המשפחה"></div>' +
            '</div>' +
          '</div>' +
          '<div class="foe ms-foe-mini">' +
            '<img class="ms-mini-villain" src="' + G.urlOf(stageSpec.foeImg) + '" alt="מיקונוס ו' + stageSpec.animalName + ' בכלוב">' +
          '</div>' +
        '</div>' +
        '<div class="bonus-banner" hidden>✨ שאלת בונוס! ענו נכון ותקבלו עזרה מגיבור על! ✨</div>' +
        '<div class="qbox"></div>' +
      '</section>';

    var s = G.screen;
    var fill = s.querySelector(".fill");
    var runner = s.querySelector(".runner");
    var stp = s.querySelector(".stp");
    var heartsBox = s.querySelector(".hearts-bar");
    var helpersBox = s.querySelector(".helpers-bar");
    var bannerBox = s.querySelector(".bonus-banner");
    var qbox = s.querySelector(".qbox");
    loadPlayerPoster(chosenPlayers[0], s.querySelector("#msStartImg"));

    function renderHearts() {
      var html = "";
      for (var i = 0; i < MAX_HEARTS; i++) {
        html += '<span class="heart ' + (i < hearts ? "alive" : "lost") + '">' + (i < hearts ? "❤️" : "🖤") + '</span>';
      }
      heartsBox.innerHTML = html;
    }

    function renderHelpers() {
      if (!helpers.length) {
        helpersBox.innerHTML = '<span class="helpers-empty">כל 5 שאלות: בונוס גיבור על ⚡ (' + chosenPlayers.map(function (p) { return p.name; }).join(", ") + ')</span>';
        return;
      }
      helpersBox.innerHTML = helpers.map(function (id, idx) {
        var fh = familyList.find(function (x) { return x.id === id; });
        if (!fh) return "";
        var media = fh.type === "gif"
          ? '<img src="' + G.urlOf(fh.src) + '" alt="' + fh.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'">' +
            '<span class="thumb-fallback" style="display:none">' + fh.icon + '</span>'
          : '<video src="' + G.urlOf(fh.src) + '" muted playsinline webkit-playsinline preload="auto" style="opacity:0"></video>' +
            '<span class="thumb-fallback">' + fh.icon + '</span>';
        return (
          '<button type="button" class="helper-chip" data-idx="' + idx + '" title="לחץ לפטור מהשאלה עם ' + fh.name + '">' +
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
          if (busy || bonusPending) return;
          var idx = parseInt(btn.dataset.idx, 10);
          activateHelper(idx);
        };
      });
    }

    function updateHUD() {
      var p = (step / N) * 100;
      fill.style.width = p + "%";
      runner.style.right = p + "%";
      stp.textContent = bonusPending ? "⭐ שאלת בונוס! ⭐" : "שאלה " + (step + 1) + " מתוך " + N;
      bannerBox.hidden = !bonusPending;
      qbox.classList.toggle("is-bonus", bonusPending);
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
          '<div class="hero-fallback-stage" hidden><div class="hero-fallback-ico">' + fh.icon + '</div></div>' +
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
        vid.controls = true;
        vid.muted = !!G.muted;
        vid.onended = finish;
        vid.onerror = function () {
          vid.style.display = "none";
          fbStage.hidden = false;
          G.later(finish, 3500);
        };
        vid.addEventListener("loadeddata", function () {
          vid.style.display = "block";
          fbStage.hidden = true;
        }, { once: true });
        try { vid.load(); } catch (e) {}
        var playPromise = vid.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function () {
            vid.muted = true;
            vid.play().catch(function () {
              vid.style.display = "none";
              fbStage.hidden = false;
              G.later(finish, 3500);
            });
          });
        }
        G.later(finish, 15000);
      } else {
        var img = ov.querySelector("img");
        img.onerror = function () { img.hidden = true; fbStage.hidden = false; };
        G.later(finish, 5500);
      }
    }

    function activateHelper(idx) {
      var id = helpers[idx];
      var fh = familyList.find(function (x) { return x.id === id; });
      if (!fh) return;

      busy = true;
      qToken++;
      G.clearTimers();

      helpers.splice(idx, 1);
      renderHelpers();

      playHeroCutscene(fh, function () {
        busy = false;
        G.sfx.ok();
        advanceNormalStep();
      });
    }

    function advanceNormalStep() {
      step++;
      if (step >= N) {
        fill.style.width = "100%";
        runner.style.right = "100%";
        return showWinScreen();
      }
      if (step > 0 && step % BONUS_EVERY === 0 && lastBonusStep !== step && familyList.length) {
        bonusPending = true;
        lastBonusStep = step;
      }
      nextStep();
    }

    function handleBonusResult(ok) {
      bonusPending = false;
      if (ok && familyList.length) {
        var picked = G.pick(familyList);
        helpers.push(picked.id);
        G.sfx.win();
        G.confetti(60);
        var previewHTML = picked.type === "gif"
          ? '<img src="' + G.urlOf(picked.src) + '" alt="' + picked.name + '" style="height:100%;border-radius:18px;border:4px solid var(--ink);" onerror="this.outerHTML=\'<div style=font-size:90px>' + picked.icon + '</div>\'">'
          : '<video src="' + G.urlOf(picked.src) + '" autoplay loop muted playsinline webkit-playsinline style="height:100%;border-radius:18px;border:4px solid var(--ink);" onerror="this.outerHTML=\'<div style=font-size:90px>' + picked.icon + '</div>\'"></video>';

        G.dialog({
          art: previewHTML,
          title: "זכית בעזרה של " + picked.name + "! " + picked.icon,
          text: picked.title + " הצטרף אליך! לחץ על התמונה שלו למעלה בכל שאלה כדי לקבל פטור.",
          buttons: [{ label: "איזה כיף! קדימה!", onClick: function () { nextStep(); } }]
        });
      } else {
        G.dialog({
          art: '<div style="font-size:80px;line-height:1;">⭐</div>',
          title: "כמעט!",
          text: "לא זכית בעזרה הפעם, אבל הלבבות שלך נשמרו! ממשיכים במשחק.",
          buttons: [{ label: "ממשיכים", onClick: function () { nextStep(); } }]
        });
      }
    }

    function showLoseScreen() {
      G.sfx.bad();
      G.screen.innerHTML =
        '<section class="sb-stage"><div class="sb-frame"><img class="sb-img" src="' + G.urlOf(art.loseLaugh) + '" alt=""><div class="sb-caption">אוי לא! מיקונוס ניצח הפעם... אל תוותרו!</div></div>' +
        '<div class="sb-controls"><button type="button" class="btn big" id="msRetry">🔄 נסו שוב</button><button type="button" class="btn big alt" id="msHome">🏠 מסך ראשי</button></div></section>';
      G.screen.querySelector("#msRetry").onclick = function () { startStage(chosenPlayers, stageIdx, []); };
      G.screen.querySelector("#msHome").onclick = function () { G.go("home"); };
    }

    function showWinScreen() {
      G.sfx.win(); G.confetti(100);
      G.screen.innerHTML =
        '<section class="sb-stage"><div class="sb-frame"><img class="sb-img" src="' + G.urlOf(art.winCry) + '" alt=""><div class="sb-caption">מיקונוס הפסיד! הכלוב נפתח! 🎉</div></div>' +
        '<div class="sb-controls"><button type="button" class="btn big" id="msToHill">לראות את ' + stageSpec.animalName + ' המשוחרר ' + stageSpec.animalEmoji + '⬅️</button></div></section>';

      function goHill() {
        G.confetti(120);
        var animalsLine = isLastStage
          ? '<div class="sb-animals-line">' +
              stages.map(function (st) {
                return '<div class="sb-animal-chip"><span>' + st.animalEmoji + '</span><b>' + st.animalName + '</b></div>';
              }).join("") +
            '</div>'
          : '';
        var finalBubble = isLastStage
          ? stageSpec.winBubble
          : stageSpec.winBubble;

        var controlsHTML = isLastStage
          ? '<button type="button" class="btn big" id="msWinHome">🏠 מסך ראשי</button>'
          : '<button type="button" class="btn big" id="msNextStage">לשלב הבא! (שלב ' + (stageIdx + 2) + ') ⬅️</button><button type="button" class="btn big alt" id="msWinHome">🏠 מסך ראשי</button>';

        G.screen.innerHTML =
          '<section class="sb-stage"><div class="sb-frame"><img class="sb-img" src="' + G.urlOf(stageSpec.winHillImg) + '" alt="">' +
          '<div class="sb-bubble">' + finalBubble + '</div>' +
          animalsLine +
          '<div class="sb-heroes-line">' +
          chosenPlayers.map(function (p) { return '<div class="sb-hero-badge"><img data-pid="' + p.id + '" alt="' + p.name + '"><span>' + p.name + '</span></div>'; }).join("") +
          '</div></div><div class="sb-controls">' + controlsHTML + '</div></section>';

        chosenPlayers.forEach(function (p) {
          var img = G.screen.querySelector('img[data-pid="' + p.id + '"]');
          if (img) loadPlayerPoster(p, img);
        });

        var nextBtn = G.screen.querySelector("#msNextStage");
        if (nextBtn) {
          nextBtn.onclick = function () {
            playStageTransition(chosenPlayers, stageIdx + 1, helpers);
          };
        }
        G.screen.querySelector("#msWinHome").onclick = function () { G.go("home"); };
      }

      G.screen.querySelector("#msToHill").onclick = goHill;
      G.later(goHill, 4200);
    }

    function nextStep() {
      updateHUD();
      var token = ++qToken;
      askStoryMiniGame(qbox, step, stageIdx, function (ok) {
        if (token !== qToken || busy) return;
        if (bonusPending) return handleBonusResult(ok);
        if (ok) {
          advanceNormalStep();
        } else {
          hearts = Math.max(0, hearts - 1);
          renderHearts();
          if (hearts <= 0) showLoseScreen();
          else nextStep();
        }
      });
    }

    nextStep();
  }

  window.MainStory = { start: selectMode, _progress: storyProgress };
})();
