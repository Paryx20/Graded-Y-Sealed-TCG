# Original User Request

## Approved Task Prompt — 2026-11-02T19:44:30Z

Update the e-commerce web platform to make Google Sign-In dynamic via an interactive account selector modal, anonymize the public order tracking section by default, update catalog product data with newly added images, and humanize interface copy across user touchpoints to be natural and clear.

Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce
Integrity mode: development

## Requirements

### R1. Dynamic Google Sign-In Modal
Replace the automatic/hardcoded login ("Patrick Mora", "patrickmora2006@gmail.com") with a client-side interactive modal or selector when clicking "Continuar con Google". The modal must allow visitors to enter or select their own email address and full name, authenticating the active session with their provided credentials without requiring external Google Cloud API keys.

### R2. Anonymous Default Order Tracking
Ensure that public visitors navigating to the `#tracking` section do not see any preloaded personal data or order details ("Patrick Mora Arias"). By default, the tracking view must present an empty search interface awaiting a valid tracking code or display orders placed within the active user's current session.

### R3. Catalog Image Updates in data.js
Update the product catalog in `js/data.js` to link the newly added image assets to their corresponding products:
- `img/cards/gengar-holo-scarlet.png` linked to the Gengar card product.
- `img/cards/mewto-holo-rare.png` linked to the Mewtwo card product.
- `img/cards/mimikyu-rare.png` linked to the Mimikyu card product.
- `img/sealed/Paquete fossil.png` linked to the Fossil booster pack / sealed item.

### R4. Humanized UI Copy and Tone
Review and refine UI text across user-facing touchpoints (login modals, confirmation banners, tracking status descriptions, and feedback alerts). Replace formulaic, overly technical, or robotic phrases with natural, clear, and human-friendly Spanish that any customer can understand immediately.

## Acceptance Criteria

### Authentication
- [ ] Clicking "Continuar con Google" opens an interactive modal allowing the user to input or choose their name and email, rather than immediately signing in as "Patrick Mora".
- [ ] Submitting the modal logs in the user with the entered name and email, updating the user profile display across the navbar and application.
- [ ] Hardcoded references to "Patrick Mora" and "patrickmora2006@gmail.com" are removed from the default Google authentication logic.

### Order Tracking
- [ ] Navigating to `#tracking` as a visitor without an active order shows an empty tracking input state without exposing any person's name, email, or order history.
- [ ] "Patrick Mora Arias" does not appear anywhere in `#tracking` unless explicitly entered or authenticated as that user.
- [ ] Entering a valid tracking code or placing a new order correctly retrieves and displays the corresponding order details.

### Catalog Assets
- [ ] In `js/data.js`, the Gengar card product specifies `img/cards/gengar-holo-scarlet.png` as its image path.
- [ ] In `js/data.js`, the Mewtwo card product specifies `img/cards/mewto-holo-rare.png` as its image path.
- [ ] In `js/data.js`, the Mimikyu card product specifies `img/cards/mimikyu-rare.png` as its image path.
- [ ] In `js/data.js`, the Fossil sealed pack product specifies `img/sealed/Paquete fossil.png` as its image path.
- [ ] The catalog and product modal render all four updated images without broken image links.

### Copywriting & Usability
- [ ] Modal dialogs, buttons, and status indicators in tracking use direct, natural Spanish without robotic or artificial filler phrasing.
- [ ] Order status updates and confirmation alerts are clear, plain, and free of system jargon.

### Verification
- [ ] Programmatic checks verify that the Google Sign-In prompt accepts dynamic input and updates session state.
- [ ] Programmatic checks verify that loading `#tracking` in a fresh session contains no pre-filled personal name.
- [ ] Programmatic checks verify that all four image paths exist on disk and resolve correctly in the DOM.
- [ ] Programmatic checks verify that user-facing strings are non-empty and present clear, grammatically sound Spanish text.
