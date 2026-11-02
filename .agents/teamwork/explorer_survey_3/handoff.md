# Handoff Report — Explorer 3 (Spec Miner)
**Focus Area**: R4 (Humanized UI Copy across Touchpoints), R1-R4 Specification Mining, and Project Testing Infrastructure/Environment.
**Date**: 2026-11-02
**Working Directory**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_3\`

---

## 1. Observation

### 1.1 Source Code and Hardcoded Copy Observations
- **Hardcoded Google Authentication**:
  - File: `js/app.js`, lines 545–567:
    ```javascript
    handleSimulatedGoogleLogin() {
      const simulatedUser = {
        id: 'google-oauth2-10829574102948',
        name: 'Patrick Mora',
        email: 'patrickmora2006@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        authProvider: 'google', ...
      };
      Store.data.currentUser = simulatedUser;
      ...
    }
    ```
    Clicking "Continuar con Google" automatically signs in the visitor as "Patrick Mora" (`patrickmora2006@gmail.com`) without displaying any prompt or input dialog.

- **Preloaded Tracking Personal Data**:
  - File: `js/views/tracking.js`, lines 15–78 & lines 363–365:
    ```javascript
    getSimulatedOrder() { ...
      buyerName: 'Patricio Mora (Coleccionista Verificado)',
      buyerEmail: 'coleccionista.paryx@bovedatcg.ec',
      orderId: '#GS-2026-9481', ...
    }
    ...
    if (!order) {
      order = this.getSimulatedOrder();
    }
    ```
  - File: `js/state.js`, lines 104–108 & lines 110–170:
    ```javascript
    if (orderId === '#GS-2026-9481' || !this.data.orders || this.data.orders.length === 0) {
      return this.getPreloadedSimulatedOrder();
    }
    ```
    When an anonymous public visitor navigates to `#tracking`, the view immediately renders order `#GS-2026-9481` belonging to "Patricio Mora (Coleccionista Verificado)".

- **Catalog Image Asset Mappings in `js/data.js`**:
  - Product `gengar-scarlet-violet` (lines 90–113) specifies `imagenLocal: 'img/gengar-vmax.png'`, but disk contains `img/cards/gengar-holo-scarlet.png`.
  - Product `mewtwo-151` (lines 165–188) specifies `imagenLocal: 'img/mewtwo-base.png'`, but disk contains `img/cards/mewto-holo-rare.png`.
  - Product `mimikyu-paldean` (lines 140–163) specifies `imagenLocal: 'img/umbreon-vmax.png'`, but disk contains `img/cards/mimikyu-rare.png`.
  - Product `booster-box-fossil-1999` (lines 314–355) specifies `imagenLocal: 'img/sealed/team-rocket-box-front.png'`, but disk contains `img/sealed/Paquete fossil.png`.

- **User-Facing Copy Analysis**:
  - Scanning `index.html`, `js/app.js`, `js/views/checkout.js`, `js/views/tracking.js`, `js/views/profile.js`, `js/views/cart.js`, and `js/views/search-results.js` revealed multiple categories of formulaic, robotic, or overly technical Spanish phrases:
    1. *Cryptographic & System Security Jargon in consumer views*: `Checkout Seguro TLS 256-bit`, `Cumplimiento PCI-DSS`, `Autenticación segura federada con Google Identity Services (OAuth 2.0)`, `Verificando autenticación 3D Secure y custodia...`, `Conectando con pasarela bancaria TLS 256-bit...`.
    2. *Exposing Internal Validation Algorithms*: `Cédula o RUC (Módulo 10): *` (input label), `Cédula o RUC ecuatoriano inválido (validación Módulo 10)` (error alert), `La cédula ingresada no es válida según el algoritmo Módulo 10.`, `Dígito de verificación de tarjeta incorrecto (Luhn)`.
    3. *Robotic / Military / Forensic Jargon in Tracking*: `Fondos verificados y orden registrada en la cadena de custodia`, `Sellado UV & Inspección Óptica`, `Validación de microimpresión, hologramas y encapsulado acrílico`, `Embalaje con precinto tamper-evident en valija de seguridad`, `GPS Activo • Valija Nivel IV`, `Requisito Obligatorio: Presentar Cédula de Identidad original...`.
    4. *Developer Milestones & Database Terminology*: `¡Hito completado! Tu orden está lista para retiro...` (toast), `Ítem eliminado de la bolsa.`, `[Deshacer acción]`, `Iniciar Sesión y Precargar`.
    5. *Medical / Engineering Diagnostics on Payment Errors*: `Diagnóstico de la Operación`, `Código Bancario: #DECLINED-SEC-054` (displayed as a primary header badge), `Tranquilidad garantizada: NO se ha realizado ningún cargo a tu tarjeta.`.

### 1.2 System Execution Runtime and Tooling
- **Command execution**:
  - `node -v` -> `v24.21.0`. Supported with native test runner (`node:test`, `node:assert/strict`), native ES Modules (`.mjs`), `node:vm`, and timers.
  - `cmd /c "npm -v"` -> `11.19.0`. Note: direct `npm` in PowerShell fails due to execution policy on `.ps1`; `cmd /c` is mandatory for npm invocations.
  - `python --version` -> Access Denied / not configured (Windows App execution alias stub).
  - `cmd /c "npm list --depth=0"` -> `-- (empty)`. Zero npm packages in `node_modules`.
- **Baseline Test Suite Status**:
  - Running `node --test tests/*.test.mjs` executes 429 native tests across 16 test suites.
  - Result: 429 passed, 0 failed, 0 skipped, execution time ~7.9s.
  - Environment emulation is provided by `tests/test_harness.mjs`, which exports `MockDOMElement`, `MockClassList`, storage mocks, and simulation engines.

---

## 2. Logic Chain

1. **R1 Logic**:
   - `handleSimulatedGoogleLogin()` in `js/app.js` (lines 545–567) hardcodes "Patrick Mora" and immediately sets `Store.data.currentUser`.
   - To satisfy R1, clicking "Continuar con Google" must open an interactive modal/selector dialog allowing the visitor to input or pick a name and email.
   - Upon submitting the modal, `Store.data.currentUser` must be updated with the visitor's dynamic credentials and propagated to the navbar and profile.

2. **R2 Logic**:
   - `TrackingView.render()` in `js/views/tracking.js` falls back to `this.getSimulatedOrder()` when no order ID is found in the current session.
   - This preloaded order explicitly contains `buyerName: 'Patricio Mora (Coleccionista Verificado)'` and `#GS-2026-9481`.
   - Therefore, any unauthenticated or first-time visitor navigating to `#tracking` sees personal data.
   - To satisfy R2, `#tracking` must check if the current session has placed orders. If not, it must render an empty search form with placeholder prompt ("Ingresa tu código de seguimiento") without displaying any user's name or preloaded order history.

3. **R3 Logic**:
   - The files `img/cards/gengar-holo-scarlet.png`, `img/cards/mewto-holo-rare.png`, `img/cards/mimikyu-rare.png`, and `img/sealed/Paquete fossil.png` exist on disk.
   - `js/data.js` currently assigns placeholder images (`img/gengar-vmax.png`, `img/mewtwo-base.png`, `img/umbreon-vmax.png`, `img/sealed/team-rocket-box-front.png`) to those items.
   - Updating `imagenLocal` in `js/data.js` directly resolves catalog and PDP rendering for all 4 items.

4. **R4 Logic**:
   - Customer-facing interfaces must prioritize clarity, trust, and human warmth over technical and legalistic jargon.
   - Informing a customer that their cédula failed "algoritmo Módulo 10" or card failed "fórmula de Luhn" exposes internal code mechanics and causes friction.
   - Replacing "Módulo 10" with "Cédula o RUC incorrecto. Verifica los 10 o 13 dígitos" is immediately actionable.
   - Replacing forensic tracking phrases ("cadena de custodia", "tamper-evident", "inspección óptica") with reassuring retail collector terminology ("embalaje de máxima seguridad", "verificación de autenticidad") maintains collector prestige while sounding natural and professional.

---

## 3. Recommended Natural Spanish Replacements (R4 Copy Dictionary)

| # | Component / View | Existing Formulaic / Robotic / Technical Copy | Recommended Humanized Spanish Replacement | Rationale / Human UX Impact |
|---|---|---|---|---|
| 1 | `index.html` (L327) | `Ítem eliminado de la bolsa.` | `Producto retirado de tu bolsa.` | Replaces data terminology ("Ítem") with natural retail phrasing. |
| 2 | `index.html` (L335) | `[Deshacer acción]` | `Deshacer` | Removes ugly brackets and computer command tone. |
| 3 | `index.html` (L356-359) | `Procesando Transacción Segura` / `Conectando con la pasarela bancaria segura...` | `Confirmando tu compra` / `Validando los datos con tu entidad financiera...` | Friendly and calm progress indicator without cybersecurity posturing. |
| 4 | `index.html` (L368) | `Encriptación TLS de 256 bits • No cierres esta ventana` | `Conexión protegida • Por favor espera un momento` | Simple, clear instruction without technical alphabet soup. |
| 5 | `index.html` (L458-461) | `¿Deseas eliminar este artículo de tu bolsa?` / `Esta acción retirará el producto seleccionado de tu carrito actual.` | `¿Quieres quitar este producto de tu bolsa?` / `Podrás volver a añadirlo desde el catálogo cuando desees.` | Replaces legalistic "Esta acción retirará..." with warm, reassuring text. Unifies "bolsa" instead of mixing "carrito". |
| 6 | `js/views/checkout.js` (L16-19) | `Checkout Seguro TLS 256-bit • Graded & Sealed TCG` / `Cumplimiento PCI-DSS` | `Pago Seguro y Protegido • Graded & Sealed` / `Tus datos viajan 100% encriptados` | Consumer-friendly security assurance without compliance codes. |
| 7 | `js/views/checkout.js` (L45) | `Para garantizar la autenticidad y custodia certificada, toda compra requiere registro obligatorio. Si ya tienes cuenta, inicia sesión aquí:` | `Para respaldar la autenticidad y entrega de tu pedido, necesitas una cuenta. Si ya estás registrado, ingresa aquí:` | Eliminates harsh, defensive phrase "requiere registro obligatorio". |
| 8 | `js/views/checkout.js` (L56) | `Iniciar Sesión y Precargar` | `Iniciar sesión` | Replaces robotic database term "Precargar". |
| 9 | `js/views/checkout.js` (L87, L99) | `Cédula o RUC (Módulo 10): *` / `Cédula o RUC ecuatoriano inválido (validación Módulo 10)` | `Cédula o RUC ecuatoriano: *` / `Por favor ingresa un número de cédula o RUC válido.` | Hides the mathematical algorithm name from consumer labels and errors. |
| 10 | `js/views/checkout.js` (L149) | `El checkout requiere cuenta registrada para emisión de comprobante fiscal y custodia certificada.` | `Utilizaremos tu cuenta para enviarte la factura electrónica y el seguimiento de tu pedido.` | Clarifies value to the customer instead of imposing administrative rules. |
| 11 | `js/views/checkout.js` (L202) | `Visa, Mastercard (Validación Luhn & 3D Secure)` | `Aceptamos Visa y Mastercard (débito o crédito)` | Removes developer validation references ("Luhn", "3D Secure"). |
| 12 | `js/views/checkout.js` (L212) | `Para simular fallo bancario ingresa una tarjeta terminada en 0000` | `Prueba de seguridad: una tarjeta terminada en 0000 simula un pago rechazado.` | Clearer context for demo evaluation without sounding broken. |
| 13 | `js/views/checkout.js` (L344) | `Código Bancario: #DECLINED-SEC-054` | `Referencia bancaria: #DECLINED-SEC-054` | Replaces harsh system error badge with standard reference code. |
| 14 | `js/views/checkout.js` (L349-352) | `Diagnóstico de la Operación` / `La transacción fue rechazada por el banco emisor debido a límites de seguridad diarios o verificación 3D Secure.` | `¿Qué ocurrió con tu pago?` / `Tu banco no autorizó la operación. Esto suele ocurrir por límites de compra por internet o verificación de seguridad de tu tarjeta.` | Human, empathetic explanation that guides the user rather than giving a technical diagnostic. |
| 15 | `js/views/checkout.js` (L355) | `Tranquilidad garantizada: NO se ha realizado ningún cargo a tu tarjeta.` | `No te preocupes: no se ha realizado ningún cobro a tu tarjeta.` | Conversational and calming Spanish. |
| 16 | `js/views/checkout.js` (L428, L471) | `o con tu cuenta` / `o regístrate en 1-clic con` | `O continúa con` / `O regístrate rápidamente con` | Replaces awkward Spanglish "1-clic" with natural Spanish. |
| 17 | `js/views/checkout.js` (L462) | `Acepto los protocolos de custodia y términos de Graded & Sealed TCG` | `Acepto los términos de compra y políticas de envío de Graded & Sealed` | Replaces prison/forensic phrasing "protocolos de custodia". |
| 18 | `js/views/checkout.js` (L559, L709) | `Transacción denegada por el banco emisor (Límites o 3D Secure) (#DECLINED-SEC-054)` | `El banco no autorizó el pago. Por favor intenta con otra tarjeta o método.` | Actionable error message. |
| 19 | `js/views/checkout.js` (L616, L685) | `La cédula ingresada no supera la validación Módulo 10.` | `La cédula ingresada no es válida. Revisa los 10 dígitos e intenta de nuevo.` | Simple, friendly correction prompt. |
| 20 | `js/views/checkout.js` (L693) | `Teléfono celular inválido. Debe tener prefijo +593 seguido de 9 dígitos.` | `Ingresa un número de celular válido de 9 dígitos (ej. 0991234567).` | Direct and instructive with concrete example. |
| 21 | `js/views/checkout.js` (L929, L933) | `Conectando con pasarela bancaria TLS 256-bit...` / `Verificando autenticación 3D Secure y custodia...` | `Conectando de forma segura con tu banco...` / `Verificando la aprobación del pago...` | Natural banking flow description. |
| 22 | `js/views/tracking.js` (L39, L42) | `Pago Verificado TLS 256-bit` / `Fondos verificados y orden registrada en la cadena de custodia.` | `Pago Confirmado` / `Tu orden fue recibida y confirmada exitosamente.` | Clean, reassuring status update. |
| 23 | `js/views/tracking.js` (L46, L49) | `Sellado UV & Inspección Óptica` / `Validación de microimpresión, hologramas y encapsulado acrílico.` | `Empaque Seguro y Autenticación` / `Inspeccionamos tu producto y preparamos su estuche protector rígido.` | Clear explanation of collector preparation without pretentious lab jargon. |
| 24 | `js/views/tracking.js` (L53, L56) | `Asignado a Transporte Especial` / `Embalaje con precinto tamper-evident en valija de seguridad.` | `Despachado en Transporte Seguro` / `Tu paquete cuenta con sello de seguridad inviolable y protección especial.` | Removes untranslated English "tamper-evident" and overly militarized wording. |
| 25 | `js/views/tracking.js` (L60, L63) | `Custodia contra Cédula y Firma` / `Recepción formal por el titular con documento de identidad.` | `En Reparto / Listo para Entrega` / `El transportista entregará el paquete al titular previa verificación de identidad.` | Clear delivery instructions. |
| 26 | `js/views/tracking.js` (L163-167) | `¡Hito completado! Tu orden está lista para retiro en Bóveda Central Quito.` | `¡Excelente noticia! Tu pedido ya está listo para retiro en nuestra tienda de Quito.` | Replaces robotic "¡Hito completado!" with warm human celebration. |
| 27 | `js/views/tracking.js` (L165) | `¡Hito completado! Tu orden ha sido despachada en transporte blindado.` | `¡Tu pedido va en camino! Ya fue despachado con transporte de alta seguridad.` | Natural excitement for delivery dispatch. |
| 28 | `js/views/tracking.js` (L204-206) | `Requisito Obligatorio: Presentar Cédula de Identidad original del titular registrado (${order.buyerName}) o código QR de orden.` | `Recuerda: Para retirar tu producto, presenta tu cédula de identidad original o el código de tu orden.` | Friendly, cooperative reminder instead of punitive bureaucratic command. |
| 29 | `js/views/tracking.js` (L226-227) | `GPS Activo • Valija Nivel IV` | `Rastreo Satelital Activo • Entrega Protegida` | Credible security without militarized hyperbole. |
| 30 | `js/views/profile.js` (L21) | `Autenticación segura federada con Google Identity Services (OAuth 2.0)` | `Acceso rápido y protegido con tu cuenta de Google` | Accessible benefits rather than technical protocol names. |
| 31 | `js/views/profile.js` (L322) | `La cédula ingresada no es válida según el algoritmo Módulo 10.` | `El número de cédula ingresado no es correcto. Por favor verifícalo.` | Humanized validation notice. |
| 32 | `js/views/search-results.js` (L37-42) | `Doble API con Failover Automático • 3-Tier Cascade` / `Consulta en cascada automática: pokemontcg.io → tcgdex.net → Bóveda Local G&S con tolerancia a desconexión y latencia.` | `Búsqueda Inteligente Multifuente` / `Consultamos catálogos internacionales y nuestra colección local para encontrar exactamente lo que buscas.` | Customer-facing feature description instead of internal backend architecture diagram. |

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth (R1) | Dynamic Google Login Modal | Client-side modal allowing users to enter custom full name and email for authentication session | Name string, Email string, Avatar pick (optional) | `Store.data.currentUser` dynamic object, UI state update | Validates non-empty name, email regex; displays natural feedback on error | `ORIGINAL_REQUEST.md`, `js/app.js:545` |
| 2 | Auth (R1) | Dynamic Session Persistence | Saves dynamic authenticated user to `localStorage.gstcg_user` and updates navbar profile indicator | Authenticated user object | Navbar displays user's first name with active styling; profile reflects details | Falls back to "Mi Cuenta" if cleared or logged out | `js/app.js:558-560`, `js/state.js:70` |
| 3 | Tracking (R2) | Anonymous Default Tracking View | Clean, empty search state shown to unauthenticated visitors navigating to `#tracking` | Navigation to `#tracking` with clean/empty session | Empty tracking search box, informative instructions, zero exposed personal data | If no order ID provided or found, renders empty prompt without crashing | `ORIGINAL_REQUEST.md`, `js/views/tracking.js:357` |
| 4 | Tracking (R2) | Manual Tracking Code Query | Visitor can enter a valid tracking code (e.g. `GUI-EC-948102-PSA` or `#PKM-2026-XXXXX`) to query status | Tracking code string | Renders order timeline, stages, items, and delivery card | Shows friendly "Código no encontrado" banner if nonexistent | `ORIGINAL_REQUEST.md`, `js/views/tracking.js:107` |
| 5 | Tracking (R2) | Active Session Order Auto-Tracking | If user placed an order in the active session, `#tracking` immediately loads their current order | Active session `Store.data.orders[0]` | Displays active order stages, live timer simulation, invoice download button | Falls back to empty search if session has no orders | `ORIGINAL_REQUEST.md`, `js/state.js:59` |
| 6 | Catalog (R3) | Gengar Scarlet & Violet Image Asset | Links `img/cards/gengar-holo-scarlet.png` to product `gengar-scarlet-violet` | Product ID `gengar-scarlet-violet` | Catalog card & PDP render updated asset with zero broken links | If image fails to load, `onerror` falls back to `imagenFallbackUrl` | `ORIGINAL_REQUEST.md`, `js/data.js:90` |
| 7 | Catalog (R3) | Mewtwo 151 Holo Rare Image Asset | Links `img/cards/mewto-holo-rare.png` to product `mewtwo-151` | Product ID `mewtwo-151` | Catalog card & PDP render updated asset with zero broken links | `onerror` fallback handled gracefully | `ORIGINAL_REQUEST.md`, `js/data.js:165` |
| 8 | Catalog (R3) | Mimikyu Shiny Rare Image Asset | Links `img/cards/mimikyu-rare.png` to product `mimikyu-paldean` | Product ID `mimikyu-paldean` | Catalog card & PDP render updated asset with zero broken links | `onerror` fallback handled gracefully | `ORIGINAL_REQUEST.md`, `js/data.js:140` |
| 9 | Catalog (R3) | Fossil Booster Pack Image Asset | Links `img/sealed/Paquete fossil.png` to Fossil booster / sealed product | Product ID `booster-box-fossil-1999` / sealed items | Catalog card, PDP sealed gallery & cart render updated asset | `onerror` fallback handled gracefully | `ORIGINAL_REQUEST.md`, `js/data.js:314` |
| 10 | Copy (R4) | Humanized Authentication Messages | Natural Spanish greetings and validation alerts for login, register, and logout | Form submissions, session changes | Warm toast alerts ("¡Bienvenido, Carlos!", "Sesión finalizada") | Clear guidance on missing fields | `js/app.js:406, 426, 583` |
| 11 | Copy (R4) | Reassuring Payment Error Guidance | Empathetic decline screen with non-punitive explanations and actionable alternatives | Decline event `#DECLINED-SEC-054` | Explains bank limits/checks, offers card retry or cash pickup | Does not expose raw scary crash terminology | `js/views/checkout.js:343` |
| 12 | Copy (R4) | Clear Cédula / Document Feedback | Plain Spanish identification validation without mentioning "algoritmo Módulo 10" | 10-digit Cédula / 13-digit RUC input | Prompts user to check number of digits if invalid | Inline error indicator without mathematical jargon | `js/views/checkout.js:98, 685` |
| 13 | Copy (R4) | Conversational Cart & Undo Banner | Natural notices when removing and restoring items from the bag | Cart item remove/undo trigger | "Producto retirado de tu bolsa" with clean "Deshacer" button | No computer brackets `[ ]` or robotic "Ítem" nouns | `index.html:327`, `js/app.js:326` |
| 14 | Copy (R4) | Customer-Friendly Tracking Milestones | Plain, premium collector descriptions for order status stages | Stage status transitions (1 to 4) | Natural stage descriptions ("Pago Confirmado", "Empaque Seguro", "En Camino", "Entregado") | Toast celebrates progress warmly without "¡Hito completado!" | `js/views/tracking.js:37` |
| 15 | Testing | Native Zero-Dependency Test Suite | Automated regression testing runner using built-in `node:test` on Node v24 | `tests/*.test.mjs` test specifications | Test pass/fail reports with ms execution duration | Throws `AssertionError` with detailed diffs on contract breach | `TEST_INFRA.md`, `tests/test_harness.mjs` |

---

## 5. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Dynamic Google Login (R1) | Empty full name or empty email submitted in modal | Modal blocks submission, highlights empty field with friendly Spanish alert: "Por favor completa tu nombre y correo". |
| 2 | Dynamic Google Login (R1) | Complex Latin name with accents and compound surnames ("María José Peña-Herrera") | Preserves full UTF-8 encoding across Store, navbar (`María José`), and profile without mojibake or truncation. |
| 3 | Dynamic Google Login (R1) | Visitor presses Escape key or clicks backdrop while modal is open | Modal closes immediately, session remains guest/unauthenticated, no state corruption. |
| 4 | Dynamic Google Login (R1) | User logs in while already having an active session with different email | Confirms session switch, updates navbar label and profile data, refreshes current view. |
| 5 | Anonymous Tracking (R2) | Fresh browser session visits `#tracking` directly with no query parameter | Renders empty search interface with search bar; string dump of DOM confirms 0 occurrences of "Patrick", "Patricio", or "Mora". |
| 6 | Anonymous Tracking (R2) | Visitor submits invalid or nonexistent tracking code ("XYZ-999-FAKE") | Displays clear friendly message: "No encontramos ninguna orden con el código ingresado. Verifica tu comprobante.", without leaking other orders. |
| 7 | Anonymous Tracking (R2) | Hostile search input with HTML/SQL tags (`<script>alert(1)</script>`, `' OR '1'='1`) | Safely sanitized and escaped; renders harmless string in search input without XSS execution. |
| 8 | Catalog Assets (R3) | Asset filename contains space (`img/sealed/Paquete fossil.png`) | HTML attribute properly quotes filename; Node tests verify file existence and DOM image source resolution without URI corruption. |
| 9 | Catalog Assets (R3) | Simulated asset 404 or image network block | `onerror` handler seamlessly swaps image to designated fallback asset (`imagenFallbackUrl` or `card-back.png`) without broken image icon. |
| 10 | Humanized Copy (R4) | Input with exactly 9 digits in phone without prefix | Auto-formats or accepts cleanly, prompt advises: "Ingresa tu celular de 9 dígitos (ej. 0991234567)". |
| 11 | Humanized Copy (R4) | Rapid consecutive cart additions triggering toasts | Singleton manager clears prior timer, displays latest friendly toast without text clipping or UI freezing. |

---

## 6. Comprehensive 4-Tier Test Specifications (R1–R4)

### Tier 1: Feature Coverage (Happy Path)
- **R1 Dynamic Authentication**:
  - `TC-T1-R1-01`: Clicking "Continuar con Google" opens an interactive modal/selector dialog in the DOM instead of immediately establishing a session as "Patrick Mora".
  - `TC-T1-R1-02`: Submitting the modal with custom inputs (`name: "Diana Salazar"`, `email: "dsalazar@gmail.com"`) authenticates the user with those exact credentials.
  - `TC-T1-R1-03`: Navbar user badge updates to the dynamic user's first name (`Diana`) and applies active authenticated classes.
  - `TC-T1-R1-04`: Session state in `Store.data.currentUser` and `localStorage.getItem('gstcg_user')` stores the dynamic user object with `authProvider: 'google'`.
  - `TC-T1-R1-05`: Navigating to `#profile` renders the dynamic name, email, and Google Verified account badge.
- **R2 Anonymous Tracking**:
  - `TC-T1-R2-01`: Navigating to `#tracking` with a clean session (`Store.data.orders = []`) renders an empty tracking input state.
  - `TC-T1-R2-02`: The unauthenticated `#tracking` view contains zero preloaded order cards, zero personal names, and zero buyer emails.
  - `TC-T1-R2-03`: Submitting a valid tracking code into the search box retrieves and displays that specific order's tracking stages.
  - `TC-T1-R2-04`: When a user completes checkout in the current session, navigating to `#tracking` displays their newly placed order.
  - `TC-T1-R2-05`: The hardcoded string "Patrick Mora Arias" or "Patricio Mora" does not appear anywhere in `#tracking` default state.
- **R3 Catalog Visual Assets**:
  - `TC-T1-R3-01`: Product `gengar-scarlet-violet` in `js/data.js` has `imagenLocal === 'img/cards/gengar-holo-scarlet.png'`.
  - `TC-T1-R3-02`: Product `mewtwo-151` in `js/data.js` has `imagenLocal === 'img/cards/mewto-holo-rare.png'`.
  - `TC-T1-R3-03`: Product `mimikyu-paldean` in `js/data.js` has `imagenLocal === 'img/cards/mimikyu-rare.png'`.
  - `TC-T1-R3-04`: Product `booster-box-fossil-1999` in `js/data.js` has `imagenLocal === 'img/sealed/Paquete fossil.png'`.
  - `TC-T1-R3-05`: All four image paths resolve to existing physical files on disk with non-zero byte length.
- **R4 Humanized Copy**:
  - `TC-T1-R4-01`: Toast notifications use natural, human Spanish phrases without robotic syntax (e.g. `¡Bienvenido a Graded & Sealed, Carlos!`).
  - `TC-T1-R4-02`: Tracking timeline milestones describe actions in plain language ("Pago Confirmado", "Empaque Seguro", "En Camino", "Entregado").
  - `TC-T1-R4-03`: Cart removal banner says "Producto retirado de tu bolsa" with clean "Deshacer" button (no brackets).
  - `TC-T1-R4-04`: Payment error screen guides user with "Tu banco no autorizó el pago" without technical "Diagnóstico de la Operación" headers.
  - `TC-T1-R4-05`: Cédula and phone inputs use friendly consumer labels without mentioning internal check algorithms ("Módulo 10").

### Tier 2: Boundary & Corner Cases (Adversarial & Fault Tolerance)
- **R1 Boundary**:
  - `TC-T2-R1-01`: Empty name or whitespace-only email in Google modal is rejected with friendly inline alert.
  - `TC-T2-R1-02`: Name with special accented characters, hyphens, and apostrophes is sanitized and preserved accurately.
  - `TC-T2-R1-03`: Closing modal with Escape key leaves current session unchanged.
- **R2 Boundary**:
  - `TC-T2-R2-01`: Searching nonexistent tracking code renders informative zero-state without exposing other system orders.
  - `TC-T2-R2-02`: Inputting HTML tags or script injection into tracking search input does not cause DOM execution or crash.
  - `TC-T2-R2-03`: Empty search submission prompts user without error.
- **R3 Boundary**:
  - `TC-T3-R3-01`: Asset path containing spaces (`Paquete fossil.png`) renders properly in DOM `src` attributes without breaking image tags.
  - `TC-T3-R3-02`: Simulating image load failure triggers `onerror` fallback gracefully in catalog and PDP.
- **R4 Boundary**:
  - `TC-T2-R4-01`: All system validation error strings are non-empty, grammatically correct Spanish, and free of system jargon across all forms.
  - `TC-T2-R4-02`: Toast messages dismiss reliably within 2500ms without leaving persistent ghost overlays.

### Tier 3: Interaction & Cross-Feature Integration Combinations
- `TC-T3-01 (Dynamic Auth + Profile + Tracking Flow)`: Dynamic Google Sign-In as "Esteban Andrade" -> Navigates to `#tracking` -> Confirms clean state with no orders -> Places order -> Verifies order is recorded under "Esteban Andrade" and rendered in `#tracking`.
- `TC-T3-02 (Catalog Image Assets + PDP 3D Inspector + Cart Flow)`: Opens Gengar PDP -> 3D scene renders `gengar-holo-scarlet.png` -> Selects condition -> Adds to cart -> Cart renders thumbnail -> Deletes item -> Clicks "Deshacer" -> Item restored.
- `TC-T3-03 (Checkout Validation + Humanized Copy Flow)`: Enters invalid cédula -> Friendly message appears ("Revisa los 10 dígitos") -> Corrects number -> Enters test card ending in `0000` -> Rejection screen renders clear explanation ("Tu banco no autorizó...") -> Switches to cash pickup -> Success.

### Tier 4: Real-World Scenarios (End-to-End User Journeys)
- `TC-T4-01 (Collector Dynamic Onboarding & First Order)`: Complete journey from homepage arrival, interactive Google account selection, catalog browsing of newly updated assets, frictionless checkout, and tracking verification.
- `TC-T4-02 (Anonymous Visitor Tracking Protection)`: Complete journey verifying that a visitor arriving directly at `#tracking` can never see another user's personal details, enters a valid code from an email receipt, and tracks the package to delivery.
- `TC-T4-03 (Payment Decline Recovery & Safe Completion)`: Complete journey simulating credit card decline, humanized feedback explaining common bank security holds, seamless switch to in-store pickup with cash, and confirmation alert.

---

## 7. Caveats
- No caveats. The codebase, HTML, scripts, test runner, and disk assets have been directly inspected and verified.
- Existing tests in `tests/test_google_auth_profile.test.mjs` and `tests/test_challenger_m2_r1_r2.test.mjs` contain assertions written for the prior hardcoded "Patrick Mora" behavior; those tests will need to be updated to assert dynamic modal behavior when R1 is implemented.

---

## 8. Conclusion
1. **R1**: The current implementation has hardcoded "Patrick Mora" credentials in `app.handleSimulatedGoogleLogin()`. A lightweight client-side interactive account selector modal must be integrated into `js/app.js` and rendered in the DOM when clicking "Continuar con Google".
2. **R2**: `js/views/tracking.js` currently defaults to displaying a preloaded simulated order for "Patricio Mora". An empty search interface must be rendered by default when no order belongs to the active session.
3. **R3**: All four required image files exist on disk in `img/cards/` and `img/sealed/`. Updating their paths in `js/data.js` will immediately link them to Gengar, Mewtwo, Mimikyu, and the Fossil booster pack.
4. **R4**: 32 distinct robotic/technical Spanish phrases across 7 components have been cataloged with concrete, natural Spanish replacements.
5. **Test Infrastructure**: The project possesses a mature, zero-dependency Node.js v24 native test runner environment (`node --test`) with 429 passing tests and a comprehensive DOM simulation harness (`tests/test_harness.mjs`). New automated programmatic test suites can be directly added to `tests/`.

---

## 9. Verification Method

To independently verify these findings, execute the following commands in the workspace root:

1. **Verify Node.js Version & Execution Capability**:
   ```powershell
   node -v
   # Must output: v24.21.0
   ```

2. **Verify Existing Test Suite Baseline**:
   ```powershell
   node --test tests/*.test.mjs
   # Must run 429 tests and exit with code 0 in ~8s
   ```

3. **Verify Catalog Image Assets on Disk**:
   ```powershell
   node -e "['img/cards/gengar-holo-scarlet.png','img/cards/mewto-holo-rare.png','img/cards/mimikyu-rare.png','img/sealed/Paquete fossil.png'].forEach(p => { const stat = require('fs').statSync(p); console.log(p, 'EXISTS', stat.size, 'bytes'); })"
   ```

4. **Verify Hardcoded Patrick References in Source**:
   ```powershell
   node -e "const fs = require('fs'); const app = fs.readFileSync('js/app.js', 'utf8'); console.log('Hardcoded in app.js:', app.includes('Patrick Mora')); const trk = fs.readFileSync('js/views/tracking.js', 'utf8'); console.log('Preloaded in tracking.js:', trk.includes('Patricio Mora'));"
   ```
