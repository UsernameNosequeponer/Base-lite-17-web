/* ========================================================
   Base Élite 17 - JavaScript compartido
   ======================================================== */

(function () {
  "use strict";

  /* ---------- i18n ENGINE ---------- */
  var SUPPORTED = ["es", "ca", "en"];
  var currentLang = "es";

  function detectLang() {
    var stored = localStorage.getItem("be17-lang");
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    var browser = (navigator.language || navigator.userLanguage || "es").slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(browser) !== -1 ? browser : "es";
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    currentLang = lang;
    localStorage.setItem("be17-lang", lang);
    document.documentElement.setAttribute("lang", lang);

    var dict = window.I18N && I18N[lang] ? I18N[lang] : null;
    if (!dict) return;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (dict[key] !== undefined) {
        el.setAttribute("aria-label", dict[key]);
      }
    });

    var titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) {
      var titleKey = titleEl.getAttribute("data-i18n");
      if (dict[titleKey] !== undefined) {
        document.title = dict[titleKey];
      }
    }

    var langBtn = document.querySelector(".lang-current");
    if (langBtn) langBtn.textContent = lang.toUpperCase();

    document.querySelectorAll(".lang-list li").forEach(function (li) {
      li.classList.toggle("lang-active", li.getAttribute("data-lang") === lang);
    });
  }

  function initI18n() {
    if (!window.I18N) return;
    currentLang = detectLang();
    setLang(currentLang);

    var langBtn = document.querySelector(".lang-btn");
    var langList = document.querySelector(".lang-list");
    if (!langBtn || !langList) return;

    langBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = langList.classList.toggle("abierto");
      langBtn.setAttribute("aria-expanded", open);
    });

    langList.querySelectorAll("li").forEach(function (li) {
      li.addEventListener("click", function () {
        var lang = this.getAttribute("data-lang");
        setLang(lang);
        langList.classList.remove("abierto");
        langBtn.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", function () {
      langList.classList.remove("abierto");
      langBtn.setAttribute("aria-expanded", "false");
    });

    langList.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  initI18n();

  /* ---------- MENÚ MÓVIL ---------- */
  var menuBoton = document.querySelector(".menu-boton");
  if (menuBoton) {
    menuBoton.addEventListener("click", function () {
      var nav = document.querySelector("nav");
      var abierto = nav.classList.toggle("abierto");
      menuBoton.setAttribute("aria-expanded", abierto);
      menuBoton.textContent = abierto ? "\u2715" : "\u2630";
    });
  }

  /* ---------- MODALES ---------- */
  function abrirModal(modal) {
    if (!modal) return;
    modal._triggerElement = document.activeElement;
    modal.classList.add("activo");
    document.body.style.overflow = "hidden";
    var primero = modal.querySelector(
      ".modal-cerrar, button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    if (primero) primero.focus();
  }

  function cerrarModal(modal) {
    if (!modal) return;
    modal.classList.remove("activo");
    document.body.style.overflow = "";
    if (modal._triggerElement) modal._triggerElement.focus();
  }

  document.querySelectorAll(".servicio-card").forEach(function (card) {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    var label = card.querySelector("h3");
    if (label) card.setAttribute("aria-label", label.textContent.trim());
    card.addEventListener("click", function () {
      var id = this.getAttribute("data-modal");
      var modal = document.getElementById(id);
      if (!modal) return;
      var img = this.querySelector(".servicio-imagen img");
      if (img) {
        modal.style.backgroundImage =
          "linear-gradient(rgba(0,0,0,0.75),rgba(0,0,0,0.75)),url('" +
          img.getAttribute("src") +
          "')";
      }
      abrirModal(modal);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }
    });
  });

  document.querySelectorAll(".modal-cerrar").forEach(function (btn) {
    btn.addEventListener("click", function () {
      cerrarModal(this.closest(".modal-overlay"));
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === this) cerrarModal(this);
    });
  });

  /* Escape cierra modales */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var langListOpen = document.querySelector(".lang-list.abierto");
      if (langListOpen) {
        langListOpen.classList.remove("abierto");
        var langBtnEsc = document.querySelector(".lang-btn");
        if (langBtnEsc) langBtnEsc.setAttribute("aria-expanded", "false");
        return;
      }
      var abierto = document.querySelector(".modal-overlay.activo");
      if (abierto) cerrarModal(abierto);
    }
  });

  /* Focus trap dentro del modal */
  document.querySelectorAll(".modal-overlay").forEach(function (modal) {
    modal.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var focusables = this.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var primero = focusables[0];
      var ultimo = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        }
      } else {
        if (document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    });
  });

  /* ---------- CARRUSEL 3D COVERFLOW ---------- */
  (function () {
    var cards = document.querySelectorAll(".card-3d");
    var prevBtn = document.querySelector(".btn-3d-prev");
    var nextBtn = document.querySelector(".btn-3d-next");
    if (!cards.length || !prevBtn || !nextBtn) return;

    var total = cards.length;
    var currentIndex = 0;

    function getConfig() {
      if (window.innerWidth >= 960)
        return { offsets: [320, 540], rotations: [10, 20], scales: [0.85, 0.58] };
      if (window.innerWidth >= 600)
        return { offsets: [250, 420], rotations: [10, 18], scales: [0.82, 0.55] };
      return { offsets: [200, 340], rotations: [8, 16], scales: [0.78, 0.5] };
    }

    function setPosition(index, animate) {
      var cfg = getConfig();
      for (var i = 0; i < total; i++) {
        var card = cards[i];

        if (animate) {
          card.style.transition = "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s ease";
        } else {
          card.style.transition = "none";
        }

        var rawDist = i - index;
        var dist = rawDist;
        if (dist >= total / 2) dist -= total;
        if (dist < -total / 2) dist += total;

        if (dist === 0) {
          card.style.transform = "scale(1) rotateY(0deg) translateX(0)";
          card.style.opacity = "1";
          card.style.zIndex = "20";
        } else {
          var dir = dist > 0 ? 1 : -1;
          var absDist = Math.abs(dist);
          var idx = Math.min(absDist, cfg.offsets.length) - 1;
          var x = dir * cfg.offsets[idx];
          var rotate = dir * cfg.rotations[idx];
          var scale = cfg.scales[idx];
          card.style.transform =
            "scale(" + scale + ") rotateY(" + rotate + "deg) translateX(" + x + "px)";
          card.style.opacity = absDist <= 2 ? "1" : "0.1";
          card.style.zIndex = String(Math.max(20 - absDist * 6, 1));
        }
      }
    }

    nextBtn.addEventListener("click", function () {
      currentIndex++;
      if (currentIndex >= total) currentIndex = 0;
      setPosition(currentIndex, true);
    });

    prevBtn.addEventListener("click", function () {
      currentIndex--;
      if (currentIndex < 0) currentIndex = total - 1;
      setPosition(currentIndex, true);
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { setPosition(currentIndex, false); }, 100);
    });

    setPosition(0, false);
  })();
})();
