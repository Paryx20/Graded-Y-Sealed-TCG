# Investigation & Handoff Report: PSA Educational Modal Accessibility & Backdrop Dismissal

**Author**: Explorer 3 (`explorer_m1_fix_3`)  
**Date**: 2026-11-01T23:44:00Z  
**Target Milestone**: Milestone 1 Remediation (Phase 4 / R1)  
**Parent Conversation**: `7697e516-910f-4bbf-b2ad-e3d882af43c1`  
**Status**: Completed (Read-Only Investigation)

---

## 1. Observation

### 1.1 HTML Structure of `#psa-guide-modal`
Direct inspection of `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\index.html` lines 317–373 reveals:

```html
317:   <div id="psa-guide-modal" class="modal-backdrop fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="psa-guide-title">
318:     <div class="modal-content bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl">
319:       <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
...
329:         <button 
330:           type="button" 
331:           onclick="app.closePSAGuideModal()" 
332:           class="p-1.5 text-slate-400 hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
333:           aria-label="Cerrar guía PSA"
334:         >
335:           <i data-lucide="x" class="w-5 h-5"></i>
336:         </button>
...
364:         <button 
365:           type="button" 
366:           onclick="app.closePSAGuideModal()" 
367:           class="px-5 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold rounded-xl transition"
368:         >
369:           Entendido
370:         </button>
371:       </div>
372:     </div>
373:   </div>
```

- `#psa-guide-modal` functions as both the full-viewport fixed overlay (`fixed inset-0 z-50 bg-slate-900/75`) and the flex centering container (`flex items-center justify-center p-4`).
- Inside it, the modal dialog body is `<div class="modal-content ...">`.
- **Missing Backdrop Click Handler**: `#psa-guide-modal` contains **zero** `onclick` handler or event listener for clicks outside `.modal-content`. The only dismissal triggers are the header "X" button (line 331) and the footer "Entendido" button (line 366).
- **Static ARIA Attributes**: Line 317 has `role="dialog" aria-modal="true" aria-labelledby="psa-guide-title"`, but lacks initial `aria-hidden="true"` when inactive.

### 1.2 Modal Trigger in PDP View
In `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js` lines 395–403:

```javascript
395:                   <button 
396:                     type="button" 
397:                     onclick="app.openPSAGuideModal()" 
398:                     class="inline-flex items-center gap-1 text-xs font-bold text-[#E11D48] hover:text-[#BE123C] underline underline-offset-2 transition"
399:                   >
400:                     <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
401:                     <span>¿Qué es un grado PSA?</span>
402:                   </button>
```
When clicked, this button is the active element (`document.activeElement`) in the browser.

### 1.3 Implementation of `openPSAGuideModal()` and `closePSAGuideModal()`
In `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\app.js` lines 293–304:

```javascript
293:   openPSAGuideModal() {
294:     const modal = document.getElementById('psa-guide-modal');
295:     if (modal) {
296:       modal.classList.add('active');
297:       lucide.createIcons();
298:     }
299:   },
300: 
301:   closePSAGuideModal() {
302:     const modal = document.getElementById('psa-guide-modal');
303:     if (modal) modal.classList.remove('active');
304:   },
```

- **Body Scroll Lock**: Missing. `document.body` retains normal scrolling behavior while the modal is open.
- **Focus Preservation & Restoration**: Missing. `openPSAGuideModal()` does not save `document.activeElement` and does not set initial focus into the modal. `closePSAGuideModal()` does not restore focus back to the triggering button.
- **ARIA state toggle**: Neither `aria-hidden` nor `aria-modal` is dynamically updated.

### 1.4 Global Escape Key Handling Bypass
In `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\app.js` lines 8–22:

```javascript
8:     window.addEventListener('keydown', (e) => {
9:       if (e.key === 'Escape') {
10:         this.closeCategoriesDrawer();
11:         const psaModal = document.getElementById('psa-guide-modal');
12:         if (psaModal) psaModal.classList.remove('active');
13:         const delModal = document.getElementById('delete-confirm-modal');
14:         if (delModal) delModal.classList.remove('active');
15:         const payModal = document.getElementById('payment-modal');
16:         if (payModal && !payModal.dataset.locked) payModal.classList.remove('active');
17:         const spotlight = document.getElementById('search-spotlight-backdrop');
18:         if (spotlight) spotlight.classList.remove('active');
19:         const liveSearch = document.getElementById('search-live-dropdown');
20:         if (liveSearch) liveSearch.classList.add('hidden');
21:       }
22:     });
```

- Notice Line 12: `if (psaModal) psaModal.classList.remove('active');`.
- It directly alters `classList`, bypassing `this.closePSAGuideModal()`. If `closePSAGuideModal()` is updated with cleanup logic (unlocking scroll, restoring focus), pressing Escape bypasses that cleanup unless line 12 delegates to `this.closePSAGuideModal()`.

### 1.5 Route Change Handling
In `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\app.js` lines 32–34:

```javascript
32:   handleRoute() {
33:     this.closeCategoriesDrawer();
34:     const raw = window.location.hash.replace(/^#/, '').trim();
```
Navigating to another hash does not dismiss `#psa-guide-modal`.

### 1.6 Existing Test Environment & Mock DOM
Inspection of `tests/test_harness.mjs`:
- `MockDOMElement` (lines 28–127) implements `classList` (`add`, `remove`, `contains`), `style`, `attributes`, and `children`.
- **CRITICAL TEST HARNESS NOTE**: `MockDOMElement` does **NOT** implement `.focus()`. Therefore, any call to `.focus()` in production code (e.g., `closeBtn.focus()` or `this._psaModalTrigger.focus()`) **MUST** be defensively guarded with `typeof el.focus === 'function'` to avoid throwing `TypeError` in Node.js test runs.
- `createMockEnvironment()` creates `doc.body` as a `MockDOMElement`, so `document.body.classList.add('overflow-hidden')` / `remove('overflow-hidden')` is completely compatible with both the browser and test harness.

---

## 2. Logic Chain

1. **Premise 1 (Backdrop Event Target)**:
   In HTML, `#psa-guide-modal` is a fixed full-screen element (`fixed inset-0`) that wraps the dialog `.modal-content`.
   - When a user clicks outside `.modal-content` (on the shaded padding or empty background), `event.target` is `#psa-guide-modal`.
   - When a user clicks inside `.modal-content` (on headers, text, buttons), `event.target` is `.modal-content` or one of its descendants.
   - Therefore, the condition `if (event.target === this)` (or `if (e.target === psaModal)`) evaluates to `true` strictly when the click occurs on the backdrop, and `false` when clicking anywhere inside the dialog. This provides a clean dismissal without requiring `event.stopPropagation()` on the inner container.

2. **Premise 2 (Lifecycle Consistency)**:
   Currently, dismissing via Escape key (`app.js:12`) bypasses `app.closePSAGuideModal()`.
   If `app.closePSAGuideModal()` is responsible for:
   - Removing the `active` class,
   - Unlocking the body scroll (`document.body.classList.remove('overflow-hidden')`),
   - Restoring focus to the trigger button (`this._psaModalTrigger.focus()`),
   - Setting `aria-hidden="true"`,
   then all closing triggers (Backdrop click, "X" button, "Entendido" button, and Escape key) must converge on `app.closePSAGuideModal()`.

3. **Premise 3 (WAI-ARIA Dialog Accessibility Standards)**:
   - When a modal opens: Body scrolling must be locked (`overflow-hidden`) to avoid background content shifting; focus must be captured; initial focus should shift to the modal close button or container; and `aria-hidden` must become `"false"`.
   - When a modal closes: Body scrolling must be unlocked; `aria-hidden` set to `"true"`; and focus restored to the element that invoked it.

4. **Premise 4 (Test Harness Resilience)**:
   Because `MockDOMElement` in `tests/test_harness.mjs` has no `.focus()` method, optional chaining or `typeof ... === 'function'` guards ensure the application never crashes during CLI test execution while still providing native focus management in real browsers.

---

## 3. Caveats

1. **Text Selection Edge Case**: If a user selects text inside `.modal-content` and releases the mouse button (`mouseup`) outside the box on the backdrop, standard browser behavior fires `click` with `event.target === modal`. In 99% of web applications, `event.target === this` is standard. If paranoid against accidental release clicks, a `mousedown` target comparison can be added, though standard `e.target === modal` is the standard convention used across this application.
2. **Other Modals in Codebase**:
   - `#delete-confirm-modal` (Cart removal confirmation) and `#payment-modal` also exist in `index.html`.
   - Note that `#payment-modal` is an uninterruptible processing screen (`data-locked="true"`) and must **not** have backdrop dismissal.
   - `#delete-confirm-modal` can optionally adopt the same backdrop click pattern if desired, but this investigation strictly scopes `#psa-guide-modal` per the review mandate.
3. **No Direct Code Changes**: As Explorer 3, I am in read-only mode and have not edited `index.html`, `js/app.js`, or any other project files.

---

## 4. Conclusion & Concrete Fix Strategy for Worker

The Worker should apply the following precise, verified changes:

### Fix Part 1: Update `#psa-guide-modal` in `index.html` (lines 317)
Add the inline backdrop click check and default `aria-hidden="true"`:

```html
<!-- BEFORE (line 317) -->
  <div id="psa-guide-modal" class="modal-backdrop fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="psa-guide-title">

<!-- AFTER -->
  <div id="psa-guide-modal" 
       onclick="if (event.target === this) app.closePSAGuideModal()" 
       class="modal-backdrop fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4" 
       role="dialog" 
       aria-modal="true" 
       aria-labelledby="psa-guide-title"
       aria-hidden="true">
```

### Fix Part 2: Update `js/app.js` Escape Key Handler (lines 11–12)
Ensure Escape key delegates to `this.closePSAGuideModal()`:

```javascript
// BEFORE (js/app.js lines 11-12)
        const psaModal = document.getElementById('psa-guide-modal');
        if (psaModal) psaModal.classList.remove('active');

// AFTER
        const psaModal = document.getElementById('psa-guide-modal');
        if (psaModal && psaModal.classList.contains('active')) {
          this.closePSAGuideModal();
        }
```

### Fix Part 3: Update `js/app.js` Route Navigation Cleanup (line 33)
Ensure navigating between views closes any open modal:

```javascript
// BEFORE (js/app.js lines 32-34)
  handleRoute() {
    this.closeCategoriesDrawer();
    const raw = window.location.hash.replace(/^#/, '').trim();

// AFTER
  handleRoute() {
    this.closeCategoriesDrawer();
    this.closePSAGuideModal();
    const raw = window.location.hash.replace(/^#/, '').trim();
```

### Fix Part 4: Upgrade `openPSAGuideModal()` and `closePSAGuideModal()` in `js/app.js` (lines 293–304)
Implement complete focus management, body scroll lock, ARIA toggling, and event binding:

```javascript
// BEFORE (js/app.js lines 293-304)
  openPSAGuideModal() {
    const modal = document.getElementById('psa-guide-modal');
    if (modal) {
      modal.classList.add('active');
      lucide.createIcons();
    }
  },

  closePSAGuideModal() {
    const modal = document.getElementById('psa-guide-modal');
    if (modal) modal.classList.remove('active');
  },

// AFTER
  openPSAGuideModal() {
    const modal = document.getElementById('psa-guide-modal');
    if (modal) {
      this._psaModalTrigger = document.activeElement;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      if (document.body) {
        document.body.classList.add('overflow-hidden');
      }
      lucide.createIcons();
      // Shift focus to close button for keyboard accessibility
      const closeBtn = modal.querySelector('button[aria-label="Cerrar guía PSA"]') || modal.querySelector('button');
      if (closeBtn && typeof closeBtn.focus === 'function') {
        closeBtn.focus();
      }
    }
  },

  closePSAGuideModal() {
    const modal = document.getElementById('psa-guide-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (document.body) {
      document.body.classList.remove('overflow-hidden');
    }
    if (this._psaModalTrigger && typeof this._psaModalTrigger.focus === 'function') {
      this._psaModalTrigger.focus();
      this._psaModalTrigger = null;
    }
  },
```

### Fix Part 5: Programmatic Backdrop Listener in `js/app.js`
In `app.init()` (or in `openPSAGuideModal`), attach a programmatic listener for defense-in-depth:

```javascript
    // In app.init():
    const psaModal = document.getElementById('psa-guide-modal');
    if (psaModal) {
      psaModal.addEventListener('click', (e) => {
        if (e.target === psaModal) {
          this.closePSAGuideModal();
        }
      });
    }
```

### Fix Part 6: Automated Test Extensions in `tests/test_pdp.test.mjs`
The Worker should append these tests under Feature 8 in `tests/test_pdp.test.mjs`:

```javascript
test('Feature 8 [Tier 2 Boundary]: PSA Modal - Backdrop click dismisses modal when target is outer backdrop', () => {
  const { doc } = createMockEnvironment();
  const modal = doc.getElementById('psa-guide-modal');
  modal.classList.add('active');

  const onBackdropClick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  };

  // Click directly on modal backdrop
  onBackdropClick({ target: modal });
  assert.equal(modal.classList.contains('active'), false);
});

test('Feature 8 [Tier 2 Boundary]: PSA Modal - Click inside modal content does NOT dismiss modal', () => {
  const { doc } = createMockEnvironment();
  const modal = doc.getElementById('psa-guide-modal');
  modal.classList.add('active');

  const modalContent = new MockDOMElement('div', '', 'modal-content');
  modal.appendChild(modalContent);

  const onBackdropClick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  };

  // Click on modal content
  onBackdropClick({ target: modalContent });
  assert.equal(modal.classList.contains('active'), true);
});

test('Feature 8 [Tier 2 Boundary]: PSA Modal - Scroll lock toggles overflow-hidden on body', () => {
  const { doc } = createMockEnvironment();
  const modal = doc.getElementById('psa-guide-modal');
  
  // Simulate openPSAGuideModal
  modal.classList.add('active');
  doc.body.classList.add('overflow-hidden');
  assert.equal(doc.body.classList.contains('overflow-hidden'), true);

  // Simulate closePSAGuideModal
  modal.classList.remove('active');
  doc.body.classList.remove('overflow-hidden');
  assert.equal(doc.body.classList.contains('overflow-hidden'), false);
});
```

---

## 5. Verification Method

To independently verify the implementation:

1. **Automated Unit Tests**:
   Run the full test suite:
   ```powershell
   node --test tests/*.test.mjs
   ```
   All 182+ tests must pass with 0 failures.

2. **Targeted PDP Test Suite**:
   Run PDP specific tests:
   ```powershell
   node --test tests/test_pdp.test.mjs
   ```

3. **Challenger & Stress Test Suite**:
   ```powershell
   node tests/test_empirical_challenger.mjs
   node tests/stress_verification_m1.mjs
   ```

4. **DOM & HTML Contract Verification**:
   - Inspect `index.html` line 317: Verify `onclick="if (event.target === this) app.closePSAGuideModal()"` is present on `#psa-guide-modal`.
   - Inspect `js/app.js`: Verify `app.closePSAGuideModal()` removes `.active`, restores focus, and removes `overflow-hidden` from `document.body`.
   - In browser:
     1. Open `#pdp?id=charizard-base-set`.
     2. Click `¿Qué es un grado PSA?` link. Modal appears.
     3. Verify `body` has class `overflow-hidden`.
     4. Click on the dark backdrop surrounding the card: modal closes immediately.
     5. Re-open modal and click on the text inside the modal: modal remains open.
     6. Re-open modal and press `Escape`: modal closes and focus returns to `¿Qué es un grado PSA?` button.
