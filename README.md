# Configurador de Pressupostos UAUU

Aplicació web estàtica per a calcular pressupostos de bodas dinàmicament. Pensada per a GitHub Pages, amb arquitectura modular i integració amb Google Sheets.

## Descripció

Eina interactiva que permet als usuaris:
- Seleccionar finca (4 venues disponibles: Mas Vivencs, Castell de Tous, Can Macià, Ca n'Alzina)
- Triar data de l'event
- Indicar nombre de convidats
- Calcular pressupost automàtic en temps real
- Seleccionar serveis addicionals (menús, DJ, etc.)
- Exportar pressupost a PDF

## Arquitectura

### Estructura de carpetes

```
uauudigital.github.io/
├── index.html                              # Redirecció a la pàgina principal
├── README.md                               # Aquest fitxer
├── serve.js                                # Servidor Node.js per a prova local
├── source/pressupostos-uauu/
│   ├── index.html                          # Pàgina principal (càrrega tots els scripts)
│   ├── colors_and_type.css                 # Tipografia i paleta de colors
│   ├── styles.css                          # Estils de la interfície
│   ├── fonts/                              # Tipografies personalitzades
│   ├── assets/                             # Logos i imatges
│   ├── uploads/                            # Arxius per a carregues
│   └── scripts/
│       ├── App.jsx                         # Arrel de React - component principal
│       ├── data.js                         # [ENTRADA] Agregador de mòduls, exporta window.uauuData
│       ├── data/
│       │   ├── constants.js                # Constants globals: venues, mesos, estructura de columnes
│       │   ├── utils.js                    # Utilitats: parsing de diners, text, IDs
│       │   ├── parsers.js                  # Parsers de Google Sheets - extracció de dades
│       │   ├── config.js                   # Configuració de preus (PRICE_CONFIG) i traduccions (PDF_TEXT)
│       │   ├── spreadsheet.js              # Carregador de dades de Google Sheets
│       │   └── calculator.js               # Lògica de negoci: càlculs de pressupost
│       ├── components/
│       │   ├── Toggle.jsx                  # Selector de botó
│       │   ├── VenueCards.jsx              # Grid de finques disponibles
│       │   ├── GuestsControl.jsx           # Control de nombre de convidats (input + slider)
│       │   ├── DateInfoStrip.jsx           # Visualizador de dia, mes, preu/persona, mínim
│       │   ├── ExtrasSection.jsx           # Selector i editor de serveis addicionals
│       │   └── SummaryPanel.jsx            # Panell de resum, subtotal, IVA, total + botó PDF
│       ├── lib/
│       │   ├── formatters.js               # Formatadors (EUR, etc.)
│       │   └── pdfGenerator.js             # Generador de PDF amb detalls del pressupost
│       └── utils/
│           └── input.js                    # Utilitats de formulari
├── build/
│   └── pressupostos-uauu-standalone.html   # Exportació de paquet únic (si cal)
└── docs/
    └── adaptacio-menu-sense-gluten.pdf     # Documentació de suport
```

### Flux de càrrega de mòduls

Els mòduls es carreguen en ordre estricte dins `index.html`:

```
constants.js
    ↓
utils.js (depèn de constants)
    ↓
parsers.js (depèn de utils, constants)
    ↓
config.js (depèn de utils, constants)
    ↓
spreadsheet.js (depèn de tots els anteriors + XLSX library)
    ↓
calculator.js (depèn de tots)
    ↓
data.js (ENTRADA: agrega tots en window.uauuData)
    ↓
App.jsx i components (usen window.uauuData)
```

## On editar per a cada necessitat

### 📊 Canviar preus o configuració de minims

**Fitxer:** `source/pressupostos-uauu/scripts/data/config.js`

```javascript
const PRICE_CONFIG = {
  vatRate: 0.10,  // 10% d'IVA
  venues: {
    'mas-vivencs': {
      minimumPenaltyPerPerson: 75,  // Penalització per persona si queda per sota del mínim
      priceMatrix: {
        2026: {
          6: [ // Dissabte
            { months: [6,7,9,10], price: 154, minGuests: 100 },
            ...
          ],
          5: [ // Divendres
            ...
          ],
          0: [ // Diumenge + Dl–Dj
            ...
          ],
        },
      },
      extras: { ... }
    },
    ...
  }
}
```

**Per canviar:** Edita els preus (`price`), mínims (`minGuests`), o afegeix nous períodes (anys, dies de setmana, mesos).

### 🏰 Afegir o modificar finques (venues)

**Fitxer:** `source/pressupostos-uauu/scripts/data/constants.js`

```javascript
const VENUES = [
  { id: 'mas-vivencs', name: 'Mas Vivencs', logo: 'assets/logo-mas-vivencs.png', type: 'Mas Rural' },
  ...
];
```

**Per canviar:** Edita noms, logos, o tipus de finca.

### 🍽️ Afegir serveis addicionals (DJ, menús, etc.)

Els serveis es carreguen de **Google Sheets** automàticament. Les columnes es mapen dins `scripts/data/constants.js`:

```javascript
const SPREADSHEET_COLUMNS = {
  name: ['nom servei', 'servei', 'nom'],
  price: ['preu', 'import'],
  venue: ['masia', 'finca', 'venue'],
  year: ['any', 'curs'],
  optional: ['si es opcional', 'opcional', 'optional'],
  ...
};
```

**Per afegir:** Edita el Google Sheet i afegeix files noves amb servei, preu, finques i any aplicable.

### 🌐 Canviar traduccions

**Fitxer:** `source/pressupostos-uauu/scripts/data/config.js`

```javascript
const PDF_TEXT = {
  ca: { ... },  // Català
  es: { ... },  // Espanyol
  en: { ... },  // Anglès
};
```

### 🔧 Modificar lògica de càlcul

**Fitxer:** `source/pressupostos-uauu/scripts/data/calculator.js`

Funcions principals:
- `lookupPrice()` - Buscar preu per venue/data/mes/dia de setmana
- `getExtras()` - Obtenir serveis disponibles per venue/any
- `computeQuote()` - **Funció principal de càlcul** - retorna pressupost complet

### 🎨 Modificar estils o components

- **Estils:** `source/pressupostos-uauu/styles.css`
- **Components React:** `source/pressupostos-uauu/scripts/components/*.jsx`
- **Tipografia:** `source/pressupostos-uauu/colors_and_type.css`

## Datos del Google Sheets

Per carregar serveis addicionals, cal configurar un Google Sheet públic amb les columnes:
- `nom servei` - Nom del servei
- `preu` - Preu unitari
- `masia` - Quins venues l'ofereixen (format: venue IDs separats per coma o *)
- `any` - Any aplicable
- `opcional` - true/false si és opcional
- `extres` - Tipus (desplegable, llinda, altres-extres)

**URL del sheet:** Configurada dins `constants.js` com `SPREADSHEET_URL`.

## Prova local

### Requisits
- Node.js 14+

### Executar el servidor

```bash
# Servir l'arrel
node serve.js

# O servir només el configurador
node serve.js source/pressupostos-uauu

# O especificar port personalitzat
node serve.js source/pressupostos-uauu --port=3000
```

Llavors accedeix a `http://localhost:8000/` (o el port indicat).

## Desenvolupament

### Estructura de codi

- **Mòduls de dades** (`data/*.js`): No reben entrada de l'usuari, només computen.
- **Components** (`components/*.jsx`): Reben props de `App.jsx` i gestionen estat local.
- **App** (`App.jsx`): Orquestra l'estat global i passa props als components.

### Flux de dades

```
App (estat global: venue, date, guests, selectedExtras)
  ↓
  Passa form a computeQuote() → obté quote
  ↓
  Renderiza components amb dades
  ↓
  components actualitzen form via setters
  ↓
  App recalcula quote en useMemo
```

### Afegir nova funcionalitat

1. **Si és dada/lògica:** Afegeix a `data/calculator.js` o el mòdul apropiat.
2. **Si és UI:** Crea component nou a `components/` o edita component existent.
3. **Si és style:** Afegeix estil a `styles.css`.
4. **Assegura-te que els mòduls es carreguen en ordre** dins `index.html`.

## GitHub Pages

- La branca per publicar és `main` (o configurada en GitHub Pages settings).
- `index.html` a l'arrel redirigeix a `source/pressupostos-uauu/index.html`.
- Tot és estàtic — sense build step, sense servidor back-end.

## Navegadors suportats

- Chrome/Edge (Chromium 90+)
- Firefox 88+
- Safari 14+
- Require: ES6, Fetch API, `Intl` API

## Llicència

Propietat de UAUU weddings & events.

## Web i contacte

Més informació: [www.uauu.cat](https://www.uauu.cat)
