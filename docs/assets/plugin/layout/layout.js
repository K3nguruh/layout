/**
 * `layout`
 *
 * Das Plugin basiert auf der jQuery UI Widget Factory. Es verwaltet responsive Layout-Zustände und steuert die Sichtbarkeit
 * sowie den Aktivitätsstatus von Navigation, Navigation-Button und Overlay über konfigurierbare CSS-Klassen. Dabei wird die
 * aktuelle Fensterbreite überwacht, um automatisch zwischen einer responsiven Mobile-Ansicht mit aufklappbarer Navigation und
 * einer festen Sidebar- oder Desktop-Darstellung umzuschalten.
 *
 * Funktionalitäten:
 * - Automatische Initialisierung über das HTML5-Data-Attribut `data-plugin="layout"` sowie die Konfiguration über HTML5-Data-Attribute.
 * - Dynamische Wechsel zwischen der Mobile-, der Sidebar- und der Desktop-Ansicht basierend auf der Viewport-Breite und der Option `sidebar`.
 * - Performance-optimierte Verarbeitung von Ereignissen zur Fenstergrößenänderung über die `requestAnimationFrame`-API.
 * - Steuerung der Navigation in der Mobile-Ansicht inklusive des Klick-Handlings für den Navigation-Button und das Overlay.
 * - Bereitstellung öffentlicher Methoden (`open`, `close`, `toggle`) für den programmatischen Zugriff in der Mobile-Ansicht.
 *
 * Voraussetzungen:
 * - jQuery `1.7+`
 * - jQuery UI `1.8+`; vorausgesetzt wird das Widget-Modul: `Core` → `Widget`
 * - Aktuelle Webbrowser mit ES6- und CSS3-Unterstützung
 *
 * Autor:   K3nguruh https://github.com/K3nguruh
 * Version: 1.0.0
 * Datum:   2026-10-17
 * Lizenz:  MIT-Lizenz
 */

(function ($) {
  "use strict";

  $.widget("custom.layout", {
    /**
     * Standard-Konfiguration
     *
     * Definiert die grundlegenden Standardwerte, Optionen sowie Einstellungen, die für die vollständige
     * Initialisierung und das spezifische Verhalten des Plugins benötigt werden.
     *
     * @private
     * @typedef {Object} LayoutOptions
     * @property {number} breakpoint Viewport-Breite in Pixeln, unterhalb derer die Mobile-Ansicht aktiviert wird (Standard: 1200)
     * @property {boolean} sidebar Aktiviert ab dem Breakpoint die Sidebar-Ansicht anstatt der Desktop-Ansicht (Standard: false)
     * @property {string} navbtn CSS-Selektor für den Navigation-Button (Standard: "#navbtn")
     * @property {string} navbar CSS-Selektor für die Navigation (Standard: "#navbar")
     * @property {string} overlay CSS-Selektor für das Overlay (Standard: "#overlay")
     * @property {Object} classes Objekt zur Definition der verwendeten CSS-Klassennamen
     * @property {string} classes.layout Basis-Klasse für das Layout-Element (Standard: "layout")
     * @property {string} classes.layoutMobile Wird in der Mobile-Ansicht dem Layout-Element zugewiesen (Standard: "layout-mobile")
     * @property {string} classes.layoutSidebar Wird in der Sidebar-Ansicht dem Layout-Element zugewiesen (Standard: "layout-sidebar")
     * @property {string} classes.layoutDesktop Wird in der Desktop-Ansicht dem Layout-Element zugewiesen (Standard: "layout-desktop")
     * @property {string} classes.stateAnimated Wird für die CSS-Übergänge dem Layout-Element zugewiesen (Standard: "is-animated")
     * @property {string} classes.stateCollapsed Wird bei geschlossener Navigation dem Layout-Element zugewiesen (Standard: "is-collapsed")
     * @property {string} classes.stateExpanded Wird bei geöffneter Navigation dem Layout-Element zugewiesen (Standard: "is-expanded")
     * @property {string} classes.stateActive Wird bei geöffneter Navigation dem Navigation-Button zugewiesen (Standard: "active")
     */
    options: {
      breakpoint: 1200,
      sidebar: false,
      navbtn: "#navbtn",
      navbar: "#navbar",
      overlay: "#overlay",
      classes: {
        layout: "layout",
        layoutMobile: "layout-mobile",
        layoutSidebar: "layout-sidebar",
        layoutDesktop: "layout-desktop",
        stateAnimated: "is-animated",
        stateCollapsed: "is-collapsed",
        stateExpanded: "is-expanded",
        stateActive: "active",
      },
    },

    /**
     * Initialisieren des Plugins
     *
     * Führt die übergebenen Optionen mit den HTML5-Data-Attributen zusammen, setzt die internen
     * Variablen auf ihre Ausgangswerte, weist die benötigten DOM-Referenzen zu und führt die initiale
     * Aktualisierung des Layouts sowie die Registrierung der Event-Listener durch.
     *
     * @private
     * @return {void}
     */
    _create: function () {
      this.options = $.extend(true, {}, this.options, this.element.data());

      this.isMobile = null;
      this.isSidebar = null;
      this.isResizing = null;
      this.isOpen = false;

      this._createLayout();
      this._updateLayout();
      this._bindEvents();
    },

    /**
     * Zuweisen von DOM-Referenzen und CSS-Klassen
     *
     * Selektiert die benötigten HTML-Elemente anhand der in den Optionen hinterlegten CSS-Selektoren,
     * speichert diese als jQuery-Objektreferenzen für die spätere Verwendung ab und weist dem
     * Layout-Element die definierte Basis-Klasse zu.
     *
     * @private
     * @return {void}
     */
    _createLayout: function () {
      this.$window = $(window);

      this.$layout = $(this.element);
      this.$navbtn = $(this.options.navbtn);
      this.$navbar = $(this.options.navbar);
      this.$overlay = $(this.options.overlay);

      this.$layout.addClass(this.options.classes.layout);
    },

    /**
     * Registrieren der Event-Listener
     *
     * Registriert die Event-Listener für die Ereignisse zur Änderung der Fenstergröße sowie für die
     * Klick-Ereignisse auf den Navigation-Button und das Overlay über die Widget-Methode `_on()`.
     *
     * @private
     * @return {void}
     */
    _bindEvents: function () {
      this._on(this.$window, { "resize": "_onResize" });
      this._on(this.$navbtn, { "click": "_onClick" });
      this._on(this.$overlay, { "click": "_onClick" });
    },

    /**
     * Steuern des Resize-Ereignisses
     *
     * Fängt fortlaufende Ereignisse zur Fenstergrößenänderung ab und entkoppelt deren Ausführung zur
     * Optimierung der Render-Performance über die `requestAnimationFrame`-API des Browsers.
     *
     * @private
     * @return {void}
     */
    _onResize: function () {
      if (this.isResizing) {
        window.cancelAnimationFrame(this.isResizing);
      }

      this.isResizing = window.requestAnimationFrame(() => {
        this.isResizing = null;
        this._updateLayout();
      });
    },

    /**
     * Steuern der Klick-Ereignisse
     *
     * Verhindert das Standardverhalten sowie die Event-Weiterleitung bei Klicks auf den Navigation-Button
     * oder das Overlay, bricht bei inaktiver Ansicht ab und ruft die Methode `_toggleNavbar()` auf.
     *
     * @private
     * @param {Event} event Das ausgelöste Click-Event
     * @return {void}
     */
    _onClick: function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (!this.isMobile) {
        return;
      }

      this.isOpen = !this.isOpen;
      this._toggleNavbar();
    },

    /**
     * Aktualisieren der Ansicht
     *
     * Vergleicht die aktuelle Viewport-Breite mit dem Breakpoint und wertet die Konfiguration für
     * die Sidebar aus, aktualisiert bei Statusänderungen die Schalter und ruft das Layout auf.
     *
     * @private
     * @return {void}
     */
    _updateLayout: function () {
      const isMobile = this.$window.innerWidth() < this.options.breakpoint;
      const isSidebar = this.options.sidebar;

      if (this.isMobile !== isMobile || this.isSidebar !== isSidebar) {
        this.isMobile = isMobile;
        this.isSidebar = isSidebar;
        this[isMobile ? "_applyLayoutMobile" : isSidebar ? "_applyLayoutSidebar" : "_applyLayoutDesktop"]();
      }
    },

    /**
     * Aktivieren der Mobile-Ansicht
     *
     * Weist dem Layout-Element die CSS-Klasse für die Mobile-Ansicht zu, entfernt die Klassen anderer
     * Layout-Modi sowie laufender Animationen, passt die Zustandsklassen für das Auf- und Zuklappen
     * an und blendet den Navigation-Button sowie das Overlay über die Inline-Styles ein.
     *
     * @private
     * @return {void}
     */
    _applyLayoutMobile: function () {
      this.$layout.addClass(this.options.classes.layoutMobile);
      this.$layout.removeClass(this.options.classes.layoutSidebar);
      this.$layout.removeClass(this.options.classes.layoutDesktop);
      this.$layout.removeClass(this.options.classes.stateAnimated);
      this.$layout.toggleClass(this.options.classes.stateCollapsed, !this.isOpen);
      this.$layout.toggleClass(this.options.classes.stateExpanded, this.isOpen);
      this.$navbtn.toggleClass(this.options.classes.stateActive, this.isOpen);

      this.$navbtn.show();
      this.$overlay.show();
    },

    /**
     * Aktivieren der Sidebar-Ansicht
     *
     * Weist dem Layout-Element die CSS-Klasse für die Sidebar-Ansicht zu, entfernt die Klassen anderer
     * Layout-Modi, löscht sämtliche Animations- und Zustands-Klassen vom Layout sowie Navigation-Button
     * und blendet den Navigation-Button sowie das Overlay zuverlässig über die Inline-Styles aus.
     *
     * @private
     * @return {void}
     */
    _applyLayoutSidebar: function () {
      this.$layout.addClass(this.options.classes.layoutSidebar);
      this.$layout.removeClass(this.options.classes.layoutDesktop);
      this.$layout.removeClass(this.options.classes.layoutMobile);
      this.$layout.removeClass(this.options.classes.stateAnimated);
      this.$layout.removeClass(this.options.classes.stateCollapsed);
      this.$layout.removeClass(this.options.classes.stateExpanded);
      this.$navbtn.removeClass(this.options.classes.stateActive);

      this.$navbtn.hide();
      this.$overlay.hide();
    },

    /**
     * Aktivieren der Desktop-Ansicht
     *
     * Weist dem Layout-Element die CSS-Klasse für die Desktop-Ansicht zu, entfernt Klassen anderer
     * Layout-Modi, löscht sämtliche Animations- und Zustands-Klassen vom Layout sowie Navigation-Button
     * und blendet den Navigation-Button sowie das Overlay zuverlässig über die Inline-Styles aus.
     *
     * @private
     * @return {void}
     */
    _applyLayoutDesktop: function () {
      this.$layout.addClass(this.options.classes.layoutDesktop);
      this.$layout.removeClass(this.options.classes.layoutSidebar);
      this.$layout.removeClass(this.options.classes.layoutMobile);
      this.$layout.removeClass(this.options.classes.stateAnimated);
      this.$layout.removeClass(this.options.classes.stateCollapsed);
      this.$layout.removeClass(this.options.classes.stateExpanded);
      this.$navbtn.removeClass(this.options.classes.stateActive);

      this.$navbtn.hide();
      this.$overlay.hide();
    },

    /**
     * Umschalten des Öffnungszustands
     *
     * Weist dem Layout-Element die CSS-Klasse für Animationen zu und aktualisiert sowohl die
     * Zustandsklassen für den Öffnungsstatus als auch die Aktiv-Klasse am Navigation-Button.
     *
     * @private
     * @return {void}
     */
    _toggleNavbar: function () {
      this.$layout.addClass(this.options.classes.stateAnimated);
      this.$layout.toggleClass(this.options.classes.stateCollapsed, !this.isOpen);
      this.$layout.toggleClass(this.options.classes.stateExpanded, this.isOpen);
      this.$navbtn.toggleClass(this.options.classes.stateActive, this.isOpen);
    },

    /**
     * Aktualisieren einzelner Optionen
     *
     * Reicht die Optionsänderung an die Widget-Methode `_super()` weiter und führt bei Anpassungen
     * der Optionen `breakpoint` oder `sidebar` einen erneuten Aufruf von `_updateLayout()` aus.
     *
     * @private
     * @param {string} key Der Name der zu ändernden Option
     * @param {*} value Der neue Wert der Option
     * @return {void}
     */
    _setOption: function (key, value) {
      this._super(key, value);

      if (key === "breakpoint" || key === "sidebar") {
        this._updateLayout();
      }
    },

    /**
     * Zerstören und Zustand zurücksetzen
     *
     * Bricht eventuell laufende Animationen ab, entfernt alle zugewiesenen Layout-, Zustand- und
     * Animations-Klassen, setzt Inline-Styles zurück und ruft die Widget-Methode `_super()` auf.
     *
     * @private
     * @return {void}
     */
    _destroy: function () {
      if (this.isResizing) {
        window.cancelAnimationFrame(this.isResizing);
        this.isResizing = null;
      }

      this.$layout.removeClass(this.options.classes.layout);
      this.$layout.removeClass(this.options.classes.layoutMobile);
      this.$layout.removeClass(this.options.classes.layoutSidebar);
      this.$layout.removeClass(this.options.classes.layoutDesktop);
      this.$layout.removeClass(this.options.classes.stateAnimated);
      this.$layout.removeClass(this.options.classes.stateCollapsed);
      this.$layout.removeClass(this.options.classes.stateExpanded);
      this.$navbtn.removeClass(this.options.classes.stateActive);

      this.$navbtn.css({ "display": "" });
      this.$overlay.css({ "display": "" });

      this._super();
    },

    /**
     * Öffnen der Navigation
     *
     * Bricht ab, falls die Mobile-Ansicht inaktiv oder die Navigation bereits geöffnet ist, setzt
     * den internen Status auf geöffnet und ruft daraufhin die interne Methode `_toggleNavbar()` auf.
     *
     * @public
     * @return {void}
     */
    open: function () {
      if (!this.isMobile || this.isOpen) {
        return;
      }

      this.isOpen = true;
      this._toggleNavbar();
    },

    /**
     * Schließen der Navigation
     *
     * Bricht ab, falls die Mobile-Ansicht inaktiv oder die Navigation geschlossen ist, setzt den
     * internen Status auf geschlossen und ruft daraufhin die interne Methode `_toggleNavbar()` auf.
     *
     * @public
     * @return {void}
     */
    close: function () {
      if (!this.isMobile || !this.isOpen) {
        return;
      }

      this.isOpen = false;
      this._toggleNavbar();
    },

    /**
     * Umschalten der Navigation
     *
     * Bricht ab, falls die Mobile-Ansicht nicht aktiv ist, kehrt andernfalls den internen Status
     * um und ruft daraufhin die interne Methode `_toggleNavbar()` zur Anwendung der Änderungen auf.
     *
     * @public
     * @return {void}
     */
    toggle: function () {
      if (!this.isMobile) {
        return;
      }

      this.isOpen = !this.isOpen;
      this._toggleNavbar();
    },
  });

  /**
   * Automatische Initialisierung
   *
   * Selektiert alle DOM-Elemente mit dem Datenattribut `data-plugin="layout"` und erzeugt für jedes
   * Element eine Instanz des Layout-Plugins. Die Ausführung erfolgt nach dem vollständigen Laden des
   * DOM.
   */
  $(function () {
    $('[data-plugin="layout"]').layout();
  });
})(jQuery);
