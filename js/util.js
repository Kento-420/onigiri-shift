'use strict';
// 小道具：要素の取得、金額の表示、ランダム選択

const $ = id => document.getElementById(id);
const yen = n => Math.round(n).toLocaleString('ja-JP');
const pick = a => a[Math.floor(Math.random() * a.length)];
