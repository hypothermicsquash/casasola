# Casasola

Browser game built with Vite and three.js r128, published as a static site on GitHub Pages and embedded in a Google Site.

Run locally: `npm install`, then `npm run dev` and open the address it prints. `npm run build` writes the site to `dist/`.

Publishing: every push to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. In the repo's Settings, under Pages, set Source to "GitHub Actions" once.

Google Site: Insert, Embed, the "By URL" tab, paste the Pages address, then stretch the box to full width. Use "By URL", not "Embed code".

Shell: `index.html` (source `src/shell/`) is the title screen, the loading screen and one frame that holds the scene being played. Scenes are their own pages (`scene1.html`, `office.html`, `scene2.html`, `credits.html`) and load `public/shell/client.js`, which gives them `CasasolaShell.ready()`, `onShown(cb)` and `next(href)`. Opened directly, a scene still runs on its own. `?start=office` on the shell jumps to a scene. The loader's spinning camera is a sprite sheet of scene 1's camera model, rendered by `node tools/render-camera-sprite.mjs`.

Layout: `src/main.js` picks the scene (`?scene=scene1`), starts it, and runs the zone streamer. `src/engine/zones.js` loads and frees zones by the player's distance (preload 40 m, unload past 70 m). `src/scenes/index.js` lists the scenes, each loaded as its own chunk. `src/scenes/<scene>/zones.js` lists that scene's zones, each in `zones/<name>.js`. Textures live in `public/scenes/<scene>/` and are fetched as files.

Scene 1 sync: while scene 1 is still edited in the single-file prototype (`prototype/src/scene1.template.html`), that template stays the source of truth. `npm run sync` (or `node tools/sync-scene1.mjs <path to prototype/src>`) regenerates `scene1.html`, `src/scenes/scene1/{scene1.js,horses.js,style.css}` and the textures from it. Don't hand-edit the generated files until the prototype is retired.

Testing: `?q=low|mid|high` forces a quality tier. `?zones=debug` shows the player position and zone states and streams a test post in at the crossing.

Credits: see CREDITS.md.
