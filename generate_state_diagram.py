# -*- coding: utf-8 -*-
"""
Generate the formal State Machine & Navigation Flow diagram for "Graded & Sealed TCG".
Deliverables:
- flujo_navegacion_estados.svg (High-resolution vector architecture)
- flujo_viewer.html (Interactive browser viewer with zoom/pan and HCI documentation)
Saved in c:/Users/patri/Desktop/PUCE TAREAS/IHC/Pagina_e-commerce/ and root.
"""
import os
import xml.etree.ElementTree as ET

def escape_xml(text):
    return (text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
                .replace("'", "&apos;"))

def build_flowchart_svg():
    width = 1920
    height = 1200
    
    font_sans = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    font_mono = "Menlo, Monaco, Consolas, Courier New, monospace"

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    
    # Defs: Arrowhead markers and filters
    svg.append('''<defs>
      <!-- Blue Happy Path Marker -->
      <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#1D4ED8" />
      </marker>
      <!-- Red Error / Recovery Marker -->
      <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
      </marker>
      <!-- Green Success Marker -->
      <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#16A34A" />
      </marker>
      <!-- Slate Secondary Marker -->
      <marker id="arrow-slate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
      </marker>
      <!-- Purple Feedback Marker -->
      <marker id="arrow-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#7C3AED" />
      </marker>
    </defs>''')

    # Canvas Background
    svg.append(f'<rect width="{width}" height="{height}" fill="#F8FAFC"/>')
    # Blueprint grid dots
    for gx in range(40, width, 60):
        for gy in range(40, height, 60):
            svg.append(f'<circle cx="{gx}" cy="{gy}" r="1" fill="#E2E8F0"/>')

    # Top Title Header Banner
    svg.append('<g id="Title_Header">')
    svg.append('<rect x="60" y="40" width="1800" height="84" fill="#0F172A" rx="12" ry="12"/>')
    svg.append(f'<text x="96" y="80" fill="#FFFFFF" font-family="{font_sans}" font-size="22" font-weight="900" letter-spacing="-0.5">GRADED &amp; SEALED TCG — DIAGRAMA FORMAL DE ESTADOS Y FLUJO DE NAVEGACIÓN</text>')
    svg.append(f'<text x="96" y="104" fill="#94A3B8" font-family="{font_sans}" font-size="13">Máquina de Estados Finitos (FSM) • Arquitectura de Información • Modelo Mental del Usuario (IHC) • WCAG 2.2</text>')
    svg.append('<rect x="1620" y="62" width="200" height="36" fill="#1D4ED8" rx="6" ry="6"/>')
    svg.append(f'<text x="1720" y="85" fill="#FFFFFF" font-family="{font_mono}" font-size="12" font-weight="800" text-anchor="middle">SISTEMA 9 ESTADOS</text>')
    svg.append('</g>')

    # Helper: Draw State Node Card
    def draw_state_card(x, y, w, h, code, title, header_color, bg_color, items, border_color="#CBD5E1"):
        res = []
        res.append(f'<g id="Node_{code.replace(" ", "_")}">')
        # Outer Card
        res.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg_color}" stroke="{border_color}" stroke-width="2" rx="12" ry="12"/>')
        # Card Header
        res.append(f'<rect x="{x}" y="{y}" width="{w}" height="42" fill="{header_color}" rx="12" ry="12"/>')
        res.append(f'<rect x="{x}" y="{y + 24}" width="{w}" height="18" fill="{header_color}"/>')
        res.append(f'<text x="{x + 16}" y="{y + 26}" fill="#FFFFFF" font-family="{font_sans}" font-size="13" font-weight="900">{escape_xml(code)}</text>')
        res.append(f'<text x="{x + 72}" y="{y + 26}" fill="#FFFFFF" font-family="{font_sans}" font-size="13" font-weight="700">| {escape_xml(title)}</text>')
        # Items list
        iy = y + 64
        for it in items:
            res.append(f'<text x="{x + 16}" y="{iy}" fill="#1E293B" font-family="{font_sans}" font-size="11.5" font-weight="500">• {escape_xml(it)}</text>')
            iy += 20
        res.append('</g>')
        return "\n".join(res)

    # ----------------------------------------------------
    # NODES PLACEMENT (Coordinates tailored for clear layout)
    # ----------------------------------------------------
    
    # S1: Home / Catálogo (x=80, y=180, w=300, h=190)
    svg.append(draw_state_card(
        80, 180, 310, 200, "S1", "Home / Catálogo", "#1D4ED8", "#FFFFFF",
        [
            "Estado inicial del sistema",
            "Búsqueda facetada (aria-label)",
            "Chips: [Cartas Sueltas], [Solo PSA]",
            "Grid modular: Singles, Packs, Slabs",
            "Badge dinámico de Bolsa (B=3)"
        ], "#93C5FD"
    ))

    # S2: Ficha de Producto / PDP (x=480, y=180, w=320, h=200)
    svg.append(draw_state_card(
        480, 180, 320, 200, "S2", "Ficha de Producto (PDP)", "#1D4ED8", "#FFFFFF",
        [
            "Inspección de carta y slab PSA",
            "Selector: Raw / PSA 8 / PSA 9 / PSA 10",
            "Actualización reactiva de precio",
            "Gráfica histórica 12 meses (+21%)",
            "Acción: [Añadir a la bolsa]"
        ], "#93C5FD"
    ))

    # S3: Bolsa de Compras (x=890, y=180, w=320, h=200)
    svg.append(draw_state_card(
        890, 180, 320, 200, "S3", "Bolsa de Compras", "#1D4ED8", "#FFFFFF",
        [
            "Listado de cartas seleccionadas",
            "Steppers accesibles (+ / -)",
            "Recálculo reactivo: Subtotal e IVA 12%",
            "Acción: [Proceder al Checkout]",
            "Acción: [Eliminar ítem]"
        ], "#93C5FD"
    ))

    # S3_Feedback: Microinteracción de Borrado (x=890, y=450, w=320, h=170)
    svg.append(draw_state_card(
        890, 450, 320, 170, "S3_F", "Microinteracción Borrado", "#7C3AED", "#FAF5FF",
        [
            "Sub-estado temporal de feedback (Heurística #1)",
            "Banner / Toast accesible superior",
            "Caché de memoria: 60s retención",
            "Control y libertad (Heurística #3): [Deshacer]",
            "Recálculo automático de cesta"
        ], "#C084FC"
    ))

    # S4: Checkout Bifurcado (x=1300, y=180, w=340, h=220)
    svg.append(draw_state_card(
        1300, 180, 340, 220, "S4", "Checkout Bifurcado", "#1D4ED8", "#FFFFFF",
        [
            "Carril A: Usuario Frecuente (Login)",
            "Carril B: Compra Rápida Invitado",
            "Entrega: Envío ($25) vs Retiro ($0)",
            "Condicional: Efectivo solo en Retiro",
            "Acción: [Finalizar Compra y Pagar]"
        ], "#93C5FD"
    ))

    # Decision Diamond: Pasarela de Pago (x=1390, y=470, w=160, h=100)
    gw_cx = 1470
    gw_cy = 520
    svg.append('<g id="Gateway_Decision_Diamond">')
    svg.append(f'<polygon points="{gw_cx},{gw_cy-45} {gw_cx+90},{gw_cy} {gw_cx},{gw_cy+45} {gw_cx-90},{gw_cy}" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>')
    svg.append(f'<text x="{gw_cx}" y="{gw_cy - 8}" fill="#0F172A" font-family="{font_sans}" font-size="11.5" font-weight="900" text-anchor="middle">¿Pasarela</text>')
    svg.append(f'<text x="{gw_cx}" y="{gw_cy + 8}" fill="#0F172A" font-family="{font_sans}" font-size="11.5" font-weight="900" text-anchor="middle">de Pago</text>')
    svg.append(f'<text x="{gw_cx}" y="{gw_cy + 24}" fill="#B45309" font-family="{font_sans}" font-size="10" font-weight="700" text-anchor="middle">Aprobada?</text>')
    svg.append('</g>')

    # S5_Exito: Orden Confirmada (x=1300, y=670, w=340, h=190)
    svg.append(draw_state_card(
        1300, 670, 340, 190, "S5_E", "Orden Confirmada (#PKM)", "#16A34A", "#F0FDF4",
        [
            "Estado terminal de éxito de compra",
            "Confirmación inequívoca #PKM-2026-88941",
            "Desglose final y comprobante al correo",
            "Registro Progresivo Opcional (1 Clic)",
            "Ruta a: [Ver Seguimiento de Pedido]"
        ], "#86EFAC"
    ))

    # S5_Error: Contingencia de Pago (x=1680, y=470, w=300, h=210)
    svg.append(draw_state_card(
        1670, 440, 220, 220, "S5_X", "Error de Pago", "#DC2626", "#FEF2F2",
        [
            "Heurística Nielsen #9 (Diagnóstico)",
            "Código: #DECLINED-SEC-054",
            "Reaseguro: Cobro $0.00",
            "Preserva datos del formulario",
            "Ruta 1: [Reintentar con otro método]",
            "Ruta 2: [Cambiar a Retiro en Tienda]"
        ], "#FCA5A5"
    ))

    # S7: Tracking y Custodia (x=890, y=720, w=320, h=200)
    svg.append(draw_state_card(
        890, 720, 320, 200, "S7", "Mis Pedidos & Tracking", "#0F172A", "#FFFFFF",
        [
            "Seguimiento post-venta del pedido activo",
            "Stepper 4 Fases: Recibido ➔ Preparación ➔",
            "➔ En Camino/Listo ➔ Entregado",
            "Acción: [Descargar Factura Electrónica]",
            "Acción: [Solicitar Devolución / Soporte]"
        ], "#CBD5E1"
    ))

    # S6: Autenticación / Cuenta (x=80, y=720, w=310, h=200)
    svg.append(draw_state_card(
        80, 720, 310, 200, "S6", "Autenticación / Cuenta", "#475569", "#FFFFFF",
        [
            "Gestión de credenciales y cuenta",
            "Pestaña A: Iniciar Sesión",
            "Pestaña B: Crear Cuenta (Cédula, Correo)",
            "Etiquetas accesibles fuera del input",
            "Foco de teclado visible (:focus-visible 3px)"
        ], "#CBD5E1"
    ))

    # ----------------------------------------------------
    # TRANSITION CONNECTORS & LABELS
    # ----------------------------------------------------
    def draw_edge(path_d, color, marker_id, label, lx, ly, label_bg="#FFFFFF"):
        res = []
        res.append(f'<path d="{path_d}" fill="none" stroke="{color}" stroke-width="2.5" stroke-linecap="round" marker-end="url(#{marker_id})"/>')
        if label:
            bw = len(label) * 6.4 + 18
            bh = 22
            bx = lx - bw/2
            by = ly - bh/2
            res.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="{label_bg}" stroke="{color}" stroke-width="1.2" rx="4" ry="4"/>')
            res.append(f'<text x="{lx}" y="{ly + 4}" fill="{color}" font-family="{font_mono}" font-size="10.5" font-weight="700" text-anchor="middle">{escape_xml(label)}</text>')
        return "\n".join(res)

    # 1. S1 -> S2: Clic en tarjeta de producto
    svg.append(draw_edge(
        "M 390 280 L 476 280", "#1D4ED8", "arrow-blue",
        "[Seleccionar carta / Ver detalle]", 433, 265
    ))

    # 2. S2 -> S3: Añadir a la bolsa
    svg.append(draw_edge(
        "M 800 280 L 886 280", "#1D4ED8", "arrow-blue",
        "[Clic 'Añadir a la bolsa' / Incrementa badge]", 843, 265
    ))

    # 3. S3 -> S4: Proceder al Checkout
    svg.append(draw_edge(
        "M 1210 280 L 1296 280", "#1D4ED8", "arrow-blue",
        "[Clic 'Proceder al Checkout' / Valida cesta > 0]", 1253, 265
    ))

    # 4. S3 -> S3_F: Eliminar ítem
    svg.append(draw_edge(
        "M 1000 380 L 1000 446", "#7C3AED", "arrow-purple",
        "[Clic 'Eliminar' / Oculta ítem y activa caché 60s]", 1000, 415
    ))

    # 5. S3_F -> S3: Deshacer acción (Loop)
    svg.append(draw_edge(
        "M 1100 450 L 1100 384", "#7C3AED", "arrow-purple",
        "[Clic 'Deshacer acción' / Restaura ítem]", 1100, 415
    ))

    # 6. S4 -> Decision Diamond: Submit checkout
    svg.append(draw_edge(
        "M 1470 400 L 1470 471", "#1D4ED8", "arrow-blue",
        "[Clic 'Finalizar Compra y Pagar']", 1470, 435
    ))

    # 7. Decision Diamond -> S5_E (Sí / Aprobada)
    svg.append(draw_edge(
        "M 1470 565 L 1470 666", "#16A34A", "arrow-green",
        "[Sí / Autorización bancaria exitosa]", 1470, 615
    ))

    # 8. Decision Diamond -> S5_X (No / Denegada)
    svg.append(draw_edge(
        "M 1560 520 L 1666 520", "#DC2626", "arrow-red",
        "[No / Rechazo #DECLINED-SEC-054]", 1613, 505
    ))

    # 9. S5_X -> S4: Reintentar con otro método (Recovery Loop)
    svg.append(draw_edge(
        "M 1780 440 L 1780 290 L 1644 290", "#DC2626", "arrow-red",
        "[Reintentar / Preserva datos en S4]", 1712, 275
    ))

    # 10. S5_E -> S7: Ver seguimiento de orden
    svg.append(draw_edge(
        "M 1300 780 L 1214 780", "#1D4ED8", "arrow-blue",
        "[Clic 'Ver Seguimiento del Pedido']", 1257, 765
    ))

    # 11. S1 -> S6: Acceso a Mi Cuenta
    svg.append(draw_edge(
        "M 235 380 L 235 716", "#475569", "arrow-slate",
        "[Clic 'Mi Cuenta' en Navbar / Gestión credenciales]", 235, 550
    ))

    # 12. S6 -> S1: Sesión iniciada / Registro
    svg.append(draw_edge(
        "M 390 820 C 580 820, 580 430, 394 375", "#475569", "arrow-slate",
        "[Login exitoso / Retorno con sesión activa]", 485, 600
    ))

    # 13. S7 -> S1: Volver a la tienda
    svg.append(draw_edge(
        "M 890 840 C 650 840, 650 360, 394 360", "#475569", "arrow-slate",
        "[Clic 'Volver a la tienda' / Estado inicial]", 620, 600
    ))

    # ----------------------------------------------------
    # HCI & WCAG 2.2 NOTATION LEGEND (Bottom Banner)
    # ----------------------------------------------------
    svg.append('<g id="Legend_Box">')
    leg_x = 60
    leg_y = 960
    leg_w = 1800
    leg_h = 190
    svg.append(f'<rect x="{leg_x}" y="{leg_y}" width="{leg_w}" height="{leg_h}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="12" ry="12"/>')
    svg.append(f'<rect x="{leg_x}" y="{leg_y}" width="{leg_w}" height="36" fill="#F1F5F9" rx="12" ry="12"/>')
    svg.append(f'<rect x="{leg_x}" y="{leg_y + 20}" width="{leg_w}" height="16" fill="#F1F5F9"/>')
    svg.append(f'<text x="{leg_x + 24}" y="{leg_y + 24}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="900">LEYENDA DE INGENIERÍA DE INTERACCIÓN HUMANO-COMPUTADOR &amp; ESPECIFICACIÓN WCAG 2.2</text>')

    # Column 1: Símbolos de Estados
    c1_x = leg_x + 24
    svg.append(f'<text x="{c1_x}" y="{leg_y + 64}" fill="#0F172A" font-family="{font_sans}" font-size="12" font-weight="800">Tipología de Estados:</text>')
    svg.append(f'<rect x="{c1_x}" y="{leg_y + 76}" width="16" height="12" fill="#1D4ED8" rx="2"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 86}" fill="#475569" font-family="{font_sans}" font-size="11">Flujo Principal (Happy Path - Azul #1D4ED8)</text>')

    svg.append(f'<rect x="{c1_x}" y="{leg_y + 98}" width="16" height="12" fill="#16A34A" rx="2"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 108}" fill="#475569" font-family="{font_sans}" font-size="11">Estado Terminal de Éxito (Verde #16A34A)</text>')

    svg.append(f'<rect x="{c1_x}" y="{leg_y + 120}" width="16" height="12" fill="#DC2626" rx="2"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 130}" fill="#475569" font-family="{font_sans}" font-size="11">Contingencia y Recuperación (Rojo #DC2626)</text>')

    svg.append(f'<rect x="{c1_x}" y="{leg_y + 142}" width="16" height="12" fill="#7C3AED" rx="2"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 152}" fill="#475569" font-family="{font_sans}" font-size="11">Sub-estado Microinteracción (Púrpura #7C3AED)</text>')

    # Column 2: Sintaxis de Transiciones
    c2_x = leg_x + 380
    svg.append(f'<text x="{c2_x}" y="{leg_y + 64}" fill="#0F172A" font-family="{font_sans}" font-size="12" font-weight="800">Sintaxis de Transición:</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 86}" fill="#0F172A" font-family="{font_mono}" font-size="11" font-weight="700">[ Evento del Usuario / Condición del Sistema ]</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 108}" fill="#475569" font-family="{font_sans}" font-size="11">• Evento: Disparador intencional del usuario (Clic, Teclado, Envío de formulario).</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 128}" fill="#475569" font-family="{font_sans}" font-size="11">• Condición: Regla de negocio (Autenticado, Cesta &gt; 0, Tarjeta válida, etc.).</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 148}" fill="#475569" font-family="{font_sans}" font-size="11">• Respuesta: Mutación reactiva de la interfaz (Badge, Toast, Modal o Transición).</text>')

    # Column 3: Mapeo de Heurísticas de Nielsen
    c3_x = leg_x + 880
    svg.append(f'<text x="{c3_x}" y="{leg_y + 64}" fill="#0F172A" font-family="{font_sans}" font-size="12" font-weight="800">Heurísticas de Usabilidad Modeladas:</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 86}" fill="#475569" font-family="{font_sans}" font-size="11"><tspan font-weight="700" fill="#0F172A">#1 Visibilidad del Estado:</tspan> Badges numéricos reactivos, toasts y stepper de 4 fases.</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 106}" fill="#475569" font-family="{font_sans}" font-size="11"><tspan font-weight="700" fill="#0F172A">#3 Control y Libertad:</tspan> Botón [Deshacer] en S3_F ante eliminaciones accidentales.</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 126}" fill="#475569" font-family="{font_sans}" font-size="11"><tspan font-weight="700" fill="#0F172A">#5 Prevención de Errores:</tspan> Deshabilitación de efectivo si el método es Courier.</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 146}" fill="#475569" font-family="{font_sans}" font-size="11"><tspan font-weight="700" fill="#0F172A">#9 Diagnóstico y Recuperación:</tspan> Error no destructivo en S5_X que preserva datos.</text>')

    # Column 4: WCAG 2.2 Requisitos
    c4_x = leg_x + 1400
    svg.append(f'<text x="{c4_x}" y="{leg_y + 64}" fill="#0F172A" font-family="{font_sans}" font-size="12" font-weight="800">Cumplimiento WCAG 2.2:</text>')
    svg.append(f'<text x="{c4_x}" y="{leg_y + 86}" fill="#475569" font-family="{font_sans}" font-size="11">• Criterio 2.4.7 / 2.4.13: Foco de teclado :focus-visible 3px.</text>')
    svg.append(f'<text x="{c4_x}" y="{leg_y + 106}" fill="#475569" font-family="{font_sans}" font-size="11">• Criterio 3.3.2: Etiquetas visibles fuera del campo.</text>')
    svg.append(f'<text x="{c4_x}" y="{leg_y + 126}" fill="#475569" font-family="{font_sans}" font-size="11">• Criterio 4.1.3: Anuncios aria-live="polite".</text>')
    svg.append(f'<text x="{c4_x}" y="{leg_y + 146}" fill="#475569" font-family="{font_sans}" font-size="11">• Contraste &gt; 14:1 en texto carbón #0F172A.</text>')
    svg.append('</g>')

    svg.append('</svg>')
    return "\n".join(svg)

# Write to file
svg_content = build_flowchart_svg()
ET.fromstring(svg_content) # XML validation

target_dirs = [
    r"c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce",
    r"c:\Users\patri\Desktop\PUCE TAREAS\IHC"
]

for d in target_dirs:
    out_path = os.path.join(d, "flujo_navegacion_estados.svg")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Validated and saved: {out_path}")

print("State diagram SVG generated successfully.")
