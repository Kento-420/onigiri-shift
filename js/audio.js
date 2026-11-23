'use strict';
// 音：Web Audio でその場で鳴らす

let ac = null;
function beep(f, d, when, type){
  if(S.muted) return;
  try{
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ac.currentTime + (when || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.09, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + d + 0.02);
  }catch(e){}
}
