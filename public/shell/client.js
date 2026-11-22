// Every scene page loads this first (a plain script, so the self-contained palace page can use it too).
// Inside the game shell (index.html) the shell owns the title, the loading screen and the move from one scene
// to the next: a scene says when its first frames are drawn (ready), waits to be revealed (onShown), and asks
// for the next page (next). Opened on its own, a scene behaves as before: no loader, next() is a plain link.
(function () {
  var host = null;
  try { if (window.parent !== window && window.parent.__casasolaShell) host = window.parent.__casasolaShell; } catch (e) {}
  var shown = !host, waiting = [], readySent = false;
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
    // on to another page: through the loading screen inside the shell, a plain link outside it
    next: function (href) {
      if (host) host.go(href);
      else location.href = href + location.search;
    }
  };
})();
