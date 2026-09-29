# CLAUDE.md — pressupostos

Regles específiques d'aquest projecte (les globals són a `~/.claude/CLAUDE.md`).

## Stack
- React 18 + esbuild (`npm run build` → `source/pressupostos-uauu/bundle.js`), sense servidor Node en producció (estàtic).
- `serve.js` només és per a ús local.

## Cache-busting (patró UAUU, còpies mestres a `Uauu/_shared-assets/cache/`)
- Cas B (estàtic, Apache/Plesk): `.htaccess` (arrel i `source/pressupostos-uauu/`) amb la política de `htaccess-cache.conf`.
- `source/pressupostos-uauu/uauu-update-check.js`: còpia idèntica de la mestra; s'inclou a `index.html`.
- `source/pressupostos-uauu/version.json`: es regenera amb el hook `.githooks/pre-commit` (activar un cop per clon: `git config core.hooksPath .githooks`).
- `npm run build` posa `?v=<hash>` als CSS/JS locals d'`index.html`.
- Plesk: html/htm/js/mjs/css/json/webmanifest NO han d'estar a "Serve static files directly by nginx".
