'use strict';
// 状態 S と、そこから決まる値。保存と読み込み

const newBench = () => ({rice:false, fill:null, squeeze:0, nori:false});
const S = {
  phase:'title', day:1, wage:1050, savings:0, up:{}, buff:null, buffWeek:0, own:false, muted:false,
  t:0, sales:0, tips:0, served:0, lost:0, misses:0, combo:0,
  seats:[null,null,null], spawnT:0, bench:newBench(), conf:null,
  rice:8, cookT:0, fry:{kara:{t:0,stock:0}, ebi:{t:0,stock:0}}, mix:{step:0, stock:4}
};
const stockOf = f => f === 'tuna' ? S.mix : S.fry[f];
const buffOn = id => S.buff === id && S.buffWeek === weekOf(S.day);
const riceCap = () => S.up.cooker ? 14 : 8;
const cookTime = () => S.up.quick ? 4.5 : 8;
const FRY_TIME = 6;
const batch = () => S.up.batch ? 5 : 3;

/* ---------- 保存 ---------- */
const KEY = 'onigiri-shift-plus';
const snap = () => ({day:S.day, wage:S.wage, savings:S.savings, up:S.up, buff:S.buff, buffWeek:S.buffWeek, own:S.own});
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(snap())); }catch(e){} }
function apply(d){
  if(!d || !(d.day >= 1)) return;
  S.day = d.day; S.wage = d.wage || 1050; S.savings = d.savings || 0;
  S.up = d.up || {}; S.buff = d.buff || null; S.buffWeek = d.buffWeek || 0; S.own = !!d.own;
}
function load(){ try{ apply(JSON.parse(localStorage.getItem(KEY) || 'null')); }catch(e){} }
