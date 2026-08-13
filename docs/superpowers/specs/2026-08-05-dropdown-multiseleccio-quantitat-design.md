# Multi-selecció amb quantitat als desplegables d'opcions (`extraType: 'desplegable'`)

## Context

A `ExtrasSection.jsx`, alguns serveis addicionals tenen `extraType: 'desplegable'` amb una llista `dropdownOptions` (opcions amb preu unitari, p. ex. tipus de còctel). Actualment es renderitzen amb un `<select>` natiu d'una sola opció: `extraOptions[extra.id].dropdownSelection` guarda un únic `optionId`, i el preu de l'extra és el de l'opció triada.

Es vol que aquests desplegables permetin marcar **més d'una opció alhora**, cadascuna amb la seva **quantitat**, i que el preu total de l'extra sigui la suma de `quantitat × preu` de totes les opcions marcades.

Queden **fora d'abast** d'aquest canvi:
- El desplegable principal "Afegir o treure servei opcional" (combobox de `ExtrasSection.jsx`).
- Els desplegables de variants (`e.variants`).

## Model de dades

- `extraOptions[extra.id].dropdownSelection` (string, id d'opció) es reemplaça per `extraOptions[extra.id].dropdownSelections` (objecte `{ [optionId]: quantitat }`, `quantitat` és un enter ≥ 0).
- Una opció es considera "marcada" quan `quantitat > 0`.
- L'extra queda actiu (`included`) si almenys una opció té `quantitat > 0` (substitueix la lògica actual, que activa l'extra en triar qualsevol opció del `<select>`).
- No cal migració de dades existents: l'estat viu només al formulari en memòria (`form.extraOptions`) durant la sessió de l'usuari; no hi ha persistència entre sessions.

## Càlcul de preu (`calculator.js`)

Es reemplaça:
```js
const selectedDropdown = e.dropdownOptions.find(opt => opt.id === extraOpts.dropdownSelection) || e.dropdownOptions[0];
if (selectedDropdown) {
  currentPrice = selectedDropdown.price;
  variantSuffix = ` (${getOptionLabel(selectedDropdown, lang)})`;
}
```
per una suma sobre totes les opcions marcades:
```js
const selections = extraOpts.dropdownSelections || {};
const markedOptions = e.dropdownOptions
  .map(opt => ({ opt, qty: Math.max(0, Math.round(Number(selections[opt.id] || 0))) }))
  .filter(x => x.qty > 0);
```
- `computedPrice` per aquest tipus d'extra = `Σ qty × opt.price` de `markedOptions` (en lloc del `currentPrice` fix actual, sempre que l'extra no sigui `quantityBased` — que no és el cas per aquest tipus).
- `priceDetail` = llista human-readable, p. ex. `"2× Cava (24,00 €) + 1× Vi (18,00 €)"`.
- `included` = `markedOptions.length > 0` (o obligatori/altres condicions existents, igual que ara).
- Si no hi ha cap opció marcada i l'extra no és obligatori, l'extra no surt a la línia de pressupost (mateix comportament que ara amb 0 seleccionat).

## Component UI nou: `DropdownQuantitySelect`

Nou fitxer `scripts/components/DropdownQuantitySelect.jsx`, usat des de `ExtrasSection.jsx` en lloc del `<select>` de `hasDropdownOptions`.

**Aspecte tancat:** botó amb l'estil actual de `.variant-select` (mateixa amplada, tipografia, vora). Text del botó:
- Cap opció marcada: `"Selecciona opcions..."`.
- Alguna marcada: resum compacte, p. ex. `"Cava ×2, Vi ×1"` (si el resum és massa llarg, es trunca amb `…` i es manté el detall complet al popover i al resum del pressupost).

**Aspecte obert (popover):**
- S'obre en clicar el botó; es tanca en clicar fora, prement `Escape`, o tornant a clicar el botó.
- Una fila per opció de `e.dropdownOptions`, amb:
  - Nom de l'opció (`opt.labels?.ca || opt.label`) i preu unitari (`eur(opt.price)`).
  - Un input numèric de quantitat, mateix estil que `.extra-quantity-input` (min 0, step 1, `inputMode="numeric"`), amb `normalizeQuantity` per sanejar l'entrada (reaprofit del que ja s'usa a `ExtrasSection.jsx`).
- No cal checkbox separat: quantitat 0 = no marcada, quantitat > 0 = marcada. Menys controls, mateixa expressivitat.
- Funciona igual en mòbil i escriptori (evita el problema d'un `<select multiple>` natiu, inutilitzable en mòbil); no calen variants desktop/mobile separades com al combobox principal.

**Accessibilitat:**
- Botó amb `aria-haspopup="true"` i `aria-expanded`.
- Cada input de quantitat amb `aria-label` que inclou el nom de l'opció (p. ex. `"Quantitat de Cava"`).
- Navegació amb teclat: `Tab` recorre les files; `Escape` tanca el popover i retorna el focus al botó.

**Estils:** nova classe(s) al `styles.css`, seguint la paleta i tipografia existents (`--font-serif`, `--color-ink`, `--color-divider`, `--radius-sm`, etc.), coherent amb `.extra-item` / `.variant-select`.

## Resum del pressupost (`SummaryPanel.jsx`)

Actualment (línia ~99-100) es mostra una sola opció seleccionada (`currentSelectionId` / `selectedOption`). Es canvia per llistar totes les opcions marcades amb la seva quantitat i preu, coherent amb el `priceDetail` generat a `calculator.js` (p. ex. mostrar el mateix text `priceDetail` en lloc de reconstruir-lo per separat).

## Fitxers afectats

1. `scripts/components/DropdownQuantitySelect.jsx` — nou component.
2. `scripts/components/ExtrasSection.jsx` — substitueix el `<select>` de `hasDropdownOptions` pel nou component; passa `dropdownSelections` en lloc de `dropdownSelection` via `onOptionChange`.
3. `scripts/data/calculator.js` — nova lògica de suma de preu per aquest tipus d'extra.
4. `scripts/components/SummaryPanel.jsx` — mostra totes les opcions marcades.
5. `styles.css` — estils del popover/botó del nou component.

## Fora d'abast

- Desplegable principal de serveis opcionals (combobox "Afegir o treure servei opcional").
- Desplegables de variants (`e.variants`).
- Migració de dades desades prèviament (no aplica, no hi ha persistència).
- Canvis al format de dades de Google Sheets / `spreadsheet.js` (el parsing de `dropdownOptions` no canvia).
