const panel = document.querySelector('.map-panel');
const world = document.querySelector('.game-world');
const strip = document.querySelector('.interaction-strip');
function fitMap() {
  if (!panel || !world || !strip) return;
  const layout=panel.parentElement, sidebar=layout.querySelector('.sidebar');
  const sideBySide=matchMedia('(min-width:851px), (min-width:600px) and (max-width:850px) and (max-height:500px)').matches;
  const shellStyle=getComputedStyle(layout.parentElement);
  const available=layout.parentElement.clientWidth-parseFloat(shellStyle.paddingLeft)-parseFloat(shellStyle.paddingRight);
  const sidebarSpace=sideBySide ? sidebar.offsetWidth+parseFloat(getComputedStyle(layout).columnGap) : 0;
  const width = Math.max(1, Math.floor(Math.min(available-sidebarSpace-4, (panel.clientHeight - strip.offsetHeight - 6) * 1000 / 667)));
  layout.style.width=sideBySide ? `${width+sidebarSpace+4}px` : '100%';
  layout.style.justifySelf='center';
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

// Fullscreen the document so dialog top-layer content remains available.
const app = document.querySelector('#app');
const fullscreenButton = document.querySelector('#fullscreen-button');
let expanded = false;
function setExpanded(value) {
  expanded = value;
  app.classList.toggle('is-immersive',value);
  fullscreenButton.setAttribute('aria-pressed',String(value));
  fullscreenButton.setAttribute('aria-label',value ? '離開全螢幕' : '進入全螢幕');
  fullscreenButton.title = value ? '離開全螢幕（Esc）' : '全螢幕';
  requestAnimationFrame(fitMap);
}
fullscreenButton.addEventListener('click',async()=>{
  if(expanded){
    if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});
    else setExpanded(false);
    return;
  }
  try {
    await document.documentElement.requestFullscreen();
    setExpanded(true);
  } catch {
    // Browsers without Fullscreen API still get a reversible full-window mode.
    setExpanded(true);
  }
});
document.addEventListener('fullscreenchange',()=>setExpanded(Boolean(document.fullscreenElement)));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && expanded && !document.fullscreenElement && !document.querySelector('dialog[open]'))setExpanded(false);
});
