## 2026-11-01T22:52:53Z
You are Worker for Milestone 1: Phase 4 Visual Assets & Adaptive 3D PDP (teamwork_worker, Generation 2).
Your working directory is: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_m1_gen2\
Your parent is: 7697e516-910f-4bbf-b2ad-e3d882af43c1

MANDATORY: Read ORIGINAL_REQUEST.md first:
c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md

Also read PROJECT.md and survey findings:
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\orchestrator_1\PROJECT.md
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_1\handoff.md
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context from predecessor:
The previous worker completed generating and placing the image assets:
- `img/cards/card-back.png` and `img/cards/raichu-gx.png` exist!
- `img/sealed/team-rocket-box-front.png`, `team-rocket-box-perspective.png`, and `team-rocket-box-side.png` exist!
Verify their existence and integrity.

Exclusive File Ownership:
- `js/views/pdp.js`
- `css/styles.css`
- `js/data.js` (only for adding/confirming product attributes `tipo_item`/`tipo_discriminador` and image paths)
- `img/cards/` and `img/sealed/` (if any adjustments needed)

Mission:
1. CSS 3D Card Inspector in `js/views/pdp.js` & `css/styles.css`:
   - Smooth transitions between modes:
     * 'Frontal': Vertical card display with interactive CSS holographic reflection shimmer (`.holo-sheen-layer`, mousemove coords `--holo-x`, `--holo-y`).
     * 'Reverso y Bordes': 180° Y-axis rotation (`rotateY(180deg)`) showing official back image (`img/cards/card-back.png`) under the 50/50 centering overlay grid (`.centering-grid-overlay`). Replace the synthetic SVG in `.card-3d-back` with `<img src="img/cards/card-back.png" class="w-full h-full object-cover rounded-xl" alt="Reverso de carta Pokémon">`.
     * 'Slab PSA': Acrylic grading slab frame (`.psa-acrylic-slab`) with authentic top PSA certification label in CSS (red border, PSA grade badge, barcode, cert number).
2. Adaptive Conditional PDP Logic in `js/views/pdp.js`:
   - Branch on `product.tipo_discriminador === 'PRODUCTO_SELLADO' || product.categoria === 'sealed'`:
     * If `PRODUCTO_SELLADO`:
       - HIDE the PSA condition radio selector (Raw/PSA 8/PSA 9/PSA 10).
       - HIDE the 3D card inspection flip controls ('Frontal', 'Reverso y Bordes', 'Slab PSA').
       - DISPLAY the multi-angle sealed packaging gallery (main viewport showing selected angle, thumbnails below for 'Frontal', 'Perspectiva 3/4', 'Lateral' pointing to `img/sealed/team-rocket-box-front.png`, `team-rocket-box-perspective.png`, `team-rocket-box-side.png`).
       - DISPLAY factory specifications (gramaje, fábrica, sello Wizards of the Coast / Pokémon Company, número de sobres, estado sin pesar).
     * If `CARTA_INDIVIDUAL`:
       - DISPLAY the PSA grade selector (Raw, PSA 8, PSA 9, PSA 10).
       - DISPLAY the 3D card inspector controls ('Frontal', 'Reverso y Bordes', 'Slab PSA').
       - DISPLAY the 12-month market trend SVG chart.
3. Quantity Selector & Modal:
   - Stepper (`- [ 1 ] +`): Minimum value clamped at 1.
   - Accessible modal "¿Qué es un Grado PSA?" (`#psa-guide-modal`): Opens on click, accessible via keyboard (Escape closes), closes on backdrop or button click.
4. Testing & Verification:
   - Run the automated tests: `cmd /c "node --test tests/*.test.mjs"`.
   - Ensure all tests (specifically `tests/test_pdp.test.mjs`) pass with 0 failures.
