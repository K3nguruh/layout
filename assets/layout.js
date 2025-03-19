/**
 * jQuery Widget für responsives Navigations-Management.
 *
 * Das Widget implementiert ein responsives Navigationssystem, das automatisch
 * zwischen mobilen und Desktop-Darstellungen wechselt. Es verwaltet die Navigation
 * und passt deren Sichtbarkeit und Verhalten dynamisch an verschiedene Bildschirmgrößen an.
 *
 * Das Widget bietet folgende Kernfunktionalitäten:
 * - Automatischer Wechsel zwischen mobilem und Desktop-Layout basierend auf einem konfigurierbaren Breakpoint
 * - Toggle-Mechanismus für die mobile Navigation mit animiertem Ein- und Ausblenden
 * - Overlay-System für verbesserte Benutzerfreundlichkeit auf mobilen Geräten
 * - Sidebar-Modus für spezielle Verwaltungsoberflächen
 * - Automatische Anpassung der DOM-Struktur durch Hinzufügen/Entfernen von CSS-Klassen
 *
 * Das Widget reagiert automatisch auf Größenänderungen des Fensters und passt
 * das Layout entsprechend an, ohne dass eine manuelle Neuinitialisierung erforderlich ist.
 * Alle Layout-Elemente werden über CSS-Klassen gesteuert, was eine einfache Anpassung
 * des visuellen Erscheinungsbilds durch CSS ermöglicht.
 *
 *
 * Autor:   K3nguruh <https://github.com/K3nguruh>
 * Version: 1.0.1
 * Datum:   2025-03-19
 * Lizenz:  MIT-Lizenz
 */
(function ($) {
  $.widget("custom.layout", {
    /**
     * Optionen für das Widget
     *
     * Diese Optionen definieren die wichtigsten Parameter des Widgets, wie Breakpoint, Animationsgeschwindigkeit und
     * CSS-Klassen für verschiedene Layout-Zustände. Sie können durch das Daten-Attribut `data-plugin` oder explizit
     * beim Initialisieren gesetzt werden.
     *
     * @typedef {Object} LayoutOptions
     * @property {boolean} sidebar - Aktiviert/Deaktiviert die Sidebar-Funktionalität (Standard: false)
     * @property {number} breakpoint - Breakpoint für den Wechsel zwischen Desktop und Mobile (Standard: 1200)
     * @property {number} width - Breite der Navigation im mobilen und Sidebar-Modus in Pixeln (Standard: 300)
     * @property {number} duration - Animationsdauer in Millisekunden (Standard: 300)
     * @property {string} easing - Easing-Funktion für Animationen (Standard: "linear")
     * @property {string} navbtn - Selector für den Navigation-Toggle-Button (Standard: "#navbtn")
     * @property {string} navbar - Selector für die Navigationsleiste (Standard: "#navbar")
     * @property {string} overlay - Selector für das Overlay-Element (Standard: "#overlay")
     * @property {Object} classes - CSS-Klassen für verschiedene Layout-Zustände
     * @property {string} classes.desktop - Klasse für Desktop-Layout (Standard: "layout-desktop")
     * @property {string} classes.mobile - Klasse für Mobile-Layout (Standard: "layout-mobile")
     * @property {string} classes.sidebar - Klasse für Sidebar-Layout (Standard: "layout-sidebar")
     * @property {string} classes.active - Klasse für aktiven Navigations-Button (Standard: "active")
     */
    options: {
      sidebar: false,
      breakpoint: 1200,
      width: 300,
      duration: 300,
      easing: "linear",
      navbtn: "#navbtn",
      navbar: "#navbar",
      overlay: "#overlay",
      classes: {
        desktop: "layout-desktop",
        mobile: "layout-mobile",
        sidebar: "layout-sidebar",
        active: "active",
      },
    },

    /**
     * Wird beim Erstellen des Widgets aufgerufen.
     * Initialisiert alle notwendigen Eigenschaften und bereitet das Widget für die Verwendung vor.
     *
     * Diese Methode führt folgende Schritte aus:
     * 1. Zusammenführung der Standard-Optionen mit benutzerdefinierten Daten-Attributen
     * 2. Zwischenspeicherung häufig verwendeter jQuery-Objekte für bessere Performance
     * 3. Aufruf der Event-Bindung
     *
     * @private
     * @return {void}
     */
    _create: function () {
      this.options = $.extend(true, {}, this.options, this.element.data());

      this.$window = $(window);
      this.$layout = $(this.element);
      this.$navbtn = $(this.options.navbtn);
      this.$navbar = $(this.options.navbar);
      this.$overlay = $(this.options.overlay);

      this._initEvents();
    },

    /**
     * Bindet alle erforderlichen Event-Handler für das Widget.
     *
     * Diese Methode registriert folgende Event-Handler:
     * - 'resize' auf dem Fenster-Objekt: Passt das Layout bei Größenänderungen an
     * - 'click' auf dem Navigationsbutton: Schaltet die Navigation ein/aus
     * - 'click' auf dem Overlay: Schließt die Navigation im mobilen Modus
     *
     * Die Event-Bindung verwendet die jQuery UI _on-Methode, um eine saubere Trennung
     * zu gewährleisten und automatische Event-Bereinigung beim Zerstören des Widgets zu ermöglichen.
     *
     * @private
     * @return {void}
     */
    _initEvents: function () {
      this._on(this.$window, { "resize": "_onResize" });
      this._on(this.$navbtn, { "click": "_onToggle" });
      this._on(this.$overlay, { "click": "_onToggle" });

      this._resize();
    },

    /**
     * Event-Handler für das Resize-Ereignis des Browserfensters.
     *
     * Implementiert eine Optimierung mit requestAnimationFrame, um zu häufige Ausführungen
     * bei schnellen Größenänderungen zu verhindern. Dies stellt sicher, dass die Anpassungen
     * synchron mit dem Bildschirm-Rendering ablaufen und die Performance verbessert wird.
     *
     * @private
     * @param {Event} event - Das Resize-Event
     * @return {void}
     */
    _onResize: function (event) {
      if (this.resizeAnimationFrame) cancelAnimationFrame(this.resizeAnimationFrame);
      this.resizeAnimationFrame = requestAnimationFrame(() => this._resize());
    },

    /**
     * Event-Handler für das Ein- und Ausblenden der Navigation.
     *
     * Wird durch Klicks auf den Navigationsbutton oder das Overlay ausgelöst.
     * Ruft basierend auf dem aktuellen Zustand der Navigation entweder _open oder _close auf.
     *
     * @private
     * @param {Event} event - Das Click-Event
     * @return {void}
     */
    _onToggle: function (event) {
      this[this.isShown ? "_close" : "_open"]();
    },

    /**
     * Öffnet die mobile Navigation.
     *
     * Diese Methode:
     * 1. Markiert den Navigationsbutton als aktiv
     * 2. Animiert die Navigationsleiste zur sichtbaren Position
     * 3. Blendet das Overlay ein
     *
     * @private
     * @return {void}
     */
    _open: function () {
      this.isShown = true;

      this.$navbtn.addClass(this.options.classes.active);
      this.$navbar.stop().animate({ left: 0 }, this.options.duration, this.options.easing);
      this.$overlay.stop().fadeIn(this.options.duration, this.options.easing);
    },

    /**
     * Schließt die mobile Navigation.
     *
     * Diese Methode:
     * 1. Entfernt die aktiv-Markierung vom Navigationsbutton
     * 2. Animiert die Navigationsleiste zurück zur ausgeblendeten Position
     * 3. Blendet das Overlay aus
     *
     * @private
     * @return {void}
     */
    _close: function () {
      this.isShown = false;

      this.$navbtn.removeClass(this.options.classes.active);
      this.$navbar.stop().animate({ left: -this.options.width }, this.options.duration, this.options.easing);
      this.$overlay.stop().fadeOut(this.options.duration, this.options.easing);
    },

    /**
     * Passt das Layout basierend auf der aktuellen Fensterbreite an.
     *
     * Diese zentrale Methode:
     * 1. Vergleicht die aktuelle Fensterbreite mit dem konfigurierten Breakpoint
     * 2. Wechselt zwischen mobilem und Desktop-Layout (oder Sidebar-Modus)
     * 3. Ruft die entsprechende Anpassungsmethode auf (_applyMobile, _applyDesktop oder _applySidebar)
     *
     * Die Methode wird nur dann ausgeführt, wenn sich der Layout-Typ tatsächlich geändert hat,
     * um unnötige DOM-Manipulationen zu vermeiden.
     *
     * @private
     * @return {void}
     */
    _resize: function () {
      const isSidebar = this.options.sidebar;
      const isMobile = this.$window.width() < this.options.breakpoint;

      if (this.isMobile !== isMobile) {
        this.isMobile = isMobile;
        this[isMobile ? "_applyMobile" : isSidebar ? "_applySidebar" : "_applyDesktop"]();
      }
    },

    /**
     * Wendet das mobile Layout an.
     *
     * Diese Methode:
     * 1. Fügt die mobile CSS-Klasse hinzu und entfernt andere Layout-Klassen
     * 2. Zeigt den Navigationsbutton an
     * 3. Positioniert die Navigationsleiste absolut mit konfigurierten Werten
     * 4. Positioniert das Overlay absolut und zeigt es je nach Zustand an/aus
     *
     * @private
     * @return {void}
     */
    _applyMobile: function () {
      this.$layout.addClass(this.options.classes.mobile);
      this.$layout.removeClass(this.options.classes.desktop);
      this.$layout.removeClass(this.options.classes.sidebar);

      this.$navbtn.css({ "display": "" });
      this.$navbar.css({ "position": "absolute", "z-index": "1045", "inset": "0", "left": this.isShown ? "0" : -this.options.width, "width": this.options.width });
      this.$overlay.css({ "position": "absolute", "z-index": "1040", "inset": "0", "display": this.isShown ? "" : "none" });
    },

    /**
     * Wendet das Desktop-Layout an.
     *
     * Diese Methode:
     * 1. Fügt die Desktop CSS-Klasse hinzu und entfernt andere Layout-Klassen
     * 2. Blendet den Navigationsbutton aus
     * 3. Setzt die CSS-Eigenschaften der Navigationsleiste zurück
     * 4. Blendet das Overlay aus und setzt dessen CSS-Eigenschaften zurück
     *
     * @private
     * @return {void}
     */
    _applyDesktop: function () {
      this.$layout.addClass(this.options.classes.desktop);
      this.$layout.removeClass(this.options.classes.mobile);
      this.$layout.removeClass(this.options.classes.sidebar);

      this.$navbtn.css({ "display": "none" });
      this.$navbar.css({ "position": "", "z-index": "", "inset": "", "width": "" });
      this.$overlay.css({ "position": "", "z-index": "", "inset": "", "display": "none" });
    },

    /**
     * Wendet das Sidebar-Layout an.
     *
     * Diese Methode:
     * 1. Fügt die Sidebar CSS-Klasse hinzu und entfernt andere Layout-Klassen
     * 2. Blendet den Navigationsbutton aus
     * 3. Setzt die CSS-Eigenschaften der Navigationsleiste zurück
     * 4. Setzt die Breite der Navigationsleiste auf den konfigurierten Wert
     * 5. Blendet das Overlay aus und setzt dessen CSS-Eigenschaften zurück
     *
     * @private
     * @return {void}
     */
    _applySidebar: function () {
      this.$layout.addClass(this.options.classes.sidebar);
      this.$layout.removeClass(this.options.classes.desktop);
      this.$layout.removeClass(this.options.classes.mobile);

      this.$navbtn.css({ "display": "none" });
      this.$navbar.css({ "position": "", "z-index": "", "inset": "", "width": this.options.width });
      this.$overlay.css({ "position": "", "z-index": "", "inset": "", "display": "none" });
    },

    /**
     * Öffnet die mobile Navigation (öffentliche Methode).
     *
     * Diese Methode prüft, ob das aktuelle Layout mobil ist und
     * die Navigation noch nicht geöffnet wurde, bevor sie die Navigation öffnet.
     * Sie kann von außen aufgerufen werden, um die Navigation programmgesteuert zu öffnen.
     *
     * @public
     * @return {void}
     */
    open: function () {
      if (this.isMobile && !this.isShown) {
        this._open();
      }
    },

    /**
     * Schließt die mobile Navigation (öffentliche Methode).
     *
     * Diese Methode prüft, ob das aktuelle Layout mobil ist und
     * die Navigation geöffnet ist, bevor sie die Navigation schließt.
     * Sie kann von außen aufgerufen werden, um die Navigation programmgesteuert zu schließen.
     *
     * @public
     * @return {void}
     */
    close: function () {
      if (this.isMobile && this.isShown) {
        this._close();
      }
    },

    /**
     * Zerstört das Widget und setzt alle Änderungen zurück.
     *
     * Diese Methode:
     * 1. Entfernt alle vom Widget hinzugefügten CSS-Klassen
     * 2. Setzt alle CSS-Eigenschaften auf Standardwerte zurück
     *
     * @public
     * @return {void}
     */
    destroy: function () {
      this.$layout.removeClass(this.options.classes.desktop);
      this.$layout.removeClass(this.options.classes.mobile);
      this.$layout.removeClass(this.options.classes.sidebar);
      this.$navbtn.removeClass(this.options.classes.active);

      this.$navbtn.css({ "display": "" });
      this.$navbar.css({ "position": "", "z-index": "", "inset": "", "width": "" });
      this.$overlay.css({ "position": "", "z-index": "", "inset": "", "display": "" });
    },
  });

  /**
   * Automatische Initialisierung des Widgets.
   *
   * Selektiert alle DOM-Elemente mit dem Datenattribut 'data-plugin="layout"' und
   * initialisiert für jedes gefundene Element eine neue Instanz des Layout-Widgets.
   * Diese Selbst-Initialisierung macht eine manuelle Widget-Erstellung in JavaScript unnötig
   * und ermöglicht eine deklarative Konfiguration direkt im HTML.
   *
   * Die Initialisierung erfolgt nach dem vollständigen Laden des DOM, um sicherzustellen,
   * dass alle relevanten Elemente verfügbar sind.
   */
  $(function () {
    $('[data-plugin="layout"]').layout();
  });
})(jQuery);
