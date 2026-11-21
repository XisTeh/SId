const presets = {
  compact: { label: 'Compacto', width: 320, height: 568 },
  regular: { label: 'Android', width: 360, height: 800 },
  iphone: { label: 'iPhone', width: 393, height: 852 },
  large: { label: 'Tela grande', width: 430, height: 932 },
};

const stage = document.querySelector('.device-stage');
const space = document.querySelector('.device-space');
const frame = document.querySelector('.device-frame');
const screen = document.querySelector('.device-screen');
const caption = document.querySelector('.device-caption');
const sitePreview = document.querySelector('#site-preview');
const choices = [...document.querySelectorAll('[data-device]')];
const sectionChoices = [...document.querySelectorAll('[data-preview-section]')];
let activePreset = presets.iphone;

const initialSection = new URLSearchParams(location.search).get('section');
function setPreviewSection(section) {
  if (!sitePreview || !['inicio', 'videos'].includes(section)) return;
  sitePreview.src = `index.html?preview=${Date.now()}#${section}`;
  sectionChoices.forEach((button) => button.classList.toggle('is-active', button.dataset.previewSection === section));
}
sectionChoices.forEach((button) => button.addEventListener('click', () => setPreviewSection(button.dataset.previewSection)));
setPreviewSection(initialSection || 'inicio');

function fitDevice() {
  if (!stage || !space || !frame || !screen) return;
  const availableWidth = stage.clientWidth - 38;
  const availableHeight = stage.clientHeight - (caption?.offsetHeight || 0) - 54;
  const scale = Math.min(1, availableWidth / (activePreset.width + 18), availableHeight / (activePreset.height + 18));
  screen.style.setProperty('--screen-width', `${activePreset.width}px`);
  screen.style.setProperty('--screen-height', `${activePreset.height}px`);
  frame.style.width = `${activePreset.width + 18}px`;
  frame.style.height = `${activePreset.height + 18}px`;
  frame.style.transform = `translateX(-50%) scale(${scale})`;
  space.style.width = `${(activePreset.width + 18) * scale}px`;
  space.style.height = `${(activePreset.height + 18) * scale}px`;
  if (caption) caption.textContent = `${activePreset.label} · ${activePreset.width} × ${activePreset.height} px`;
}

choices.forEach((button) => button.addEventListener('click', () => {
  const preset = presets[button.dataset.device];
  if (!preset) return;
  activePreset = preset;
  choices.forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('is-active', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  fitDevice();
}));

window.addEventListener('resize', fitDevice, { passive: true });
new ResizeObserver(fitDevice).observe(stage);
fitDevice();
