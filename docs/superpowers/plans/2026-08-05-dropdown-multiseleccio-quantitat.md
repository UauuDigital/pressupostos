# Multi-selecció amb quantitat als desplegables d'opcions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fer que els desplegables de serveis amb `extraType: 'desplegable'` (`e.dropdownOptions`) permetin marcar diverses opcions alhora, cadascuna amb la seva quantitat, sumant el preu total.

**Architecture:** Es reemplaça el `<select>` natiu d'una sola opció per un component nou `DropdownQuantitySelect` (botó + popover amb una fila d'input numèric per opció). El model de dades passa de `dropdownSelection` (string) a `dropdownSelections` (mapa `{ optionId: quantitat }`). El càlcul de preu a `calculator.js` suma `quantitat × preu` de totes les opcions marcades. `SummaryPanel.jsx` mostra el detall ja generat per `calculator.js` en lloc de reconstruir-lo.

**Tech Stack:** React 18 (JSX transformat amb esbuild, sense JSX runtime automàtic — cal `import React from 'react'` a cada fitxer `.jsx`), sense framework de tests al projecte.

## Global Constraints

- Llengua de comentaris i missatges de commit: català (regles globals UAUU).
- Format de commit: `Millora: [descripció]` per a funcionalitat nova.
- No hi ha `git commit`/`git push` automàtics — cada tasca acaba amb un commit local fet per qui executa el pla, però **no s'ha de fer push** sense demanar-ho explícitament.
- No hi ha framework de tests (`package.json` només té `esbuild`). La verificació de cada tasca es fa amb: (a) `npm run build` sense errors, i (b) prova manual al navegador amb `node serve.js --port=8000` (vegeu tasca 5 per al flux complet; a les tasques 1-4 n'hi ha prou amb el build).
- Mantenir l'estètica existent: reutilitzar `.variant-select`, `.extra-quantity-input`, `.extra-item`, variables CSS de `colors_and_type.css` (`--font-serif`, `--color-ink`, `--color-divider`, `--color-muted`, `--radius-sm`, `--color-white`).
- Abast limitat a `extraType: 'desplegable'`. No es toca `e.variants`, ni el combobox principal "Afegir o treure servei opcional" (`optional-services-select`).

---

## File Structure

- **Crear** `source/pressupostos-uauu/scripts/components/DropdownQuantitySelect.jsx` — component botó+popover reutilitzable, sense coneixement del domini de "extres" (rep `options`, `selections`, `onChange`, `getLabel` genèrics).
- **Modificar** `source/pressupostos-uauu/scripts/data/calculator.js` — nova lògica de suma per `hasDropdownOptions`.
- **Modificar** `source/pressupostos-uauu/scripts/components/ExtrasSection.jsx` — substituir el `<select>` de `hasDropdownOptions` pel nou component.
- **Modificar** `source/pressupostos-uauu/scripts/components/SummaryPanel.jsx` — treure la lectura de `dropdownSelection` únic, confiar en `priceDetail`.
- **Modificar** `source/pressupostos-uauu/styles.css` — estils del botó/popover nou.

---

### Task 1: Component `DropdownQuantitySelect`

**Files:**

- Create: `source/pressupostos-uauu/scripts/components/DropdownQuantitySelect.jsx`
- Modify: `source/pressupostos-uauu/styles.css` (afegir estils al final del bloc `.variant-select` / `.extra-quantity-input`, aprox. línia 920, sense esborrar res existent)

**Interfaces:**

- Consumes: `normalizeQuantity` de `../utils/input.js` (ja existent: `normalizeQuantity(value) -> number enter ≥ 0`), `eur` de `../lib/formatters.js`.
- Produces: `export default function DropdownQuantitySelect({ options, selections, onChange, getLabel, getPrice, placeholder, ariaLabel })`
  - `options`: array d'objectes qualssevol amb un `id` (p. ex. `e.dropdownOptions`).
  - `selections`: objecte `{ [optionId]: quantitat }` (pot ser `undefined`/`{}`).
  - `onChange(optionId, quantity)`: cridat quan canvia la quantitat d'una opció (`quantity` és un enter ≥ 0 ja normalitzat).
  - `getLabel(option) -> string`: com mostrar el nom de l'opció.
  - `getPrice(option) -> number`: preu unitari de l'opció.
  - Cap altre component necessita res més d'aquest fitxer.

- [ ] **Step 1: Escriure el component**

```jsx
import React from 'react';
import { eur } from '../lib/formatters.js';
import { normalizeQuantity } from '../utils/input.js';

export default function DropdownQuantitySelect({
  options,
  selections,
  onChange,
  getLabel,
  getPrice,
  placeholder = 'Selecciona opcions...',
  ariaLabel = 'Desplegable amb quantitat per opció',
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const sel = selections || {};

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(ev) {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(ev) {
      if (ev.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const markedOptions = options.filter(opt => Number(sel[opt.id] || 0) > 0);
  const summaryLabel = markedOptions.length === 0
    ? placeholder
    : markedOptions.map(opt => `${getLabel(opt)} ×${sel[opt.id]}`).join(', ');

  return (
    <div className="dqs-container" ref={containerRef}>
      <button
        type="button"
        className="variant-select dqs-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="dqs-trigger-label">{summaryLabel}</span>
        <span className="dqs-trigger-caret">▾</span>
      </button>
      {open && (
        <div className="dqs-popover" role="group" aria-label={ariaLabel}>
          {options.map(opt => {
            const qty = Number(sel[opt.id] || 0);
            return (
              <div key={opt.id} className="dqs-row">
                <div className="dqs-row-info">
                  <span className="dqs-row-label">{getLabel(opt)}</span>
                  <span className="dqs-row-price">{eur(getPrice(opt))}</span>
                </div>
                <input
                  className="extra-quantity-input dqs-row-input"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  value={qty ? qty : ''}
                  onChange={ev => onChange(opt.id, normalizeQuantity(ev.target.value))}
                  aria-label={`Quantitat de ${getLabel(opt)}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Afegir estils al `styles.css`**

Afegir just després del bloc `.optional-services-field .variant-select:focus` (al voltant de la línia 962, abans de `.extra-remove-btn`):

```css
.dqs-container {
  position: relative;
  margin-left: 10px;
  display: inline-block;
  min-width: 220px;
  max-width: 320px;
  vertical-align: middle;
}

.dqs-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.dqs-trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dqs-trigger-caret {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-muted);
}

.dqs-popover {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--color-white);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 24px rgba(28, 28, 26, 0.12);
  padding: 8px;
  max-height: 260px;
  overflow-y: auto;
}

.dqs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-divider);
}

.dqs-row:last-child {
  border-bottom: none;
}

.dqs-row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dqs-row-label {
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dqs-row-price {
  font-family: var(--font-serif);
  font-size: 12px;
  color: var(--color-muted);
}

.dqs-row-input {
  width: 64px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dqs-container {
    margin-left: 0;
    margin-top: 8px;
    max-width: 100%;
    display: block;
  }
}
```

- [ ] **Step 3: Verificar que el projecte compila**

Run: `npm run build`
Expected: surt `⚡ Done` (o similar missatge d'èxit d'esbuild) sense errors. El fitxer nou encara no s'usa enlloc, així que això només verifica que no hi ha errors de sintaxi.

- [ ] **Step 4: Commit**

```bash
git add source/pressupostos-uauu/scripts/components/DropdownQuantitySelect.jsx source/pressupostos-uauu/styles.css
git commit -m "Millora: Component DropdownQuantitySelect per a seleccio multiple amb quantitat"
```

---

### Task 2: Càlcul de preu multi-opció a `calculator.js`

**Files:**

- Modify: `source/pressupostos-uauu/scripts/data/calculator.js:138-148` (bloc de `hasDropdownOptions` / `selectedDropdown`)

**Interfaces:**

- Consumes: `getOptionLabel` (ja importat de `./parsers.js`), `eur` no cal aquí (ja existeix a l'àmbit del fitxer via altres usos de format; si no hi és, no cal — `priceDetail` es construeix amb template strings i `eur()` ja s'usa en altres branques del fitxer, per exemple línia 185).
- Produces: per a cada línia d'extra amb `hasDropdownOptions === true`, l'objecte retornat per `computeQuote().extrasLines` inclou:
  - `computedPrice`: suma de `quantitat × preu` de les opcions marcades (en lloc del preu fix d'una sola opció).
  - `priceDetail`: string human-readable amb totes les opcions marcades, p. ex. `"2× Cava (24,00 €) + 1× Vi (18,00 €)"`.
  - `included`: `true` només si com a mínim una opció té quantitat > 0 (a més de les condicions existents `isMandatory`/etc. que ja gestiona la resta de la funció).

**Context actual (línies 138-156 de `calculator.js`):**

```js
    let currentPrice = e.price || 0;
    let variantSuffix = '';
    const hasDropdownOptions = Array.isArray(e.dropdownOptions) && e.dropdownOptions.length > 0 && (e.extraType === 'desplegable' || wantsDropdown(e.extraListCell));
    const selectedDropdown = hasDropdownOptions
      ? e.dropdownOptions.find(opt => opt.id === extraOpts.dropdownSelection) || e.dropdownOptions[0]
      : null;

    if (selectedDropdown) {
      currentPrice = selectedDropdown.price;
      variantSuffix = ` (${getOptionLabel(selectedDropdown, lang)})`;
    }

    if (e.variants && extraVariants && extraVariants[e.id]) {
      const selectedVariant = e.variants.find(v => v.id === extraVariants[e.id]);
      if (selectedVariant) {
        currentPrice = selectedVariant.price;
        variantSuffix = ` (${selectedVariant.label})`;
      }
    }
```

Aquest bloc estableix `currentPrice`/`variantSuffix`, que després s'usen a la cadena `if/else if` de les línies 158-207 (`barlliure`, `quantityBased`, `extraUnitPair`, `pricingFn`, `pricePerPerson`, `perGuest`, `else`). Per a un extra `hasDropdownOptions` típic (sense cap altre flag), cau a l'`else` final (`computedPrice = currentPrice`, línia 205-206) i a `included` (línia 132) via `selectedExtras[e.id] === true`.

- [ ] **Step 1: Substituir el bloc de selecció única per multi-selecció amb suma de preu**

Reemplaçar les línies 140-148 (el bloc `hasDropdownOptions` / `selectedDropdown` / `if (selectedDropdown)`) per:

```js
    const hasDropdownOptions = Array.isArray(e.dropdownOptions) && e.dropdownOptions.length > 0 && (e.extraType === 'desplegable' || wantsDropdown(e.extraListCell));
    const dropdownSelections = extraOpts.dropdownSelections || {};
    const markedDropdownOptions = hasDropdownOptions
      ? e.dropdownOptions
          .map(opt => ({ opt, qty: Math.max(0, Math.round(Number(dropdownSelections[opt.id] || 0))) }))
          .filter(x => x.qty > 0)
      : [];
    let dropdownTotal = 0;
    let dropdownDetail = null;

    if (hasDropdownOptions && markedDropdownOptions.length > 0) {
      dropdownTotal = markedDropdownOptions.reduce((sum, x) => sum + (x.qty * Number(x.opt.price || 0)), 0);
      dropdownDetail = markedDropdownOptions
        .map(x => `${x.qty}× ${getOptionLabel(x.opt, lang)} (${eur(x.opt.price)})`)
        .join(' + ');
      currentPrice = dropdownTotal;
    }
```

(`eur` cal importar-lo si el fitxer no el té ja a l'àmbit; comprovar l'import al capçal de `calculator.js` — si no hi és, afegir `import { eur } from '../lib/formatters.js';` al costat dels altres imports.)

- [ ] **Step 2: Fer que el resultat final de l'extra usi `dropdownTotal`/`dropdownDetail`**

A la branca final `else` (línia ~205-206):

```js
    } else {
      computedPrice = currentPrice;
    }
```

No cal canviar-la: com que `currentPrice` ja val `dropdownTotal` quan `hasDropdownOptions`, `computedPrice` hereta la suma correctament. Però cal establir `priceDetail` amb el detall multi-opció quan aplica. Just abans del `return { ...e, isMandatory, ... }` (línia 228), afegir:

```js
    if (hasDropdownOptions && dropdownDetail) {
      priceDetail = priceDetail ? `${dropdownDetail} · ${priceDetail}` : dropdownDetail;
    }
```

- [ ] **Step 3: Actualitzar la condició `included` perquè un extra `hasDropdownOptions` no obligatori només compti com actiu si té alguna opció marcada**

Localitzar la línia 132:

```js
    const included = isBarLliure || isMandatory || selectedExtras[e.id] === true || (e.quantityBased && quantity > 0);
```

Substituir per:

```js
    const included = isBarLliure || isMandatory || selectedExtras[e.id] === true || (e.quantityBased && quantity > 0) || (hasDropdownOptions && markedDropdownOptions.length > 0);
```

Nota: cal moure/duplicar el càlcul de `hasDropdownOptions`/`markedDropdownOptions` abans de la línia 132, o bé calcular-los una sola vegada més amunt al bloc `extrasLines.map(e => { ... })` (abans de `const included = ...`). Per mantenir-ho net, mou tot el bloc del Step 1 (declaració de `hasDropdownOptions`, `dropdownSelections`, `markedDropdownOptions`) a just abans de la línia `const included = ...` (línia 132), i deixa a la posició original (línia 140) només el càlcul de `dropdownTotal`/`dropdownDetail`/`currentPrice` que depèn de `markedDropdownOptions`.

- [ ] **Step 4: Verificar amb build**

Run: `npm run build`
Expected: build sense errors.

- [ ] **Step 5: Verificació manual ràpida amb Node**

Run (des de l'arrel del projecte, amb Node en mode script ràpid):

```bash
node -e "
const m = require('esbuild');
" 
```

Com que `calculator.js` és un mòdul ES amb `import`, la verificació funcional real es farà a la Tasca 5 (navegador). Aquí n'hi ha prou que `npm run build` no falli.

- [ ] **Step 6: Commit**

```bash
git add source/pressupostos-uauu/scripts/data/calculator.js
git commit -m "Millora: Calcul de preu per multiples opcions marcades als desplegables"
```

---

### Task 3: Integrar `DropdownQuantitySelect` a `ExtrasSection.jsx`

**Files:**

- Modify: `source/pressupostos-uauu/scripts/components/ExtrasSection.jsx:1-4` (imports), `:212-214` (`hasDropdownOptions`/`selectedDropdownOption`), `:297-313` (el `<select>` a substituir)

**Interfaces:**

- Consumes: `DropdownQuantitySelect` (Task 1) amb props `options`, `selections`, `onChange`, `getLabel`, `getPrice`.
- Consumes: `onOptionChange(extraId, key, value)` (prop ja existent del component, ve d'`App.jsx#setExtraOption`).
- Produces: quan l'usuari canvia una quantitat, es crida `onOptionChange(e.id, 'dropdownSelections', { ...opts.dropdownSelections, [optionId]: quantitat })`.

- [ ] **Step 1: Afegir l'import**

A la capçalera del fitxer (línia 1-4), afegir:

```js
import DropdownQuantitySelect from './DropdownQuantitySelect.jsx';
```

- [ ] **Step 2: Canviar el càlcul de `selectedDropdownOption`/`currentPrice` (línies 212-224)**

Context actual:

```js
        const hasDropdownOptions = e.extraType === 'desplegable' && Array.isArray(e.dropdownOptions) && e.dropdownOptions.length > 0;
        const selectedDropdownOption = hasDropdownOptions
          ? e.dropdownOptions.find(opt => opt.id === opts.dropdownSelection) || e.dropdownOptions[0]
          : null;
        const rawSwitchSelection = String(opts.switchSide ?? opts.extraSelection ?? '').trim().toLowerCase();
        const selectedSwitchSide = ['left', 'esquerra', 'a', '0'].includes(rawSwitchSelection) ? 'left' : 'right';
        const switchCurrentPrice = hasSwitchOptions
          ? (selectedSwitchSide === 'left' ? Number(switchOption.leftPrice ?? 0) : Number(switchOption.rightPrice ?? 0))
          : null;

        const basePrice = Number(e.price || 0);
        let currentPrice = basePrice;
        if (selectedDropdownOption) currentPrice = selectedDropdownOption.price;
```

Reemplaçar per:

```js
        const hasDropdownOptions = e.extraType === 'desplegable' && Array.isArray(e.dropdownOptions) && e.dropdownOptions.length > 0;
        const dropdownSelections = opts.dropdownSelections || {};
        const markedDropdownOptions = hasDropdownOptions
          ? e.dropdownOptions.filter(opt => Number(dropdownSelections[opt.id] || 0) > 0)
          : [];
        const dropdownTotal = markedDropdownOptions.reduce(
          (sum, opt) => sum + (Number(dropdownSelections[opt.id] || 0) * Number(opt.price || 0)),
          0
        );
        const rawSwitchSelection = String(opts.switchSide ?? opts.extraSelection ?? '').trim().toLowerCase();
        const selectedSwitchSide = ['left', 'esquerra', 'a', '0'].includes(rawSwitchSelection) ? 'left' : 'right';
        const switchCurrentPrice = hasSwitchOptions
          ? (selectedSwitchSide === 'left' ? Number(switchOption.leftPrice ?? 0) : Number(switchOption.rightPrice ?? 0))
          : null;

        const basePrice = Number(e.price || 0);
        let currentPrice = basePrice;
        if (hasDropdownOptions) currentPrice = dropdownTotal;
```

Nota: la variable `isSelected` (definida més amunt al component, línia ~202, via `isExtraSelected(e)`) segueix funcionant igual perquè `isExtraSelected` mira `selectedExtras?.[extra.id] === true`; per als extres `hasDropdownOptions`, `isSelected` reflecteix si l'usuari ha activat l'extra amb el botó × (`canDeactivate`), no si hi ha opcions marcades — aquest comportament ja existia abans (l'extra queda actiu quan es tria una opció, línia 303 actual: `if (!isMandatory && !isSelected) onChange(e.id, true)`), i es manté igual al Step 3 amb `handleChange`.

- [ ] **Step 3: Substituir el bloc del `<select>` (línies ~297-313)**

Context actual:

```jsx
              {hasDropdownOptions && (
                  <select
                    className="variant-select"
                    value={selectedDropdownOption?.id || ''}
                    onChange={(ev) => {
                      onOptionChange(e.id, 'dropdownSelection', ev.target.value);
                      if (!isMandatory && !isSelected) onChange(e.id, true);
                    }}
                    style={{ marginLeft: '10px' }}
                  >
                    {e.dropdownOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {(opt.labels?.ca || opt.label)} ({eur(opt.price)})
                      </option>
                    ))}
                  </select>
              )}
```

Reemplaçar per:

```jsx
              {hasDropdownOptions && (
                <DropdownQuantitySelect
                  options={e.dropdownOptions}
                  selections={dropdownSelections}
                  getLabel={opt => opt.labels?.ca || opt.label}
                  getPrice={opt => opt.price}
                  placeholder="Selecciona opcions..."
                  ariaLabel={`Opcions de ${e.label}`}
                  onChange={(optionId, quantity) => {
                    const nextSelections = { ...dropdownSelections, [optionId]: quantity };
                    onOptionChange(e.id, 'dropdownSelections', nextSelections);
                    const anyMarked = Object.values(nextSelections).some(q => Number(q) > 0);
                    if (!isMandatory && anyMarked && !isSelected) onChange(e.id, true);
                    if (!isMandatory && !anyMarked && isSelected) onChange(e.id, false);
                  }}
                />
              )}
```

- [ ] **Step 4: Verificar amb build**

Run: `npm run build`
Expected: build sense errors.

- [ ] **Step 5: Commit**

```bash
git add source/pressupostos-uauu/scripts/components/ExtrasSection.jsx
git commit -m "Millora: Desplegables d'opcions amb seleccio multiple i quantitat"
```

---

### Task 4: Actualitzar `SummaryPanel.jsx`

**Files:**

- Modify: `source/pressupostos-uauu/scripts/components/SummaryPanel.jsx:98-119`

**Interfaces:**

- Consumes: `e.priceDetail` (ja generat per `calculator.js` a la Tasca 2, inclou el detall multi-opció).

Context actual (línies 98-120):

```jsx
              .map(e => {
                const currentSelectionId = form.extraOptions?.[e.id]?.dropdownSelection;
                const selectedOption = e.dropdownOptions?.find(opt => opt.id === currentSelectionId);

                return (
                  <div key={e.id} className="line-item">
                    <div className="li-left">
                      <div className="li-label">
                        {e.label} {e.isMandatory && <span className="li-mandatory-tag">{t.mandatory}</span>}
                      </div>

                      {selectedOption && (
                        <div className="li-detail">
                          Seleccionat: {selectedOption.labels?.ca || selectedOption.label}
                        </div>
                      )}

                      {e.priceDetail && <div className="li-detail">{e.priceDetail}</div>}
                    </div>
                    <div className="li-amount">{eur(e.computedPrice)}</div>
                  </div>
                );
              })
```

- [ ] **Step 1: Treure la lectura de `dropdownSelection` únic i confiar en `priceDetail`**

Reemplaçar per:

```jsx
              .map(e => (
                <div key={e.id} className="line-item">
                  <div className="li-left">
                    <div className="li-label">
                      {e.label} {e.isMandatory && <span className="li-mandatory-tag">{t.mandatory}</span>}
                    </div>

                    {e.priceDetail && <div className="li-detail">{e.priceDetail}</div>}
                  </div>
                  <div className="li-amount">{eur(e.computedPrice)}</div>
                </div>
              ))
```

- [ ] **Step 2: Verificar amb build**

Run: `npm run build`
Expected: build sense errors.

- [ ] **Step 3: Commit**

```bash
git add source/pressupostos-uauu/scripts/components/SummaryPanel.jsx
git commit -m "Millora: Resum del pressupost mostra totes les opcions marcades als desplegables"
```

---

### Task 5: Verificació manual end-to-end al navegador

**Files:** cap canvi de fitxer — només verificació.

**Interfaces:** cap.

- [ ] **Step 1: Arrencar el servidor local**

Run: `node serve.js --port=8000`

- [ ] **Step 2: Obrir l'app**

Navegar a `http://localhost:8000/source/pressupostos-uauu/`.

- [ ] **Step 3: Provar un extra amb `extraType: 'desplegable'`**

Com que aquestes dades venen de Google Sheets (no hi ha exemples estàtics al codi — vegeu `spreadsheet.js:96-107`), cal:

- Confirmar amb l'usuari (Martí) quina finca/format/servei del full de càlcul en producció té `extraType: 'desplegable'` amb `dropdownOptions`, o
- Si no hi ha connexió a dades reals en local, afegir temporalment (només per a la prova, sense commitejar) un extra de mostra a `PRICE_CONFIG` (`config.js`) amb `extraType: 'desplegable'` i `dropdownOptions: [{id:'a', label:'Cava', price: 24}, {id:'b', label:'Vi', price: 18}]`, provar, i desfer el canvi (`git checkout -- source/pressupostos-uauu/scripts/data/config.js`) abans de continuar.

- [ ] **Step 4: Verificar comportament**

- Clicar el botó del desplegable nou: s'obre el popover amb una fila per opció (nom + preu + input de quantitat).
- Posar quantitat 2 a una opció i 1 a una altra: el botó tancat mostra el resum (p. ex. `"Cava ×2, Vi ×1"`), el preu de la línia a `ExtrasSection` i al `SummaryPanel` reflecteix `2×24 + 1×18 = 66 €` (+ IVA), i el detall de preu mostra el desglossament.
- Posar totes les quantitats a 0: si l'extra no és obligatori, desapareix de `SummaryPanel` (i es manté visible a `ExtrasSection` només si `isMandatory` o si l'usuari no l'ha desactivat explícitament amb ×, segons la lògica de `visibleExtras`).
- Clicar fora del popover: es tanca. Prement `Escape` amb el popover obert: es tanca.
- Provar en una finestra estreta (mòbil, ~375px): el popover i el botó s'ajusten a l'amplada disponible sense desbordar horitzontalment.

- [ ] **Step 5: Aturar el servidor**

`Ctrl+C` a la terminal on corre `node serve.js`.

---

## Self-Review (fet en escriure el pla)

- **Cobertura de l'spec:** model de dades (Task 2), component UI (Task 1+3), càlcul de preu (Task 2), resum (Task 4), estètica/CSS (Task 1). Tot cobert.
- **Sense placeholders:** cada step té codi complet, no hi ha "TODO" ni "similar a...".
- **Consistència de tipus:** `DropdownQuantitySelect` s'usa amb les mateixes props (`options`, `selections`, `onChange`, `getLabel`, `getPrice`) a Task 1 (definició) i Task 3 (ús). `dropdownSelections` és sempre `{ [optionId]: number }` a `calculator.js`, `ExtrasSection.jsx` i `App.jsx` (via `setExtraOption` genèric, sense canvis necessaris).
