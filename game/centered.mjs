const side=document.querySelector('.sidebar'),panel=document.querySelector('.map-panel'),app=document.querySelector('#app');
app.insertBefore(document.querySelector('.inventory-section'),document.querySelector('.footer'));
const bag=document.querySelector('.inventory-section'),view=document.querySelector('#bag-button');bag.append(view);
const goal=document.createElement('button');goal.className='compact-goal';document.querySelector('.scene-heading').after(goal);
const rail=document.createElement('nav');rail.className='tool-rail';app.append(rail);
const sections=[document.querySelector('.objective-section'),document.querySelector('.scene-section')];let active=-1;
function close(){active=-1;side.classList.remove('tool-open');for(const b of rail.children)b.setAttribute('aria-expanded','false');}
function open(i){if(active===i)return close();close();active=i;sections.forEach((s,n)=>s.hidden=n!==i);side.classList.add('tool-open');side.dataset.tool=i;document.querySelector('#tool-title').textContent=i===0?'接下來的方向':'校園地圖';rail.children[i].setAttribute('aria-expanded','true');}
['目標','地圖','背包','筆記'].forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>i<2?open(i):(close(),document.querySelector(i===2?'#bag-button':'#journal-button').click());rail.append(b);});
const head=document.createElement('header');head.className='tool-heading';head.innerHTML='<h2 id="tool-title">探索工具</h2>';const x=document.createElement('button');x.className='tool-dismiss';x.setAttribute('aria-label','關閉工具面板');x.textContent='×';x.onclick=close;head.append(x);side.prepend(head);goal.onclick=()=>open(0);const source=document.querySelector('#objective-main');function update(){goal.textContent=source.textContent+' ↗';}new MutationObserver(update).observe(source,{childList:true,subtree:true});update();document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});

const full=document.createElement('button');full.className='icon-button';full.id='fullscreen-button';full.textContent='⛶';full.title='全螢幕';full.setAttribute('aria-label','進入全螢幕');document.querySelector('.header-tools').prepend(full);
full.onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else try{await document.documentElement.requestFullscreen();}catch{app.classList.toggle('is-immersive');}window.dispatchEvent(new Event('resize'));};
document.addEventListener('fullscreenchange',()=>{full.setAttribute('aria-label',document.fullscreenElement?'離開全螢幕':'進入全螢幕');window.dispatchEvent(new Event('resize'));});

// One persistent menu entry; secondary tools remain available on demand.
const menu=document.createElement('button');menu.className='menu-toggle';menu.textContent='☰ 選單';menu.setAttribute('aria-expanded','false');app.append(menu);
menu.onclick=()=>{const expanded=app.classList.toggle('menu-expanded');menu.setAttribute('aria-expanded',String(expanded));if(!expanded)close();};
for(const button of rail.children)button.addEventListener('click',()=>{app.classList.remove('menu-expanded');menu.setAttribute('aria-expanded','false');});
const nearby=document.querySelector('#nearby-text'),strip=document.querySelector('.interaction-strip');function syncNearby(){strip.classList.toggle('has-nearby',!document.querySelector('#interact-button').disabled);}
new MutationObserver(syncNearby).observe(document.querySelector('#interact-button'),{attributes:true});syncNearby();
