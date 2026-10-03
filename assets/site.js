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
  // Dragging shares one position with slow movement and decaying flick momentum.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const strips = [...document.querySelectorAll('.photo-strip')].map(el => ({
    el, direction: 1, position: el.scrollLeft, velocity: 0, drag: null,
    resumeAt: 0, suppressUntil: 0, visible: false, edgeWait: 0, max: 0
  }));
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => { const s = strips.find(s => s.el === entry.target); if (s) s.visible = entry.isIntersecting; });
  }, {threshold: 0.05});
  const clamp = (s, x) => Math.max(0, Math.min(s.max, x));
  function updateStrip(s) {
    s.max = Math.max(0, s.el.scrollWidth - s.el.clientWidth);
    s.position = clamp(s, s.el.scrollLeft);
  }
  strips.forEach(s => {
    visibility.observe(s.el);
    new ResizeObserver(() => updateStrip(s)).observe(s.el);
    s.el.querySelectorAll('img').forEach(img => img.addEventListener('load', () => updateStrip(s)));
    s.el.querySelectorAll('video').forEach(video => video.addEventListener('loadedmetadata', () => updateStrip(s)));
    s.el.addEventListener('dragstart', event => event.preventDefault());
    s.el.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || s.max < 2) return;
      s.velocity = 0; s.position = s.el.scrollLeft;
      s.drag = {id:event.pointerId, x:event.clientX, y:event.clientY,
        lastX:event.clientX, time:event.timeStamp, moved:false};
      s.resumeAt = Infinity;
    });
    s.el.addEventListener('pointermove', event => {
      const d = s.drag;
      if (!d || event.pointerId !== d.id) return;
      const dx = event.clientX - d.x, dy = event.clientY - d.y;
      if (!d.moved) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
          s.drag = null; s.resumeAt = performance.now() + 2500; return;
        }
        if (Math.abs(dx) < 6) return;
        d.moved = true; s.el.setPointerCapture(d.id); s.el.classList.add('is-dragging');
      }
      event.preventDefault();
      const elapsed = Math.max(1, event.timeStamp - d.time);
      const delta = d.lastX - event.clientX;
      s.position = clamp(s, s.position + delta); s.el.scrollLeft = s.position;
      s.velocity = s.velocity * 0.25 + (delta / elapsed * 1000) * 0.75;
      d.lastX = event.clientX; d.time = event.timeStamp;
    });
    const finish = event => {
      const d = s.drag;
      if (!d || event.pointerId !== d.id) return;
      s.drag = null; s.el.classList.remove('is-dragging');
      if (s.el.hasPointerCapture(d.id)) s.el.releasePointerCapture(d.id);
      if (d.moved) s.suppressUntil = performance.now() + 600;
      if (!d.moved || event.type === 'pointercancel' || event.timeStamp - d.time > 100) s.velocity = 0;
      s.velocity = Math.max(-2400, Math.min(2400, s.velocity));
      s.resumeAt = performance.now() + 2500;
    };
    ['pointerup','pointercancel'].forEach(type => window.addEventListener(type, finish));
    s.el.addEventListener('lostpointercapture', finish);
    s.el.addEventListener('click', event => {
      if (performance.now() < s.suppressUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    ['wheel','keydown'].forEach(type => s.el.addEventListener(type, () => {
      s.velocity = 0; s.resumeAt = performance.now() + 2500;
    }, {passive:true}));
    s.el.addEventListener('scroll', () => { if (!s.drag && !s.velocity) s.position = s.el.scrollLeft; }, {passive:true});
    s.el.closest('details.project')?.addEventListener('toggle', () => updateStrip(s));
    updateStrip(s);
  });
  const galleryVideos = [...document.querySelectorAll('.photo-strip video')];
  const videoVisibility = new IntersectionObserver(entries => {
    entries.forEach(entry => { entry.target.dataset.inView = entry.isIntersecting ? '1' : '0'; });
  }, {threshold:0.1});
  galleryVideos.forEach(video => videoVisibility.observe(video));
  function syncGalleryVideos() {
    for (const video of galleryVideos) {
      const shouldPlay = video.dataset.inView === '1' && !document.hidden && !document.querySelector('dialog[open]');
      if (video.dataset.playing === String(shouldPlay)) continue;
      video.dataset.playing = String(shouldPlay);
      if (shouldPlay) { video.muted = true; video.play().catch(() => {}); }
      else video.pause();
    }
  }
  let last = 0;
  function tick(now) {
    syncGalleryVideos();
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
    for (const s of strips) {
      if (!s.visible || s.drag || s.max < 2 || document.hidden || document.querySelector('dialog[open]')) continue;
      if (Math.abs(s.velocity) > 8) {
        const nextPosition = s.position + s.velocity * dt;
        s.position = clamp(s, nextPosition); s.el.scrollLeft = s.position;
        s.velocity *= Math.exp(-5 * dt);
        if (nextPosition !== s.position) s.velocity = 0;
        s.resumeAt = now + 2500;
        continue;
      }
      s.velocity = 0;
      if (reducedMotion.matches || now < s.resumeAt || s.el.matches(':hover,:focus-within')) continue;
      if (s.edgeWait > 0) { s.edgeWait -= dt; continue; }
      s.position = clamp(s, s.position + s.direction * 14 * dt);
      s.el.scrollLeft = s.position;
      if (s.position >= s.max - 1) { s.direction = -1; s.edgeWait = 1.4; }
      else if (s.position <= 0 && s.direction < 0) { s.direction = 1; s.edgeWait = 1.4; }
    }
    requestAnimationFrame(tick);
  }
  if (strips.length) requestAnimationFrame(tick);

  // Native dialog supplies Escape, focus containment, and a floating right-hand card.
  const information = [...document.querySelectorAll('details.information')];
  if (information.length && typeof HTMLDialogElement !== 'undefined') {
    const closeText = 'Close';
    const panel = document.createElement('dialog');
    panel.className = 'information-panel'; panel.setAttribute('aria-labelledby', 'information-panel-title');
    panel.innerHTML = `<div class="panel-toolbar"><h2 id="information-panel-title"></h2><button type="button" class="panel-close">${closeText} <span aria-hidden="true">×</span></button></div><div class="panel-content"></div>`;
    document.body.append(panel);
    let opener, closeTimer;
    const closePanel = () => {
      if (!panel.open || closeTimer) return;
      panel.classList.remove('is-visible');
      closeTimer = setTimeout(() => { panel.close(); closeTimer = null; }, reducedMotion.matches ? 0 : 240);
    };
    information.forEach(details => {
      const summary = details.querySelector('summary');
      summary.setAttribute('aria-haspopup', 'dialog');
      summary.addEventListener('click', event => {
        event.preventDefault(); opener = summary;
        panel.querySelector('h2').textContent = details.closest('.project')?.querySelector('h2')?.textContent || document.querySelector('h1')?.textContent;
        panel.querySelector('.panel-content').replaceChildren(details.querySelector('.information-card').cloneNode(true));
        panel.showModal(); requestAnimationFrame(() => panel.classList.add('is-visible'));
        panel.querySelector('button').focus();
      });
    });
    panel.querySelector('button').addEventListener('click', closePanel);
    panel.addEventListener('cancel', event => { event.preventDefault(); closePanel(); });
    panel.addEventListener('click', event => {
      const box = panel.getBoundingClientRect();
      if (event.target === panel && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) closePanel();
    });
    panel.addEventListener('close', () => { panel.classList.remove('is-visible'); opener?.focus(); });
  }
  const dialog = document.querySelector('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let media = [], index = 0, opener = null;
  const img = dialog.querySelector('.lightbox-image');
  const video = document.createElement('video');
  video.className = 'lightbox-video'; video.controls = true;
  video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
  video.hidden = true; img.after(video);
  const prev = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  function show() {
    const a = media[index];
    const isVideo = a.hasAttribute('data-lightbox-video');
    video.pause(); video.removeAttribute('src'); video.load();
    img.hidden = isVideo; video.hidden = !isVideo;
    const label = isVideo ? a.getAttribute('aria-label') : a.querySelector('img').alt;
    if (isVideo) {
      img.removeAttribute('src'); video.src = a.href;
      video.poster = a.querySelector('video').poster;
      video.setAttribute('aria-label', label); video.muted = true;
      video.play().catch(() => {});
    } else { img.src = a.href; img.alt = label; }
    dialog.querySelector('.lightbox-caption').textContent = label;
    dialog.querySelector('.lightbox-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}`;
    prev.disabled = index === 0;
    next.disabled = index === media.length - 1;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-lightbox],a[data-lightbox-video]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); opener = link;
    const group = link.closest('[data-gallery]') || link.parentElement;
    media = [...group.querySelectorAll('[data-lightbox],[data-lightbox-video]')];
    index = media.indexOf(link);
    dialog.showModal(); show(); syncGalleryVideos(); dialog.querySelector('.lightbox-close').focus();
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  prev.addEventListener('click', () => { if (index > 0) { index--; show(); } });
  next.addEventListener('click', () => { if (index < media.length - 1) { index++; show(); } });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); prev.click(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); }
  });
  dialog.addEventListener('close', () => {
    img.removeAttribute('src'); video.pause(); video.removeAttribute('src'); video.load();
    opener?.focus(); syncGalleryVideos();
  });
})();
