// Sound for the scenes: music, footsteps, horses, a faint crowd, and the people's voices (wordless blips).
// Loaded by shell/client.js on the scene pages. It only reads what each scene already exposes
// (window.__casasola in the village, window.G2 in the palace, window.G3 in the battle, the #dialog card in every scene),
// so the scenes' own builds stay as they are. Light on weak machines: one AudioContext, short mono loops
// decoded once, the long music tracks streamed from <audio>, and a 10 Hz update instead of every frame.
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || window.CasasolaAudio) return;
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/shell\/audio\.js.*$/, 'audio/') : 'audio/';
  var page = /scene3/.test(location.pathname) ? 'battle' : /scene2/.test(location.pathname) ? 'palace' : /office/.test(location.pathname) ? 'office' : 'village';

  // every loop file carries 0.15 s of wrap-around on both ends, so the loop window below is seamless
  // whatever the decoder does with the MP3 padding
  var LOOPS = { dirt: 9.35, marble: 9.2, stone: 8.58, gallop: 21.0, crowd: 30.5 }, PAD = .15;
  var WANT = { village: ['dirt', 'gallop', 'crowd', 'neigh', 'paper-insert', 'fanfare'], palace: ['stone', 'marble', 'crowd', 'paper-insert', 'fanfare'], battle: ['stone', 'gallop', 'crowd', 'neigh', 'paper-insert', 'fanfare'], office: [] }[page];
  var MUSIC = { village: 'music1.mp3', palace: 'music2.mp3' }[page];

  var ctx = null, master, voiceBus, buf = {}, loops = {}, music = null, muted = false;
  try { muted = localStorage.getItem('casasola-mute') === '1'; } catch (e) {}

  function start() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); if (music && music.a.paused) { var pp = music.a.play(); if (pp && pp.catch) pp.catch(function () {}); } return; }
    try { ctx = new AC({ latencyHint: 'playback' }); } catch (e) { ctx = new AC(); }
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1;
    // a gentle limiter so the column and the neighs never clip
    var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 6; lim.ratio.value = 8; lim.attack.value = .005; lim.release.value = .2;
    master.connect(lim); lim.connect(ctx.destination);
    voiceBus = ctx.createGain(); voiceBus.gain.value = .8; voiceBus.connect(master);
    WANT.forEach(load);
    if (MUSIC) startMusic();
    setInterval(tick, 100);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (e) { addEventListener(e, start, true); });
  // inside the shell the click on Start Game happened in the parent page: try at once, the browser may allow it
  try { if (window.parent !== window && navigator.userActivation && navigator.userActivation.hasBeenActive) start(); } catch (e) {}
  try { if (window.parent !== window && window.parent.__casasolaShell) start(); } catch (e) {}

  function load(name) {
    fetch(BASE + name + '.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (a) {
      return new Promise(function (res, rej) { ctx.decodeAudioData(a, res, rej); });
    }).then(function (b) { buf[name] = b; }).catch(function () {});
  }

  // a looping bed with its own gain (and stereo pan where the browser has it); gain eases to its target
  function bed(name) {
    if (loops[name]) return loops[name];
    var g = ctx.createGain(); g.gain.value = 0;
    var out = g;
    if (ctx.createStereoPanner) { var p = ctx.createStereoPanner(); g.connect(p); p.connect(master); out = p; } else g.connect(master);
    var L = loops[name] = { g: g, pan: out !== g ? out : null, src: null, on: false, level: 0 };
    return L;
  }
  function setBed(name, level, opt) {
    if (!buf[name]) return;
    var L = bed(name), t = ctx.currentTime; opt = opt || {};
    if (level > .002 && !L.src) {
      var s = ctx.createBufferSource(); s.buffer = buf[name]; s.loop = true;
      s.loopStart = PAD; s.loopEnd = PAD + LOOPS[name];
      s.playbackRate.value = opt.rate || 1;
      s.connect(L.g);
      // footsteps start at the top of the loop, which is the gap just before a step, so the first step lands at once
      s.start(0, opt.fromTop ? PAD : PAD + Math.random() * LOOPS[name]);
      L.src = s;
    }
    if (L.src && opt.rate) L.src.playbackRate.setTargetAtTime(opt.rate, t, .2);
    L.g.gain.setTargetAtTime(level, t, opt.fast ? .05 : .25);
    if (L.pan && opt.pan !== undefined) L.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, opt.pan)), t, .15);
    L.level = level;
    // a step loop stops when the walking stops, so the next walk starts on a step again
    if (level <= .002 && L.src && opt.stopWhenSilent) { var src = L.src; L.src = null; try { src.stop(t + .25); } catch (e) {} }
  }
  function once(name, vol, rate, pan) {
    if (!buf[name]) return;
    var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf[name]; s.playbackRate.value = rate || 1; g.gain.value = vol;
    s.connect(g);
    if (ctx.createStereoPanner && pan) { var p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(master); } else g.connect(master);
    s.start();
  }

  // music streams from an <audio> element; a filter muffles it behind walls
  function startMusic() {
    var a = new Audio(BASE + MUSIC); a.loop = true; a.preload = 'auto'; a.crossOrigin = 'anonymous';
    var g = ctx.createGain(), f = ctx.createBiquadFilter(); g.gain.value = 0; f.type = 'lowpass'; f.frequency.value = 18000;
    try { ctx.createMediaElementSource(a).connect(f); f.connect(g); g.connect(master); } catch (e) { return; }
    music = { a: a, g: g, f: f };
    var p = a.play(); if (p && p.catch) p.catch(function () {});
  }
  function setMusic(level, cutoff) {
    if (!music) return;
    var t = ctx.currentTime;
    music.g.gain.setTargetAtTime(level, t, .6);
    music.f.frequency.setTargetAtTime(cutoff || 18000, t, .4);
  }

  // the player's view: pan a sound by where it is relative to the way the player faces
  function panFrom(p, x, z) {
    var dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz) || 1;
    // forward is (-sin yaw, -cos yaw), right is (cos yaw, -sin yaw)
    return ((dx * Math.cos(p.yaw) - dz * Math.sin(p.yaw)) / d) * .7;
  }
  var dlgOpen = function () { var d = document.getElementById('dialog'); return d && !d.hidden; };

  // ---------- the village (scene 1) ----------
  var V = { lx: null, lz: null, mv: 0, neighs: 0, neighT: 0 };
  function village() {
    var G = window.__casasola; if (!G || !G.player || !G.state) return;
    var p = G.player, st = G.state, outside = st.started && !st.room && !st.seqCover;
    var moved = V.lx !== null && Math.hypot(p.x - V.lx, p.z - V.lz) > .02; V.lx = p.x; V.lz = p.z;
    V.mv = moved ? 3 : Math.max(0, V.mv - 1); // a few ticks of grace so a stutter in the frame rate doesn't chop the steps
    var walking = V.mv > 0 && !st.busy;
    // the column: gallop by distance to the nearest horse, panned; two neighs as it goes by.
    // The player's z is kept along the straight path; the world (and the riders) are bent, so bend the player too.
    var me = { x: p.x, z: G.warpP ? G.warpP(p.x, p.z) : p.z, yaw: p.yaw };
    var col = G.column, near = 1e9, nx = 0, nz = 0;
    if (st.columnStarted && !st.columnDone && col) for (var i = 0; i < col.length; i++) { if (!col[i].userData.horse || !col[i].visible) continue; var g = col[i].position, d = Math.hypot(g.x - me.x, g.z - me.z); if (d < near) { near = d; nx = g.x; nz = g.z; } }
    var lv = near > 1e8 ? 0 : Math.min(1, 1 / (1 + Math.pow(near / 30, 2))) * 1.5; V.near = Math.round(near);
    // music (user, 2026-11-23): quieter overall, quietest in Miguel's front room, and it steps aside for the column
    var tutorial = st.room || (G.ROOM && !G.ROOM.left), duck = Math.max(0, 1 - lv / .9);
    var mv = st.seqCover ? .012 : tutorial ? .1 : dlgOpen() ? .15 : .22;
    setMusic(st.seqCover ? .012 : Math.max(.05, mv * (.35 + .65 * duck)));
    setBed('dirt', outside && walking ? .42 : 0, { fast: true, fromTop: true, stopWhenSilent: true, rate: st.raised ? .8 : 1 });
    setBed('crowd', outside ? .045 : st.started ? .015 : 0);
    setBed('gallop', st.seqCover ? 0 : lv, { pan: near < 1e8 ? panFrom(me, nx, nz) : 0 });
    if (lv > 0) {
      V.neighT -= .1;
      if (V.neighs === 0 && near < 40) { once('neigh', 1.3, .97, panFrom(me, nx, nz)); V.neighs = 1; V.neighT = 3.5; }
      else if (V.neighs === 1 && V.neighT <= 0 && near < 30) { once('neigh', 1.2, 1.08, panFrom(me, nx, nz)); V.neighs = 2; }
    }
  }

  // ---------- the palace (scene 2) ----------
  var P = { lx: null, lz: null, mv: 0 };
  var INSIDE = { patio: 1, pantry: 1, stair: 1, hall: 1, office: 1 };
  var ROOMQ = { zocalo: [1, 18000], guard: [.5, 3500], patio: [.45, 2600], pantry: [.3, 1500], stair: [.32, 1800], hall: [.25, 1400], office: [.18, 1100] };
  function palace() {
    var G = window.G2; if (!G || !G.player || !G.state) return;
    var p = G.player, st = G.state, z = p.zone || 'zocalo';
    var moved = P.lx !== null && Math.hypot(p.x - P.lx, p.z - P.lz) > .02; P.lx = p.x; P.lz = p.z;
    P.mv = moved ? 3 : Math.max(0, P.mv - 1);
    var walking = P.mv > 0 && st.started && !st.busy;
    // the trumpet and guitarrón outside the side door: louder the closer you are, faint through the guardroom
    var M = G.musicians || [], mx = -2.6, mz = -19.4;
    if (M.length) { mx = 0; mz = 0; for (var i = 0; i < M.length; i++) { mx += M[i].x; mz += M[i].z; } mx /= M.length; mz /= M.length; }
    var d = Math.hypot(p.x - mx, p.z - mz), q = ROOMQ[z] || ROOMQ.hall;
    var lv = (.035 + .95 / (1 + Math.pow(d / 4.5, 2))) * q[0];
    if (INSIDE[z] && walking) lv *= .7; // the marble steps quiet the music a little
    if (dlgOpen()) lv *= .8;
    if (!st.started) lv *= .4;
    if (st.seqCover) lv = .012; // developing, choosing, the newspaper: the music all but stops (user, 2026-11-23)
    setMusic(Math.min(.9, lv), q[1]);
    setBed('stone', walking && !INSIDE[z] ? .38 : 0, { fast: true, fromTop: true, stopWhenSilent: true, rate: st.raised ? .8 : 1 });
    setBed('marble', walking && INSIDE[z] ? .32 : 0, { fast: true, fromTop: true, stopWhenSilent: true, rate: st.raised ? .8 : 1 });
    setBed('crowd', st.seqCover ? 0 : !st.started ? .02 : z === 'zocalo' ? .06 : z === 'guard' ? .03 : z === 'patio' ? .02 : 0);
  }

  // ---------- the battle (scene 3): gunfire and shells, made here from noise, no files ----------
  // one second of white noise, shaped per shot; a rifle crack is a short band of it, a shell a long low roar with a thump under it
  var noise = null;
  function noiseBuf() { if (noise) return noise; noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var d = noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return noise; }
  function out(pan) { if (ctx.createStereoPanner && pan) { var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(master); return p; } return master; }
  function shot(t, vol, pan, far) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf();
    f.type = 'lowpass'; f.frequency.value = far ? 900 : 2600; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .003); g.gain.exponentialRampToValueAtTime(.001, t + (far ? .22 : .14));
    s.connect(f); f.connect(g); g.connect(out(pan)); s.start(t, Math.random() * .7); s.stop(t + .3);
  }
  function boom(t, vol, pan, d) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf(); s.loop = true;
    f.type = 'lowpass'; f.frequency.setValueAtTime(d < 30 ? 1400 : 700, t); f.frequency.exponentialRampToValueAtTime(110, t + 1.4);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + 2.2);
    s.connect(f); f.connect(g); g.connect(out(pan)); s.start(t); s.stop(t + 2.3);
    var o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + .5);
    og.gain.setValueAtTime(vol * .9, t); og.gain.exponentialRampToValueAtTime(.001, t + .7); o.connect(og); og.connect(out(pan)); o.start(t); o.stop(t + .75);
  }
  var B = { lx: null, lz: null, mv: 0, ev: 0, crowdT: 0, neighs: 0 };
  function battle() {
    var G = window.G3; if (!G || !G.player || !G.state) return;
    var p = G.player, st = G.state, t = ctx.currentTime;
    var moved = B.lx !== null && Math.hypot(p.x - B.lx, p.z - B.lz) > .02; B.lx = p.x; B.lz = p.z;
    B.mv = moved ? 3 : Math.max(0, B.mv - 1);
    var walking = B.mv > 0 && st.started && !st.busy, quiet = st.seqCover;
    setMusic(0);
    setBed('stone', walking && !quiet ? .38 : 0, { fast: true, fromTop: true, stopWhenSilent: true, rate: st.raised ? .8 : 1 });
    // the crowd: loud while the column marches, a surge when the guns open, then it thins away
    var fl = G.flags || {};
    if (fl.volley) B.crowdT += .1;
    var cl = !st.started ? .03 : !fl.volley ? .09 : Math.max(.015, .16 - B.crowdT * .02);
    setBed('crowd', quiet ? 0 : p.zone === 'zocalo' ? cl : cl * .4);
    // the generals' horses: trot or gallop by the nearest moving one
    var near = 1e9, nx = 0, nz = 0, M = [G.diaz, G.mond, G.reyes];
    for (var i = 0; i < M.length; i++) { var n = M[i]; if (!n || n.gone || !n.g3) continue; var sp = n === G.reyes ? (n.path ? 7 : 0) : n.speed || (fl.volley ? 0 : 1.25); if (sp < .5) continue; var d = Math.hypot(n.x - p.x, n.z - p.z); if (d < near) { near = d; nx = n.x; nz = n.z; } }
    setBed('gallop', quiet || near > 1e8 ? 0 : Math.min(.9, 1 / (1 + Math.pow(near / 18, 2))), { pan: near < 1e8 ? panFrom(p, nx, nz) : 0 });
    if (fl.volley && B.neighs === 0 && G.reyes) { once('neigh', 1.2, 1.05, panFrom(p, G.reyes.x, G.reyes.z)); B.neighs = 1; }
    if (quiet) { B.ev = (G.events || []).length; return; }
    // the machine guns on the palace roof and the guard's rifles: bursts while the volley lasts, quieter the further away
    var mg = G.mg || 0;
    if (mg > 0) { var dp = Math.hypot(40 - p.x, p.z), v = Math.min(.7, 14 / (dp + 6)) * mg, pn = panFrom(p, 40, 0);
      for (var k = 0; k < 5; k++) if (Math.random() < .75) shot(t + k * .02 + Math.random() * .015, v * (.6 + Math.random() * .4), pn + (Math.random() - .5) * .4, dp > 45); }
    // events the scene pushed: the volley's first crash, each shell (delayed by the distance, as sound travels)
    var E = G.events || [];
    for (; B.ev < E.length; B.ev++) { var e = E[B.ev];
      if (e.type === 'volley') for (var j = 0; j < 14; j++) shot(t + Math.random() * .25, .6, panFrom(p, 40, (Math.random() - .5) * 30), false);
      if (e.type === 'shell') { var dd = e.d || Math.hypot(e.x - p.x, e.z - p.z); boom(t + Math.min(.4, dd / 343), Math.min(1.1, 30 / (dd + 10)), panFrom(p, e.x, e.z), dd); } }
  }

  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    if (document.hidden) { master.gain.setTargetAtTime(0, ctx.currentTime, .1); return; }
    master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .1);
    try { if (page === 'village') village(); else if (page === 'palace') palace(); else if (page === 'battle') battle(); } catch (e) {}
  }

  // ---------- voices: wordless 8-bit babble, now and then an "ah", "oh" or "hm" ----------
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  // who is speaking: the scene's own person (design D) when we can find them, else a guess from the name
  function voiceOf(name, D) {
    var n = (name || '').toLowerCase(), r = hash(D ? D.id + n : n);
    var child = D ? D.h < 1.25 : /girl|boy|child|niñ|little/.test(n);
    var woman = D ? !!D.skirt : /woman|lady|wife|señora|senora|abuela|grand|soldadera|daughter|mother|madre|doña/.test(n);
    var old = /old|abuela|abuelo|grand|priest/.test(n + ' ' + (D ? (D.id + ' ' + (D.name || '')).toLowerCase() : ''));
    if (child) return { f: 260 + r * 70, rate: 13, wave: 'square' };
    if (woman) return { f: 185 + r * 50, rate: 11.5, wave: 'square', old: old };
    return { f: 98 + r * 42, rate: 10.5, wave: r > .5 ? 'square' : 'triangle', old: old };
  }
  function speakerD(who, bubbleEl) {
    var G = window.__casasola, G2 = window.G2 || window.G3, i;
    if (G2 && G2.npcs) { for (i = 0; i < G2.npcs.length; i++) if (G2.npcs[i].name === who && G2.npcs[i].P) return G2.npcs[i].P.D; return null; }
    if (!G) return null;
    if (bubbleEl && G.VOICES) { for (i = 0; i < G.VOICES.length; i++) if (G.VOICES[i].el === bubbleEl && G.VOICES[i].P) return G.VOICES[i].P.D; return null; }
    if (/casasola/i.test(who) && G.CAST && G.CAST.miguel && /miguel/i.test(who)) return G.CAST.miguel.D;
    var ps = G.CAST && G.CAST.crowd ? G.CAST.crowd.people : [], bub = (G.VOICES || []).map(function (v) { return v.P; });
    for (i = 0; i < ps.length; i++) if (ps[i].talking && bub.indexOf(ps[i]) < 0) return ps[i].D;
    return null;
  }
  // one "wah": a muted-trombone syllable (user, 2026-11-23: rounder, like the muffled trombone teacher).
  // A brassy sawtooth and a round sine under it, through a lowpass that opens and closes (the plunger mute),
  // the pitch sliding into the note and sagging at the end, with a little vibrato.
  function blip(t, f, wave, vol, len) {
    var o = ctx.createOscillator(), s = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), sg = ctx.createGain();
    var lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; s.type = 'sine';
    [o, s].forEach(function (x) { x.frequency.setValueAtTime(f * .9, t); x.frequency.exponentialRampToValueAtTime(f, t + len * .25); x.frequency.exponentialRampToValueAtTime(f * .86, t + len); });
    lfo.frequency.value = 5.5; lg.gain.value = f * .018; lfo.connect(lg); lg.connect(o.frequency); lg.connect(s.frequency);
    lp.type = 'lowpass'; lp.Q.value = 5;
    lp.frequency.setValueAtTime(f * 1.6, t); lp.frequency.exponentialRampToValueAtTime(f * 6, t + len * .35); lp.frequency.exponentialRampToValueAtTime(f * 1.8, t + len);
    sg.gain.value = .55;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .04); g.gain.setValueAtTime(vol, t + len * .55); g.gain.exponentialRampToValueAtTime(.001, t + len);
    o.connect(lp); s.connect(sg); sg.connect(lp); lp.connect(g); g.connect(voiceBus);
    [o, s, lfo].forEach(function (x) { x.start(t); x.stop(t + len + .03); });
  }
  // a vowel: a buzzy source through two formant filters, with a little pitch glide
  var VOWELS = { ah: [750, 1150], oh: [520, 860], ooh: [330, 900], eh: [560, 1750], hm: [250, 1200] };
  function vowel(t, v, f, glide, len, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(), F = VOWELS[v];
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f * (glide > 1 ? .92 : 1.1), t); o.frequency.exponentialRampToValueAtTime(f * glide, t + len);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .05); g.gain.setValueAtTime(vol, t + len * .6); g.gain.exponentialRampToValueAtTime(.001, t + len);
    F.forEach(function (ff, i) { var b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = v === 'hm' && i ? 300 : ff; b.Q.value = 7; var k = ctx.createGain(); k.gain.value = i ? .6 : 1.4; o.connect(b); b.connect(k); k.connect(g); });
    g.connect(voiceBus); o.start(t); o.stop(t + len + .05);
  }
  var lastSpeak = 0, spoken = 0;
  function speak(name, text, soft, D) {
    if (!ctx || ctx.state !== 'running' || muted) return;
    var now = ctx.currentTime; if (now - lastSpeak < .12) return; lastSpeak = now; spoken++;
    var V = voiceOf(name, D), t = now + .03, words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    var syl = Math.max(2, Math.min(soft ? 4 : 10, Math.round(words * .7))), step = 1.9 / (V.rate * (V.old ? .8 : 1)), vol = soft ? .2 : .32;
    var r = Math.random(), q = /\?\s*$/.test(text || ''), ex = /!\s*$/.test(text || '');
    // now and then a line opens with a little sound of its own
    if (!soft && r < .3) { var v = ['ah', 'oh', 'hm', 'eh'][(Math.random() * 4) | 0]; vowel(t, v, V.f * 1.05, v === 'hm' ? .95 : .85, .32, .3); t += .36; }
    var notes = [1, 1.06, 1.12, 1.19, .94];
    for (var i = 0; i < syl; i++) {
      var k = notes[(hash(name + i + (text || '').length) * notes.length) | 0], end = i >= syl - 2;
      var f = V.f * k * (end && q ? 1.3 : end && !ex ? .88 : 1);
      var len = step * (.85 + Math.random() * .6) * (end ? 1.5 : 1);
      blip(t, f, V.wave, vol * (ex ? 1.15 : 1), len);
      t += len * .92 + (Math.random() < .15 ? step * .8 : 0); // wah-wah, now and then a breath
    }
    if (!soft && r > .82) vowel(t + .05, Math.random() < .5 ? 'ooh' : 'ah', V.f * 1.15, q ? 1.25 : .8, .4, .26);
  }
  // listen to the dialogue card (every scene uses #dialog, #dlgName, #dlgText) and the village's speech bubbles
  function hookDialog() {
    var o = page === 'office' ? ['talk', 'talkName', 'talkText'] : ['dialog', 'dlgName', 'dlgText'];
    var box = document.getElementById(o[0]), nameEl = document.getElementById(o[1]), textEl = document.getElementById(o[2]);
    if (!box || !textEl) return false;
    var last = '';
    var check = function () {
      if (box.hidden || textEl.hidden) { if (box.hidden) last = ''; return; }
      if (page === 'office' && !textEl.firstChild) return;
      var tx = textEl.textContent || '', who = nameEl ? nameEl.textContent : '';
      if (!tx || tx === last) return; last = tx;
      setTimeout(function () { var D = null; try { D = speakerD(who); } catch (e) {} speak(who, tx, false, D); }, 0);
    };
    // the office reveals its line word by word with class changes; only the line itself changing counts
    new MutationObserver(check).observe(box, page === 'office' ? { attributes: true, attributeFilter: ['hidden'], childList: true } : { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true, characterData: true });
    if (page === 'office') new MutationObserver(check).observe(textEl, { childList: true });
    var bub = document.getElementById('bubbles');
    // the village's speech bubbles are made once and shown by class: a bubble coming into view chatters softly
    if (bub) new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        var el = m.target; if (el.parentNode !== bub) return;
        var on = /\bshow\b/.test(el.className || ''), was = /\bshow\b/.test(m.oldValue || '');
        if (on && !was) { var D = null; try { D = speakerD('', el); } catch (e) {} speak('', el.textContent, true, D); }
      });
    }).observe(bub, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    return true;
  }
  (function wait() { if (!hookDialog()) setTimeout(wait, 300); })();

  // one-off sounds the scenes call for (sndCue in the scene code): the letter, the print going in, the newspaper
  // user, 2026-11-23: no paper sound before the photo goes in; the insert sound much quieter
  var CUES = { insert: ['paper-insert', .3], fanfare: ['fanfare', .85] };
  function cue(k) { var c = CUES[k]; if (!c || !ctx || ctx.state !== 'running') return; once(c[0], c[1], 1, 0); }

  window.CasasolaAudio = {
    speak: speak, cue: cue,
    mute: function (on) { muted = on === undefined ? !muted : !!on; try { localStorage.setItem('casasola-mute', muted ? '1' : '0'); } catch (e) {} if (ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .05); return muted; },
    get muted() { return muted; },
    get ctx() { return ctx; },
    // for tests: what each bed and the music are set to
    levels: function () { var o = {}; for (var k in loops) o[k] = +loops[k].level.toFixed(3); if (music) o.music = +music.g.gain.value.toFixed(3); o.loaded = Object.keys(buf); o.neighs = V.neighs; o.near = V.near; o.spoken = spoken; return o; }
  };
})();
