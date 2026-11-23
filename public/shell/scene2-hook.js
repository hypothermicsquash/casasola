// Ties the self-contained palace page (scene 2) into the game shell, without touching its build.
// Added by tools/sync-scene2.mjs. Inside the shell: no title card, the palace warms up under the loading screen,
// and after the newspaper, a while later, an arrow leads on to scene 3.
(function () {
  var S = window.CasasolaShell, $ = function (id) { return document.getElementById(id); };
  function whenReady(cb) { (function poll() { var b = $('bStart'); if (window.G2 && b && !b.disabled) cb(); else setTimeout(poll, 50); })(); }
  whenReady(function () {
    var again = $('bAgain');
    if (again && !$('bOn') && S) {
      // the scene holds on its newspaper for a while, then a lone arrow, centred under the photographs, leads on (user, 2026-11-22); scene 3 now follows the palace
      var b = S.goButton('', 'scene3.html', { aria: 'On to the next scene' }); b.id = 'bOn';
      again.before(b);
      var timer = 0;
      new MutationObserver(function () {
        var on = again.classList.contains('show');
        if (on && !timer && !b.classList.contains('on')) timer = setTimeout(function () { b.classList.add('on'); }, 7000);
        else if (!on) { clearTimeout(timer); timer = 0; b.classList.remove('on'); }
      }).observe(again, { attributes: true, attributeFilter: ['class'] });
    }
    if (!S || !S.inShell) return;
    // the Zócalo is drawn behind the loader for a moment so its shaders are compiled before anyone sees it
    setTimeout(function () { S.ready(); }, 1800);
    S.onShown(function () { $('bStart').click(); });
  });
})();
