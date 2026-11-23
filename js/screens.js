'use strict';
// かぶせ画面：タイトル、申し送り、給与明細、週末、エンディング

const goalHTML = () => S.own
  ? '<p class="goal">自分の店は開業済み。貯金 ' + yen(S.savings) + '円</p>'
  : '<div class="goal">開業資金　' + yen(S.savings) + ' / ' + yen(GOAL) + '円<div class="gbar"><i style="width:' + Math.min(100, S.savings / GOAL * 100) + '%"></i></div></div>';

const overlay = $('overlay');
function showOverlay(html, keepScroll){
  const y = overlay.scrollTop;
  overlay.innerHTML = html; overlay.hidden = false;
  overlay.scrollTop = keepScroll ? y : 0;
}
const NOREN = '<div class="noren" aria-hidden="true"><span>こ</span><span>め</span><span>八</span></div>';
const STEPS = '<ol class="steps"><li>お客さんの伝票を見る</li><li>ごはんをよそって、具をえらぶ</li><li>2回にぎって、のりを巻く</li><li>お客さんをタップして渡す</li></ol>';

function showTitle(){
  S.phase = 'title';
  const cont = S.day > 1;
  showOverlay(NOREN +
    '<h1>こめ八 バイト日誌<br>大盛り</h1>' +
    '<p class="lead">駅前のおむすび屋「こめ八」で月曜から金曜まで働き、週末に休む。開業資金を貯めて、いつか自分の店を持つ。</p>' +
    '<div class="paper"><h2>しごとの流れ</h2>' + STEPS +
    '<p class="news">待たせるとお客さんは帰ってしまいます。早く渡すとチップ。ごはんと揚げものは切らす前に仕込むこと。</p>' +
    goalHTML() + '</div>' +
    '<div class="cta"><button class="btn big" type="button" id="goBtn">' + (cont ? dayName(S.day) + 'からつづける' : '出勤する') + '</button>' +
    (cont ? '<button class="btn small" type="button" id="resetBtn">最初からはじめる</button>' : '') + '</div>');
  const monday = cont && (S.day - 1) % 5 === 0;
  $('goBtn').addEventListener('click', !cont ? startDay : monday ? showWeekend : showIntro);
  if(cont) $('resetBtn').addEventListener('click', () => {
    apply({day:1}); save(); startDay();
  });
}
function showResult(r){
  const {day, friday, rank, hit, base, bonus, total, raise, target} = r;
  showOverlay(
    '<button class="retry" type="button" id="retryBtn">この日をやり直す</button>' +
    '<h1>' + dayName(day) + '<br>おつかれさま</h1>' +
    '<div class="paper"><div class="hanko" role="img" aria-label="店長の評価 ' + rank + '">' + rank + '</div>' +
    '<h2>給与明細</h2><dl class="pay">' +
    '<dt>売上</dt><dd>' + yen(S.sales) + '円</dd>' +
    '<dt>渡せた / 帰られた</dt><dd>' + S.served + '人 / ' + S.lost + '人</dd>' +
    '<dt>渡しまちがい</dt><dd>' + S.misses + '回</dd>' +
    '<dt>時給 ' + yen(S.wage - raise) + '円 × 4時間</dt><dd>' + yen(base) + '円</dd>' +
    '<dt>チップ・手当</dt><dd>' + yen(S.tips) + '円</dd>' +
    '<dt>大入り袋' + (hit ? '' : '（目標 ' + yen(target) + '円）') + '</dt><dd>' + yen(bonus) + '円</dd>' +
    '<dt class="sum">本日の支給</dt><dd class="sum">' + yen(total) + '円</dd></dl>' +
    '<p class="news"><b>店長より</b>　' + pick(COMMENT[rank]) + (raise ? ' 時給を' + raise + '円上げておくよ。' : '') + '</p>' +
    goalHTML() + '</div>' +
    '<div class="cta"><button class="btn big" type="button" id="nextBtn">' + (friday ? '週末へ' : dayName(S.day) + 'へ') + '</button></div>'
  );
  // 終業直後は手元の連打がそのまま当たるので、少しのあいだ押せなくする
  overlay.classList.add('lock');
  setTimeout(() => overlay.classList.remove('lock'), 1500);
  $('nextBtn').addEventListener('click', friday ? showWeekend : showIntro);
  let armed = false;
  $('retryBtn').addEventListener('click', e => {
    const el = e.currentTarget;
    if(!armed){
      // 押しまちがい防止：2回目のタップで確定
      armed = true; el.classList.add('armed'); el.textContent = 'もう一度押すとやり直し';
      setTimeout(() => { armed = false; el.classList.remove('armed'); el.textContent = 'この日をやり直す'; }, 3000);
      return;
    }
    S.day = day; S.wage -= raise; S.savings -= total; save(); startDay();
  });
}
function showIntro(){
  S.phase = 'intro';
  const d = S.day, cf = conf(d);
  const news = NEWS[d] || '12時台は昼ピーク。その前にごはんと揚げものを用意しておくこと。';
  const memo = (cf.reg ? '<br>' + MEMO1 : '') + (cf.reg2 ? '<br>' + MEMO2 : '');
  const buff = buffOn('sento') ? '<br>銭湯の効果で、今週はお客さんが少し長く待ってくれます。' : buffOn('yakiniku') ? '<br>焼肉の効果で、今週はチップが2倍。' : '';
  showOverlay(NOREN +
    '<h1>' + dayName(d) + '</h1>' +
    '<div class="paper"><h2>本日の申し送り</h2><dl class="pay">' +
    '<dt>時給</dt><dd>' + yen(S.wage) + '円</dd>' +
    '<dt>売上目標</dt><dd>' + yen(cf.target) + '円</dd></dl>' +
    '<p class="news">' + news + memo + buff + '</p>' + goalHTML() + '</div>' +
    '<div class="cta"><button class="btn big" type="button" id="goBtn">出勤する</button></div>');
  $('goBtn').addEventListener('click', startDay);
}
function showWeekend(keep){
  S.phase = 'weekend';
  const treated = S.buffWeek === weekOf(S.day);
  const row = (it, attr, state, can) => '<li><strong>' + it.name + '</strong><p>' + it.desc + '</p>' +
    '<button type="button" ' + attr + '="' + it.id + '"' + (can ? '' : ' disabled') + '>' + state + '</button></li>';
  showOverlay(
    '<h1 style="margin-top:24px">' + (weekOf(S.day) - 1) + '週目の週末</h1>' +
    '<p class="lead">一週間おつかれさま。貯金は <b>' + yen(S.savings) + '円</b>。</p>' +
    '<div class="paper"><h2>夢</h2><ul class="shop">' +
    (S.own ? '<li><strong>自分の店</strong><p>開業済み。屋号は「こめ九」。</p><button type="button" disabled>開業済み</button></li>'
      : row({id:'own', name:'自分の店を開く', desc:'物件と開業の費用。貯まったら、のれん分け。'}, 'data-goal', yen(GOAL) + '円', S.savings >= GOAL)) +
    '</ul>' + (S.own ? '' : goalHTML()) + '</div>' +
    '<div class="paper"><h2>開業準備</h2><p style="font-size:12px;font-weight:500;margin-bottom:8px">自分の店で使う道具を先に買っておく。店長が「うちで試運転していいよ」と置かせてくれる。</p><ul class="shop">' +
    SHOP.map(it => S.up[it.id] ? row(it, 'data-buy', '購入済み', false) : row(it, 'data-buy', yen(it.price) + '円', S.savings >= it.price)).join('') +
    '</ul></div>' +
    '<div class="paper"><h2>ごほうび（週に1つ）</h2><ul class="shop">' +
    TREAT.map(it => treated ? row(it, 'data-treat', S.buff === it.id ? '行ってきた' : 'また今度', false)
      : row(it, 'data-treat', yen(it.price) + '円', S.savings >= it.price)).join('') +
    '</ul></div>' +
    '<div class="cta"><button class="btn big" type="button" id="goBtn">月曜へ</button></div>', keep === true);
  $('goBtn').addEventListener('click', showIntro);
  overlay.querySelectorAll('[data-buy]').forEach(el => el.addEventListener('click', () => {
    const it = SHOP.find(x => x.id === el.dataset.buy);
    if(S.up[it.id] || S.savings < it.price) return;
    S.savings -= it.price; S.up[it.id] = true; save(); beep(660, 0.08); beep(990, 0.14, 0.08); showWeekend(true);
  }));
  overlay.querySelectorAll('[data-treat]').forEach(el => el.addEventListener('click', () => {
    const it = TREAT.find(x => x.id === el.dataset.treat);
    if(S.buffWeek === weekOf(S.day) || S.savings < it.price) return;
    S.savings -= it.price; S.buff = it.id; S.buffWeek = weekOf(S.day); save(); beep(520, 0.1); beep(780, 0.16, 0.1); showWeekend(true);
  }));
  const g = overlay.querySelector('[data-goal]');
  if(g) g.addEventListener('click', () => {
    if(S.own || S.savings < GOAL) return;
    S.savings -= GOAL; S.own = true; save(); showEnding();
  });
}
function showEnding(){
  S.phase = 'ending';
  beep(523, 0.14); beep(659, 0.14, 0.14); beep(784, 0.14, 0.28); beep(1047, 0.4, 0.42);
  showOverlay('<div class="noren" aria-hidden="true"><span>こ</span><span>め</span><span>九</span></div>' +
    '<h1>のれん分け</h1>' +
    '<p class="lead">' + (S.day - 1) + '日のバイトで開業資金が貯まった。店長は新しい暖簾を一枚くれて、「屋号は こめ九 でどうだ」と言った。</p>' +
    '<div class="paper"><h2>店長より</h2><p style="font-weight:500">店が軌道に乗るまで、うちのシフトにも入ってくれると助かるんだが。</p></div>' +
    '<div class="cta"><button class="btn big" type="button" id="goBtn">こめ八のバイトも続ける</button></div>');
  $('goBtn').addEventListener('click', showWeekend);
}

$('muteBtn').addEventListener('click', e => {
  S.muted = !S.muted;
  e.currentTarget.textContent = S.muted ? '音 なし' : '音 あり';
  e.currentTarget.setAttribute('aria-pressed', String(S.muted));
});
