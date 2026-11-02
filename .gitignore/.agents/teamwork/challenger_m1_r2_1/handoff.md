# Empirical Adversarial Challenge Report — Milestone 1 Iteration 2

## 1. Observation

Direct observations from source inspection and execution in workspace: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce`:

### 1.1 Source Code Verification in `js/views/pdp.js`

1. **`PDPView.handleHoloMove` (lines 518–540)**:
```javascript
  handleHoloMove(e) {
    if (!e) return;
    const scene = document.getElementById('pdp-3d-scene');
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;

    const pointer = (e.touches && e.touches.length > 0) ? e.touches[0] : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e);
    const clientX = pointer.clientX;
    const clientY = pointer.clientY;

    if (typeof clientX !== 'number' || typeof clientY !== 'number' || isNaN(clientX) || isNaN(clientY)) {
      return;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));

    scene.style.setProperty('--holo-x', `${xPct.toFixed(1)}%`);
    scene.style.setProperty('--holo-y', `${yPct.toFixed(1)}%`);
  },
```
Direct observation:
- Touch events are extracted via `(e.touches && e.touches.length > 0) ? e.touches[0] : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e)`.
- Non-numeric or `NaN` coordinates are rejected early: `if (typeof clientX !== 'number' || typeof clientY !== 'number' || isNaN(clientX) || isNaN(clientY)) return;`.
- Boundaries are clamped strictly to `[0, 100]` with `Math.max(0, Math.min(100, ...))`.
- CSS custom properties `--holo-x` and `--holo-y` receive formatted percentages: `${xPct.toFixed(1)}%`.

2. **`PDPView.updateQuantity` (lines 555–568)**:
```javascript
  updateQuantity(delta) {
    const rawDelta = typeof delta === 'number' ? delta : parseInt(delta, 10);
    if (isNaN(rawDelta)) return;

    const current = parseInt(Store.data.pdpQuantity, 10) || 1;
    const next = Math.max(1, Math.min(10, current + rawDelta));

    Store.data.pdpQuantity = next;
    if (typeof document !== 'undefined') {
      const el = document.getElementById('pdp-quantity-value');
      if (el) el.innerText = String(next);
    }
    return next;
  },
```
Direct observation:
- Delta coercion is guarded: `const rawDelta = typeof delta === 'number' ? delta : parseInt(delta, 10); if (isNaN(rawDelta)) return;`.
- Current value fallback: `parseInt(Store.data.pdpQuantity, 10) || 1`.
- Clamping is enforced on both boundaries: `Math.max(1, Math.min(10, current + rawDelta))`.

3. **`PDPView.render` Era Fallback (line 389)**:
```javascript
<p class="text-xs sm:text-sm text-slate-500 mt-1">${product.rareza} • ${product.set} • ${isSealed ? `Era ${(product.era || 'vintage').toUpperCase()} • Display Sellado` : `${product.tipo} • Cert #${product.certNumber}`}</p>
```
Direct observation:
- Property access is guarded with fallback `(product.era || 'vintage').toUpperCase()`, producing `'VINTAGE'` if `product.era` is undefined, null, or empty string.

### 1.2 Test Execution Output

1. **Adversarial Verification Suite (`tests/test_challenger_m1_r2.test.mjs`)**:
Command: `node --test tests/test_challenger_m1_r2.test.mjs`
Output:
```
✔ PDPView.handleHoloMove: Simulated touch events clamp correctly within [0%, 100%] (2.9912ms)
✔ PDPView.handleHoloMove: Extreme pointer coordinates (-9999, 999999, NaN) maintain bounds [0%, 100%] (1.837ms)
✔ PDPView.handleHoloMove: Malformed events and DOM edge conditions handle safely (1.4094ms)
✔ PDPView.handleHoloMove: 10,000 randomized adversarial coordinate iterations stay in [0%, 100%] (12.9706ms)
✔ PDPView.updateQuantity: Large negative deltas (-10, -1000) strictly clamp to 1 (1.5336ms)
✔ PDPView.updateQuantity: Zero delta preserves current quantity within [1, 10] (1.2833ms)
✔ PDPView.updateQuantity: Decimal numbers keep quantity strictly within [1, 10] (1.3428ms)
✔ PDPView.updateQuantity: Non-numeric strings, NaN, and objects are safely rejected (1.2089ms)
✔ PDPView.updateQuantity: Corrupted store state auto-recovers to valid [1, 10] (1.5195ms)
✔ PDPView.updateQuantity: 10,000 randomized operations guarantee 1 <= qty <= 10 (7.7806ms)
✔ PDPView.render: Custom products missing era do NOT throw unhandled errors (13.1186ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 125.6292
```

2. **Full Regression Test Suite (`cmd /c "node --test tests/*.test.mjs"`)**:
Command: `cmd /c "node --test tests/*.test.mjs"`
Output:
```
ℹ tests 193
ℹ suites 0
ℹ pass 193
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2616.2718
```
All 193 tests passed with 0 failures, 0 cancelled, and 0 skipped.

---

## 2. Logic Chain

1. **Premise 1 (`handleHoloMove` touch & extreme coords)**:
   - When a simulated touch event `{ touches: [{ clientX: 50, clientY: 50 }] }` is dispatched with scene element rect `[left: 100, top: 100, width: 200, height: 300]`, `clientX - rect.left = -50`. `Math.max(0, Math.min(100, (-50/200)*100))` evaluates to `0`. `scene.style.setProperty('--holo-x', '0.0%')` and `--holo-y` evaluates to `0.0%`. Both values remain strictly in `[0%, 100%]`.
   - When extreme negative coordinates `clientX: -9999, clientY: -9999` are provided, `xPct` and `yPct` evaluate to `0.0%`.
   - When extreme positive coordinates `clientX: 999999, clientY: 999999` are provided, `xPct` and `yPct` evaluate to `100.0%`.
   - When `clientX: NaN` is passed, `isNaN(clientX)` is true, triggering early return. The method exits without mutating DOM styles, avoiding invalid CSS values.
   - When fuzzed over 10,000 randomized iterations with coordinates up to ±1,000,000, 100% of generated values remained within `[0.0%, 100.0%]`.

2. **Premise 2 (`updateQuantity` clamping & sanitization)**:
   - When `delta = -10` is passed from `current = 5`, `Math.max(1, Math.min(10, 5 + (-10))) = Math.max(1, -5) = 1`. Quantity is strictly clamped to `1`.
   - When `delta = 0` is passed from any quantity in `[1, 10]`, `current + 0 = current`, preserving the quantity unchanged within `[1, 10]`.
   - When decimal deltas (`delta = 2.5`, `delta = -0.5`, `delta = 25.7`) are provided, `Math.max(1, Math.min(10, ...))` maintains the value within `[1, 10]`. In addition, string numeric inputs like `"2.8"` are integer-parsed via `parseInt(delta, 10)` to `2`.
   - When non-numeric strings (`"abc"`, `""`, `"<script>"`, `null`, `undefined`, `{}`) are passed, `parseInt` yields `NaN`, triggering `if (isNaN(rawDelta)) return;`. Neither store state nor DOM text is modified.
   - When store state itself is artificially corrupted (`-50`, `NaN`, `'corrupted'`), subsequent calls to `updateQuantity` immediately re-clamp to `[1, 10]`.
   - 10,000 high-frequency randomized operations confirmed 0 out-of-bounds occurrences.

3. **Premise 3 (Custom products missing `era`)**:
   - In `PDPView.render()`, sealed products reference `(product.era || 'vintage').toUpperCase()`.
   - Custom sealed products with omitted `era`, `era: undefined`, `era: null`, or `era: ""` evaluate `(product.era || 'vintage')` to `'vintage'`, invoking `.toUpperCase()` safely to yield `'VINTAGE'`.
   - Verified that `PDPView.render()` executed on 5 distinct custom product fixtures without throwing any TypeError or unhandled exception.

4. **Premise 4 (Full Test Suite Regression Check)**:
   - The unified test command `cmd /c "node --test tests/*.test.mjs"` executed all 193 unit, boundary, integration, and scenario tests spanning Phase 4 through Phase 7.
   - 193 passed, 0 failed, 0 skipped.

---

## 3. Caveats

- Testing was executed in Node.js runtime using mock DOM structures (`vm` sandbox) replicating the browser DOM environment. Visual GPU-level shader rendering of the CSS sheen (`radial-gradient`) was verified via exact CSS property output (`--holo-x` and `--holo-y`), as headless Node does not execute native GPU rasterization.
- No other caveats.

---

## 4. Conclusion

**VERDICT: CONFIRM**

All remediations in Milestone 1 Iteration 2 are empirically verified and mathematically sound:
1. `PDPView.handleHoloMove` handles simulated touch events and extreme pointer coordinates (`-9999`, `999999`, `NaN`) safely, guaranteeing `--holo-x` and `--holo-y` remain strictly within `[0.0%, 100.0%]`.
2. `PDPView.updateQuantity(delta)` enforces bounds strictly within `[1, 10]` under large negative deltas, zero, decimal numbers, and non-numeric strings.
3. `PDPView.render()` gracefully defaults custom products missing `era` without throwing unhandled exceptions.
4. The complete test suite of 193 tests passes with zero failures.

---

## 5. Verification Method

To independently reproduce this verification:

1. **Run the full test suite**:
   ```powershell
   cmd /c "node --test tests/*.test.mjs"
   ```
   *Expected output*: 193 pass, 0 fail.

2. **Run the adversarial challenge suite directly**:
   ```powershell
   node --test tests/test_challenger_m1_r2.test.mjs
   ```
   *Expected output*: 11 pass, 0 fail.

3. **Inspect implementation files**:
   - `js/views/pdp.js`: Lines 518–540 (`handleHoloMove`), lines 555–568 (`updateQuantity`), line 389 (`era || 'vintage'`).
   - `tests/test_challenger_m1_r2.test.mjs`: Adversarial stress tests and fuzzing harnesses.

*Invalidation Conditions*:
- Any occurrence of `--holo-x` or `--holo-y` outside `[0%, 100%]`.
- Any value of `Store.data.pdpQuantity` outside `[1, 10]`.
- Any unhandled exception thrown by `PDPView.render()` on sealed products missing `era`.
