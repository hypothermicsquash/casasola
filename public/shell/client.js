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
})();
