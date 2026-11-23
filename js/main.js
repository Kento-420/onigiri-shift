'use strict';
// 進行：1日の開始、毎フレームの更新、終業、起動

const inPeak = fr => S.conf.peak && fr >= 0.5 && fr < 0.75;
function updateHud(){
  $('sales').textContent = yen(S.sales);
  $('combo').textContent = S.combo;
  const fr = Math.min(1, S.t / S.conf.dur);
  $('timeFill').style.transform = 'scaleX(' + fr + ')';
  const min = 600 + Math.floor(fr * 240 / 5) * 5;
  $('clock').textContent = Math.floor(min / 60) + ':' + String(min % 60).padStart(2, '0');
  $('peak').hidden = !(S.phase === 'play' && inPeak(fr));
}
function setHeader(){
  $('dayLabel').textContent = dayName(S.day);
  $('target').textContent = yen(S.conf.target);
  $('timebar').classList.toggle('haspeak', S.conf.peak);
}
function startDay(){
  S.conf = conf(S.day);
  Object.assign(S, {phase:'play', t:0, sales:0, tips:0, served:0, lost:0, misses:0, combo:0,
    seats:[null,null,null], spawnT:0.7, bench:newBench(), rice:riceCap(), cookT:0,
    fry:{kara:{t:0, stock:2}, ebi:{t:0, stock:2}}, mix:{step:0, stock:4}});
  hintFlash = 0;
  setHeader();
  seatsEl.querySelectorAll('.pop').forEach(p => p.remove());
  [0,1,2].forEach(renderSeat);
  buildFillings(); renderBench(); updateHud(); updateBars();
  overlay.hidden = true;
  beep(523, 0.1); beep(784, 0.16, 0.1);
}
function updateBars(){
  cookBtn.querySelector('.fillbar').style.width = S.cookT > 0 ? (1 - S.cookT / cookTime()) * 100 + '%' : '0';
  FRIED.forEach(f => {
    fryBtns[f].querySelector('.fillbar').style.width = S.fry[f].t > 0 ? (1 - S.fry[f].t / FRY_TIME) * 100 + '%' : '0';
  });
}
function tick(dt){
  S.t += dt;
  if(hintFlash > 0){ hintFlash -= dt; if(hintFlash <= 0) hint.innerHTML = hintText(); }
  if(S.t >= S.conf.dur){ endDay(); return; }
  const fr = S.t / S.conf.dur;

  // 仕込み
  if(S.cookT > 0){
    S.cookT -= dt;
    if(S.cookT <= 0){ S.cookT = 0; S.rice = riceCap(); beep(700, 0.1); beep(930, 0.14, 0.1); flashHint('ごはんが炊けた'); renderBench(); }
  }
  FRIED.forEach(f => {
    const x = S.fry[f];
    if(x.t > 0){
      x.t -= dt;
      if(x.t <= 0){ x.t = 0; x.stock += batch(); beep(620, 0.1); flashHint(FILL[f].name + 'が揚がった'); renderBench(); }
    }
  });
  updateBars();

  // 来店
  S.spawnT -= dt;
  if(S.spawnT <= 0){
    const free = [0,1,2].filter(i => !S.seats[i]);
    if(free.length){
      spawn(pick(free));
      S.spawnT = S.conf.spawnEvery * (0.8 + Math.random() * 0.4) * (inPeak(fr) ? 0.55 : 1);
    }else S.spawnT = 0.3;
  }
  S.seats.forEach((c, i) => {
    if(!c) return;
    if(c.leaving){
      c.leaveT -= dt;
      if(c.leaveT <= 0){ S.seats[i] = null; renderSeat(i); }
      return;
    }
    c.t -= dt;
    if(c.t <= 0){
      S.lost++; S.combo = 0;
      pop(i, 'もう行くね…', true);
      beep(150, 0.25, 0, 'sawtooth');
      leave(i, 'angry');
      return;
    }
    const r = c.t / c.max;
    if(c.kind === 'waver' && !c.changed && r < 0.6){
      const it = c.items.find(x => !x.done);
      if(it){
        it.f = pick(S.conf.fills.filter(f => f !== it.f));
        c.changed = true; c.t += 3;
        pop(i, 'やっぱり ' + FILL[it.f].name + ' で', true);
        beep(400, 0.08); beep(300, 0.1, 0.08);
        renderSeat(i);
      }
    }
    c.bar.style.width = (c.t / c.max * 100) + '%';
    const mood = r > 0.5 ? 'happy' : r > 0.25 ? 'flat' : 'angry';
    if(mood !== c.mood){
      c.mood = mood;
      seatEls[i].querySelector('.face').innerHTML = faceSVG(c);
      c.bar.parentNode.classList.toggle('hot', mood === 'angry');
    }
  });
  updateHud();
}

function endDay(){
  S.phase = 'result';
  S.seats = [null,null,null]; [0,1,2].forEach(renderSeat);
  S.bench = newBench(); S.cookT = 0; S.mix.step = 0; FRIED.forEach(f => { S.fry[f].t = 0; });
  renderBench(); updateBars(); updateHud();
  const cf = S.conf, hit = S.sales >= cf.target;
  const rank = hit && S.lost === 0 && S.misses <= 1 ? '優' : S.sales >= cf.target * 0.7 ? '良' : '可';
  const base = S.wage * 4, bonus = hit ? 500 : 0, total = base + S.tips + bonus;
  const raise = rank === '優' ? 30 : rank === '良' ? 10 : 0;
  const day = S.day, friday = day % 5 === 0;
  S.savings += total; S.wage += raise; S.day++;
  save();
  beep(784, 0.12); beep(988, 0.12, 0.12); beep(1175, 0.25, 0.24);
  showResult({day, friday, rank, hit, base, bonus, total, raise, target: cf.target});
}

/* ---------- 起動 ---------- */
let last = 0;
function frame(now){
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if(S.phase === 'play') tick(dt);
  requestAnimationFrame(frame);
}
function start(data){
  load();
  if(data && data.day) apply(data);
  S.conf = conf(S.day);
  S.rice = riceCap();
  setHeader();
  buildFillings(); renderBench(); updateHud();
  showTitle();
  last = performance.now();
  requestAnimationFrame(frame);
}
const hot = window.claude && window.claude.hot;
if(hot && hot.snapshot) hot.snapshot(snap);
if(hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
