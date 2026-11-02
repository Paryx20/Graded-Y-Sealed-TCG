# Task Assignment: Worker Milestone 1 (Catalog Assets & Data Integrity)

Implement R3 catalog image updates in js/data.js and js/db/db-client.js.
Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_m1\
Authoritative Request: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
Project Index: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\PROJECT.md
Survey Handoff: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_2\handoff.md
## 2026-11-02T19:59:47Z
You are the Worker for Milestone 1 (Catalog Assets & Data Integrity) on the e-commerce web platform.
Your working directory is: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_m1\
The authoritative request is at: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.
Also read:
- Project architecture & features: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\PROJECT.md
- Survey findings: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_2\handoff.md

Exclusive Write Ownership:
You own exclusively:
- `js/data.js`
- `js/db/db-client.js`
Do NOT edit other files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope of Implementation:
1. In `js/data.js`:
   - Product `gengar-scarlet-violet` (lines 90-113):
     Set `imagenLocal: 'img/cards/gengar-holo-scarlet.png'`, `imagenFallbackUrl: 'img/cards/gengar-holo-scarlet.png'`.
   - Product `mimikyu-paldean` (lines 140-163):
     Set `imagenLocal: 'img/cards/mimikyu-rare.png'`, `imagenFallbackUrl: 'img/cards/mimikyu-rare.png'`.
   - Product `mewtwo-151` (lines 165-188):
     Set `imagenLocal: 'img/cards/mewto-holo-rare.png'`, `imagenFallbackUrl: 'img/cards/mewto-holo-rare.png'`.
   - Product `booster-box-fossil-1999` (lines 313-355):
     Set `imagenLocal: 'img/sealed/Paquete fossil.png'`, `imagenFallbackUrl: 'img/sealed/Paquete fossil.png'`.
     Update `galeria_sellada` so that `frontal`, `perspectiva`, and `lateral` all point to `'img/sealed/Paquete fossil.png'`.
2. In `js/db/db-client.js`:
   - Synchronize seed records for `PKM-SV-GEN-057` (`img/cards/gengar-holo-scarlet.png`), `PKM-PF-MIM-097` (`img/cards/mimikyu-rare.png`), and `PKM-151-MEW-059` (`img/cards/mewto-holo-rare.png`).
3. Verification:
   - Run verification commands (e.g. `node --test tests/*.test.mjs`) to ensure zero regressions across existing test suites.
   - Run a node assertion verifying the 4 assets exist and resolve in `PRODUCTS`.
4. Document all changes and verification outputs in your handoff report:
   c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_m1\handoff.md
Update progress.md in your working directory and notify the parent orchestrator via send_message when complete.
