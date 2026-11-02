# Technical Analysis & Implementation Strategy: Requirement R1 (Interactive 3D Card Viewer on PDP)

## 1. Executive Summary

Requirement R1 mandates an interactive 3D card viewer on the Product Detail Page (PDP) that enables users to freely inspect cards with smooth mouse or touch drag rotation in 3D perspective, viewing both front and reverse sides.

Current inspection reveals that while CSS 3D structure (`perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`) is present in `css/styles.css`, `#pdp-3d-scene` in `js/views/pdp.js` only listens to mousemove and touch movements to compute holographic gradient coordinates (`--holo-x` and `--holo-y`). Card flipping currently only occurs via discrete button clicks (`PDPView.setInspectorMode('back')`), and drag-to-rotate in 3D space is completely absent.

This document establishes the exact, production-ready technical design for the Worker agent to implement the unified pointer/mouse/touch drag controller in `js/views/pdp.js` and CSS optics hardening in `css/styles.css`.

---

## 2. Current State & Codebase Observations

### 2.1. Target Files & Key Line References

1. **`js/views/pdp.js`**:
   - **Lines 98–147 (`renderInspectorStage`)**: Renders `#pdp-3d-scene` with inline handlers `onmousemove="PDPView.handleHoloMove(event)"`, `ontouchstart="..."`, `ontouchmove="..."`, `ontouchend="..."`. Contains `#pdp-3d-object`, `.card-3d-front` (with `#pdp-holo-layer`), `.card-3d-back` (with `img/cards/card-back.png` and `.centering-grid-overlay`), and `#pdp-cert-badge`.
   - **Lines 513–516 (`afterRender`)**: Currently executes only `this.drawChart()` and `this.bindChartEvents()`. Does not bind any 3D scene drag controller.
   - **Lines 518–540 (`handleHoloMove`)**: Computes relative coordinates `xPct` and `yPct` within `[0%, 100%]` and applies them to `scene.style.setProperty('--holo-x')` and `--holo-y`. Contains strict coordinate sanitization (ignoring NaN, non-numeric values).
   - **Lines 542–545 (`setInspectorMode`)**: Sets `Store.data.pdpInspectorMode = mode` and triggers `app.renderCurrentView()`.

2. **`css/styles.css`**:
   - **Lines 167–201**:
     * `.card-3d-scene`: `perspective: 1000px;`. Lacks `touch-action: none;`, `user-select: none;`, and grab cursor indicators.
     * `.card-3d-object`: `transform-style: preserve-3d; transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);`. Has no dynamic transition toggling for instant response during drag.
     * `.card-3d-face`: `position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;`.
     * `.card-3d-back`: `transform: rotateY(180deg);`.
     * `.card-3d-front`: Missing an explicit rule in CSS; co-planar with back face at `translateZ(0)`, which can cause sub-pixel Z-fighting during rotational transforms.
     * `img` inside cards: Not guarded against native browser image drag (`-webkit-user-drag: none`).

3. **Regression Test Constraints**:
   - `tests/test_pdp.test.mjs` (46 tests): Asserts `#pdp-holo-layer`, `.holo-sheen-layer`, `handleHoloMove` calculations (`50.0%`, `65.5%`, `42.0%`), `#pdp-cert-badge`, `is-flipped-y` on mode 'back', `card-3d-back` with `img/cards/card-back.png`, and `.centering-grid-overlay`.
   - `tests/test_challenger_m1_r2.test.mjs` (11 tests): Adversarially tests `PDPView.handleHoloMove` with touches, extreme negative/positive coordinates, NaN, and 10,000 randomized iterations.
   - `tests/test_empirical_challenger.mjs`: Asserts that sealed products (`booster-team-rocket`) NEVER render `#pdp-3d-scene` even if `pdpInspectorMode` is set to 'back' or 'slab'.

---

## 3. Mathematical Model & Interaction Physics

### 3.1. Euler Rotation Coordinate System

The 3D card inspector utilizes a 2-axis Euler gimbal system with screen-space perspective:

$$\mathbf{T}_{\text{card}} = \text{perspective}(1000\text{px}) \cdot \mathbf{R}_x(\theta_x) \cdot \mathbf{R}_y(\theta_y)$$

1. **Continuous Yaw ($\theta_y$, Horizontal Rotation)**:
   - Driven by horizontal pointer translation: $\Delta x = x_{\text{current}} - x_{\text{start}}$.
   - Sensitivity factor: $k_y = 0.55^\circ/\text{px}$ (calibrated so ~330px horizontal drag corresponds to 180° rotation).
   - $\theta_y = \theta_{y,\text{start}} + \Delta x \cdot k_y$.
   - **Continuous Range**: Not clamped. Users can rotate continuously past 360°, allowing multiple 360° inspections in either clockwise or counter-clockwise directions.

2. **Clamped Pitch ($\theta_x$, Vertical Tilt)**:
   - Driven by vertical pointer translation: $\Delta y = y_{\text{current}} - y_{\text{start}}$.
   - Sensitivity factor: $k_x = 0.35^\circ/\text{px}$.
   - $\theta_x = \text{clamp}(\theta_{x,\text{start}} - \Delta y \cdot k_x, -40^\circ, +40^\circ)$.
   - Negative delta $y$ (dragging up) tilts top edge away; positive delta $y$ (dragging down) tilts top edge toward viewer. Clamping at $\pm 40^\circ$ prevents disorientation and keeps card information legible.

3. **Multiplication Order**:
   - `rotateX` is specified before `rotateY` in CSS: `perspective(1000px) rotateX(...) rotateY(...)`.
   - In CSS 3D transform semantics ($M = \text{Perspective} \cdot R_x \cdot R_y$), the horizontal rotation $R_y$ is performed in the card's local coordinate frame, while $R_x$ tilts around the fixed camera/screen X-axis. This ensures that tilting vertically tilts the top edge toward/away from the viewer regardless of whether the card is showing the front or back face.

### 3.2. Dynamic Transition State Machine

```
[RESTING / HOVER]
  transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)
  cursor: grab
       │
       ▼ (pointerdown)
[ACTIVE DRAG]
  transition: none  <── Instant zero-lag 1:1 tracking
  cursor: grabbing
  isDragging: true
  scene.setPointerCapture(pointerId)
       │
       ▼ (pointermove)
  Update rotateX (clamped [-40, 40])
  Update rotateY (continuous)
  Track velocity (px/ms)
  Update handleHoloMove(e)
       │
       ▼ (pointerup / pointercancel)
[RELEASE & DECELERATION]
  isDragging: false
  scene.releasePointerCapture(pointerId)
  Apply momentum delta: rotY += clamp(vx * 80, -60, 60)
  transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)  <── Smooth deceleration
```

- **Drag Responsiveness**: Setting `card.style.transition = 'none'` during pointerdown/pointermove ensures zero input lag and eliminate rubberbanding.
- **Flick / Inertia Physics**: On pointerup, velocity $v_x = \frac{\Delta x}{\Delta t}$ is evaluated. If $|v_x| > 0.15\text{ px/ms}$, an inertia offset $\Delta \theta_y = \text{clamp}(v_x \cdot 80, -60^\circ, +60^\circ)$ is added to $\theta_y$. Restoring `transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)` causes the browser compositor to smoothly decelerate the spin into a resting position.

---

## 4. Sheen Preservation & Optical Stacking

1. **Holographic Sheen Tracking**:
   - During active pointermove (or hover), `PDPView.handleHoloMove(e)` is invoked with the active pointer coordinates.
   - `--holo-x` and `--holo-y` update in real time on `#pdp-3d-scene`.
   - In `css/styles.css`, `.card-3d-scene.is-dragging .holo-sheen-layer` is given `opacity: 1` so the sheen remains vivid during touch drag on mobile where `:hover` is inactive.

2. **Backface Visibility & Co-Planar Z-Fighting Prevention**:
   - `.card-3d-face` maintains `backface-visibility: hidden` and `-webkit-backface-visibility: hidden`.
   - `.card-3d-front` is explicitly assigned `transform: rotateY(0deg) translateZ(1px);`.
   - `.card-3d-back` is assigned `transform: rotateY(180deg) translateZ(1px);`.
   - The microscopic $1\text{px}$ offset along the normal vectors separates co-planar layers, completely eliminating sub-pixel rendering artifacts and z-fighting flickering at shallow viewing angles in Chromium and WebKit.
   - At $0^\circ \le |\theta_y \pmod{360^\circ}| < 90^\circ$ or $270^\circ < |\theta_y \pmod{360^\circ}| \le 360^\circ$, `.card-3d-front` is visible and `.card-3d-back` is hidden.
   - At $90^\circ < |\theta_y \pmod{360^\circ}| < 270^\circ$, `.card-3d-back` is visible and `.card-3d-front` is hidden.

3. **Event Interference Prevention**:
   - `touch-action: none;` on `.card-3d-scene` prevents mobile browser scroll interception.
   - `user-select: none;` and `-webkit-user-select: none;` prevent blue text/element highlight rectangles.
   - `pointer-events: none;` and `-webkit-user-drag: none;` on card `img` elements prevent native HTML5 image drag ghosts.

---

## 5. Exact Implementation Specification for the Worker

### 5.1. Modifications to `css/styles.css`

Replace lines 167–205 of `css/styles.css` with:

```css
/* ==============================================================================
   3D CARD INSPECTOR & HOLOGRAPHIC OPTICS (Requirement R1)
   ============================================================================== */

.card-3d-scene {
  -webkit-perspective: 1000px;
  perspective: 1000px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}

.card-3d-scene.is-dragging {
  cursor: grabbing;
}

.card-3d-object {
  width: 100%;
  height: 100%;
  position: relative;
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
  -webkit-transition: -webkit-transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1);
  transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1);
  will-change: transform;
}

.card-3d-object.is-flipped-y {
  -webkit-transform: rotateY(180deg);
  transform: rotateY(180deg);
}

.card-3d-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-3d-front {
  -webkit-transform: rotateY(0deg) translateZ(1px);
  transform: rotateY(0deg) translateZ(1px);
}

.card-3d-back {
  -webkit-transform: rotateY(180deg) translateZ(1px);
  transform: rotateY(180deg) translateZ(1px);
}

.card-3d-face img {
  pointer-events: none;
  -webkit-user-drag: none;
  user-select: none;
}

.holo-sheen-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 0.75rem;
  background: radial-gradient(
    circle at var(--holo-x, 50%) var(--holo-y, 50%),
    rgba(255, 255, 255, 0.38) 0%,
    rgba(251, 191, 36, 0.18) 25%,
    rgba(56, 189, 248, 0.16) 50%,
    rgba(225, 29, 72, 0.12) 72%,
    transparent 90%
  );
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.card-3d-scene:hover .holo-sheen-layer,
.card-3d-scene.is-dragging .holo-sheen-layer {
  opacity: 1;
}
```

### 5.2. Modifications to `js/views/pdp.js`

#### A. Keep `renderInspectorStage` HTML Intact with Safe Non-Draggable Assets
In `js/views/pdp.js` lines 98–147, preserve all existing IDs and test assertions while adding `pointer-events-none` and `draggable="false"`:

```javascript
    const isFlipped = mode === 'back';
    return `
      <div 
        id="pdp-3d-scene" 
        onmousemove="PDPView.handleHoloMove(event)"
        ontouchstart="PDPView.handleHoloMove(event)"
        ontouchmove="PDPView.handleHoloMove(event)"
        ontouchend="PDPView.handleHoloMove(event)"
        class="w-full h-full min-h-[370px] card-3d-scene flex items-center justify-center relative p-4 select-none touch-none cursor-grab"
      >
        <div id="pdp-3d-object" class="card-3d-object min-h-[350px] ${isFlipped ? 'is-flipped-y' : ''}">
          <div class="card-3d-face card-3d-front p-2">
            <div class="relative inline-flex items-center justify-center max-h-[350px]">
              <img 
                id="pdp-main-image"
                src="${product.imagenLocal}" 
                alt="${product.nombre}"
                class="max-h-[340px] max-w-full object-contain filter drop-shadow-2xl rounded-xl pointer-events-none select-none"
                draggable="false"
                onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
              />
              <div id="pdp-holo-layer" class="holo-sheen-layer"></div>
            </div>
          </div>

          <div class="card-3d-face card-3d-back p-2">
            <div class="relative inline-flex items-center justify-center max-h-[350px]">
              <img 
                src="img/cards/card-back.png" 
                class="w-full h-full object-cover rounded-xl max-h-[340px] max-w-[245px] shadow-2xl pointer-events-none select-none" 
                draggable="false"
                alt="Reverso de carta Pokémon" 
                onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
              />
              <div class="centering-grid-overlay">
                <span class="absolute top-2 left-2 bg-[#0F172A]/90 text-[#FEF3C7] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#D97706]/50">
                  EJE X: 50.0% / 50.0%
                </span>
                <span class="absolute bottom-2 right-2 bg-[#059669]/95 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                  EJE Y: 50.0% / 50.0% • BORDES OK
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="absolute top-3 left-3 bg-[#0F172A] text-white border border-slate-700 px-3 py-1 rounded-lg text-xs font-black shadow-md flex items-center gap-1.5 z-10 pointer-events-none">
          <i data-lucide="shield-check" class="w-4 h-4 text-[#059669]"></i>
          <span id="pdp-cert-badge">${this.getConditionFullTitle(condition)} • #${certCode}</span>
        </div>
      </div>
    `;
```

#### B. Update `afterRender()` to Initialize Controller
```javascript
  afterRender() {
    this.drawChart();
    this.bindChartEvents();
    this.bindCard3DController();
  },
```

#### C. Add Controller Methods: `bindCard3DController` & `applyCard3DTransform`
Add right after `afterRender()`:

```javascript
  bindCard3DController() {
    const scene = document.getElementById('pdp-3d-scene');
    const card = document.getElementById('pdp-3d-object');
    if (!scene || !card) return;

    // Defensive check for headless/mock test environments
    if (typeof scene.addEventListener !== 'function') return;

    // Abort previous event listeners to eliminate memory leaks across re-renders
    if (this._card3DAbort) {
      try { this._card3DAbort.abort(); } catch (_) {}
    }
    this._card3DAbort = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const signal = this._card3DAbort ? this._card3DAbort.signal : undefined;

    const mode = (typeof Store !== 'undefined' && Store.data && Store.data.pdpInspectorMode) || 'front';

    // Initialize or synchronize internal rotation state
    if (!this._card3D || this._card3D.mode !== mode) {
      this._card3D = {
        mode,
        rotX: 0,
        rotY: mode === 'back' ? 180 : 0,
        isDragging: false,
        startX: 0,
        startY: 0,
        startRotX: 0,
        startRotY: 0,
        lastX: 0,
        lastTime: 0,
        velocityX: 0
      };
    }

    this.applyCard3DTransform();

    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;

      this._card3D.isDragging = true;
      const pointer = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      this._card3D.startX = pointer.clientX;
      this._card3D.startY = pointer.clientY;
      this._card3D.startRotX = this._card3D.rotX;
      this._card3D.startRotY = this._card3D.rotY;
      this._card3D.lastX = pointer.clientX;
      this._card3D.lastTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this._card3D.velocityX = 0;

      card.style.transition = 'none';
      scene.classList.add('is-dragging');

      if (scene.setPointerCapture && e.pointerId !== undefined) {
        try { scene.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (e.cancelable && e.type !== 'touchstart') {
        e.preventDefault();
      }
    };

    const onPointerMove = (e) => {
      // Sheen tracking remains active
      this.handleHoloMove(e);

      if (!this._card3D || !this._card3D.isDragging) return;

      const pointer = (e.touches && e.touches.length > 0) ? e.touches[0] : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e);
      if (typeof pointer.clientX !== 'number' || isNaN(pointer.clientX)) return;

      const deltaX = pointer.clientX - this._card3D.startX;
      const deltaY = pointer.clientY - this._card3D.startY;

      // Continuous horizontal rotation (0.55 deg/px)
      this._card3D.rotY = this._card3D.startRotY + deltaX * 0.55;

      // Clamped vertical tilt (-40 deg to +40 deg, 0.35 deg/px)
      this._card3D.rotX = Math.max(-40, Math.min(40, this._card3D.startRotX - deltaY * 0.35));

      // Calculate instantaneous velocity for release deceleration
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const dt = now - this._card3D.lastTime;
      if (dt > 10) {
        this._card3D.velocityX = (pointer.clientX - this._card3D.lastX) / dt;
        this._card3D.lastX = pointer.clientX;
        this._card3D.lastTime = now;
      }

      this.applyCard3DTransform();
      if (e.cancelable && e.type !== 'touchmove') {
        e.preventDefault();
      }
    };

    const onPointerUp = (e) => {
      if (!this._card3D || !this._card3D.isDragging) return;
      this._card3D.isDragging = false;
      scene.classList.remove('is-dragging');

      if (scene.releasePointerCapture && e && e.pointerId !== undefined) {
        try { scene.releasePointerCapture(e.pointerId); } catch (_) {}
      }

      // Smooth deceleration / momentum flick
      const vx = this._card3D.velocityX || 0;
      if (Math.abs(vx) > 0.15) {
        const momentumY = Math.max(-60, Math.min(60, vx * 80));
        this._card3D.rotY += momentumY;
      }

      card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)';
      this.applyCard3DTransform();
    };

    const listenerOpts = signal ? { signal } : false;
    scene.addEventListener('pointerdown', onPointerDown, listenerOpts);
    scene.addEventListener('pointermove', onPointerMove, listenerOpts);
    scene.addEventListener('pointerup', onPointerUp, listenerOpts);
    scene.addEventListener('pointercancel', onPointerUp, listenerOpts);

    // Fallback touch listeners for older mobile environments
    const touchOpts = signal ? { signal, passive: false } : { passive: false };
    scene.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) onPointerDown(e.touches[0]);
    }, touchOpts);
    scene.addEventListener('touchmove', (e) => {
      if (e.cancelable) e.preventDefault();
      onPointerMove(e);
    }, touchOpts);
    scene.addEventListener('touchend', (e) => {
      onPointerUp(e);
    }, touchOpts);
  },

  applyCard3DTransform() {
    const card = document.getElementById('pdp-3d-object');
    if (!card || !this._card3D) return;
    const { rotX, rotY } = this._card3D;
    card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  },
```

#### D. Synchronize `setInspectorMode(mode)`
Update lines 542–545 to keep `_card3D` angles aligned when user clicks inspector mode buttons:

```javascript
  setInspectorMode(mode) {
    Store.data.pdpInspectorMode = mode;
    if (this._card3D) {
      this._card3D.mode = mode;
      this._card3D.rotX = 0;
      this._card3D.rotY = mode === 'back' ? 180 : 0;
    }
    app.renderCurrentView();
  },
```

---

## 6. Verification and Regression Checklist

| Test Item | Verification Technique | Target Result |
|---|---|---|
| Pointer Down Lag | Check `card.style.transition` during drag | Evaluates to `'none'` |
| Pointer Move Transform | Inspect `card.style.transform` | Contains `perspective(1000px) rotateX(...) rotateY(...)` |
| Yaw Continuous Rotation | Drag across >360px horizontally | `rotY` values smoothly pass 180° and 360° without jumping |
| Pitch Clamp | Drag >200px vertically up & down | `rotX` strictly bounded in `[-40.00deg, 40.00deg]` |
| Pointer Release Transition | Check `card.style.transition` on release | Evaluates to `'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)'` |
| Holographic Sheen Continuity | Move pointer across `#pdp-3d-scene` | `--holo-x` and `--holo-y` update dynamically in `[0.0%, 100.0%]` |
| Backface Visibility & 180° Flip | Rotate card to 180° | `.card-3d-front` is hidden, `.card-3d-back` is fully visible |
| Zero Z-Fighting | Inspect card at 45° and 135° angles | Front and back faces render cleanly without pixel flicker |
| Mobile Touch Action | Touch drag on mobile viewport | Card rotates smoothly; page does not vertically scroll or zoom |
| Automated Test Regression | Run `node --test tests/*.test.mjs` | All existing unit and challenger tests pass 100% |
