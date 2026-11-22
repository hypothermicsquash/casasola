// Ties the self-contained palace page (scene 2) into the game shell, without touching its build.
// Added by tools/sync-scene2.mjs. Inside the shell: no title card, the palace warms up under the loading screen,
// and after the newspaper a big button leads to the credits.
(function () {
  var S = window.CasasolaShell, $ = function (id) { return document.getElementById(id); };
  function whenReady(cb) { (function poll() { var b = $('bStart'); if (window.G2 && b && !b.disabled) cb(); else setTimeout(poll, 50); })(); }
  whenReady(function () {
    var again = $('bAgain');
    if (again && !$('bOn') && S) {
      // a big button above Play again: the last scene ends with the credits
      var b = S.goButton('Roll the credits', 'credits.html'); b.id = 'bOn';
      again.before(b);
      new MutationObserver(function () { var on = again.classList.contains('show'); if (on && !b.classList.contains('on')) { b.classList.add('on'); b.focus({ preventScroll: true }); } else if (!on) b.classList.remove('on'); })
        .observe(again, { attributes: true, attributeFilter: ['class'] });
      if (S.inShell) again.onclick = function () { S.next('scene2.html'); };
    }
    if (!S || !S.inShell) return;
    // the Zócalo is drawn behind the loader for a moment so its shaders are compiled before anyone sees it
    setTimeout(function () { S.ready(); }, 1800);
    S.onShown(function () { $('bStart').click(); });
  });
})();
