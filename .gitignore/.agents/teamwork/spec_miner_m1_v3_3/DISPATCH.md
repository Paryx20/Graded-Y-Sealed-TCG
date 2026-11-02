## 2026-11-02T11:48:56Z

You are spec_miner_m1_v3_3, a read-only specification investigator and strategy agent.
Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_m1_v3_3
Parent Orchestrator Conversation ID: cbdda2aa-4562-4fed-ac08-7fe27ee601f8

MANDATORY CONTEXT:
Read ORIGINAL_REQUEST.md at: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
Read PROJECT.md at: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\PROJECT.md
Review Survey Report: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_survey_v3_3\handoff.md

YOUR MISSION:
Produce the definitive, implementation-ready code blueprint for the Worker agent covering Requirement R6 and the Automated Test Expansion Plan:
- R6: Google OAuth 2.0 Integration and Dynamic User Profile
  * Remove all preloaded/hardcoded default user information (name, national ID, address, etc.) on initial page load:
    - Formulate exact replacements for `js/views/profile.js:43, 102, 133, 147, 158` (replace `'1710034065'`, `'0991234567'`, `'Quito'`, etc. with empty strings `""`).
    - Formulate exact replacements for `js/app.js:388-395` (remove mock Ecuadorian user data from `loginUser()`).
    - Formulate exact replacements for `js/views/checkout.js:128` (remove hardcoded 'Quito' default for guests).
  * Implement production-ready Google Sign-In button utilizing Google Identity Services (GIS) / OAuth 2.0 structure (with elegant fallback if client credentials are not configured):
    - Formulate addition of `<script src="https://accounts.google.com/gsi/client" async defer></script>` in `index.html`.
    - Formulate `initGoogleSignIn(containerId)` in `js/app.js` with dual-mode GIS rendering and Google-branded Material Design fallback button (`handleSimulatedGoogleLogin()`).
    - Formulate pure JavaScript client-side `decodeJwtResponse(token)` in `js/app.js`.
    - Formulate `handleGoogleCredentialResponse(response)` and `handleSimulatedGoogleLogin()` populating clean session profile `{ id, name, email, avatar, authProvider: 'google', idCard: '', phone: '', city: '', address: '' }`.
    - Formulate unauthenticated guest view in `js/views/profile.js` with `#google-signin-container` and Google Sign-In prompt.
    - Formulate logout in `js/app.js` invoking `google.accounts.id.disableAutoSelect()`, clearing `currentUser`, purging storage, updating navbar, and reverting `#profile` to guest state.
- Automated Test Suite Implementation Plan:
  * Detail concrete test code for new test file `tests/test_google_auth_profile.test.mjs` (or extensions to `tests/test_profile_orders.test.mjs`), validating unauthenticated guest state, zero hardcoded data, GIS/fallback rendering, JWT decoding, dynamic profile population, and sign-out.
  * Detail exact regression checks across all 15 existing test suites.

OUTPUT REQUIREMENTS:
- Write a structured handoff report to `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_m1_v3_3\handoff.md`.
- Include exact file paths, line ranges, and complete code replacement blocks ready for Worker execution.
- Send a message to Parent (`cbdda2aa-4562-4fed-ac08-7fe27ee601f8`) when complete. Do NOT modify any source code files.
