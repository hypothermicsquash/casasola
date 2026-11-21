// When the game sits inside a Google Site (an iframe), give the player a way out to full screen,
// and fall back to opening the game in its own tab where the frame doesn't allow full screen.
export function setupEmbed() {
  const framed = window.self !== window.top;
  if (!framed) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn'; b.id = 'bFull'; b.textContent = 'Full screen';
  b.style.cssText = 'position:fixed;top:10px;right:10px;z-index:60';
  b.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { window.open(location.href, '_blank', 'noopener'); }
  };
  document.addEventListener('fullscreenchange', () => { b.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });
  document.body.append(b);
}
