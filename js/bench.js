'use strict';
// まな板と手元：ごはん・仕込み・具・にぎる・のり

const board = $('board'), hint = $('hint');
const riceBtn = $('riceBtn'), cookBtn = $('cookBtn'), trashBtn = $('trashBtn'), squeezeBtn = $('squeezeBtn'), noriBtn = $('noriBtn');
const fillBox = $('fillings'), fryRow = $('fryRow');
const fryBtns = {kara:$('fry-kara'), ebi:$('fry-ebi')};
const tunaBtn = $('tunaBtn'), mayoBtn = $('mayoBtn'), mixBtn = $('mixBtn');
let hintFlash = 0;

function buildFillings(){
  fillBox.innerHTML = S.conf.fills.filter(f => f !== 'shio').map(f =>
    '<button class="btn' + (FILL[f].name.length >= 5 ? ' long' : '') + '" type="button" id="fill-' + f + '" data-f="' + f + '"><i class="dot" style="background:' + FILL[f].color + '"></i><span>' + FILL[f].name + '</span>' +
    (stocked(f) ? '<b class="cnt">0</b>' : '') + '</button>'
  ).join('');
  fryBtns.kara.hidden = !S.conf.fills.includes('kara');
  fryBtns.ebi.hidden = !S.conf.fills.includes('ebi');
}
fillBox.addEventListener('click', e => {
  const btn = e.target.closest('button'); if(!btn || btn.disabled) return;
  const b = S.bench;
  b.fill = b.fill === btn.dataset.f ? null : btn.dataset.f;
  beep(440, 0.05); renderBench();
});
riceBtn.addEventListener('click', () => {
  if(S.rice <= 0 || S.bench.rice) return;
  S.rice--; S.bench.rice = true; beep(330, 0.06); renderBench();
});
cookBtn.addEventListener('click', () => {
  if(S.cookT > 0 || S.rice >= riceCap()) return;
  S.cookT = cookTime(); beep(300, 0.08); renderBench();
});
FRIED.forEach(f => fryBtns[f].addEventListener('click', () => {
  const other = f === 'kara' ? 'ebi' : 'kara';
  if(S.fry[f].t > 0 || (!S.up.fryer2 && S.fry[other].t > 0)) return;
  S.fry[f].t = FRY_TIME; beep(360, 0.08); renderBench();
}));
mixBtn.addEventListener('click', () => {
  // ボウルにツナとマヨが両方入っていれば、混ぜてツナマヨにする
  const m = S.mix;
  if(!m.tuna || !m.mayo) return;
  m.tuna = m.mayo = false; m.stock += MIX_YIELD;
  beep(500, 0.06); beep(620, 0.1, 0.06);
  flashHint('ツナマヨが' + MIX_YIELD + '個できた');
  renderBench();
});
tunaBtn.addEventListener('click', () => { S.mix.tuna = true; beep(380, 0.06); renderBench(); });
mayoBtn.addEventListener('click', () => { S.mix.mayo = true; beep(440, 0.06); renderBench(); });
trashBtn.addEventListener('click', () => { S.bench = newBench(); beep(240, 0.06); renderBench(); });
squeezeBtn.addEventListener('click', () => {
  const b = S.bench; if(!b.rice || b.squeeze >= 3) return;
  if(b.squeeze === 0 && b.fill && stocked(b.fill)){
    const st = stockOf(b.fill);
    if(st.stock <= 0){ b.fill = null; renderBench(); return; }
    st.stock--;
  }
  b.squeeze++;
  beep(280 + b.squeeze * 70, 0.07);
  renderBench();
  board.classList.remove('squish'); void board.offsetWidth; board.classList.add('squish');
});
noriBtn.addEventListener('click', () => { S.bench.nori = !S.bench.nori; beep(500, 0.05); renderBench(); });

function flashHint(text){
  hint.innerHTML = '<b>' + text + '</b>';
  hintFlash = 1.3;
}
function renderBench(){
  const b = S.bench, play = S.phase === 'play';
  board.innerHTML = boardSVG();
  $('riceCnt').textContent = S.rice;
  riceBtn.disabled = !play || b.rice || S.rice <= 0;
  cookBtn.disabled = !play || S.cookT > 0 || S.rice >= riceCap();
  cookBtn.querySelector('span').textContent = S.cookT > 0 ? '炊飯中' : '炊く';
  cookBtn.classList.toggle('next', play && S.cookT <= 0 && S.rice <= 2);
  FRIED.forEach(f => {
    const fr = S.fry[f], other = S.fry[f === 'kara' ? 'ebi' : 'kara'], el = fryBtns[f];
    el.disabled = !play || fr.t > 0 || (!S.up.fryer2 && other.t > 0);
    el.querySelector('span').textContent = fr.t > 0 ? '揚げ中' : (f === 'kara' ? '唐揚げ 揚げる' : 'エビ 揚げる');
    el.classList.toggle('next', play && !el.disabled && fr.stock === 0 && S.conf.fills.includes(f));
  });
  const m = S.mix, both = m.tuna && m.mayo, low = m.stock === 0;
  tunaBtn.disabled = !play || m.tuna;  tunaBtn.classList.toggle('on', m.tuna);
  mayoBtn.disabled = !play || m.mayo;  mayoBtn.classList.toggle('on', m.mayo);
  mixBtn.disabled = !play || !both;
  tunaBtn.classList.toggle('next', play && low && !m.tuna);
  mayoBtn.classList.toggle('next', play && low && !m.mayo);
  mixBtn.classList.toggle('next', play && both);
  trashBtn.disabled = !play || !b.rice;
  squeezeBtn.disabled = !play || !b.rice || b.squeeze >= 3;
  noriBtn.disabled = !play || b.squeeze < 2 || !!S.up.nori;
  noriBtn.classList.toggle('on', b.nori);
  noriBtn.textContent = S.up.nori ? 'のり おまかせ' : b.nori ? 'のりを外す' : 'のりを巻く';
  squeezeBtn.textContent = !b.rice || b.squeeze === 0 || b.squeeze === 3 ? 'にぎる' : b.squeeze === 1 ? 'にぎる あと1回' : 'もう1回でしっかり';
  fillBox.querySelectorAll('button').forEach(el => {
    const f = el.dataset.f, st = stocked(f) ? stockOf(f) : null;
    if(st) el.querySelector('.cnt').textContent = st.stock;
    el.disabled = !play || !b.rice || b.squeeze > 0 || (st && st.stock <= 0);
    el.classList.toggle('on', b.fill === f);
    el.classList.toggle('next', play && !el.disabled && b.squeeze === 0 && !b.fill);
  });
  riceBtn.classList.toggle('next', play && !riceBtn.disabled);
  squeezeBtn.classList.toggle('next', play && b.rice && b.squeeze < 2 && (b.fill || b.squeeze > 0));
  noriBtn.classList.toggle('next', play && b.squeeze >= 2 && !b.nori && !S.up.nori);
  if(hintFlash <= 0) hint.innerHTML = hintText();
  markSeats();
}
function hintText(){
  const b = S.bench;
  if(S.phase !== 'play') return '';
  if(!b.rice){
    if(S.rice <= 0) return S.cookT > 0 ? 'ごはんが炊けるのを待つ' : '<b>ごはんが空。炊く</b>';
    return '伝票を見て、<b>ごはんをよそう</b>';
  }
  if(b.squeeze === 0 && !b.fill && S.mix.stock === 0) return 'ツナマヨ切れ。<b>ツナとマヨを入れて混ぜる</b>';
  if(b.squeeze === 0) return b.fill ? FILL[b.fill].name + 'をのせた。<b>にぎる</b>' : '<b>具をえらぶ</b>' + (S.conf.fills.includes('shio') ? '（なしで塩むすび）' : '');
  if(b.squeeze === 1) return '<b>あと1回</b> にぎる';
  return (b.fill ? FILL[b.fill].name : '塩むすび') + (b.squeeze === 3 ? '・しっかり' : '・ふんわり') + (S.up.nori ? '' : b.nori ? '・のりあり' : '・のりなし') + '。<b>お客さんをタップ</b>';
}
