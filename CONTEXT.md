## Configurador de Pressupostos UAUU (pressupostos-uauu)

**Propòsit**
Aplicació web estàtica que permet calcular en temps real pressupostos de bodes per a 4 finques (Mas Vivencs, Castell de Tous, Can Macià, Ca n'Alzina), amb selecció de data, convidats, serveis addicionals i exportació a PDF.

**Estat**
Producció (desplegat via GitHub Pages, branca `main`). Commits recents mostren manteniment actiu (correccions de disponibilitat de dies, actualització d'URL de Google Sheets).

**Stack tècnic**
- Llenguatge/framework: JavaScript / React 18 (JSX) sense build step en producció (`index.html` carrega mòduls per `<script>`), amb `esbuild` disponible per generar un bundle standalone (`build.js` → `build/pressupostos-uauu-standalone.html`)
- Base de dades: Cap (No determinat sistema de persistència propi; dades de preus/serveis venen de Google Sheets extern)
- Hosting/desplegament: GitHub Pages (repo `UauuDigital/pressupostos`)
- Gestor de paquets: npm (`package.json`, `package-lock.json`)

**Punt d'entrada**
- Producció: `index.html` (arrel) redirigeix a `source/pressupostos-uauu/index.html`
- Local: `node serve.js` (arrel) o `node serve.js source/pressupostos-uauu --port=3000` → `http://localhost:8000/`
- Build opcional: `npm run build` (esbuild, script `build.js`)

**Interfícies que EXPOSA cap a fora**
- Cap API pròpia. És un frontend estàtic sense backend.
- No exposa cap endpoint, webhook ni fitxer per a consum extern.
- Genera un PDF de pressupost en client (via `html2canvas` + `jspdf`, `scripts/lib/pdfGenerator.js`), descarregat localment per l'usuari — no es publica enlloc.
- Sense autenticació (aplicació pública, sense login).

**Dependències EXTERNES que aquest projecte CONSUMEIX**
- Altres repos/projectes de UAUU: enllaç de suport cap a `tiquets.uauu.cat` (`source/pressupostos-uauu/scripts/App.jsx:287`, `href="https://tiquets.uauu.cat/?repo=uauudigital-pressupostos"`) — sembla un sistema de tiquets/suport propi de UAUU.
- Serveis de tercers: cap servei de pagament (Stripe, etc.) detectat. No hi ha crides a APIs de Google (Analytics, Auth) — només consum d'un full de Google Sheets publicat com a XLSX.
- Fitxers/dades esperades d'altres sistemes: full de Google Sheets publicat en format `.xlsx` (via `output=xlsx`), amb columnes `nom servei`, `preu`, `masia`, `any`, `opcional`, `extres` (definit a `scripts/data/constants.js` → `SPREADSHEET_COLUMNS`).

**Dades compartides**
- El Google Sheet apuntat per `SPREADSHEET_URL` / `COCTEL_SPREADSHEET_URL` (mateixa URL per a ambdues) és la única font de dades externa compartida; podria ser editat per altres persones/eines de UAUU fora d'aquest repositori.
- No hi ha base de dades, bucket ni compte de tercers compartit identificable al codi.

**Variables d'entorn rellevants per integració**
- No determinat — el projecte no fa servir fitxers `.env` ni `.env.example`; la URL del Google Sheet està hardcoded a `scripts/data/constants.js` (`SPREADSHEET_URL`), no com a variable d'entorn.

**Pendents/TODOs coneguts relacionats amb integració**
- Cap TODO/FIXME explícit relacionat amb integració trobat al codi ni al README.
- Historial de commits recent indica correccions puntuals sobre disponibilitat de dies (divendres/dissabte de març) i actualització de la URL del Google Sheet — senyal que la integració amb Sheets requereix manteniment manual quan canvia l'estructura del full.
