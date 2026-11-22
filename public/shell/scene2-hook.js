// Ties the self-contained palace page (scene 2) into the game shell, without touching its build.
// Added by tools/sync-scene2.mjs. Inside the shell: no title card, the palace warms up under the loading screen,
// and after the newspaper a Continue button leads to the credits.
(function () {
  var S = window.CasasolaShell, $ = function (id) { return document.getElementById(id); };
  function whenReady(cb) { (function poll() { var b = $('bStart'); if (window.G2 && b && !b.disabled) cb(); else setTimeout(poll, 50); })(); }
  whenReady(function () {
    var again = $('bAgain');
    if (again && !$('bOn')) {
      var b = again.cloneNode(false); b.id = 'bOn'; b.textContent = 'Continue'; b.style.marginLeft = '10px'; b.style.transition = 'opacity .4s'; b.style.opacity = 0;
      b.onclick = function () { S ? S.next('credits.html') : (location.href = 'credits.html'); };
      again.after(b);
      new MutationObserver(function () { var on = again.classList.contains('show'); b.classList.toggle('show', on); b.style.opacity = on ? 1 : 0; b.style.pointerEvents = on ? '' : 'none'; }).observe(again, { attributes: true, attributeFilter: ['class'] });
      if (S && S.inShell) again.onclick = function () { S.next('scene2.html'); };
    }
    if (!S || !S.inShell) return;
    // the Zócalo is drawn behind the loader for a moment so its shaders are compiled before anyone sees it
    setTimeout(function () { S.ready(); }, 1800);
    S.onShown(function () { $('bStart').click(); });
  });
})();
