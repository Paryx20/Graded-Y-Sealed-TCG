/**
 * GuideView - Guía de la tienda (pages/guia.html) en lenguaje sencillo:
 * qué vendemos, las partes de una carta (3D), estados, notas PSA, cómo comprar y preguntas frecuentes.
 */
const GuideView = {
  SECTIONS: [
    { id: 'guia-vendemos', label: 'Qué vendemos' },
    { id: 'guia-carta', label: 'Partes de una carta' },
    { id: 'guia-estado', label: 'Estado de una carta' },
    { id: 'guia-psa', label: 'Notas PSA' },
    { id: 'guia-comprar', label: 'Cómo comprar' },
    { id: 'guia-preguntas', label: 'Preguntas frecuentes' }
  ],

  render() {
    if (typeof document !== 'undefined') document.title = 'Guía para comprar cartas Pokémon | Graded & Sealed TCG';
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav aria-label="Ruta de navegación" class="text-xs text-slate-600 mb-3">
          <a href="index.html" class="hover:text-[#BE123C] hover:underline">Inicio</a>
          <span aria-hidden="true" class="mx-1">/</span>
          <span aria-current="page">Guía</span>
        </nav>

        <header class="max-w-3xl pb-6 border-b border-slate-200">
          <h1 class="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">Guía para comprar cartas Pokémon</h1>
          <p class="text-base text-slate-600 mt-3">Si nunca has comprado cartas, aquí te explicamos todo con palabras simples: qué es cada producto, cómo leer una carta y cómo funciona nuestra tienda.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <aside class="lg:col-span-3">
            <nav aria-label="En esta guía" class="lg:sticky lg:top-36 bg-white border border-slate-200 rounded-lg p-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">En esta guía</p>
              <ol class="space-y-1 text-sm">
                ${this.SECTIONS.map((s, i) => `
                  <li><a href="pages/guia.html#${s.id}" class="flex items-center gap-2 px-2 py-1.5 rounded-md text-[#0F172A] hover:bg-slate-100 hover:text-[#BE123C]"><span class="text-xs font-bold text-slate-500 w-4">${i + 1}</span>${s.label}</a></li>`).join('')}
              </ol>
            </nav>
          </aside>

          <div class="lg:col-span-9 space-y-12">
            ${this.renderWhatWeSell()}
            ${this.renderCard()}
            ${this.renderConditions()}
            ${this.renderPsa()}
            ${this.renderHowToBuy()}
            ${this.renderFaq()}
          </div>
        </div>
      </div>
    `;
  },

  sectionTitle(id, number, title, intro) {
    return `
      <div class="max-w-2xl mb-5">
        <p class="text-sm font-semibold text-[#BE123C]">Paso ${number}</p>
        <h2 id="${id}-title" class="text-2xl font-bold text-[#0F172A] tracking-tight mt-0.5">${title}</h2>
        ${intro ? `<p class="text-base text-slate-600 mt-2">${intro}</p>` : ''}
      </div>`;
  },

  renderWhatWeSell() {
    const items = [
      { icon: 'layers', title: 'Cartas sueltas (raw)', text: 'Una carta tal como sale del sobre. Es lo más económico para jugar o completar tu colección.', link: 'pages/catalogo.html?cat=raw', cta: 'Ver cartas sueltas' },
      { icon: 'award', title: 'Cartas certificadas (PSA)', text: 'Una empresa experta llamada PSA revisa la carta, le pone una nota del 1 al 10 y la sella en un estuche de plástico duro. Así sabes que es original y en qué estado está.', link: 'pages/catalogo.html?cat=psa', cta: 'Ver cartas certificadas' },
      { icon: 'package', title: 'Sobres y cajas selladas', text: 'Un sobre trae 10 cartas al azar. Las cajas traen varios sobres. Vienen cerradas de fábrica: la sorpresa es abrirlas.', link: 'pages/catalogo.html?cat=sealed', cta: 'Ver sobres y cajas' }
    ];
    return `
      <section id="guia-vendemos" aria-labelledby="guia-vendemos-title" class="reveal scroll-mt-36">
        ${this.sectionTitle('guia-vendemos', 1, 'Qué vendemos', 'Tenemos tres tipos de producto. Ninguno es mejor que otro: depende de lo que quieras hacer.')}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${items.map(i => `
            <article class="bg-white border border-slate-200 rounded-lg p-5 flex flex-col">
              <div class="w-11 h-11 rounded-md bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center"><i data-lucide="${i.icon}" class="w-6 h-6" aria-hidden="true"></i></div>
              <h3 class="mt-3 text-lg font-bold text-[#0F172A]">${i.title}</h3>
              <p class="mt-1 text-sm text-slate-600 leading-relaxed flex-1">${i.text}</p>
              <a href="${i.link}" class="mt-4 text-sm font-semibold text-[#BE123C] hover:underline underline-offset-2 inline-flex items-center gap-1">${i.cta}<i data-lucide="arrow-right" class="w-4 h-4" aria-hidden="true"></i></a>
            </article>`).join('')}
        </div>
      </section>`;
  },

  renderCard() {
    return `
      <section id="guia-carta" aria-labelledby="guia-carta-title" class="reveal scroll-mt-36 bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
        ${this.sectionTitle('guia-carta', 2, 'Las partes de una carta', 'Gira la carta para ver su grosor y elige un número para saber qué significa cada parte.')}
        ${typeof CardExplainer !== 'undefined' ? CardExplainer.render('guide-explainer') : ''}
      </section>`;
  },

  renderConditions() {
    const rows = [
      ['Near Mint (NM)', 'Casi perfecta', 'Parece recién sacada del sobre. Puede tener un detalle mínimo que casi no se ve.', true],
      ['Lightly Played (LP)', 'Poco usada', 'Pequeñas marcas en los bordes o esquinas si la miras de cerca.', false],
      ['Moderately Played (MP)', 'Usada', 'Marcas visibles en bordes, esquinas o la superficie.', false],
      ['Heavily Played (HP)', 'Muy usada', 'Mucho desgaste, pliegues o manchas.', false],
      ['Damaged (DMG)', 'Dañada', 'Rota, doblada o con daños grandes.', false]
    ];
    return `
      <section id="guia-estado" aria-labelledby="guia-estado-title" class="reveal scroll-mt-36">
        ${this.sectionTitle('guia-estado', 3, 'El estado de una carta', 'Las cartas sueltas se clasifican según qué tan bien conservadas están. <strong class="text-[#0F172A]">En nuestra tienda solo vendemos cartas Near Mint (casi perfectas).</strong>')}
        <div class="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table class="w-full text-sm text-left">
            <caption class="sr-only">Estados de conservación de una carta</caption>
            <thead class="bg-[#F8FAFC] text-xs uppercase tracking-wider text-slate-600">
              <tr><th scope="col" class="px-4 py-3">Estado</th><th scope="col" class="px-4 py-3">En palabras simples</th><th scope="col" class="px-4 py-3">Cómo se ve</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rows.map(([name, simple, desc, ours]) => `
                <tr class="${ours ? 'bg-emerald-50/60' : ''}">
                  <th scope="row" class="px-4 py-3 font-semibold text-[#0F172A] whitespace-nowrap">${name}${ours ? ' <span class="ml-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-[#D1FAE5] text-[#047857]">Lo que vendemos</span>' : ''}</th>
                  <td class="px-4 py-3 text-[#0F172A]">${simple}</td>
                  <td class="px-4 py-3 text-slate-600">${desc}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  },

  renderPsa() {
    const grades = [
      { grade: 'PSA 10', name: 'Gem Mint', text: 'Perfecta. Sin ningún defecto visible, incluso con lupa.' },
      { grade: 'PSA 9', name: 'Mint', text: 'Excelente. Tiene un solo detalle muy pequeño.' },
      { grade: 'PSA 8', name: 'Near Mint-Mint', text: 'Muy buena. Puede tener algún detalle leve en una esquina o en el centrado.' }
    ];
    return `
      <section id="guia-psa" aria-labelledby="guia-psa-title" class="reveal scroll-mt-36">
        ${this.sectionTitle('guia-psa', 4, 'Las notas PSA', 'PSA es una empresa de Estados Unidos que revisa cartas. Les pone una nota del 1 al 10 y las guarda en un estuche sellado (llamado "slab") para que no se dañen.')}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${grades.map(g => `
            <div class="bg-white border border-slate-200 rounded-lg p-5">
              <p class="text-2xl font-bold text-[#0F172A]">${g.grade}</p>
              <p class="text-sm font-semibold text-[#BE123C]">${g.name}</p>
              <p class="mt-2 text-sm text-slate-600 leading-relaxed">${g.text}</p>
            </div>`).join('')}
        </div>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-[#F8FAFC] border border-slate-200 rounded-lg p-5">
            <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2"><i data-lucide="scan" class="w-5 h-5 text-slate-600" aria-hidden="true"></i>¿Qué revisa PSA?</h3>
            <ul class="mt-2 space-y-1.5 text-sm text-slate-600 list-disc pl-5">
              <li><strong class="text-[#0F172A]">Esquinas:</strong> que no estén dobladas ni gastadas.</li>
              <li><strong class="text-[#0F172A]">Bordes:</strong> sin marcas blancas.</li>
              <li><strong class="text-[#0F172A]">Superficie:</strong> sin rayones ni manchas.</li>
              <li><strong class="text-[#0F172A]">Centrado:</strong> que el dibujo esté bien centrado, con márgenes parejos.</li>
            </ul>
          </div>
          <div class="bg-[#F8FAFC] border border-slate-200 rounded-lg p-5">
            <h3 class="text-base font-bold text-[#0F172A] flex items-center gap-2"><i data-lucide="badge-check" class="w-5 h-5 text-slate-600" aria-hidden="true"></i>Cómo leer la etiqueta del estuche</h3>
            <p class="mt-2 text-sm text-slate-600 leading-relaxed">Arriba del estuche hay una etiqueta con el nombre de la carta, su expansión, la nota y un <strong class="text-[#0F172A]">número de certificado</strong>. Con ese número cualquiera puede comprobar en la web de PSA que la carta es original.</p>
            <button type="button" onclick="app.openPSAGuideModal()" class="mt-3 text-sm font-semibold text-[#BE123C] hover:underline underline-offset-2">Ver el resumen de notas</button>
          </div>
        </div>
      </section>`;
  },

  renderHowToBuy() {
    const steps = [
      { icon: 'search', title: 'Elige tu producto', text: 'Busca en el catálogo por tipo o por expansión. En cada carta eliges si la quieres suelta o certificada.' },
      { icon: 'shopping-bag', title: 'Añádelo a tu bolsa', text: 'Puedes cambiar cantidades o quitar productos antes de pagar.' },
      { icon: 'credit-card', title: 'Paga', text: 'Con tarjeta, o en efectivo si eliges retirar en nuestra tienda de Quito. Puedes cancelar el pago mientras se procesa.' },
      { icon: 'package-search', title: 'Sigue tu pedido', text: 'En "Mis pedidos" ves cómo avanza. Mientras esté en preparación todavía puedes cancelarlo.' }
    ];
    return `
      <section id="guia-comprar" aria-labelledby="guia-comprar-title" class="reveal scroll-mt-36">
        ${this.sectionTitle('guia-comprar', 5, 'Cómo comprar en la tienda', '')}
        <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${steps.map((s, i) => `
            <li class="bg-white border border-slate-200 rounded-lg p-5">
              <div class="flex items-center gap-2">
                <span class="w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center" aria-hidden="true">${i + 1}</span>
                <i data-lucide="${s.icon}" class="w-5 h-5 text-[#BE123C]" aria-hidden="true"></i>
              </div>
              <h3 class="mt-3 text-base font-bold text-[#0F172A]">${s.title}</h3>
              <p class="mt-1 text-sm text-slate-600 leading-relaxed">${s.text}</p>
            </li>`).join('')}
        </ol>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-[#F8FAFC] border border-slate-200 rounded-lg p-4"><strong class="text-[#0F172A] block">Envío nacional · $5</strong><span class="text-slate-600">A todo Ecuador en 2 a 3 días hábiles.</span></div>
          <div class="bg-[#F8FAFC] border border-slate-200 rounded-lg p-4"><strong class="text-[#0F172A] block">Quito Express · $3</strong><span class="text-slate-600">Entrega en Quito en 24 horas.</span></div>
          <div class="bg-[#F8FAFC] border border-slate-200 rounded-lg p-4"><strong class="text-[#0F172A] block">Retiro en tienda · Gratis</strong><span class="text-slate-600">Pagas con tarjeta o en efectivo al retirar.</span></div>
        </div>
      </section>`;
  },

  renderFaq() {
    const faq = [
      ['¿Cómo sé cuánto vale una carta que ya tengo?', 'Usa <a href="pages/busqueda.html" class="font-semibold text-[#BE123C] hover:underline">Explorar cartas</a>: busca la carta por su nombre y verás su precio de mercado de referencia (de TCGplayer). Es solo informativo.'],
      ['¿Puedo cancelar un pedido?', 'Sí, mientras esté "En preparación". Entra a Mis pedidos, abre el pedido y pulsa "Cancelar pedido". Si pagaste con tarjeta, el valor se devuelve.'],
      ['¿Qué pasa si mi pago es rechazado o lo cancelo?', 'No se cobra nada y tus productos siguen en la bolsa. Puedes intentar con otra tarjeta o elegir retiro en tienda y pagar en efectivo.'],
      ['¿Por qué una carta cuesta distinto en cada nota PSA?', 'Mientras mejor conservada esté, más difícil es de encontrar. Por eso un PSA 10 cuesta más que la misma carta suelta.'],
      ['¿Para qué me piden la cédula?', 'Solo para tu factura electrónica. También te sirve para buscar un pedido sin iniciar sesión.'],
      ['¿Olvidé mi contraseña, qué hago?', 'En Iniciar sesión pulsa "¿Olvidaste tu contraseña?". Confirmas tu correo y tu cédula y eliges una nueva.'],
      ['¿Es una tienda real?', 'Es un proyecto académico de la PUCE: puedes navegar y probar todo, pero los pagos son simulados y no se cobra dinero real.']
    ];
    return `
      <section id="guia-preguntas" aria-labelledby="guia-preguntas-title" class="reveal scroll-mt-36">
        ${this.sectionTitle('guia-preguntas', 6, 'Preguntas frecuentes', '')}
        <div class="space-y-2">
          ${faq.map(([q, a]) => `
            <details class="group bg-white border border-slate-200 rounded-lg">
              <summary class="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer text-base font-semibold text-[#0F172A] list-none">
                <span>${q}</span>
                <i data-lucide="chevron-down" class="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" aria-hidden="true"></i>
              </summary>
              <p class="px-5 pb-4 text-sm text-slate-600 leading-relaxed">${a}</p>
            </details>`).join('')}
        </div>
      </section>`;
  },

  afterRender() {
    if (typeof CardExplainer !== 'undefined') CardExplainer.afterRender('guide-explainer');
    if (typeof HomeView !== 'undefined' && HomeView.setupReveal) HomeView.setupReveal();
  }
};

if (typeof window !== 'undefined') {
  window.GuideView = GuideView;
}
