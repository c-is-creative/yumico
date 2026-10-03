/* Progressive enhancement only. All text, navigation and project images live in HTML. */
(() => {
  'use strict';
  const projects = [...document.querySelectorAll('.project')];
  function revealHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const project = document.getElementById(id);
    if (project?.matches('.project')) { project.open = true; project.scrollIntoView({ block: 'start' }); }
  }
  window.addEventListener('hashchange', revealHash);
  if (location.hash) requestAnimationFrame(revealHash);
  // Preserve project anchors when switching languages on the archive.
  document.querySelectorAll('.languages a').forEach(link => link.addEventListener('click', () => {
    if (location.hash && document.querySelector('.archive')) link.hash = location.hash;
  }));
  // Slow, reversible movement only for overflowing, visible photo strips.
  // Hover/focus pauses it; touch, wheel and keyboard interactions pause it persistently.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const strips = [...document.querySelectorAll('.photo-strip')].map(el => ({
    el, direction: 1, position: 0,
    manualPause: reducedMotion.matches, visible: false, edgeWait: 0, max: 0
  }));
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => { const s = strips.find(s => s.el === entry.target); if (s) s.visible = entry.isIntersecting; });
  }, {threshold: 0.05});
  function updateControl(s) {
    s.max = Math.max(0, s.el.scrollWidth - s.el.clientWidth);

  }
  strips.forEach(s => {
    visibility.observe(s.el);
    new ResizeObserver(() => updateControl(s)).observe(s.el);
    s.el.querySelectorAll('img').forEach(img => img.addEventListener('load', () => updateControl(s)));
    const pause = () => { s.manualPause = true; updateControl(s); };
    s.el.addEventListener('dblclick', pause);
    s.el.addEventListener('mouseleave', () => { s.position = s.el.scrollLeft; s.manualPause = reducedMotion.matches; });
    s.el.addEventListener('focusout', () => { s.position = s.el.scrollLeft; s.manualPause = reducedMotion.matches; });
    ['pointerdown','wheel','keydown'].forEach(type => s.el.addEventListener(type, pause, {passive:true}));
    s.el.closest('details.project')?.addEventListener('toggle', () => updateControl(s));
    updateControl(s);
  });
  reducedMotion.addEventListener('change', () => { strips.forEach(s => { s.manualPause = reducedMotion.matches; updateControl(s); }); });
  let last = 0;
  function tick(now) {
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
    for (const s of strips) {
      if (!s.visible || s.manualPause || s.max < 2 || document.hidden || s.el.matches(':hover,:focus-within') || document.querySelector('dialog[open]')) continue;
      if (s.edgeWait > 0) { s.edgeWait -= dt; continue; }
      s.position = Math.max(0, Math.min(s.max, s.position + s.direction * 14 * dt));
      s.el.scrollLeft = s.position;
      if (s.el.scrollLeft >= s.max - 1) { s.direction = -1; s.edgeWait = 1.4; }
      else if (s.el.scrollLeft <= 0 && s.direction < 0) { s.direction = 1; s.edgeWait = 1.4; }
    }
    requestAnimationFrame(tick);
  }
  if (strips.length) requestAnimationFrame(tick);
  const dialog = document.querySelector('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let images = [], index = 0, opener = null;
  const img = dialog.querySelector('.lightbox-image');
  const prev = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  function show() {
    const a = images[index];
    img.src = a.href;
    img.alt = a.querySelector('img').alt;
    dialog.querySelector('.lightbox-caption').textContent = img.alt;
    dialog.querySelector('.lightbox-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
    prev.disabled = index === 0;
    next.disabled = index === images.length - 1;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-lightbox]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    const group = link.closest('[data-gallery]') || link.parentElement;
    images = [...group.querySelectorAll('[data-lightbox]')];
    index = images.indexOf(link);
    show(); dialog.showModal(); dialog.querySelector('.lightbox-close').focus();
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  prev.addEventListener('click', () => { if (index > 0) { index--; show(); } });
  next.addEventListener('click', () => { if (index < images.length - 1) { index++; show(); } });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); prev.click(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); }
  });
  dialog.addEventListener('close', () => { img.removeAttribute('src'); opener?.focus(); });
})();
