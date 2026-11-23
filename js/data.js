'use strict';
// データ表：具、申し送り、店長のコメント、週末の品ぞろえ、日ごとの難しさ

const FILL = {
  sake:  {name:'鮭',       color:'#f0876b', price:180},
  ume:   {name:'梅',       color:'#c8283c', price:150},
  tuna:  {name:'ツナマヨ',     color:'#f1dfa3', price:170},
  kombu: {name:'昆布',     color:'#46552f', price:150},
  shio:  {name:'塩むすび',       color:null,      price:120},
  mentai:{name:'明太子',     color:'#ee6a8c', price:220},
  okaka: {name:'おかか',   color:'#a06d3b', price:150},
  kara:  {name:'唐揚げ',     color:'#c8862f', price:230, fried:true},
  ebi:   {name:'エビフライ',     color:'#f29a4a', price:260, fried:true}
};
const FRIED = ['kara','ebi'];
const MIX_YIELD = 4;
const stocked = f => f === 'tuna' || !!FILL[f].fried;
const NEWS = {
  1:'具は<b>鮭・梅・ツナマヨ</b>。2回にぎれば渡せます。ごはんは釜に8杯ぶん、減ってきたら<b>炊く</b>。ツナマヨが切れたら、ボウルに<b>ツナ</b>と<b>マヨ</b>を入れて<b>混ぜる</b>と4個ぶんできます。',
  2:'<b>昆布</b>が入荷。<b>のりなし</b>を頼むお客さんも来ます。今日から12時台は<b>昼ピーク</b>で混みます。',
  3:'<b>唐揚げ</b>はじめました。<b>揚げる</b>を押して少し待つとできあがり。切らす前に揚げておくこと。',
  4:'具を入れずににぎると<b>塩むすび</b>。<b>2個</b>たのむお客さんも来ます。',
  5:'金曜日。<b>急ぎ</b>の会社員は待てる時間が短いぶん、チップが2倍。終われば週末です。',
  6:'<b>明太子</b>追加。<b>ふんわり</b>（2回）か<b>しっかり</b>（3回）の好みを言うお客さんが来ます。合えばチップ+20円。',
  7:'<b>エビフライ</b>はじめました。唐揚げと同じく、揚げて待ちます。',
  8:'常連のおばあちゃんが来ます。伝票には「いつもの」としか書かれません。',
  9:'<b>おかか</b>追加。<b>3個</b>たのむお客さんが来ます。',
  10:'途中で注文を<b>変える</b>お客さんが来ます。伝票をもう一度見ること。',
  12:'大工の常連さんが来はじめます。こちらも「いつもの」。'
};
const MEMO1 = 'おばあちゃんのいつもの：<b>梅・のりあり・ふんわり</b>';
const MEMO2 = '大工さんのいつもの：<b>唐揚げ2個・のりなし・しっかり</b>';
const COMMENT = {
  '優': ['文句なし。明日もたのむよ。', 'お客さんが「早いね」って言ってたよ。', '手つきが板についてきたね。'],
  '良': ['いい調子。あとは待たせないこと。', 'だいぶ慣れたね。その感じで。', 'わるくない。伝票をよく見てね。'],
  '可': ['まあ、こんな日もある。', 'あせらず一個ずつ。明日がんばろう。', '仕込みを早めに。ピーク前が勝負だよ。']
};
const SHOP = [
  {id:'nori',   name:'のり巻き機',     price:20000, desc:'渡すときに注文どおり巻いてくれる。のりの操作がいらなくなる'},
  {id:'cooker', name:'大きい炊飯器',   price:5000, desc:'ごはん 8杯 → 14杯'},
  {id:'quick',  name:'早炊きモード',   price:4000, desc:'炊き上がりが早くなる'},
  {id:'batch',  name:'大きい揚げかご', price:4000, desc:'一度に揚がる数 3個 → 5個'},
  {id:'fryer2', name:'フライヤー増設', price:7000, desc:'唐揚げとエビフライを同時に揚げられる'},
  {id:'bench',  name:'待合ベンチ',     price:5000, desc:'お客さんが2割長く待ってくれる'}
];
const TREAT = [
  {id:'sento',    name:'銭湯に行く',   price:800,  desc:'来週、お客さんが1割長く待ってくれる'},
  {id:'yakiniku', name:'焼肉を食べる', price:3000, desc:'来週、チップが2倍'}
];
const GOAL = 80000;
const DOW = '月火水木金';
const weekOf = d => Math.ceil(d / 5);
const dayName = d => weekOf(d) + '週目 ' + DOW[(d - 1) % 5] + '曜';

function conf(d){
  const fills = ['sake','ume','tuna'];
  if(d >= 2) fills.push('kombu');
  if(d >= 3) fills.push('kara');
  if(d >= 4) fills.push('shio');
  if(d >= 6) fills.push('mentai');
  if(d >= 7) fills.push('ebi');
  if(d >= 9) fills.push('okaka');
  return {
    fills,
    noNori: d >= 2 ? 0.25 : 0,
    maxItems: d >= 9 ? 3 : d >= 4 ? 2 : 1,
    patience: Math.max(13, 24 - d * 0.8) * (S.up.bench ? 1.2 : 1) * (buffOn('sento') ? 1.1 : 1),
    spawnEvery: Math.max(2.4, 5.5 - d * 0.28),
    dur: d === 1 ? 60 : 75,
    target: Math.min(3600, 800 + d * 180),
    peak: d >= 2, rush: d >= 5, pref: d >= 6, reg: d >= 8, waver: d >= 10, reg2: d >= 12
  };
}
