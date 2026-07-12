/**
 * disco-loader.js — Shared runtime for all Discoolver guide templates.
 *
 * Provides:
 *   window.BADGE_COLORS  — badge → hex color map
 *   window.DISCO_SVG     — isotipo SVG string (11×10px)
 *   window.renderCard(item) — builds vertical card HTML
 *   window.renderCardH(item) — builds horizontal card HTML
 *
 * Auto-fetches guide config when ?guide=<id> is in the URL and calls
 * window.onGuideData(config). Without ?guide, nothing happens (static demo).
 */
(function () {

  // ── Shared constants (eliminates duplication across all section templates) ──

  window.BADGE_COLORS = {
    'WOW':          '#C8006B', 'NUEVO 2026':  '#C8006B',
    'ICÓNICO':      '#111827', 'LOCAL-OWNED': '#059669',
    'BEST VIEW':    '#2563EB', 'ROMÁNTICO':   '#E11D48',
    'SOLO OK':      '#7C3AED', 'FAMILY OK':   '#D97706',
    'DESIGN':       '#475569', 'WELLNESS':    '#0D9488',
    'AF-FRIENDLY':  '#65A30D', 'LATE NIGHT':  '#4338CA',
    'VALUE / €':    '#6B7280', 'SPLURGE / €€€':'#B8860B',
    'LUXURY':       '#B8860B', 'TRENDY':      '#C8006B',
    'BOUTIQUE':     '#475569', 'LOCAL':       '#059669',
    'SPEAKEASY':    '#4338CA',
  };

  window.DISCO_SVG = '<svg width="11" height="10" viewBox="0 0 110 100" fill="none">'
    + '<path d="M59 0 A59 50 0 0 0 59 100 Z" fill="#C8006B"/>'
    + '<polygon points="72,13 110,50 72,87" fill="#C8006B"/></svg>';

  // ── Card renderers ────────────────────────────────────────────────────────

  function _badgePill(badge, absolute) {
    var bc = window.BADGE_COLORS[badge] || '#111827';
    var pos = absolute
      ? 'position:absolute;top:4px;left:4px;z-index:2;'
      : '';
    return '<span style="' + pos + 'background:' + bc + ';color:#fff;'
      + 'font-size:8px;font-weight:700;letter-spacing:0.05em;padding:2px 6px;line-height:1.4;">'
      + badge + '</span>';
  }

  function _cardLinks(item) {
    var out = '';
    if (item.web)     out += '<div class="card-web">' + item.web + '</div>';
    if (item.address) out += '<div class="card-addr">' + item.address + '</div>';
    if (item.event_when)  out += '<div class="card-web">Cuándo: ' + item.event_when + '</div>';
    if (item.event_where) out += '<div class="card-addr">Dónde: ' + item.event_where + '</div>';
    if (item.discoolverUrl)
      out += '<a href="' + item.discoolverUrl + '" class="disco-link">'
           + window.DISCO_SVG + ' VER EN DISCOOLVER →</a>';
    return out;
  }

  function _photoPh(height) {
    var acc = window.GUIDE_ACCENT || '#C8006B';
    var h = height || 100;
    // Gradient visible: de color de colección al 18% → gris claro
    return 'width:100%;height:' + h + 'px;'
      + 'background:linear-gradient(150deg,' + acc + '2e 0%,' + acc + '14 50%,#dddde6 100%);'
      + 'display:flex;align-items:center;justify-content:center;';
  }

  /** Vertical card — used by .card-photo-sm templates (restaurantes) */
  window.renderCard = function (item) {
    var photo = item.photo
      ? '<img src="' + item.photo + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">'
      : '<div style="' + _photoPh(100) + '"></div>';
    return '<div class="card">'
      + '<div class="card-photo-sm" style="position:relative;">'
      + photo
      + (item.badge ? _badgePill(item.badge, true) : '')
      + '</div>'
      + '<div class="card-name">' + (item.name || '').toUpperCase() + '</div>'
      + (item.tagline ? '<div class="card-tag">' + item.tagline + '</div>' : '')
      + (item.description ? '<p class="card-desc">' + item.description + '</p>' : '')
      + _cardLinks(item)
      + '</div>';
  };

  /** Horizontal card — used by secondary grid in restaurantes */
  window.renderCardH = function (item) {
    var acc = window.GUIDE_ACCENT || '#C8006B';
    var thumbBg = item.photo ? '#d4d4d4'
      : 'linear-gradient(135deg,' + acc + '22 0%,' + acc + '0d 60%,#e8e8ec 100%)';
    var photo = item.photo
      ? '<img src="' + item.photo + '" alt="" style="width:100%;height:100%;object-fit:cover;">'
      : '';
    return '<div class="card card-h">'
      + '<div class="card-h-thumb" style="position:relative;flex-shrink:0;width:118px;height:78px;'
      + 'background:' + thumbBg + ';overflow:hidden;">'
      + photo
      + (item.badge ? _badgePill(item.badge, true) : '')
      + '</div>'
      + '<div class="card-h-body">'
      + '<div class="card-name">' + (item.name || '').toUpperCase() + '</div>'
      + (item.tagline ? '<div class="card-tag">' + item.tagline + '</div>' : '')
      + (item.description ? '<p class="card-desc">' + item.description + '</p>' : '')
      + _cardLinks(item)
      + '</div></div>';
  };

  /** Card with .card-img container — used by fiesta, arte, alojamientos, etc. */
  window.renderCardImg = function (item) {
    var photo = item.photo
      ? '<img src="' + item.photo + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">'
      : '';
    return '<div class="card">'
      + '<div class="card-img" style="position:relative;">'
      + photo
      + '<div class="card-img-overlay"></div>'
      + (item.badge ? _badgePill(item.badge, true) : '')
      + '</div>'
      + '<div class="card-name">' + (item.name || '').toUpperCase() + '</div>'
      + (item.tagline ? '<div class="card-tag">' + item.tagline + '</div>' : '')
      + (item.description ? '<p class="card-desc">' + item.description + '</p>' : '')
      + _cardLinks(item)
      + '</div>';
  };

  // ── Page number injection ─────────────────────────────────────────────────
  // Injects pageNumber from GUIDE_CONFIG into .ph-number and footer page num.
  window.injectPageNumber = function(pageNum) {
    if (!pageNum) return;
    var el = document.querySelector('.ph-number');
    if (el) el.textContent = pageNum;
    // Footer right side number (multiple selector patterns used across templates)
    var footerNum = document.querySelector(
      '.cat-footer span:last-child, .pg-footer span:last-child, .mini-footer span:last-child'
    );
    if (footerNum && footerNum.style && footerNum.style.fontFamily !== undefined) {
      footerNum.textContent = pageNum;
    }
  };

  // ── Guide config loader ───────────────────────────────────────────────────

  var id = new URLSearchParams(location.search).get('guide');
  if (!id) return;

  fetch('/api/v2/guides/' + id + '/export/config')
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      // primaryColor = color de colección (indigo, ámbar, naranja…)
      // accentColor  = magenta corporativo Discoolver
      window.GUIDE_ACCENT  = cfg.primaryColor || cfg.accentColor || '#C8006B';
      window.GUIDE_PRIMARY = cfg.primaryColor || '#C8006B';
      if (typeof window.onGuideData === 'function') {
        window.onGuideData(cfg);
      } else {
        // Template script not yet executed — store and retry on next tick
        window._pendingGuideData = cfg;
        setTimeout(function () {
          if (typeof window.onGuideData === 'function' && window._pendingGuideData) {
            window.onGuideData(window._pendingGuideData);
            window._pendingGuideData = null;
          }
        }, 0);
      }
    })
    .catch(function (e) { console.warn('[disco-loader]', e); });
})();
