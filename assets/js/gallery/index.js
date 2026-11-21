const galleries = [...document.querySelectorAll('.gallery-viewport')];
const lightbox = document.querySelector('#gallery-lightbox');
const galleryTracks = galleries.map((viewport) => viewport.querySelector('.gallery-track')).filter(Boolean);
const updateMarqueeState = () => {
  const paused = document.visibilityState !== 'visible' || Boolean(lightbox?.open) ||
    galleries.some((viewport) => viewport.dataset.touching === 'true' || viewport.dataset.hovering === 'true' || viewport.dataset.keyboardFocus === 'true') ||
    galleries.some((viewport) => [...viewport.querySelectorAll('video')].some((video) => !video.paused));
  galleryTracks.forEach((track) => track.classList.toggle('is-paused', paused));
};

if (galleries.length) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  galleries.forEach((viewport) => {
    const track = viewport.querySelector('.gallery-track');
    const slides = [...track.querySelectorAll('.gallery-card')];
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap) || 0;
    const width = slides[0]?.getBoundingClientRect().width || 0;
    const distance = slides.length * (width + gap);
    const speed = reducedMotion ? 40 : (viewport.id === 'gallery-videos' ? 108 : 88);
    track.style.setProperty('--marquee-distance', `${distance}px`);
    track.style.setProperty('--marquee-duration', `${distance / speed}s`);

    slides.forEach((slide) => {
      const copy = slide.cloneNode(true);
      copy.classList.add('gallery-card--clone');
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('button, a, [tabindex]').forEach((item) => { item.tabIndex = -1; });
      copy.querySelectorAll('video').forEach((video) => {
        const poster = document.createElement('img');
        poster.src = video.poster;
        poster.alt = '';
        poster.width = 520;
        poster.height = 924;
        poster.loading = 'lazy';
        poster.decoding = 'async';
        video.replaceWith(poster);
      });
      track.append(copy);
    });

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        viewport.dataset.touching = 'true';
        updateMarqueeState();
      }
    }, { passive: true });
    viewport.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') {
        viewport.dataset.hovering = 'true';
        updateMarqueeState();
      }
    });
    viewport.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') {
        delete viewport.dataset.hovering;
        updateMarqueeState();
      }
    });
    const release = (event) => {
      if (event?.pointerType && !['touch', 'pen'].includes(event.pointerType)) return;
      delete viewport.dataset.touching;
      updateMarqueeState();
    };
    document.addEventListener('pointerup', release);
    document.addEventListener('pointercancel', release);
    viewport.addEventListener('focusin', (event) => {
      if (event.target.matches(':focus-visible')) {
        viewport.dataset.keyboardFocus = 'true';
        updateMarqueeState();
      }
    });
    viewport.addEventListener('focusout', () => requestAnimationFrame(() => {
      if (!viewport.contains(document.activeElement)) {
        delete viewport.dataset.keyboardFocus;
        updateMarqueeState();
      }
    }));
    viewport.querySelectorAll('video').forEach((video) => {
      video.addEventListener('play', updateMarqueeState);
      video.addEventListener('pause', updateMarqueeState);
    });
  });
  updateMarqueeState();
  document.addEventListener('visibilitychange', updateMarqueeState);
  lightbox?.addEventListener('close', updateMarqueeState);
}

const lightboxImage = lightbox?.querySelector('.lightbox-image');
document.querySelectorAll('.gallery-photo-open[data-full]').forEach((button) => button.addEventListener('click', () => {
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = button.dataset.full;
  lightboxImage.alt = button.dataset.alt || '';
  lightbox.showModal();
  updateMarqueeState();
}));
lightbox?.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
