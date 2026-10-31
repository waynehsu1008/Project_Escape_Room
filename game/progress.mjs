import { WORLD } from './world.mjs';

// Physical inspection points count once; conversations and doorways are separate.
export const EXPLORABLE = Object.entries(WORLD).flatMap(([scene,w]) =>
  w.points.filter(p => !['door','npc'].includes(p.kind)).map(p => ({ ...p, scene, sceneName:w.name, key:`${scene}:${p.id}` })));
export function exploration(state) {
  const known=new Set(state.discovered || []);
  const items=EXPLORABLE.map(p=>({...p,found:known.has(p.key)}));
  return {items, found:items.filter(p=>p.found).length,total:items.length};
}
export function migrateDiscovery(state) {
  const implied = new Set(state.clues);
  if(state.solved.includes('P01') || state.inventory.some(id=>['I01','I02','I03'].includes(id)))implied.add('drawer');
  if(state.solved.includes('P02'))implied.add('register');
  if(state.solved.includes('P03'))implied.add('player');
  if(state.inventory.includes('I04'))implied.add('cabinet');
  if(state.inventory.includes('I05'))implied.add('script');
  if(state.flags.photoPlaced)implied.add('photo');
  if(state.flags.scriptPlaced)implied.add('lectern');
  return EXPLORABLE.filter(p=>implied.has(p.id)).map(p=>p.key);
}
export function scoreRun(state) {
  const seconds=Math.max(0,Math.floor(state.elapsed));
  const hints=Object.values(state.hints).reduce((sum,n)=>sum+n,0);
  const hintBonus=Math.max(0,3000-hints*250);
  const timeBonus=Math.floor(3000/(1+seconds/600));
  return {seconds,hints,base:state.ended?4000:0,hintBonus,timeBonus,total:state.ended?4000+hintBonus+timeBonus:0};
}
export function tickClock(state,delta,visible) {
  if(!state.started || state.ended || !visible || !Number.isFinite(delta) || delta<=0)return state;
  return {...state,elapsed:state.elapsed+delta};
}
export function formatTime(seconds) {
  const n=Math.max(0,Math.floor(seconds));
  return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
}
