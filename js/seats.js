'use strict';
// 客席：来店、伝票の表示、渡す処理

const seatEls = [$('seat0'), $('seat1'), $('seat2')];
const seatsEl = $('seats');
const PREF = {soft:'ふんわり', firm:'しっかり'};

function spawn(i){
  const cf = S.conf;
  const has = k => S.seats.some(c => c && c.kind === k);
  let x = Math.random();
  const take = (on, p) => { if(!on) return false; if(x < p) return true; x -= p; return false; };
  const kind = take(cf.reg && !has('reg'), 0.12) ? 'reg'
    : take(cf.reg2 && !has('reg2'), 0.1) ? 'reg2'
    : take(cf.rush, 0.18) ? 'rush'
    : take(cf.waver, 0.12) ? 'waver' : 'normal';
  let items = [], pref = null, look;
  if(kind === 'reg'){
    items = [{f:'ume', nori:true, done:false}]; pref = 'soft';
    look = {hair:3, hairCol:'#b9b9b2', skin:'#f6d3b3', cloth:'#c98bb3'};
  }else if(kind === 'reg2'){
    items = [{f:'kara', nori:false, done:false}, {f:'kara', nori:false, done:false}]; pref = 'firm';
    look = {hair:2, hairCol:'#1b1d1a', skin:'#eec39a', cloth:'#6aa27a'};
  }else{
    const n = kind === 'rush' || cf.maxItems === 1 ? 1 : (Math.random() < 0.55 ? 1 : 1 + Math.ceil(Math.random() * (cf.maxItems - 1)));
    for(let k = 0; k < n; k++) items.push({f: pick(cf.fills), nori: Math.random() >= cf.noNori, done:false});
    if(cf.pref && Math.random() < 0.3) pref = pick(['soft','firm']);
    look = {
      hair: Math.floor(Math.random() * 3),
      hairCol: pick(['#1b1d1a','#5a3d2b','#8f8f8a','#b5651d']),
      skin: pick(['#f6d3b3','#eec39a','#f9dcc4']),
      cloth: kind === 'rush' ? '#fbf9f1' : pick(['#d43a45','#f4b93e','#fbf9f1','#8fb4d9'])
    };
  }
  const mult = kind === 'rush' ? 0.55 : kind === 'reg' || kind === 'reg2' ? 1.3 : 1;
  const max = cf.patience * (1 + 0.6 * (items.length - 1)) * mult;
  S.seats[i] = Object.assign({kind, items, pref, masked: kind === 'reg' || kind === 'reg2',
    t:max, max, mood:'happy', leaving:null, leaveT:0, changed:false, prefBonus:0}, look);
  renderSeat(i);
  beep(520, 0.07);
}
function renderSeat(i){
  const el = seatEls[i], c = S.seats[i];
  if(!c){
    el.className = 'seat empty'; el.disabled = true; el.textContent = '空席';
    el.removeAttribute('aria-label'); return;
  }
  el.disabled = !!c.leaving;
  el.className = 'seat' + (c.leaving ? ' leaving ' + c.leaving : '');
  const tags = (c.kind === 'rush' ? '<span class="tag rush">急ぎ</span>' : '') +
    (c.masked ? '<span class="tag">常連</span>' : c.pref ? '<span class="tag">' + PREF[c.pref] + '</span>' : '');
  el.setAttribute('aria-label', '注文 ' + c.items.map(it => (c.masked && !it.done ? 'いつもの' : FILL[it.f].name + (it.nori ? '' : ' のりなし')) + (it.done ? ' 済' : '')).join('、') + '。タップで渡す');
  el.innerHTML = '<div class="face">' + faceSVG(c) + '</div><div class="tags">' + tags + '</div><ul class="slip">' +
    c.items.map(it => {
      if(c.masked && !it.done) return '<li><span class="q">？</span><span>いつもの</span></li>';
      return '<li class="' + (it.done ? 'done' : '') + '">' + mini(it.f, it.nori) +
        '<span>' + FILL[it.f].name + (it.nori ? '' : '<small>のりなし</small>') + '</span></li>';
    }).join('') +
    '</ul><div class="pat' + (c.mood === 'angry' ? ' hot' : '') + '"><i></i></div>';
  c.bar = el.querySelector('.pat i');
  c.bar.style.width = Math.max(0, c.t / c.max * 100) + '%';
  markSeats();
}
function markSeats(){
  const ready = S.bench.squeeze >= 2;
  seatEls.forEach((el, i) => {
    const c = S.seats[i];
    el.classList.toggle('can', !!(ready && c && !c.leaving));
  });
}
function pop(i, text, bad){
  const p = document.createElement('div');
  p.className = 'pop' + (bad ? ' bad' : '');
  p.textContent = text;
  p.style.left = (i * 33.333 + 16.666) + '%';
  seatsEl.appendChild(p);
  setTimeout(() => p.remove(), 1100);
}
function leave(i, how){
  const c = S.seats[i];
  c.leaving = how; c.leaveT = 0.55;
  renderSeat(i);
  const el = seatEls[i];
  el.classList.remove('leaving');
  void el.offsetWidth;
  el.classList.add('leaving');
}

function deliver(i){
  const c = S.seats[i], b = S.bench;
  if(S.phase !== 'play' || !c || c.leaving) return;
  if(b.squeeze < 2){ flashHint(b.rice ? 'まだにぎれていません' : 'まず ごはんをよそう'); beep(200, 0.08, 0, 'square'); return; }
  const key = b.fill || 'shio';
  // のり巻き機があれば、のりは注文に合わせて機械が巻く
  const it = c.items.find(x => !x.done && x.f === key && (S.up.nori || x.nori === b.nori));
  const firm = b.squeeze === 3;
  S.bench = newBench();
  if(!it){
    S.misses++; S.combo = 0;
    c.t -= c.max * 0.2;
    pop(i, 'それ ちがうよ', true);
    beep(170, 0.18, 0, 'square');
    renderBench(); updateHud();
    return;
  }
  it.done = true;
  S.sales += FILL[key].price;
  const fit = c.pref && (c.pref === 'firm') === firm;
  if(fit) c.prefBonus += 20;
  if(c.items.every(x => x.done)){
    const r = c.t / c.max;
    let tip = r > 0.75 ? 50 : r > 0.5 ? 30 : 0;
    if(c.kind === 'rush') tip *= 2;
    S.combo++; S.served++;
    if(S.combo >= 3) tip += 20;
    tip += c.prefBonus;
    if(buffOn('yakiniku')) tip *= 2;
    S.tips += tip;
    pop(i, (fit ? '好みぴったり！' : tip ? 'ありがとう！' : 'どうも') + (tip ? ' +' + tip + '円' : ''));
    beep(660, 0.09); beep(880, 0.14, 0.09);
    leave(i, 'happy');
  }else{
    pop(i, 'あと ' + c.items.filter(x => !x.done).length + '個');
    beep(660, 0.09);
    renderSeat(i);
  }
  renderBench(); updateHud();
}
seatEls.forEach((el, i) => el.addEventListener('click', () => deliver(i)));
