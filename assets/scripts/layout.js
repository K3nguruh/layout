(function ($) {
  /**
   * Ein leichtgewichtiges jQuery Widget für responsives Layout-Management.
   * Es ermöglicht einen nahtlosen Wechsel zwischen mobilen und Desktop-Ansichten durch automatische Anpassung an die Fenstergröße.
   * Die integrierte Navigation mit Ein-/Ausblend-Animation und Overlay sorgt für optimale Benutzerfreundlichkeit auf allen Geräten.
   *
   *
   * Hauptmerkmale:
   * - Responsives Layout: Wechselt automatisch zwischen mobilen und Desktop-Layouts je nach Fenstergröße.
   * - Navigation: Ermöglicht das Ein- und Ausblenden der Navigation mit Animation und Overlay.
   * - CSS-Klassenverwaltung: Verwendet CSS-Klassen zur Steuerung der Layout- und Navigationsdarstellung.
   * - Dynamische Anpassung: Erkennt Änderungen der Fenstergröße und passt das Layout entsprechend an.
   * - Sidebar-Unterstützung: Optionale Sidebar-Funktionalität für komplexere Layouts.
   *
   *
   * Beispiel:
   * <body id="layout" data-plugin="layout">
   *   <div id="header">
   *     <button id="navbtn"></button>
   *   </div>
   *   <div id="navbar"></div>
   *   <div id="overlay"></div>
   * </body>
   *
   *
   * Autor:   K3nguruh <https://github.com/K3nguruh>
   * Version: 1.0.0
   * Datum:   2025-02-13 20:07
   * Lizenz:  MIT
   */
  $.widget("custom.layout", {
    /**
     * Optionen für das Widget
     *
     * Diese Optionen definieren die wichtigsten Parameter des Widgets, wie Breakpoint, Animationsgeschwindigkeit und
     * CSS-Klassen für verschiedene Layout-Zustände. Sie können durch das Daten-Attribut `data-plugin` oder explizit
     * beim Initialisieren gesetzt werden.
     *
     * @typedef {Object} LayoutOptions
     * @property {number} breakpoint - Breakpoint für den Wechsel zwischen Desktop und Mobile (Standard: 1200)
     * @property {boolean} sidebar - Aktiviert/Deaktiviert die Sidebar-Funktionalität (Standard: false)
     * @property {number} duration - Animationsdauer in Millisekunden (Standard: 300)
     * @property {string} easing - Easing-Funktion für Animationen (Standard: "linear")
     * @property {string} navbtn - Selector für den Navigation-Toggle-Button (Standard: "#navbtn")
     * @property {string} navbar - Selector für die Navigationsleiste (Standard: "#navbar")
     * @property {string} overlay - Selector für das Overlay-Element (Standard: "#overlay")
     * @property {Object} classes - CSS-Klassen für verschiedene Layout-Zustände
     * @property {string} classes.layoutDesktop - Klasse für Desktop-Layout (Standard: "layout-desktop")
     * @property {string} classes.layoutMobile - Klasse für Mobile-Layout (Standard: "layout-mobile")
     * @property {string} classes.layoutSidebar - Klasse für Sidebar-Layout (Standard: "layout-sidebar")
     * @property {string} classes.navbtnActive - Klasse für aktiven Navigations-Button (Standard: "active")
     */
    options: {
      breakpoint: 1200,
      sidebar: false,
      duration: 300,
      easing: "linear",
      navbtn: "#navbtn",
      navbar: "#navbar",
      overlay: "#overlay",
      classes: {
        layoutDesktop: "layout-desktop",
        layoutMobile: "layout-mobile",
        layoutSidebar: "layout-sidebar",
        navbtnActive: "active",
      },
    },

    /**
     * Initialisiert das Widget
     *
     * Setzt die Optionen basierend auf den Data-Attributen des Elements und speichert die Referenzen auf wichtige DOM-Elemente.
     * Anschließend wird die Widget-Initialisierung durchgeführt, einschließlich Event-Handler-Bindung.
     *
     * @private
     */
    _create: function () {
      this.options = $.extend(true, {}, this.options, this.element.data());

      this.$window = $(window);
      this.$wrapper = $(this.element);
      this.$navbtn = $(this.options.navbtn);
      this.$navbar = $(this.options.navbar);
      this.$overlay = $(this.options.overlay);

      this._initWidget();
      this._initEvents();
    },

    /**
     * Setzt den initialen Zustand und passt das Layout an
     *
     * Diese Funktion ermittelt zu Beginn die Breite der Navigationsleiste und sorgt für die erste Layout-Anpassung.
     * Sie initialisiert auch den Zustand der Navigation und setzt die `navbarOpen`-Variable auf `false`.
     *
     * @private
     */
    _initWidget: function () {
      this.navbarOpen = false;
      this.navbarWidth = this.$navbar.outerWidth();

      this._resizeLayout();
    },

    /**
     * Bindet Events
     *
     * Registriert die notwendigen Event-Listener für Resize-Events und Click-Events auf den Navigations-Button
     * und das Overlay, um das Layout dynamisch anzupassen und die Navigation zu steuern.
     *
     * @private
     */
    _initEvents: function () {
      this._on(this.$window, { "resize": "_onResize" });
      this._on(this.$navbtn, { "click": "_onToggle" });
      this._on(this.$overlay, { "click": "_onToggle" });
    },

    /**
     * Führt das Layout-Resize aus
     *
     * Diese Funktion wird bei einem Resize-Ereignis aufgerufen und sorgt dafür, dass das Layout entsprechend
     * der aktuellen Fensterbreite angepasst wird. Sie nutzt `requestAnimationFrame`, um unnötige Berechnungen
     * zu vermeiden und die Performance zu optimieren.
     *
     * @private
     * @param {Event} event - Resize-Event
     */
    _onResize: function () {
      if (this.resizeAnimationFrame) cancelAnimationFrame(this.resizeAnimationFrame);
      this.resizeAnimationFrame = requestAnimationFrame(() => this._resizeLayout());
    },

    /**
     * Toggelt die Navigation
     *
     * Diese Funktion wechselt den Zustand der Navigation (offen/geschlossen) basierend auf dem aktuellen
     * Status und ruft die entsprechende Funktion zum Öffnen oder Schließen der Navigation auf.
     *
     * @private
     * @param {Event} event - Click-Event vom Navbutton oder Overlay
     */
    _onToggle: function () {
      this[this.navbarOpen ? "_closeNavbar" : "_openNavbar"]();
    },

    /**
     * Öffnet die Navigation mit Animation
     *
     * Diese Funktion zeigt die Navigationsleiste mit einer Animation und aktiviert den Toggle-Button.
     * Sie wird beim ersten Klicken auf den Button aufgerufen und öffnet die Navbar mit einem Slide-In-Effekt.
     *
     * @private
     */
    _openNavbar: function () {
      this.navbarOpen = true;
      this.$navbtn.addClass(this.options.classes.navbtnActive);
      this.$navbar.stop().animate({ left: 0 }, this.options.duration, this.options.easing);
      this.$overlay.stop().fadeIn(this.options.duration, this.options.easing);
    },

    /**
     * Schließt die Navigation mit Animation
     *
     * Diese Funktion blendet die Navigationsleiste mit einer Animation aus und deaktiviert den Toggle-Button.
     * Sie wird beim zweiten Klicken auf den Button aufgerufen und schließt die Navbar mit einem Slide-Out-Effekt.
     *
     * @private
     */
    _closeNavbar: function () {
      this.navbarOpen = false;
      this.$navbtn.removeClass(this.options.classes.navbtnActive);
      this.$navbar.stop().animate({ left: -this.navbarWidth }, this.options.duration, this.options.easing);
      this.$overlay.stop().fadeOut(this.options.duration, this.options.easing);
    },

    /**
     * Passt das Layout basierend auf der Fensterbreite an
     *
     * Diese Funktion prüft, ob die aktuelle Fensterbreite den Breakpoint überschreitet und wechselt dann
     * zwischen Mobile- und Desktop-Layout, indem sie die entsprechenden CSS-Klassen anwendet.
     *
     * @private
     */
    _resizeLayout: function () {
      const isMobile = this.$window.width() < this.options.breakpoint;

      if (this.isMobile !== isMobile) {
        this.isMobile = isMobile;
        this[isMobile ? "_applyMobileLayout" : "_applyDesktopLayout"]();
      }
    },

    /**
     * Aktiviert das Mobile-Layout
     *
     * Zeigt den Navigation-Toggle-Button, ändert die Layout-Klassen und positioniert die Navbar absolut,
     * sodass sie auf mobilen Geräten ein- und ausgeblendet werden kann.
     *
     * @private
     */
    _applyMobileLayout: function () {
      this.$navbtn.show();
      this.$wrapper.addClass(this.options.classes.layoutMobile).removeClass(this.options.classes.layoutDesktop);
      this.$wrapper.toggleClass(this.options.classes.layoutSidebar, this.options.sidebar);
      this.$navbar.css({ "position": "absolute", "left": this.navbarOpen ? "" : -this.navbarWidth, "width": "" });
      this.$overlay.toggle(this.navbarOpen);
    },

    /**
     * Aktiviert das Desktop-Layout
     *
     * Versteckt den Navigation-Toggle-Button, ändert die Layout-Klassen und entfernt mobile-spezifische
     * Styles, sodass die Navbar im Desktop-Modus standardmäßig angezeigt wird.
     *
     * @private
     */
    _applyDesktopLayout: function () {
      this.$navbtn.hide();
      this.$wrapper.addClass(this.options.classes.layoutDesktop).removeClass(this.options.classes.layoutMobile);
      this.$wrapper.toggleClass(this.options.classes.layoutSidebar, this.options.sidebar);
      this.$navbar.css({ "position": "", "left": "", "width": this.options.sidebar ? "" : "100%" });
      this.$overlay.hide();
    },
  });

  /**
   * Initialisiert das Layout-Widget
   *
   * Diese Funktion sucht nach allen HTML-Elementen mit dem `data-plugin="layout"`-Attribut und
   * initialisiert das Layout-Widget für diese Elemente.
   */
  $(function () {
    $('[data-plugin="layout"]').layout();
  });
})(jQuery);
