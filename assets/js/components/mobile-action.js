const mobileAction = document.querySelector('.mobile-action');
const hero = document.querySelector('.hero');
if (mobileAction && hero && 'IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver(([entry]) => {
    mobileAction.classList.toggle('is-visible', !entry.isIntersecting);
  }, { threshold: 0 });
  heroObserver.observe(hero);
}
