## 2026-11-02T03:12:00Z

Fix UI and functionality issues across the Pokemon TCG e-commerce website for an academic presentation showcase, ensuring 3D card inspection interactivity, dynamic condition pricing on the product detail page, API card search image loading and realistic price calculation, and overall interface consistency.

Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce
Integrity mode: development

## Reference Material
- PDP Reference Screenshot: C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793587749141_c6faf0cc.jpg
- Search Dropdown Reference Screenshot: C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793587810923_a2b000d8.png
- Broken Images & $15 Search Results Screenshot: C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793587837576_3085961d.jpg
- Multisource Search Header Screenshot: C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793587852151_4661f05c.jpg
- Catalog Screenshot: C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793587950073_ccf04d27.jpg

## Verification Resources
- Existing automated test suite in the repository (`tests/`)
- Browser UI execution and console log verification

## Requirements

### R1. Interactive 3D Card Viewer on PDP
The product detail page (PDP) 3D card viewer must allow users to freely inspect the card with smooth mouse or touch drag rotation in 3D perspective, enabling full inspection of both the front and reverse sides.

### R2. Dynamic Condition/Grade Pricing Updates on PDP
Selecting different card conditions / grades (Raw, PSA 8, PSA 9, PSA 10) on the product detail page must dynamically and accurately update the displayed card price.

### R3. API Search Integration, Images, and Realistic Pricing
In API card search results:
- Fix broken card images (e.g., TCGdex assets) so that card artwork loads and renders correctly.
- Replace static $15.00 placeholder prices with realistic market pricing (using API market price fields when available, and estimating realistically by rarity and set when missing).
- Ensure cards discovered through API search are integrated into the e-commerce store flow, allowing users to view card details, their real cost, and acquire them.

### R4. Interface Stability and Navigation
Ensure catalog browsing, real-time search, and navigation flow operate seamlessly across the e-commerce site without visual defects or browser console errors.

## Acceptance Criteria

### 3D Card Inspection
- [ ] Dragging with mouse or touch on the PDP 3D viewer smoothly rotates the card in 3D space with perspective.
- [ ] Both front and reverse sides of the card are fully visible and inspectable during rotation.

### Dynamic Condition Pricing
- [ ] Clicking on different grading/condition buttons (Raw, PSA 8, PSA 9, PSA 10) immediately updates the displayed price to reflect that condition's price.

### API Search & Realistic Prices
- [ ] Card images in the API search results load successfully with valid image URLs (no broken image placeholders).
- [ ] Cards returned from the API search do not show a fixed $15.00 price, but instead show realistic prices derived from market data or rarity/set estimation.
- [ ] Selecting a card from the API search results opens its product detail view with its calculated cost and store integration.

### UI & Console Integrity
- [ ] Navigating between the catalog, search results, and product detail page produces zero JavaScript console errors.
- [ ] Automated tests in `tests/` pass.


## 2026-11-02T11:32:38Z

Refactor and enhance the Pokémon TCG e-commerce web platform for production deployment, resolving UI defects, streamlining the product detail page, removing 3D viewer centering overlays, fixing search navigation and acquisition flow, establishing a realistic tracking view, and integrating production-ready Google authentication without hardcoded user data.

Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce
Integrity mode: development

## Reference Material
- Captura 1 (PDP con gráfico que debe eliminarse): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616311021_84ef79a9.jpg
- Captura 2 (Resultados de búsqueda y botones): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616320500_73fae749.jpg
- Captura 3 (Reverso con 50x50 que debe removerse): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616334600_2a319d6a.jpg
- Captura 4 (Múltiples vistos en botones PSA a corregir): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616353085_5ccd04f2.jpg
- Captura 5 (Perfil con datos predeterminados a corregir con login de Google): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616426669_fd5f4cc2.png

## Verification Resources
- Existing automated test suite in the repository (`tests/`)
- Browser UI execution and console log verification

## Requirements

### R1. PDP PSA Condition Buttons Exclusive Checkmark
When selecting a card condition/grade (Raw, PSA 8, PSA 9, PSA 10) on the product detail page, only the currently active condition button must display a checkmark (✓). The checkmark must be immediately removed from any previously selected button so that multiple checkmarks never appear simultaneously.

### R2. PDP Statistics Box Removal and Price Clarity
Completely remove the market history statistics box ('Historial de Mercado Actual 12 meses', SVG trend curve, percentage indicators) from the product detail page. The card price must remain prominently displayed, clear, and accurately reflective of the selected card condition.

### R3. 3D Card Viewer Clean Reverse Side
On the reverse/back side of the 3D card viewer, eliminate the dashed centering grid overlay ('centering-grid-overlay') and centering coordinate labels ('EJE X: 50.0% / 50.0%', 'EJE Y: 50.0% • BORDES OK'). The reverse side must display solely the clean Pokémon card back artwork without any overlaid lines or text.

### R4. API Search Card Navigation and Purchase Flow
Ensure action buttons on cards returned from API search results (e.g. 'Solicitar Adquisición') properly navigate to the card's product detail view with accurate market pricing, allowing users to add the card to their cart or initiate purchase directly.

### R5. Preloaded Live Tracking Simulation
Eliminate manual simulation buttons from the tracking view (`#tracking`). Display an active, realistic simulated order tracking timeline upon loading the tracking section, seamlessly integrated with the purchase simulation.

### R6. Google OAuth 2.0 Integration and Dynamic User Profile
Remove all preloaded/hardcoded default user information (name, national ID, address, etc.) on initial page load. Implement a production-ready Google Sign-In button utilizing Google Identity Services / OAuth 2.0 structure (with an elegant fallback if client credentials are not configured), populating and displaying user profile data only upon successful authentication.

## Acceptance Criteria

### PDP Condition Buttons
- [ ] Clicking any condition button (Raw, PSA 8, PSA 9, PSA 10) displays the checkmark (✓) exclusively on the selected button.
- [ ] Previous checkmarks are removed when switching conditions; no two buttons ever show a checkmark simultaneously.

### PDP Price and Layout
- [ ] The 12-month market history chart box, SVG curve, and percentage labels are completely removed from the product detail page.
- [ ] The card price is prominently visible and dynamically updates when changing conditions.

### 3D Card Viewer
- [ ] The reverse side of the 3D card viewer contains no dotted grid overlay ('centering-grid-overlay').
- [ ] The reverse side contains no centering coordinate text ('EJE X', 'EJE Y', '50.0%').
- [ ] Only the clean Pokémon card back image is visible on the reverse side.

### API Search Navigation and Acquisition
- [ ] Action buttons on cards in the API search results open the respective card in the product detail view with its calculated price.
- [ ] Cards found through API search can be added to the cart and purchased through the store workflow.

### Order Tracking Simulation
- [ ] The tracking section contains no manual simulation control buttons.
- [ ] An active simulated order with realistic status timeline steps is displayed when viewing `#tracking`.

### Authentication and User Profile
- [ ] Profile fields (name, ID, address, etc.) are empty or show an unauthenticated guest state on initial load, with no hardcoded default user data.
- [ ] A Google Sign-In button is present and functional via Google Identity Services / OAuth 2.0 structure.
- [ ] User profile information is established and displayed in the session only after completing Google authentication.

### Quality and Stability
- [ ] No JavaScript console errors occur during navigation, search, condition switching, or tracking views.
- [ ] Automated tests in `tests/` pass.
