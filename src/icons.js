const paths = {
  dimension: '<path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5M12 12v10M7.5 4.5l9 5v5"/>',
  orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-40 12 12)"/><path d="M7 4a9 9 0 0 1 13 11M17 20A9 9 0 0 1 4 9"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7C12 12 12 12 12 14M12 17h.01"/>',
  'arrow-up-right': '<path d="M6 18 18 6M6 6h12v12"/>',
  'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  'chevron-right': '<path d="m9 5 7 7-7 7"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M15 4v16m3-10-2 2 2 2"/>',
  rotate: '<path d="M20 8a8 8 0 1 0 .2 7M20 3v5h-5"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  reset: '<path d="M4 10a8 8 0 1 1 .5 6M4 4v6h6M12 7v5l3 2"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 6v4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
  heart: '<path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z"/>',
  cards: '<rect x="7" y="3" width="13" height="17" rx="2"/><path d="m5 6-2 1 2 15 10-1M11 8h5m-5 4h5"/>',
  swords: '<path d="m14 3 7 0v7L7 21m-4-7 7 7M3 3h7l3 3m-3 4-7-7m11 11 7 7m-7 0 7-7"/>',
  pointer: '<path d="m5 3 14 9-7 2-3 7Z"/>',
  mountain: '<path d="m2 20 8-15 5 9 3-5 5 11ZM7 11l3 2 3-2"/>',
  ghost: '<path d="M4 21V10a8 8 0 0 1 16 0v11l-4-3-4 3-4-3ZM9 10v2m6-2v2"/>',
  flame: '<path d="M13 2s2 5-2 8c-2-2-2-4-2-4s-6 5-5 10a8 8 0 0 0 16-1c0-5-4-8-4-8s1 5-2 6c2-7-1-11-1-11Z"/>',
  diamond: '<path d="m3 8 4-5h10l4 5-9 13ZM3 8h18M7 3l5 18 5-18"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5M7 10.5h7m-3.5-3.5v7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  dragon: '<path d="m4 18 2-8 5-4 2-4 2 5 5 2-2 5-6 1-3 6-5-3ZM14 10h.01"/>',
};

export function icon(name, className = '') {
  return `<svg class="${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.sparkles}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
}
