// Every scene page loads this first (a plain script, so the self-contained palace page can use it too).
// Inside the game shell (index.html) the shell owns the title, the loading screen and the move from one scene
// to the next: a scene says when its first frames are drawn (ready), waits to be revealed (onShown), and asks
// for the next page (next). Opened on its own, a scene behaves as before: no loader, next() is a plain link.
(function () {
  var host = null;
  try { if (window.parent !== window && window.parent.__casasolaShell) host = window.parent.__casasolaShell; } catch (e) {}
  var shown = !host, waiting = [], readySent = false;
  // the big "on to the next place" button every scene ends with: wide, plain, named for where you go
  var css = document.createElement('style');
  css.textContent = '.cas-go{display:block;box-sizing:border-box;min-width:min(520px,88vw);margin:6px auto 0;padding:20px 44px 21px;font-family:"IM Fell English SC","Old Standard TT",Georgia,serif;font-size:clamp(24px,3vw,34px);letter-spacing:.04em;line-height:1.1;'
    + 'color:#f2f0eb;background:#2b2724;border:2px solid #f2f0eb;border-radius:0;box-shadow:0 0 0 2px #2b2724,0 10px 28px rgba(0,0,0,.45);cursor:pointer;touch-action:manipulation;'
    + 'opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .5s,transform .5s,background .2s,color .2s}'
    + '.cas-go.on{opacity:1;transform:none;pointer-events:auto}.cas-go:hover,.cas-go:focus-visible{background:#f2f0eb;color:#2b2724;outline:none}.cas-go:active{transform:translateY(2px)}'
    + '.cas-go .arrow{display:inline-block;margin-left:.45em;transition:transform .2s}.cas-go:hover .arrow{transform:translateX(5px)}'
    + '.cas-go.arrow-only{min-width:0;padding:12px 52px 18px;font-size:60px;line-height:1}.cas-go.arrow-only .arrow{margin:0}'
    + '.cas-go.corner{position:fixed;right:calc(28px + env(safe-area-inset-right,0px));bottom:calc(28px + env(safe-area-inset-bottom,0px));margin:0;z-index:60}'
    + '.cas-go.fixed{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));margin:0;z-index:60;transform:translate(-50%,10px)}.cas-go.fixed.on{transform:translate(-50%,0)}.cas-go.fixed:active{transform:translate(-50%,2px)}';
  // no Play again after a scene: the only way on is the next-scene button (user, 2026-11-22); Play again lives at the end of the credits
  css.textContent += '#bAgain{display:none!important}';
  // dialogue boxes in every scene: no Continue button, a small light line at the bottom of the box instead (user, 2026-11-23)
  css.textContent += '.cas-hint.btn,.cas-hint{all:unset;display:block;box-sizing:border-box;width:100%;margin:8px 0 -4px;text-align:right;cursor:pointer;'
    + 'font-family:"IM Fell English","Old Standard TT",Georgia,serif;font-style:italic;font-size:14px;letter-spacing:.02em;color:#8f8a82;transition:color .2s}'
    + '.cas-hint:hover,.cas-hint:focus-visible{color:#2b2724}.cas-hint[hidden]{display:none!important}'
    + '#talk .cas-hint{float:none}'
    // OBJECTIVE: and CONTINUE in capitals (user, 2026-11-23)
    + '#objective .ol,#bIntro{text-transform:uppercase}';
  function hints() {
    ['dlgClose', 'bNext'].forEach(function (id) {
      var b = document.getElementById(id);
      if (!b || b.classList.contains('cas-go') || !b.closest('#dialog, #talk')) return;
      b.className = 'cas-hint'; b.textContent = 'Click or press Enter to CONTINUE';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hints); else hints();
  // HUD sized to the window (user, 2026-11-24): the game is often played in a small Google Sites frame, where the
  // plates, objective, watch and dialogue took over the view. Two factors, set on <html> and kept up to date on resize:
  // --hud for the drawn pieces (plates, watch, bulb), which shrink freely; --hudt for anything with words, which
  // shrinks less so it stays readable. 1 at 1280 x 760 and up. The canvases redraw at their new size on resize.
  function hudScale() {
    var k = Math.min(innerWidth / 1280, innerHeight / 760), r = document.documentElement.style;
    r.setProperty('--hud', Math.max(.45, Math.min(1, k)).toFixed(3));
    r.setProperty('--hudt', Math.max(.72, Math.min(1, .55 + .45 * k)).toFixed(3));
  }
  hudScale(); addEventListener('resize', hudScale);
  document.documentElement.classList.add('cas-hud');
  css.textContent += 'html.cas-hud #plates{width:calc(252px*var(--hud));height:calc(96px*var(--hud))}'
    + 'html.cas-hud #watch{width:calc(160px*var(--hud));height:calc(200px*var(--hud))}'
    + 'html.cas-hud #bulb{width:calc(96px*var(--hud));height:calc(170px*var(--hud))}'
    + 'html.cas-hud #controls{padding-right:calc(10px + 108px*var(--hud))}'
    + 'html.cas-hud #controls .grp,html.cas-hud #objective,html.cas-hud #item,html.cas-hud #prompt,html.cas-hud #toast,html.cas-hud #dialog,html.cas-hud #talk,'
    + 'html.cas-hud #doneBar,html.cas-hud #bulbTip,html.cas-hud .cas-go{zoom:var(--hudt)}'
    // zoomed boxes measure their offsets in zoomed pixels: undo it where they line up with the drawn pieces or the window
    + 'html.cas-hud #objective:not(.fresh),html.cas-hud #item{top:calc((16px + 96px*var(--hud))/var(--hudt))}'
    + 'html.cas-hud #dialog,html.cas-hud #talk{width:min(1000px,calc((100vw - 32px)/var(--hudt)))}'
    + '@media (min-width:641px){html.cas-hud #bulbTip{right:calc((14px + 108px*var(--hud))/var(--hudt))}}'
    + '@media (max-width:640px){html.cas-hud #bulbTip{bottom:calc((20px + 170px*var(--hud))/var(--hudt))}}'
    + 'html.cas-hud .bubble{max-width:min(calc(340px*var(--hudt)),72vw);padding:calc(10px*var(--hudt)) calc(14px*var(--hudt))}'
    + 'html.cas-hud .bubble p{font-size:calc(16px*var(--hudt))}'
    + 'html.cas-hud #gloss{font-size:calc(16px*var(--hudt))}';
  document.head.appendChild(css);
  if (host) {
    document.documentElement.classList.add('in-shell');
    // the scene's own title card and the old full screen button are not used inside the shell
    var st = document.createElement('style');
    st.textContent = '.in-shell #start{display:none!important}.in-shell #bFull{display:none!important}';
    document.head.appendChild(st);
  }
  window.CasasolaShell = {
    inShell: !!host,
    // call once the scene has drawn a few frames; the shell then fades its loading screen away
    ready: function () { if (readySent) return; readySent = true; if (host) host.ready(window); },
    // runs cb when the loading screen has gone and the player can see the scene (at once when standalone)
    onShown: function (cb) { if (shown) cb(); else waiting.push(cb); },
    _shown: function () { if (shown) return; shown = true; var w = waiting.splice(0); for (var i = 0; i < w.length; i++) try { w[i](); } catch (e) { console.error(e); } },
    // a big button that takes you on: CasasolaShell.goButton('Talk to the publisher', 'office.html').
    // Place it yourself, then .classList.add('on') to show it. o.fixed pins it to the bottom of the screen.
    goButton: function (label, href, o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cas-go' + (o && o.fixed ? ' fixed' : '') + (o && o.corner ? ' corner' : '') + (label ? '' : ' arrow-only');
      if (!label && o && o.aria) b.setAttribute('aria-label', o.aria);
      b.innerHTML = '<span></span><span class="arrow" aria-hidden="true">\u2192</span>'; b.firstChild.textContent = label;
      var self = this; b.onclick = function () { if (b.dataset.gone) return; b.dataset.gone = '1'; (o && o.before) ? o.before(function () { self.next(href); }) : self.next(href); };
      return b;
    },
    // on to another page: through the loading screen inside the shell, a plain link outside it
    next: function (href) {
      if (host) host.go(href);
      else location.href = href + location.search;
    }
  };
  // the game's important buttons click (user, 2026-11-23: seconds 0:42-0:44 of their button sound, quiet); dialogue Continue does not
  (function () {
    var me = document.currentScript && document.currentScript.src, src = me ? me.replace(/shell\/client\.js(\?.*)?$/, 'audio/click.mp3') : 'audio/click.mp3', a = null;
    var SEL = '#bStart,#bDevelop,#bDone,#bSend,#bTitle,#bAgain,.cas-go,button.print:not(.drag)';
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest(SEL); if (!b || b.disabled) return;
      try { if (!a) { a = new Audio(src); a.volume = .35; } var c = a.cloneNode(); c.volume = .35; var p = c.play(); if (p && p.catch) p.catch(function () {}); } catch (err) {}
    }, true);
  })();
  // sound for the scenes (music, footsteps, horses, voices): shell/audio.js, beside this file
  if (/(scene1|scene2|office)\.html$/.test(location.pathname)) {
    var me = document.currentScript && document.currentScript.src, au = document.createElement('script');
    au.src = me ? me.replace(/client\.js(\?.*)?$/, 'audio.js') : 'shell/audio.js'; au.async = true;
    (document.head || document.documentElement).appendChild(au);
  }
})();
