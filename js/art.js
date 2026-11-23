'use strict';
// 絵：おにぎりとお客さんを SVG の文字列で組み立てる

const TRI = 'M50 10 Q58 10 63 19 L89 66 Q97 84 78 86 L22 86 Q3 84 11 66 L37 19 Q42 10 50 10 Z';
const NORI = 'M35 60 H65 L67 86 H33 Z';
function triInner(f, nori){
  const col = FILL[f].color;
  return '<path d="' + TRI + '" fill="#fbf9f1" stroke="#d6cfba" stroke-width="2"/>' +
    (col ? '<circle cx="50" cy="38" r="8" fill="' + col + '" stroke="rgba(0,0,0,.28)" stroke-width="1"/>' : '') +
    (nori ? '<path d="' + NORI + '" fill="#1b1d1a"/>' : '');
}
const mini = (f, nori) => '<svg viewBox="0 0 100 96" aria-hidden="true">' + triInner(f, nori) + '</svg>';

function boardSVG(){
  const b = S.bench;
  if(!b.rice) return '<svg viewBox="0 0 200 120" aria-hidden="true"><ellipse cx="100" cy="96" rx="48" ry="12" fill="none" stroke="rgba(27,29,26,.35)" stroke-width="2" stroke-dasharray="6 6"/></svg>';
  const col = b.fill ? FILL[b.fill].color : null;
  if(b.squeeze === 0){
    return '<svg viewBox="0 0 200 120" aria-hidden="true"><ellipse cx="100" cy="86" rx="62" ry="26" fill="#fbf9f1" stroke="#d6cfba" stroke-width="2"/>' +
      (col ? '<circle cx="100" cy="70" r="13" fill="' + col + '" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/>' : '') + '</svg>';
  }
  const sc = [[1.6,.82],[1.36,1.14],[1.25,1.25]][b.squeeze - 1];
  return '<svg viewBox="0 0 200 120" aria-hidden="true"><g transform="translate(100 114) scale(' + sc[0] + ' ' + sc[1] + ') translate(-50 -86)">' +
    triInner(b.fill || 'shio', b.nori) + '</g></svg>';
}

const HAIR = [
  c => '<path d="M20 44 Q20 16 50 16 Q80 16 80 44 Q65 30 50 32 Q35 30 20 44 Z" fill="' + c + '"/>',
  c => '<path d="M19 62 Q14 16 50 16 Q86 16 81 62 L76 62 Q78 34 50 32 Q22 34 24 62 Z" fill="' + c + '"/>',
  c => '<path d="M24 36 Q30 18 50 18 Q70 18 76 36 Q50 26 24 36 Z" fill="' + c + '"/>',
  c => '<circle cx="50" cy="13" r="9" fill="' + c + '"/><path d="M20 44 Q20 16 50 16 Q80 16 80 44 Q65 30 50 32 Q35 30 20 44 Z" fill="' + c + '"/>'
];
function faceSVG(c){
  const m = c.leaving === 'happy' ? 'joy' : c.leaving === 'angry' ? 'angry' : c.mood;
  const st = 'fill="none" stroke="#1b1d1a" stroke-width="3" stroke-linecap="round"';
  const mouth = m === 'joy' ? '<path d="M37 57 Q50 74 63 57 Z" fill="#7a2e2e"/>'
    : m === 'happy' ? '<path d="M39 59 Q50 68 61 59" ' + st + '/>'
    : m === 'flat' ? '<path d="M41 62 H59" ' + st + '/>'
    : '<path d="M39 66 Q50 57 61 66" ' + st + '/>';
  const brows = m === 'angry' ? '<path d="M33 39 L44 43 M67 39 L56 43" ' + st + '/>' : '';
  const tie = c.kind === 'rush' ? '<path d="M46 78 H54 L57 100 H43 Z" fill="#d43a45"/>' : '';
  return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<path d="M12 100 Q12 76 50 76 Q88 76 88 100 Z" fill="' + c.cloth + '"/>' + tie +
    '<circle cx="50" cy="48" r="30" fill="' + c.skin + '"/>' + HAIR[c.hair](c.hairCol) +
    '<circle cx="40" cy="49" r="3.2" fill="#1b1d1a"/><circle cx="60" cy="49" r="3.2" fill="#1b1d1a"/>' +
    brows + mouth + '</svg>';
}
