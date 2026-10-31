const panel = document.querySelector('.map-panel');
const world = document.querySelector('.game-world');
const strip = document.querySelector('.interaction-strip');
function fitMap() {
  if (!panel || !world || !strip) return;
  const width = Math.max(1, Math.floor(Math.min(panel.clientWidth - 4, (panel.clientHeight - strip.offsetHeight - 6) * 1000 / 667)));
  world.style.width = `${width}px`;
  strip.style.width = `${width}px`;
  const controls = panel.querySelector('.touch-controls');
  if (controls) {
    controls.style.left = `${world.offsetLeft + 12}px`;
    controls.style.bottom = `${panel.clientHeight - world.offsetTop - world.offsetHeight + 12}px`;
  }
}
new ResizeObserver(fitMap).observe(panel);
window.visualViewport?.addEventListener('resize', fitMap);
fitMap();
