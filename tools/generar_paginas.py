"""
Genera las páginas HTML independientes del sitio a partir de index.html.

index.html es la plantilla: contiene el encabezado, el pie, los modales y los
scripts compartidos. Cada página copia esa estructura y cambia solo el título,
la descripción y el atributo data-page del <body>, que indica a js/app.js qué
vista dibujar dentro de <main id="app-view">.

Uso (desde la raíz del proyecto):  python tools/generar_paginas.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PAGES = {
    'index.html': ('home', 'Inicio', 'Bóveda de cartas Pokémon certificadas PSA, sellados y cartas raw en Quito, Ecuador.'),
    'catalogo.html': ('catalog', 'Catálogo', 'Catálogo completo con filtros por categoría, era, grado PSA, energía y precio.'),
    'producto.html': ('pdp', 'Ficha de producto', 'Detalle de la pieza: grados disponibles, certificado PSA e historial de precios.'),
    'carrito.html': ('cart', 'Bolsa de compras', 'Revisa las piezas de tu bolsa antes de pagar.'),
    'checkout.html': ('checkout', 'Checkout seguro', 'Datos de facturación, método de entrega y pago con tarjeta o efectivo.'),
    'confirmacion.html': ('confirmation', 'Orden confirmada', 'Resumen de tu orden confirmada.'),
    'pago-rechazado.html': ('error', 'Pago rechazado', 'El banco rechazó el pago: motivo y opciones para reintentar.'),
    'login.html': ('auth', 'Iniciar sesión o registrarse', 'Accede o crea tu cuenta de coleccionista.'),
    'perfil.html': ('profile', 'Mi perfil', 'Tus datos personales y el historial de tus órdenes.'),
    'tracking.html': ('tracking', 'Rastrear pedido', 'Seguimiento de tu pedido con verificación de identidad por cédula.'),
    'busqueda.html': ('search-results', 'Resultados de búsqueda', 'Búsqueda de cartas en la bóveda y en la base de datos Pokémon TCG.'),
}

template = (ROOT / 'index.html').read_text(encoding='utf-8')

for filename, (page, title, description) in PAGES.items():
    html = re.sub(r'<title>.*?</title>',
                  f'<title>{title} | Graded &amp; Sealed TCG</title>', template, count=1)
    html = re.sub(r'<meta name="description" content="[^"]*" />\n?', '', html)
    html = html.replace('</title>', f'</title>\n  <meta name="description" content="{description}" />', 1)
    html = re.sub(r'<body( data-page="[^"]*")?', f'<body data-page="{page}"', html, count=1)
    (ROOT / filename).write_text(html, encoding='utf-8', newline='\n')
    print('generada', filename)
