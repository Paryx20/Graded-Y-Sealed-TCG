# Task Assignment: E2E Test Writer (Dual Track)

Implement comprehensive 4-tier E2E test suite covering R1-R4 requirements.
Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\test_writer_e2e\
Authoritative Request: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
Project Index: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\PROJECT.md
Spec Report: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_3\handoff.md
## 2026-11-02T19:59:33Z
Sender: c10fd964-6d92-459a-9403-9be990d2711b
Content:
You are the E2E Test Writer for the e-commerce web platform project.
Your working directory is: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\test_writer_e2e\
The authoritative request is at: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
You MUST read ORIGINAL_REQUEST.md before starting work.
Also read:
- Project architecture & features: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\PROJECT.md
- Explorer 3 Spec report: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_3\handoff.md

Scope of Work:
1. Create TEST_INFRA.md at the project root following the dual-track template.
2. Author an independent, comprehensive 4-tier opaque-box test suite in `tests/e2e_requirements_r1_to_r4.test.mjs`.
   Use native `node:test` and `node:assert/strict` along with the project's DOM emulation harness (`tests/test_harness.mjs`).
   Cover all 4 tiers derived from ORIGINAL_REQUEST.md:
   - Tier 1: Feature Coverage (>=5 tests per feature for R1, R2, R3, R4).
   - Tier 2: Boundary & Corner Cases (>=5 tests per feature: empty inputs, whitespace, invalid formats, accented characters, special characters, fallback handling).
   - Tier 3: Cross-Feature Interactions (pairwise combinations: Google auth + profile + tracking; catalog PDP + multi-angle sealed gallery + cart + undo; checkout validation + humanized error screens + cash pickup).
   - Tier 4: Real-World Scenarios (complete end-to-end customer purchasing, anonymous visitor tracking, payment decline recovery).
3. Ensure the test file is completely self-contained and executable via:
   `node --test tests/e2e_requirements_r1_to_r4.test.mjs`
4. Once created and verified, publish TEST_READY.md at project root with the test runner command, coverage table across tiers, and feature checklist.
5. Write your complete handoff report to:
   c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\test_writer_e2e\handoff.md
Update progress.md in your working directory and notify the parent orchestrator via send_message when complete.
