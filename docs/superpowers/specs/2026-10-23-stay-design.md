# Servei STAY (The Wedding Stay) amb sub-serveis Sopar, Barra lliure i Brunch

## Context i motiu

Ca n'Alzina ofereix el paquet **The Wedding Stay** (PDF "The Wedding Stay (CATALÀ)"): una estada de dues nits a la masia amb allotjament per a 21 persones, sopar de benvinguda còctel (dia 1) i esmorzar + brunch pre-casament (dia 2). Es ven com a ampliació del casament ("Cost del casament + segona nit"). Cal poder-lo afegir al pressupost del configurador.

## Objectiu

Un servei nou **STAY** a "Serveis addicionals" que, en activar-se, mostra tres sub-serveis (**Sopar**, **Barra lliure**, **Brunch**) visualment lligats a ell, i que suma al pressupost el paquet base més els extres per persona addicional / hora addicional.

## Fora d'abast (no-objectius)

- Llegir els preus del Google Sheet. De moment **tot hardcodejat** (vegeu "Pendent: migrar a Google Sheet").
- Bloquejar dates segons la disponibilitat del PDF.
- Servei de DJ ("a consultar"): no s'implementa.
- Canvis al servei `barlliure` existent ni a la resta d'extres.
- Altres finques: STAY només per a Ca n'Alzina (decisió meva, vegeu "Decisions meves").

## Regles de preu (decidides per l'usuari)

Constants (hardcodejades, vegeu més avall): base 6.500 €, persones incloses 21, +55 €/persona al sopar, +45 €/persona al brunch, +6,50 €/persona/hora a la barra lliure. Tots els preus són **+ IVA** (el càlcul global ja aplica `vatRate`).

| Línia | Entrada | Import |
|---|---|---|
| STAY | — (en activar-lo) | 6.500 € |
| Sopar | nombre de persones (`n`) | `max(0, n − 21) × 55 €` |
| Brunch | nombre de persones (`m`) | `max(0, m − 21) × 45 €` |
| Barra lliure | hores extra (`h`) | `h × 6,50 € × n` (n = persones del sopar); 0 si `h` = 0 |

- El camp del Sopar **no té valor mínim ni comença a 21**: si són menys de 21 no passa res (el paquet es cobra igual; l'extra és 0).
- Les persones de la barra lliure són les del Sopar (`n`). Aquesta unió és suposició meva confirmada indirectament: el PDF diu "per persona" i la barra pertany al sopar. Si `n` és buit/0, la barra lliure val 0.
- Sopar i Brunch tenen nombres de persones **independents**.
- Quan `n ≤ 21` o `m ≤ 21`, la línia de Sopar/Brunch no suma res.

## Comportament d'interfície

- STAY apareix com a servei opcional de Ca n'Alzina, activable/desactivable com els altres (combobox "Afegir o treure servei opcional" i botó ×).
- Mentre STAY està actiu, sota seu surten tres files sagnades/amb una línia o vora lateral que les lliga a STAY, cadascuna amb un camp numèric (persones, hores, persones). Si STAY es desactiva, desapareixen i els seus valors es reinicien.
- Cada fila ha de mostrar l'etiqueta del preu unitari (p. ex. "55 € per persona addicional (a partir de 21) + IVA").
- Avís **no bloquejant** sota STAY amb la disponibilitat: "Gener, febrer i març: qualsevol dia. Resta de l'any: de dilluns a divendres." Si la data triada no hi compleix, l'avís es ressalta; no impedeix continuar.
- Pressupost (`SummaryPanel`) i PDF: una línia per STAY, i una per cada sub-servei amb import > 0, amb detall (p. ex. "4 persones addicionals × 55 €", "2 h × 25 pers. × 6,50 €").
- Mobile-first (375/768/1280), `alt`/aria als camps, focus visible, text d'error/avisos en català (regles globals §10–§12).

## Constraints i context tècnic

- Stack: React 18 + esbuild; sense backend. `npm run build` regenera `bundle.js`.
- Els extres es calculen a `data/calculator.js` (`computeQuote`) a partir de `getExtras(venue, year, format)`, que ve del Google Sheet. L'estat viu a `form` d'`App.jsx` (`selectedExtras`, `extraQuantities`, `extraOptions`).
- El servei especial `barlliure` ja existeix (id reservat, UI separada a `App.jsx` ~línia 229 i lògica a `calculator.js`). **El STAY ha d'usar ids propis** (p. ex. `stay`, `stay-sopar`, `stay-barra`, `stay-brunch`) per no col·lidir-hi.
- Hi ha tres idiomes (`ca`, `es`, `en`) a `PDF_TEXT` i `lang` al càlcul. Cal tenir etiquetes per als tres, o com a mínim ca amb fallback (vegeu decisions).
- `ExtrasSection.jsx` (401 línies) i `calculator.js` (257) ja són grans: la lògica i la UI del STAY han d'anar a **fitxers nous** (p. ex. `data/stay.js` amb constants + funció de càlcul pura, i `components/StaySection.jsx`), no afegir-s'hi en línia (regles globals §7).
- Cache-busting, `.htaccess` i versionat: el patró del projecte ja ho gestiona (`npm run build`, hook de pre-commit). No cal tocar-ho.

## Decisions meves (l'usuari les pot revertir)

1. STAY només disponible per a **Ca n'Alzina**.
2. La disponibilitat és un **avís**, no un bloqueig.
3. STAY se suma **a sobre** del preu de menú de la finca (casament) i dels altres extres; no el substitueix.
4. Les persones de la barra lliure = persones del Sopar.
5. Les hores extra de la barra lliure admeten enters ≥ 0 (sense mitges hores) i sense límit superior; el PDF no en dona.
6. Etiquetes en català; es/en amb traducció senzilla de les mateixes etiquetes.

## A decidir pel constructor (sense canviar el què)

- Estructura exacta dels fitxers nous i com s'injecta STAY a `getExtras` / `computeQuote`.
- Estil visual del lligam amb STAY (sagnat, línia lateral, etc.), seguint la paleta existent i la checklist anti-"look d'IA" de les regles globals.

## Pendent: migrar a Google Sheet

Quan es vulgui, els valors següents hauran de passar del codi al full (`SPREADSHEET_COLUMNS`: `nom servei`, `preu`, `masia`, `any`, `opcional`, `extres`). Fins llavors viuen en un sol lloc (`data/stay.js`), marcat amb un comentari `// TODO: migrar al Google Sheet`:

| Constant | Valor |
|---|---|
| Preu base STAY | 6.500 € |
| Persones incloses | 21 |
| Persona addicional sopar | 55 € |
| Persona addicional brunch | 45 € |
| Hora addicional de barra, per persona | 6,50 € |
| Disponibilitat | gen-mar: qualsevol dia; resta: dll-dv |

## Criteris d'acceptació

- Ca n'Alzina + STAY actiu, sopar = 21, barra = 0, brunch = 21 → només la línia STAY de 6.500 €.
- Sopar = 25 → +220 € (4 × 55). Brunch = 23 → +90 € (2 × 45).
- Sopar = 25, barra = 2 h → +325 € (2 × 6,50 × 25).
- Sopar = 18 → extra 0; barra 2 h → 2 × 6,50 × 18 = 234 €.
- Desactivar STAY elimina les 4 línies i reinicia els camps.
- L'IVA s'aplica al total com la resta d'extres; el PDF mostra les mateixes línies.
- Sense errors a consola i cap missatge tècnic en cru a la UI.
