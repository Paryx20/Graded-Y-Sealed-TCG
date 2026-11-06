/**
 * CardExplainer - Carta en 3D (con grosor) y puntos que explican cada parte.
 * Se usa en el home y en la guía (pages/guia.html).
 *
 * Accesible sin arrastre: la carta se gira con las flechas, con los botones
 * "Girar" y "Ver reverso", y cada punto también está en la lista de la derecha.
 */
const CardExplainer = {
  FRONT_IMAGE: 'assets/img/cards/blastoise-ex-151.webp',
  BACK_IMAGE: 'assets/img/cards/card-back.png',

  // Posición (% del ancho / alto de la carta) y explicación en lenguaje sencillo
  POINTS: [
    { x: 8, y: 10, face: 'front', title: 'Fase de evolución', text: 'Indica si el Pokémon es básico o una evolución. Este es "Fase 2": evoluciona de Wartortle, que a su vez evoluciona de Squirtle.' },
    { x: 61, y: 6, face: 'front', title: 'Nombre', text: 'El nombre del Pokémon. Las letras "ex" significan que es una carta especial más poderosa.' },
    { x: 88, y: 12, face: 'front', title: 'Puntos de salud (PS) y tipo', text: 'Los PS son su "vida" en el juego (330). El círculo azul es su tipo: Agua. Cada tipo es fuerte o débil frente a otros.' },
    { x: 55, y: 28, face: 'front', title: 'Ilustración', text: 'Cada carta tiene un dibujo hecho por un artista. Las ilustraciones más bonitas o raras son las más buscadas por coleccionistas.' },
    { x: 60, y: 68, face: 'front', title: 'Habilidad y ataques', text: 'Lo que el Pokémon puede hacer en una partida. Los círculos de la izquierda son la energía que necesita y el número de la derecha es el daño.' },
    { x: 13, y: 87.5, face: 'front', title: 'Debilidad y retirada', text: 'Debilidad: recibe el doble de daño de ese tipo. Retirada: lo que cuesta cambiarlo por otro Pokémon durante el juego.' },
    { x: 66, y: 91, face: 'front', title: 'Regla de las cartas ex', text: 'Si derrotan a este Pokémon, tu rival avanza el doble. Por eso las cartas ex son fuertes pero arriesgadas.' },
    { x: 22, y: 96, face: 'front', title: 'Número, expansión y rareza', text: 'MEW es la expansión (Pokémon 151), 009/165 es su número en la colección y las estrellas indican qué tan difícil es conseguirla.' },
    { x: 50, y: 50, face: 'back', title: 'Reverso', text: 'Todas las cartas Pokémon tienen el mismo reverso. Así nadie sabe qué carta vas a robar en una partida.' }
  ],

  state: {},

  render(id = 'card-explainer', options = {}) {
    const compact = !!options.compact;
    this.state[id] = { rotX: 0, rotY: -18, active: null };
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" data-explainer="${id}">
        <div class="lg:col-span-6 flex flex-col items-center gap-4">
          <div
            id="${id}-scene"
            class="explainer-scene w-full py-6"
            tabindex="0"
            role="group"
            aria-roledescription="carta en 3D"
            aria-label="Carta Blastoise ex en 3D. Usa las flechas izquierda y derecha para girarla y Inicio para enderezarla."
            aria-describedby="${id}-hint"
          >
            <div id="${id}-card" class="explainer-card" style="transform: rotateX(0deg) rotateY(-18deg)">
              <div class="explainer-face explainer-front">
                <img src="${this.FRONT_IMAGE}" alt="Carta Blastoise ex de la expansión Pokémon 151, por el frente" width="245" height="342" loading="lazy" decoding="async"
                  onerror="this.onerror=null; this.src='https://images.pokemontcg.io/sv3pt5/9.png'" draggable="false" />
                ${this.POINTS.map((p, i) => p.face === 'front' ? this.renderHotspot(id, p, i) : '').join('')}
              </div>
              <div class="explainer-face explainer-back">
                <img src="${this.BACK_IMAGE}" alt="Reverso de una carta Pokémon" width="245" height="342" loading="lazy" decoding="async" draggable="false" />
                ${this.POINTS.map((p, i) => p.face === 'back' ? this.renderHotspot(id, p, i) : '').join('')}
              </div>
              <span class="explainer-edge edge-left" aria-hidden="true"></span>
              <span class="explainer-edge edge-right" aria-hidden="true"></span>
              <span class="explainer-edge edge-top" aria-hidden="true"></span>
              <span class="explainer-edge edge-bottom" aria-hidden="true"></span>
            </div>
          </div>
          <p id="${id}-hint" class="text-xs text-slate-600 text-center">Arrástrala o usa los botones para girarla y ver su grosor.</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button type="button" onclick="CardExplainer.rotate('${id}', -30)" class="h-10 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5" aria-label="Girar la carta a la izquierda">
              <i data-lucide="rotate-ccw" class="w-4 h-4" aria-hidden="true"></i><span>Girar</span>
            </button>
            <button type="button" id="${id}-flip" onclick="CardExplainer.flip('${id}')" class="h-10 px-3 rounded-md bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold inline-flex items-center gap-1.5">
              <i data-lucide="repeat" class="w-4 h-4" aria-hidden="true"></i><span id="${id}-flip-label">Ver reverso</span>
            </button>
            <button type="button" onclick="CardExplainer.rotate('${id}', 30)" class="h-10 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5" aria-label="Girar la carta a la derecha">
              <span>Girar</span><i data-lucide="rotate-cw" class="w-4 h-4" aria-hidden="true"></i>
            </button>
            <button type="button" onclick="CardExplainer.edge('${id}')" class="h-10 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] inline-flex items-center gap-1.5">
              <i data-lucide="panel-left" class="w-4 h-4" aria-hidden="true"></i><span>Ver de canto</span>
            </button>
          </div>
        </div>

        <div class="lg:col-span-6">
          <ol class="grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : ''} gap-2" aria-label="Partes de la carta">
            ${this.POINTS.map((p, i) => `
              <li>
                <button type="button" id="${id}-item-${i}" class="explainer-item w-full text-left flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition" onclick="CardExplainer.select('${id}', ${i})" aria-controls="${id}-detail">
                  <span class="w-7 h-7 rounded-full ${p.face === 'back' ? 'bg-[#0F172A]' : 'bg-[#E11D48]'} text-white text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">${i + 1}</span>
                  <span class="text-sm font-semibold text-[#0F172A] pt-1">${p.title}</span>
                </button>
              </li>`).join('')}
          </ol>
          <div id="${id}-detail" class="mt-3 p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 min-h-[88px]" aria-live="polite">
            <p class="text-sm text-slate-600">Elige un número para ver qué significa esa parte de la carta.</p>
          </div>
        </div>
      </div>
    `;
  },

  renderHotspot(id, p, i) {
    // Los puntos sobre la carta son para el ratón; con teclado se usa la lista (mismas acciones)
    return `<button type="button" class="explainer-hotspot" style="left:${p.x}%; top:${p.y}%" tabindex="-1" aria-hidden="true" data-point="${i}" onclick="event.stopPropagation(); CardExplainer.select('${id}', ${i})">${i + 1}</button>`;
  },

  isBack(st) {
    const y = ((st.rotY % 360) + 360) % 360;
    return y > 90 && y < 270;
  },

  apply(id) {
    const st = this.state[id];
    const card = document.getElementById(`${id}-card`);
    if (!st || !card) return;
    card.style.transform = `rotateX(${st.rotX}deg) rotateY(${st.rotY}deg)`;
    const label = document.getElementById(`${id}-flip-label`);
    if (label) label.textContent = this.isBack(st) ? 'Ver frente' : 'Ver reverso';
  },

  rotate(id, deg) {
    const st = this.state[id];
    if (!st) return;
    st.rotY += deg;
    this.apply(id);
  },

  flip(id) {
    const st = this.state[id];
    if (!st) return;
    st.rotY = this.isBack(st) ? 0 : 180;
    st.rotX = 0;
    this.apply(id);
  },

  edge(id) {
    const st = this.state[id];
    if (!st) return;
    st.rotY = 80;
    st.rotX = -8;
    this.apply(id);
  },

  select(id, index) {
    const st = this.state[id];
    const point = this.POINTS[index];
    if (!st || !point) return;
    st.active = index;
    // Gira la carta hacia la cara donde está el punto
    const wantBack = point.face === 'back';
    if (wantBack !== this.isBack(st)) {
      st.rotY = wantBack ? 180 : 0;
      st.rotX = 0;
    } else if (Math.abs(((st.rotY % 360) + 360) % 360 - (wantBack ? 180 : 0)) > 40) {
      st.rotY = wantBack ? 180 : 0;
    }
    this.apply(id);

    const root = document.querySelector(`[data-explainer="${id}"]`);
    if (root) {
      root.querySelectorAll('.explainer-hotspot').forEach(h => h.setAttribute('aria-pressed', String(Number(h.dataset.point) === index)));
      root.querySelectorAll('.explainer-item').forEach((b, i) => b.setAttribute('aria-current', i === index ? 'true' : 'false'));
    }
    const detail = document.getElementById(`${id}-detail`);
    if (detail) {
      detail.innerHTML = `
        <p class="text-xs font-semibold text-[#BE123C]">Punto ${index + 1}</p>
        <h3 class="text-base font-bold text-[#0F172A]">${point.title}</h3>
        <p class="text-sm text-slate-700 mt-1 leading-relaxed">${point.text}</p>`;
    }
  },

  afterRender(id = 'card-explainer') {
    const scene = document.getElementById(`${id}-scene`);
    if (!scene || scene.dataset.bound) return;
    scene.dataset.bound = '1';
    const st = this.state[id] || (this.state[id] = { rotX: 0, rotY: -18, active: null });
    let drag = null;

    scene.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.explainer-hotspot')) return;
      drag = { x: e.clientX, y: e.clientY, rotX: st.rotX, rotY: st.rotY, moved: false };
      scene.classList.add('is-dragging');
      if (scene.setPointerCapture) scene.setPointerCapture(e.pointerId);
    });
    scene.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      st.rotY = drag.rotY + dx * 0.6;
      st.rotX = Math.max(-35, Math.min(35, drag.rotX - dy * 0.35));
      this.apply(id);
    });
    const end = () => {
      if (!drag) return;
      drag = null;
      scene.classList.remove('is-dragging');
    };
    scene.addEventListener('pointerup', end);
    scene.addEventListener('pointercancel', end);
    scene.addEventListener('lostpointercapture', end);

    scene.addEventListener('keydown', (e) => {
      const keys = { ArrowLeft: [0, -20], ArrowRight: [0, 20], ArrowUp: [10, 0], ArrowDown: [-10, 0] };
      if (keys[e.key]) {
        e.preventDefault();
        st.rotX = Math.max(-35, Math.min(35, st.rotX + keys[e.key][0]));
        st.rotY += keys[e.key][1];
        this.apply(id);
      } else if (e.key === 'Home') {
        e.preventDefault();
        st.rotX = 0;
        st.rotY = 0;
        this.apply(id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.flip(id);
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.CardExplainer = CardExplainer;
}
