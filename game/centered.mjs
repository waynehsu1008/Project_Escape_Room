const side=document.querySelector('.sidebar'),panel=document.querySelector('.map-panel'),app=document.querySelector('#app');
panel.after(document.querySelector('.inventory-section'));
const goal=document.createElement('button');goal.className='compact-goal';document.querySelector('.scene-heading').after(goal);
const rail=document.createElement('nav');rail.className='tool-rail';app.append(rail);
const sections=[document.querySelector('.objective-section'),document.querySelector('.scene-section')];let active=-1;
function close(){active=-1;side.classList.remove('tool-open');for(const b of rail.children)b.setAttribute('aria-expanded','false');}
function open(i){if(active===i)return close();close();active=i;sections.forEach((s,n)=>s.hidden=n!==i);side.classList.add('tool-open');rail.children[i].setAttribute('aria-expanded','true');}
['目標','地圖','背包','筆記'].forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>i<2?open(i):(close(),document.querySelector(i===2?'#bag-button':'#journal-button').click());rail.append(b);});
const x=document.createElement('button');x.textContent='關閉 ×';x.onclick=close;side.prepend(x);goal.onclick=()=>open(0);const source=document.querySelector('#objective-main');function update(){goal.textContent=source.textContent+' ↗';}new MutationObserver(update).observe(source,{childList:true,subtree:true});update();document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
