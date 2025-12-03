/**
 * 🎬 Netflix Clone - Production-grade streaming UI built with Vanilla JavaScript, HTML5, CSS3 & TMDB API. Features responsive design, lazy loading, infinite scroll, search functionality. No frameworks - pure JavaScript. Perfect for learning modern web development. ⭐ Star if helpful!
 * ===================================================
 *
 * @file        index.js
 * @version     1.0.0
 * @description Pure JavaScript Netflix clone with TMDB API integration
 * @author      Abdul Mujeeb
 * @license     MIT
 * @copyright   2025 Netflix Clone Demo. All rights reserved.
 *
 * DISCLAIMER:
 * This project is a demonstration/portfolio piece and is NOT affiliated with,
 * endorsed by, or connected to Netflix, Inc. in any way. All movie/TV show data
 * is provided by The Movie Database (TMDB) API for educational purposes.
 *
 * @see README.md for setup instructions
 * @see https://github.com/mujeebdev3/netflix-clone-vanilla-javascript
 */

const NetflixApp = (() => {
  // Configuration
  const CONFIG = {
    API_KEY: "YOUR_API_KEY_HERE",
    BASE_URL: "https://api.themoviedb.org/3",
    IMG_BASE: "https://image.tmdb.org/t/p",
    IMG_SIZES: { sm: "w342", md: "w500", lg: "w780", xl: "original" },
    DEBOUNCE_MS: 300,
    SCROLL_THRESHOLD: 50,
    CACHE_TTL: {
      TRENDING: 5 * 60 * 1000,
      GENERAL: 30 * 60 * 1000,
    },
    RATE_LIMIT: {
      MAX_REQUESTS: 45,
      WINDOW_MS: 10 * 1000,
    },
  };

  // State
  const state = {
    isScrolled: false,
    activeDropdown: null,
    heroData: null,
    myList: JSON.parse(localStorage.getItem("netflix_mylist") || "[]"),
    notifications: [],
    rateLimitQueue: [],
    lastHeroShowIds: JSON.parse(
      localStorage.getItem("last_hero_shown") || "[]"
    ),
  };

  // Cache
  // const cache = new Map();
  // Cache with TTL support
  const cache = {
    _map: new Map(),

    set(key, data, ttl = CONFIG.CACHE_TTL.GENERAL) {
      this._map.set(key, {
        data,
        expires: Date.now() + ttl,
      });
    },

    get(key) {
      const entry = this._map.get(key);
      if (!entry) return null;

      if (Date.now() > entry.expires) {
        this._map.delete(key);
        return null;
      }

      return entry.data;
    },

    has(key) {
      return !!this.get(key);
    },

    delete(key) {
      this._map.delete(key);
    },

    clearExpired() {
      const now = Date.now();
      for (const [key, entry] of this._map.entries()) {
        if (now > entry.expires) {
          this._map.delete(key);
        }
      }
    },
  };

  // ===== UTILITIES =====
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const debounce = (fn, ms) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const truncate = (str, len) =>
    str?.length > len ? str.slice(0, len).trim() + "..." : str || "";

  const imgUrl = (path, size = "md") =>
    path
      ? `${CONFIG.IMG_BASE}/${CONFIG.IMG_SIZES[size]}${path}`
      : "/assets/images/placeholder.jpg";

  // Check which page we're on
  const isMyListPage = () => window.location.pathname.includes("my-list");

  const rateLimiter = {
    canMakeRequest() {
      const now = Date.now();

      state.rateLimitQueue = state.rateLimitQueue.filter(
        (time) => now - time < CONFIG.RATE_LIMIT.WINDOW_MS
      );

      if (state.rateLimitQueue.length >= CONFIG.RATE_LIMIT.MAX_REQUESTS) {
        console.warn(
          "Rate limit approaching! Requests in last 10s:",
          state.rateLimitQueue.length
        );
        return false;
      }
      state.rateLimitQueue.push(now);
      return true;
    },
    getRemainingRequests() {
      const now = Date.now();
      state.rateLimitQueue = state.rateLimitQueue.filter(
        (time) => now - time < CONFIG.RATE_LIMIT.WINDOW_MS
      );
      return CONFIG.RATE_LIMIT.MAX_REQUESTS - state.rateLimitQueue.length;
    },
  };
  // ===== API LAYER =====
  const api = {
    async fetch(endpoint, params = {}, options = {}) {
      // Check rate limit
      if (!rateLimiter.canMakeRequest()) {
        throw new Error(`Rate limit exceeded. Please wait a moment.`);
      }

      // Determine cache TTL
      const isTrending = endpoint.includes("/trending/");
      const ttl =
        options.ttl ||
        (isTrending ? CONFIG.CACHE_TTL.TRENDING : CONFIG.CACHE_TTL.GENERAL);

      // Generate cache key
      const cacheKey = `${endpoint}${JSON.stringify(params)}`;

      // Check cache first (if not skipping)
      if (!options.skipCache) {
        const cached = cache.get(cacheKey);
        if (cached) {
          console.log(`Cache hit: ${endpoint}`);
          return cached;
        }
      }

      // Build URL
      const url = new URL(`${CONFIG.BASE_URL}${endpoint}`);
      url.searchParams.set("api_key", CONFIG.API_KEY);
      url.searchParams.set("language", "en-US");

      // Add cache busting for trending endpoints
      if (isTrending && options.cacheBuster) {
        url.searchParams.set("_", Date.now());
      }

      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      try {
        console.log(`API Request: ${endpoint}`);
        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          }
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Cache the response
        if (!options.skipCache) {
          cache.set(cacheKey, data, ttl);
        }

        return data;
      } catch (err) {
        console.error("API fetch failed:", err);

        // Try to return cached data if available (even if expired)
        const cached = cache.get(cacheKey);
        if (cached) {
          console.warn("Using stale cache due to API error");
          return cached;
        }

        throw err;
      }
    },

    getTrending: (type = "all", time = "week", options = {}) =>
      api.fetch(
        `/trending/${type}/${time}`,
        {},
        {
          ttl: CONFIG.CACHE_TTL.TRENDING,
          cacheBuster: true,
          ...options,
        }
      ),

    getPopular: (type = "movie", options = {}) =>
      api.fetch(`/${type}/popular`, {}, options),

    getTopRated: (type = "movie", options = {}) =>
      api.fetch(`/${type}/top_rated`, {}, options),

    getNowPlaying: (options = {}) =>
      api.fetch("/movie/now_playing", {}, options),

    getUpcoming: (options = {}) => api.fetch("/movie/upcoming", {}, options),

    getGenres: (type = "movie", options = {}) =>
      api.fetch(`/genre/${type}/list`, {}, options),

    getByGenre: (type, genreId, options = {}) =>
      api.fetch(`/discover/${type}`, { with_genres: genreId }, options),

    search: (query, options = {}) =>
      api.fetch("/search/multi", { query, include_adult: false }, options),

    getDetails: (type, id, options = {}) =>
      api.fetch(
        `/${type}/${id}`,
        { append_to_response: "videos,credits" },
        options
      ),

    getByLanguage: (type, lang, options = {}) =>
      api.fetch(`/discover/${type}`, { with_original_language: lang }, options),

    // Special method for hero that always fetches fresh
    getFreshTrending: (type = "all", time = "day") =>
      api.fetch(
        `/trending/${type}/${time}`,
        {},
        {
          skipCache: true,
          cacheBuster: true,
        }
      ),
  };

  // ===== DOM HELPERS =====
  const dom = {
    create(tag, attrs = {}, children = []) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === "class") el.className = v;
        else if (k === "data")
          Object.entries(v).forEach(([dk, dv]) => (el.dataset[dk] = dv));
        else if (k.startsWith("on"))
          el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v);
      });
      children.forEach((c) => el.append(typeof c === "string" ? c : c));
      return el;
    },

    setHTML(el, html) {
      if (el) el.innerHTML = html;
    },
    show(el) {
      el?.removeAttribute("hidden");
    },
    hide(el) {
      el?.setAttribute("hidden", "");
    },
    toggle(el, show) {
      show ? dom.show(el) : dom.hide(el);
    },
  };

  // ===== HEADER & NAVIGATION =====
  const header = {
    init() {
      this.el = $("#header");
      this.mobileToggle = $("#mobile-menu-toggle");
      this.nav = $("#main-nav");

      window.addEventListener(
        "scroll",
        debounce(() => this.onScroll(), 10),
        { passive: true }
      );
      this.mobileToggle?.addEventListener("click", () =>
        this.toggleMobileMenu()
      );

      document.addEventListener("click", (e) => this.handleClickOutside(e));

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.closeMobileMenu();
      });

      this.onScroll();
      this.setActiveNav();
    },

    onScroll() {
      const scrolled = window.scrollY > CONFIG.SCROLL_THRESHOLD;
      if (scrolled !== state.isScrolled) {
        state.isScrolled = scrolled;
        this.el?.classList.toggle("header--scrolled", scrolled);
      }
    },

    handleClickOutside(e) {
      const isMenuOpen = this.nav?.classList.contains("header__nav--open");

      if (
        isMenuOpen &&
        !this.nav?.contains(e.target) &&
        !this.mobileToggle?.contains(e.target)
      ) {
        this.closeMobileMenu();
      }
    },

    toggleMobileMenu() {
      const expanded =
        this.mobileToggle.getAttribute("aria-expanded") === "true";
      this.mobileToggle.setAttribute("aria-expanded", !expanded);
      this.nav?.classList.toggle("header__nav--open", !expanded);
      overlay.toggle(!expanded);
    },

    closeMobileMenu() {
      this.mobileToggle?.setAttribute("aria-expanded", "false");
      this.nav?.classList.remove("header__nav--open");
      overlay.toggle(false);
    },

    setActiveNav() {
      const path = window.location.pathname;
      $$(".nav__item").forEach((item) => {
        const link = $("a", item);
        const isActive =
          link?.href &&
          path.includes(link.getAttribute("href")?.split("/").pop());
        item.classList.toggle(
          "nav__item--active",
          isActive || (path.endsWith("/") && link?.href.includes("index"))
        );
      });
    },
  };

  // ===== DROPDOWNS =====
  const dropdowns = {
    init() {
      $$("[data-dropdown]").forEach((container) => {
        const toggle = $("[aria-expanded]", container);
        const dropdown = $('[id$="-container"], [id$="-dropdown"]', container);

        toggle?.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggle(dropdown, toggle);
        });
        dropdown?.addEventListener("click", (e) => {
          e.stopPropagation();
        });
      });

      document.addEventListener("click", () => this.closeAll());
      document.addEventListener(
        "keydown",
        (e) => e.key === "Escape" && this.closeAll()
      );
    },

    toggle(dropdown, toggle) {
      const isOpen = dropdown?.classList.contains("dropdown--active");
      this.closeAll();

      if (!isOpen && dropdown) {
        dropdown.classList.add("dropdown--active");
        toggle?.setAttribute("aria-expanded", "true");
        state.activeDropdown = dropdown;

        if (dropdown.id === "search-container") $("#search-input")?.focus();
      }
    },

    closeAll() {
      $$(".dropdown--active").forEach((d) =>
        d.classList.remove("dropdown--active")
      );
      $$('[aria-expanded="true"]').forEach((t) =>
        t.setAttribute("aria-expanded", "false")
      );
      state.activeDropdown = null;
      overlay.hide();
    },
  };

  // ===== SEARCH =====
  const search = {
    init() {
      this.input = $("#search-input");
      this.clear = $("#search-clear");
      this.results = $("#search-results");

      this.input?.addEventListener(
        "input",
        debounce((e) => this.onInput(e.target.value), CONFIG.DEBOUNCE_MS)
      );
      this.clear?.addEventListener("click", () => this.reset());
    },

    async onInput(query) {
      if (!query.trim()) return this.reset();

      dom.toggle(this.clear, true);
      dom.setHTML(
        this.results,
        '<div class="search-loading"><div class="skeleton" style="height:75px;margin:1rem"></div></div>'
      );

      try {
        const data = await api.search(query);
        this.render(data.results?.slice(0, 8) || []);
      } catch {
        dom.setHTML(
          this.results,
          '<div class="error-state"><p class="error-state__text">Search failed</p></div>'
        );
      }
    },

    render(items) {
      if (!items.length) {
        dom.setHTML(
          this.results,
          '<div class="empty-state"><p class="empty-state__text">No results found</p></div>'
        );
        return;
      }

      dom.setHTML(
        this.results,
        items
          .map(
            (item) => `
        <div class="search-result" data-id="${item.id}" data-type="${
              item.media_type
            }">
          <img src="${imgUrl(
            item.poster_path,
            "sm"
          )}" alt="" class="search-result__poster" loading="lazy">
          <div class="search-result__info">
            <div class="search-result__title">${item.title || item.name}</div>
            <div class="search-result__meta">
              ${
                item.vote_average
                  ? `<span class="search-result__match">${Math.round(
                      item.vote_average * 10
                    )}%</span>`
                  : ""
              }
              ${(item.release_date || item.first_air_date || "").slice(0, 4)}
              • ${
                item.media_type === "tv"
                  ? "TV Show"
                  : item.media_type === "person"
                  ? "Person"
                  : "Movie"
              }
            </div>
          </div>
        </div>
      `
          )
          .join("")
      );
    },

    reset() {
      if (this.input) this.input.value = "";
      dom.hide(this.clear);
      dom.setHTML(this.results, "");
    },
  };

  // ===== NOTIFICATIONS =====
  const notifications = {
    init() {
      this.badge = $("#notifications-badge");
      this.list = $("#notifications-list");
      this.load();

      $("#mark-all-read")?.addEventListener("click", () => this.markAllRead());
    },

    load() {
      state.notifications = [
        {
          id: 1,
          title: "New Arrival",
          text: "Stranger Things Season 5 is now available",
          time: "2 hours ago",
          unread: true,
          poster: null,
        },
        {
          id: 2,
          title: "Continue Watching",
          text: "Continue watching Breaking Bad",
          time: "1 day ago",
          unread: true,
          poster: null,
        },
        {
          id: 3,
          title: "New Release",
          text: "The Crown new episodes are here",
          time: "3 days ago",
          unread: false,
          poster: null,
        },
      ];
      this.render();
    },

    render() {
      const unread = state.notifications.filter((n) => n.unread).length;
      dom.toggle(this.badge, unread > 0);
      if (this.badge) this.badge.textContent = unread;

      if (!this.list) return;

      if (!state.notifications.length) {
        dom.setHTML(
          this.list,
          '<div class="empty-state"><p class="empty-state__text">No notifications</p></div>'
        );
        return;
      }

      dom.setHTML(
        this.list,
        state.notifications
          .map(
            (n) => `
        <div class="notification ${
          n.unread ? "notification--unread" : ""
        }" data-id="${n.id}">
          <div class="notification__icon" style="width:60px;height:90px;background:var(--c-gray-900);border-radius:4px;display:flex;align-items:center;justify-content:center">📺</div>
          <div class="notification__content">
            <p class="notification__text"><strong>${n.title}</strong><br>${
              n.text
            }</p>
            <span class="notification__time">${n.time}</span>
          </div>
        </div>
      `
          )
          .join("")
      );
    },

    markAllRead() {
      state.notifications.forEach((n) => (n.unread = false));
      this.render();
      toast.show("All notifications marked as read");
    },
  };

  // ===== OVERLAY =====
  const overlay = {
    init() {
      this.el = $("#overlay");
      this.el?.addEventListener("click", () => {
        dropdowns.closeAll();
        header.closeMobileMenu();
        this.hide();
      });
    },
    show() {
      this.el?.classList.add("overlay--active");
    },
    hide() {
      this.el?.classList.remove("overlay--active");
    },
    toggle(show) {
      show ? this.show() : this.hide();
    },
  };

  // ===== TOAST =====
  const toast = {
    container: null,
    init() {
      this.container = $("#toast-container");
    },
    show(msg, type = "success", duration = 3000) {
      if (!this.container) return;
      const el = dom.create("div", { class: `toast toast--${type}` }, [
        dom.create("span", { class: "toast__message" }, [msg]),
        dom.create(
          "button",
          { class: "toast__close", onClick: () => el.remove() },
          ["×"]
        ),
      ]);
      this.container.append(el);
      setTimeout(() => el.remove(), duration);
    },
  };

  // ===== HERO =====
  const hero = {
    async init() {
      this.section = $("#hero-section");
      if (!this.section) return; // Skip if not on home page

      this.bg = $("#hero-background");
      this.title = $("#hero-title");
      this.meta = $("#hero-meta");
      this.desc = $("#hero-description");
      this.badge = $("#hero-badge");

      try {
        // Clear cache for trending to get fresh data
        const cacheKeys = Array.from(cache._map.keys());
        cacheKeys.forEach((key) => {
          if (key.includes("/trending/")) {
            cache.delete(key);
          }
        });

        // Fetch FRESH trending data (skip cache)
        const data = await api.getFreshTrending("all", "day");

        // Filter to only items with backdrop images and overview
        const validItems =
          data.results?.filter((i) => i.backdrop_path && i.overview) || [];

        if (validItems.length > 0) {
          // Get items that haven't been shown recently
          const newItems = validItems.filter(
            (item) => !state.lastHeroShownIds.includes(item.id)
          );

          let featured;
          if (newItems.length > 0) {
            // Pick random from new items
            const randomIndex = Math.floor(Math.random() * newItems.length);
            featured = newItems[randomIndex];
          } else {
            // All items shown, reset and pick random
            const randomIndex = Math.floor(Math.random() * validItems.length);
            featured = validItems[randomIndex];
            state.lastHeroShownIds = []; // Reset
          }

          // Update last shown IDs
          state.lastHeroShownIds.unshift(featured.id);
          if (state.lastHeroShownIds.length > 5) {
            state.lastHeroShownIds.pop();
          }

          // Save to localStorage
          localStorage.setItem(
            "last_hero_shown",
            JSON.stringify(state.lastHeroShownIds)
          );

          console.log(
            `Showing hero: ${featured.title || featured.name} (ID: ${
              featured.id
            })`
          );
          this.render(featured);
        } else if (data.results?.length > 0) {
          // Fallback: pick random from all results
          const randomIndex = Math.floor(Math.random() * data.results.length);
          this.render(data.results[randomIndex]);
        }
      } catch (err) {
        console.error("Hero load failed:", err);
        // Try to use cached trending data as fallback
        try {
          const cachedData = await api.getTrending("all", "day");
          if (cachedData.results?.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * cachedData.results.length
            );
            this.render(cachedData.results[randomIndex]);
          }
        } catch (cacheErr) {
          console.error("Cache fallback also failed:", cacheErr);
        }
      }
    },

    render(item) {
      state.heroData = item;
      const isTV = item.media_type === "tv";

      if (this.bg)
        this.bg.style.backgroundImage = `url(${imgUrl(
          item.backdrop_path,
          "xl"
        )})`;
      if (this.title) this.title.textContent = item.title || item.name;
      if (this.desc) this.desc.textContent = truncate(item.overview, 200);
      if (this.badge)
        this.badge.textContent = `#1 in ${isTV ? "TV Shows" : "Movies"} Today`;

      if (this.meta) {
        const year = (item.release_date || item.first_air_date || "").slice(
          0,
          4
        );
        const rating = item.vote_average
          ? Math.round(item.vote_average * 10)
          : null;
        this.meta.innerHTML = `
          ${
            rating
              ? `<span class="hero__meta-item"><span class="hero__match">${rating}% Match</span></span>`
              : ""
          }
          ${
            year
              ? `<span class="hero__meta-item hero__year">${year}</span>`
              : ""
          }
          <span class="hero__meta-item">${isTV ? "TV Series" : "Movie"}</span>
        `;
      }
    },
  };

  // ===== CONTENT SECTIONS (Home Page) =====
  const content = {
    container: null,
    sections: [
      { title: "Trending Now", fetch: () => api.getTrending() },
      { title: "Popular Movies", fetch: () => api.getPopular("movie") },
      { title: "Popular TV Shows", fetch: () => api.getPopular("tv") },
      { title: "Top Rated", fetch: () => api.getTopRated("movie") },
      { title: "Now Playing", fetch: () => api.getNowPlaying() },
      { title: "Upcoming", fetch: () => api.getUpcoming() },
      {
        title: "Explore Spanish Movies",
        fetch: () => api.getByLanguage("movie", "es"),
      },
      {
        title: "Explore Hindi Movies",
        fetch: () => api.getByLanguage("movie", "hi"),
      },
    ],

    async init() {
      this.container = $("#content-sections");
      if (!this.container || isMyListPage()) return; // Skip if on My List page

      try {
        const results = await Promise.all(
          this.sections.map((s) => s.fetch().catch(() => ({ results: [] })))
        );
        this.container.innerHTML = "";

        results.forEach((data, i) => {
          if (data.results?.length) {
            this.renderSection(this.sections[i].title, data.results);
          }
        });
      } catch (err) {
        console.error("Content load failed:", err);
        this.container.innerHTML =
          '<div class="error-state"><h3 class="error-state__title">Failed to load content</h3><p class="error-state__text">Please try again later</p></div>';
      }
    },

    renderSection(title, items) {
      const section = dom.create("section", { class: "content-section" });
      section.innerHTML = `
        <div class="section__header">
          <h2 class="section__title">${title}</h2>
          <a href="#" class="section__explore">Explore All ›</a>
        </div>
        <div class="content-row-wrapper">
          <button class="slider-btn slider-btn--prev" aria-label="Previous" disabled>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>
          </button>
          <div class="content-row">
            ${items
              .slice(0, 20)
              .map((item) => this.cardHTML(item))
              .join("")}
          </div>
          <button class="slider-btn slider-btn--next" aria-label="Next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" fill="currentColor"/></svg>
          </button>
        </div>
      `;

      this.container.append(section);
      this.initSlider(section);
    },

    cardHTML(item, isMyListPage = false) {
      const type =
        item.media_type ||
        item.savedType ||
        (item.first_air_date ? "tv" : "movie");
      const title = item.title || item.name;
      const year = (item.release_date || item.first_air_date || "").slice(0, 4);
      const rating = item.vote_average
        ? Math.round(item.vote_average * 10)
        : null;
      const inList = myList.has(item.id);

      return `
        <article class="content-card" data-id="${item.id}" data-type="${type}">
          <img src="${imgUrl(
            item.poster_path,
            "md"
          )}" alt="${title}" class="content-card__poster" loading="lazy">
          <div class="content-card__overlay">
            <h3 class="content-card__title">${title}</h3>
            <div class="content-card__meta">
              ${
                rating
                  ? `<span class="content-card__match">${rating}%</span>`
                  : ""
              }
              <span>${year}</span>
              <span>${type === "tv" ? "TV" : "Movie"}</span>
            </div>
            <div class="content-card__actions">
              <button class="content-card__btn content-card__btn--primary" aria-label="Play" data-action="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 2.69C4 1.93 4.82 1.45 5.48 1.82L22.41 11.12c.69.38.69 1.37 0 1.75L5.48 22.18C4.82 22.55 4 22.07 4 21.31V2.69z" fill="currentColor"/></svg>
              </button>
              <button class="content-card__btn ${
                inList ? "content-card__btn--active" : ""
              }" aria-label="${
        inList ? "Remove from" : "Add to"
      } My List" data-action="toggle-list">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  ${
                    inList
                      ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>'
                      : '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>'
                  }
                </svg>
              </button>
              <button class="content-card__btn" aria-label="Like" data-action="like">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" fill="currentColor"/></svg>
              </button>
              <div class="content-card__more-wrapper">
                <button class="content-card__btn" aria-label="More Info" data-action="toggle-more-menu">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor"/></svg>
                </button>
                <div class="content-card__more-menu" data-menu="more">
                  ${
                    isMyListPage
                      ? `
                    <button class="content-card__menu-item" data-action="remove-list">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13h14v-2H5v2z" fill="currentColor"/></svg>
                      Remove from My List
                    </button>
                  `
                      : ""
                  }
                  <button class="content-card__menu-item" data-action="info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>
                    More Info
                  </button>
                  <button class="content-card__menu-item" data-action="share">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" fill="currentColor"/></svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    },

    initSlider(section) {
      const row = $(".content-row", section);
      const prev = $(".slider-btn--prev", section);
      const next = $(".slider-btn--next", section);

      const updateBtns = () => {
        prev.disabled = row.scrollLeft <= 0;
        next.disabled =
          row.scrollLeft >= row.scrollWidth - row.clientWidth - 10;
      };

      prev?.addEventListener("click", () => {
        row.scrollBy({ left: -row.clientWidth * 0.8, behavior: "smooth" });
      });
      next?.addEventListener("click", () => {
        row.scrollBy({ left: row.clientWidth * 0.8, behavior: "smooth" });
      });
      row?.addEventListener("scroll", debounce(updateBtns, 100), {
        passive: true,
      });

      updateBtns();
    },
  };

  // ===== MY LIST =====
  const myList = {
    add(id, type) {
      if (!state.myList.find((i) => i.id == id)) {
        state.myList.push({ id, type, added: Date.now() });
        this.save();
        toast.show("Added to My List");
        return true;
      }
      return false;
    },
    remove(id) {
      state.myList = state.myList.filter((i) => i.id != id);
      this.save();
      toast.show("Removed from My List");
    },
    toggle(id, type) {
      if (this.has(id)) {
        this.remove(id);
        return false;
      } else {
        this.add(id, type);
        return true;
      }
    },
    has(id) {
      return state.myList.some((i) => i.id == id);
    },
    save() {
      localStorage.setItem("netflix_mylist", JSON.stringify(state.myList));
    },
    getAll() {
      return state.myList;
    },
  };

  // ===== MY LIST PAGE =====
  const myListPage = {
    container: null,

    async init() {
      this.container = $("#content-sections");
      if (!this.container || !isMyListPage()) return;

      const savedItems = myList.getAll();
      console.log("My List items:", savedItems);

      // Show empty state if no items
      if (!savedItems.length) {
        this.renderEmptyState();
        return;
      }

      // Show loading
      this.container.innerHTML = `
        <div class="loading-state" style="text-align:center;padding:2rem;">
          <p>Loading your list...</p>
          <div class="skeleton" style="height:200px;margin:1rem auto;max-width:800px;border-radius:8px;"></div>
        </div>
      `;

      try {
        // Fetch details for each saved item
        const itemPromises = savedItems.map((item) =>
          api
            .getDetails(item.type, item.id)
            .then((data) => ({ ...data, savedType: item.type }))
            .catch(() => null)
        );
        const items = (await Promise.all(itemPromises)).filter(Boolean);

        if (!items.length) {
          this.renderEmptyState();
          return;
        }

        this.render(items);
      } catch (err) {
        console.error("My List page load failed:", err);
        this.renderErrorState();
      }
    },

    render(items) {
      this.container.innerHTML = `
        <section class="content-section">
          <div class="section__header">
            <h2 class="section__title">${items.length} Title${
        items.length !== 1 ? "s" : ""
      } in Your List</h2>
          </div>
          <div class="content-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1.5rem;">
            ${items.map((item) => content.cardHTML(item, true)).join("")}
          </div>
        </section>
      `;
    },

    renderEmptyState() {
      this.container.innerHTML = `
        <div class="empty-state" style="text-align:center;padding:4rem 2rem;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="opacity:0.5;margin-bottom:1rem;">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
          <h3>Your list is empty</h3>
          <p style="color:#888;margin:0.5rem 0 1.5rem;">Add movies and TV shows to your list to watch them later</p>
          <a href="/index.html" class="btn btn--primary">Browse Content</a>
        </div>
      `;
    },

    renderErrorState() {
      this.container.innerHTML = `
        <div class="error-state" style="text-align:center;padding:4rem 2rem;">
          <h3>Something went wrong</h3>
          <p style="color:#888;margin:0.5rem 0 1.5rem;">Failed to load your saved items</p>
          <button class="btn btn--primary" onclick="location.reload()">Try Again</button>
        </div>
      `;
    },
  };

  // ===== GLOBAL EVENT DELEGATION =====
  const events = {
    init() {
      // Close all menus when clicking outside
      document.addEventListener("click", (e) => {
        // If click is not on a menu or toggle button, close all menus
        if (
          !e.target.closest('[data-action="toggle-more-menu"]') &&
          !e.target.closest('[data-menu="more"]')
        ) {
          this.closeAllMenus();
        }
      });

      // Handle all button actions
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const card = btn.closest("[data-id]");
        const id = card?.dataset.id;
        const type = card?.dataset.type;

        switch (action) {
          case "play":
            console.log("Play:", id, type);
            break;

          case "info":
            console.log("More Info:", id, type);
            this.closeAllMenus();
            break;

          case "share":
            console.log("Share:", id, type);
            toast.show("Link copied to clipboard");
            this.closeAllMenus();
            break;

          case "add-list":
            myList.add(id, type);
            break;

          case "toggle-list":
            const added = myList.toggle(id, type);
            btn.innerHTML = added
              ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>'
              : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>';
            btn.classList.toggle("content-card__btn--active", added);
            btn.setAttribute(
              "aria-label",
              added ? "Remove from My List" : "Add to My List"
            );
            break;

          case "toggle-more-menu":
            e.stopPropagation();
            const menu = btn.nextElementSibling;
            const isOpen = menu?.classList.contains(
              "content-card__more-menu--active"
            );
            this.closeAllMenus();
            if (!isOpen && menu) {
              menu.classList.add("content-card__more-menu--active");
            }
            break;

          case "remove-list":
            myList.remove(id);
            this.closeAllMenus();
            if (isMyListPage()) myListPage.init();
            break;

          case "like":
            toast.show("Added to Liked");
            break;
        }
      });

      // Close menus on Escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.closeAllMenus();
      });
    },

    closeAllMenus() {
      $(".content-card__more-menu--active").forEach((menu) => {
        menu.classList.remove("content-card__more-menu--active");
      });
    },
  };

  // ===== INITIALIZATION =====
  const init = () => {
    // Common initializations for all pages
    header.init();
    dropdowns.init();
    search.init();
    notifications.init();
    overlay.init();
    toast.init();
    events.init();

    // Page-specific initializations
    if (isMyListPage()) {
      // My List page
      myListPage.init();
    } else {
      // Home page and other pages
      hero.init();
      content.init();
    }

    console.log(
      "Netflix Clone initialized",
      isMyListPage() ? "(My List Page)" : "(Home Page)"
    );
  };

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  return { state, api, myList, toast };
})();
