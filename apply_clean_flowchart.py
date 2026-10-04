# -*- coding: utf-8 -*-
"""
Redesign flujo_navegacion_estados.svg with:
1. Generous spacing between all nodes (minimum 120px gap).
2. Concise, short transition labels (only 2-3 words, NO '/' character anywhere).
3. Perfectly centered label pills on arrows with zero overlap on node cards.
4. Clean orthogonal routing without crossing lines.
5. Standard IHC & software engineering notation, clear legend, high-resolution 2000x1100.
"""
import os
import xml.etree.ElementTree as ET

def escape_xml(text):
    return (text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
                .replace("'", "&apos;"))

def build_spaced_flowchart():
    width = 2000
    height = 1100
    
    font_sans = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    font_mono = "Menlo, Monaco, Consolas, Courier New, monospace"

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">')
    
    # Arrow markers
    svg.append('''<defs>
      <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#1D4ED8" />
      </marker>
      <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
      </marker>
      <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#16A34A" />
      </marker>
      <marker id="arrow-purple" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#7C3AED" />
      </marker>
      <marker id="arrow-slate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
      </marker>
    </defs>''')

    # Background
    svg.append(f'<rect width="{width}" height="{height}" fill="#F8FAFC"/>')
    # Subtle dot grid
    for gx in range(40, width, 50):
        for gy in range(40, height, 50):
            svg.append(f'<circle cx="{gx}" cy="{gy}" r="1" fill="#E2E8F0"/>')

    # Top Header
    svg.append('<g id="Header_Banner">')
    svg.append('<rect x="60" y="30" width="1880" height="70" fill="#0F172A" rx="10" ry="10"/>')
    svg.append(f'<text x="90" y="65" fill="#FFFFFF" font-family="{font_sans}" font-size="20" font-weight="900" letter-spacing="-0.5">GRADED &amp; SEALED TCG — FLUJO DE NAVEGACIÓN Y MÁQUINA DE ESTADOS</text>')
    svg.append(f'<text x="90" y="85" fill="#94A3B8" font-family="{font_sans}" font-size="12">Arquitectura de Información • Modelo Mental del Usuario • IHC y Accesibilidad WCAG 2.2</text>')
    svg.append('<rect x="1760" y="47" width="150" height="34" fill="#1D4ED8" rx="6" ry="6"/>')
    svg.append(f'<text x="1835" y="69" fill="#FFFFFF" font-family="{font_mono}" font-size="11.5" font-weight="800" text-anchor="middle">SISTEMA 9 ESTADOS</text>')
    svg.append('</g>')

    # Card Drawer Helper
    def draw_card(x, y, w, h, code, title, header_col, bg_col, bullets, border_col="#CBD5E1"):
        res = []
        res.append(f'<g id="Card_{code}">')
        res.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg_col}" stroke="{border_col}" stroke-width="2" rx="10" ry="10"/>')
        # Card header bar
        res.append(f'<rect x="{x}" y="{y}" width="{w}" height="38" fill="{header_col}" rx="10" ry="10"/>')
        res.append(f'<rect x="{x}" y="{y+20}" width="{w}" height="18" fill="{header_col}"/>')
        res.append(f'<text x="{x + 14}" y="{y + 24}" fill="#FFFFFF" font-family="{font_sans}" font-size="12.5" font-weight="900">{escape_xml(code)}</text>')
        res.append(f'<text x="{x + 60}" y="{y + 24}" fill="#FFFFFF" font-family="{font_sans}" font-size="12.5" font-weight="700">| {escape_xml(title)}</text>')
        # Bullets
        by = y + 58
        for b in bullets:
            res.append(f'<text x="{x + 14}" y="{by}" fill="#1E293B" font-family="{font_sans}" font-size="11" font-weight="500">• {escape_xml(b)}</text>')
            by += 18
        res.append('</g>')
        return "\n".join(res)

    # Label Pill Drawer Helper
    def draw_pill(cx, cy, text, color, bg_col="#FFFFFF"):
        w = len(text) * 7.0 + 20
        h = 24
        x = cx - w/2
        y = cy - h/2
        res = []
        res.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg_col}" stroke="{color}" stroke-width="1.5" rx="5" ry="5"/>')
        res.append(f'<text x="{cx}" y="{cy + 4}" fill="{color}" font-family="{font_sans}" font-size="11" font-weight="800" text-anchor="middle">{escape_xml(text)}</text>')
        return "\n".join(res)

    # ----------------------------------------------------
    # NODES GEOMETRY (Generous horizontal spacing of 140px)
    # Row 1 (y = 150): S1, S2, S3, S4
    # ----------------------------------------------------
    card_w = 260
    card_h = 175
    gap_x = 140

    s1_x = 70
    s2_x = s1_x + card_w + gap_x   # 70 + 260 + 140 = 470
    s3_x = s2_x + card_w + gap_x   # 470 + 260 + 140 = 870
    s4_x = s3_x + card_w + gap_x   # 870 + 260 + 140 = 1270
    y_row1 = 150

    # S1: Home Catálogo
    svg.append(draw_card(
        s1_x, y_row1, card_w, card_h, "S1", "Home Catálogo",
        "#1D4ED8", "#FFFFFF",
        [
            "Estado inicial del flujo",
            "Buscador y filtros rápidos",
            "Cartas sueltas y packs",
            "Contador dinámico de bolsa"
        ], "#93C5FD"
    ))

    # S2: Ficha Producto
    svg.append(draw_card(
        s2_x, y_row1, card_w, card_h, "S2", "Ficha Producto",
        "#1D4ED8", "#FFFFFF",
        [
            "Detalle de carta y slab PSA",
            "Selector de condición",
            "Gráfica histórica 12 meses",
            "Precio reactivo al grado"
        ], "#93C5FD"
    ))

    # S3: Bolsa Compras
    svg.append(draw_card(
        s3_x, y_row1, card_w, card_h, "S3", "Bolsa Compras",
        "#1D4ED8", "#FFFFFF",
        [
            "Lista de cartas añadidas",
            "Steppers de cantidad",
            "Subtotal e IVA calculados",
            "Resumen antes de pagar"
        ], "#93C5FD"
    ))

    # S4: Checkout
    svg.append(draw_card(
        s4_x, y_row1, card_w, card_h, "S4", "Checkout",
        "#1D4ED8", "#FFFFFF",
        [
            "Login o compra rápida invitado",
            "Envío a domicilio o retiro",
            "Pago con tarjeta o efectivo",
            "Validación condicional"
        ], "#93C5FD"
    ))

    # S3_Feedback (Microinteracción): Directly under S3
    s3f_y = y_row1 + card_h + 100 # 150 + 175 + 100 = 425
    svg.append(draw_card(
        s3_x, s3f_y, card_w, 150, "S3_F", "Microinteracción",
        "#7C3AED", "#FAF5FF",
        [
            "Toast de ítem eliminado",
            "Caché temporal de 60 seg",
            "Opción de restaurar ítem",
            "Control y libertad del usuario"
        ], "#C084FC"
    ))

    # Decision Diamond: Under S4
    dia_cx = s4_x + card_w/2 # 1270 + 130 = 1400
    dia_cy = y_row1 + card_h + 160 # 150 + 175 + 160 = 485
    dia_rx = 85
    dia_ry = 45
    svg.append(f'<g id="Diamond_Gateway">')
    svg.append(f'<polygon points="{dia_cx},{dia_cy - dia_ry} {dia_cx + dia_rx},{dia_cy} {dia_cx},{dia_cy + dia_ry} {dia_cx - dia_rx},{dia_cy}" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>')
    svg.append(f'<text x="{dia_cx}" y="{dia_cy - 6}" fill="#0F172A" font-family="{font_sans}" font-size="11.5" font-weight="900" text-anchor="middle">¿Pasarela</text>')
    svg.append(f'<text x="{dia_cx}" y="{dia_cy + 10}" fill="#0F172A" font-family="{font_sans}" font-size="11.5" font-weight="900" text-anchor="middle">Aprobada?</text>')
    svg.append('</g>')

    # S5_X Error de Pago: To the right of Diamond
    s5x_x = dia_cx + dia_rx + 130 # 1400 + 85 + 130 = 1615
    s5x_y = dia_cy - card_h/2     # 485 - 87.5 = 397
    svg.append(draw_card(
        s5x_x, s5x_y, card_w, card_h, "S5_X", "Error de Pago",
        "#DC2626", "#FEF2F2",
        [
            "Diagnóstico de fallo bancario",
            "Cobro cero asegurado",
            "Datos del carrito guardados",
            "Rutas de recuperación"
        ], "#FCA5A5"
    ))

    # S5_E Orden Confirmada: Under Diamond
    s5e_y = dia_cy + dia_ry + 110 # 485 + 45 + 110 = 640
    svg.append(draw_card(
        s4_x, s5e_y, card_w, card_h, "S5_E", "Orden Confirmada",
        "#16A34A", "#F0FDF4",
        [
            "Compra finalizada con éxito",
            "Número de orden visible",
            "Comprobante al correo",
            "Registro progresivo opcional"
        ], "#86EFAC"
    ))

    # S7: Mis Pedidos & Tracking: To the left of S5_E (under S3)
    s7_y = s5e_y
    svg.append(draw_card(
        s3_x, s7_y, card_w, card_h, "S7", "Mis Pedidos",
        "#0F172A", "#FFFFFF",
        [
            "Seguimiento en tiempo real",
            "Stepper de 4 fases de entrega",
            "Descarga de factura oficial",
            "Solicitud de asistencia"
        ], "#CBD5E1"
    ))

    # S6: Autenticación / Cuenta: To the left (under S1)
    s6_y = s5e_y
    svg.append(draw_card(
        s1_x, s6_y, card_w, card_h, "S6", "Autenticación",
        "#475569", "#FFFFFF",
        [
            "Acceso de clientes registrados",
            "Creación de nueva cuenta",
            "Formulario con etiquetas",
            "Foco de teclado visible"
        ], "#CBD5E1"
    ))

    # ----------------------------------------------------
    # CONNECTING ARROWS & LABELS (Spaced, centered, NO '/')
    # ----------------------------------------------------
    
    # 1. S1 -> S2 (Horizontal)
    y_mid_row1 = y_row1 + card_h/2 # 150 + 87.5 = 237.5
    svg.append(f'<line x1="{s1_x + card_w}" y1="{y_mid_row1}" x2="{s2_x}" y2="{y_mid_row1}" stroke="#1D4ED8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>')
    svg.append(draw_pill((s1_x + card_w + s2_x)/2, y_mid_row1, "Ver Detalle", "#1D4ED8"))

    # 2. S2 -> S3 (Horizontal)
    svg.append(f'<line x1="{s2_x + card_w}" y1="{y_mid_row1}" x2="{s3_x}" y2="{y_mid_row1}" stroke="#1D4ED8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>')
    svg.append(draw_pill((s2_x + card_w + s3_x)/2, y_mid_row1, "Añadir a Bolsa", "#1D4ED8"))

    # 3. S3 -> S4 (Horizontal)
    svg.append(f'<line x1="{s3_x + card_w}" y1="{y_mid_row1}" x2="{s4_x}" y2="{y_mid_row1}" stroke="#1D4ED8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>')
    svg.append(draw_pill((s3_x + card_w + s4_x)/2, y_mid_row1, "Ir a Checkout", "#1D4ED8"))

    # 4. S3 -> S3_F (Vertical Down)
    x_down_s3 = s3_x + 75
    svg.append(f'<line x1="{x_down_s3}" y1="{y_row1 + card_h}" x2="{x_down_s3}" y2="{s3f_y}" stroke="#7C3AED" stroke-width="2.5" marker-end="url(#arrow-purple)"/>')
    svg.append(draw_pill(x_down_s3, (y_row1 + card_h + s3f_y)/2, "Eliminar Ítem", "#7C3AED", "#FAF5FF"))

    # 5. S3_F -> S3 (Vertical Up Loop)
    x_up_s3 = s3_x + 185
    svg.append(f'<line x1="{x_up_s3}" y1="{s3f_y}" x2="{x_up_s3}" y2="{y_row1 + card_h}" stroke="#7C3AED" stroke-width="2.5" marker-end="url(#arrow-purple)"/>')
    svg.append(draw_pill(x_up_s3, (y_row1 + card_h + s3f_y)/2, "Deshacer", "#7C3AED", "#FAF5FF"))

    # 6. S4 -> Diamond (Vertical Down)
    svg.append(f'<line x1="{dia_cx}" y1="{y_row1 + card_h}" x2="{dia_cx}" y2="{dia_cy - dia_ry}" stroke="#1D4ED8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>')
    svg.append(draw_pill(dia_cx, (y_row1 + card_h + dia_cy - dia_ry)/2, "Pagar Pedido", "#1D4ED8"))

    # 7. Diamond -> S5_E (Vertical Down - Aprobado)
    svg.append(f'<line x1="{dia_cx}" y1="{dia_cy + dia_ry}" x2="{dia_cx}" y2="{s5e_y}" stroke="#16A34A" stroke-width="2.5" marker-end="url(#arrow-green)"/>')
    svg.append(draw_pill(dia_cx, (dia_cy + dia_ry + s5e_y)/2, "Aprobado", "#16A34A", "#F0FDF4"))

    # 8. Diamond -> S5_X (Horizontal Right - Rechazado)
    svg.append(f'<line x1="{dia_cx + dia_rx}" y1="{dia_cy}" x2="{s5x_x}" y2="{dia_cy}" stroke="#DC2626" stroke-width="2.5" marker-end="url(#arrow-red)"/>')
    svg.append(draw_pill((dia_cx + dia_rx + s5x_x)/2, dia_cy, "Rechazado", "#DC2626", "#FEF2F2"))

    # 9. S5_X -> S4 (Recovery Loop Up & Left)
    # Exits top of S5_X, goes up to y=237.5, enters right of S4
    svg.append(f'<path d="M {s5x_x + card_w/2} {s5x_y} L {s5x_x + card_w/2} {y_mid_row1} L {s4_x + card_w} {y_mid_row1}" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow-red)"/>')
    svg.append(draw_pill(s5x_x + card_w/2, (s5x_y + y_mid_row1)/2, "Reintentar Pago", "#DC2626", "#FEF2F2"))

    # 10. S5_E -> S7 (Horizontal Left)
    y_mid_row2 = s5e_y + card_h/2 # 640 + 87.5 = 727.5
    svg.append(f'<line x1="{s4_x}" y1="{y_mid_row2}" x2="{s3_x + card_w}" y2="{y_mid_row2}" stroke="#1D4ED8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>')
    svg.append(draw_pill((s4_x + s3_x + card_w)/2, y_mid_row2, "Ver Tracking", "#1D4ED8"))

    # 11. S7 -> S1 (Loop Back to Home)
    # Exits left of S7, goes up to y=275, enters bottom of S1
    s7_exit_x = s3_x # 870
    s1_entry_y = y_row1 + card_h # 325
    svg.append(f'<path d="M {s3_x} {y_mid_row2} L 600 {y_mid_row2} L 600 280 L {s1_x + card_w} 280" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow-slate)"/>')
    svg.append(draw_pill(600, 500, "Volver al Inicio", "#475569"))

    # 12. S1 -> S6 (Vertical Down: Mi Cuenta)
    x_s1_down = s1_x + 80
    svg.append(f'<line x1="{x_s1_down}" y1="{y_row1 + card_h}" x2="{x_s1_down}" y2="{s6_y}" stroke="#475569" stroke-width="2.5" marker-end="url(#arrow-slate)"/>')
    svg.append(draw_pill(x_s1_down, (y_row1 + card_h + s6_y)/2, "Mi Cuenta", "#475569"))

    # 13. S6 -> S1 (Vertical Up: Login Exitoso)
    x_s6_up = s1_x + 180
    svg.append(f'<line x1="{x_s6_up}" y1="{s6_y}" x2="{x_s6_up}" y2="{y_row1 + card_h}" stroke="#475569" stroke-width="2.5" marker-end="url(#arrow-slate)"/>')
    svg.append(draw_pill(x_s6_up, (y_row1 + card_h + s6_y)/2, "Login Exitoso", "#475569"))

    # ----------------------------------------------------
    # LEGEND (Bottom Banner)
    # ----------------------------------------------------
    leg_x = 60
    leg_y = 880
    leg_w = 1880
    leg_h = 180

    svg.append('<g id="Legend">')
    svg.append(f'<rect x="{leg_x}" y="{leg_y}" width="{leg_w}" height="{leg_h}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="10" ry="10"/>')
    svg.append(f'<rect x="{leg_x}" y="{leg_y}" width="{leg_w}" height="32" fill="#F1F5F9" rx="10" ry="10"/>')
    svg.append(f'<rect x="{leg_x}" y="{leg_y+16}" width="{leg_w}" height="16" fill="#F1F5F9"/>')
    svg.append(f'<text x="{leg_x + 20}" y="{leg_y + 22}" fill="#0F172A" font-family="{font_sans}" font-size="12.5" font-weight="900">LEYENDA DEL MODELO DE NAVEGACIÓN (IHC &amp; ACCESIBILIDAD)</text>')

    # Col 1: Estados
    c1_x = leg_x + 24
    svg.append(f'<text x="{c1_x}" y="{leg_y + 58}" fill="#0F172A" font-family="{font_sans}" font-size="12" font-weight="800">Convención de Color de Estados:</text>')
    
    svg.append(f'<rect x="{c1_x}" y="{leg_y + 70}" width="16" height="12" fill="#1D4ED8" rx="3"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 80}" fill="#475569" font-family="{font_sans}" font-size="11.5">Camino Principal de Compra (Azul #1D4ED8)</text>')

    svg.append(f'<rect x="{c1_x}" y="{leg_y + 92}" width="16" height="12" fill="#16A34A" rx="3"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 102}" fill="#475569" font-family="{font_sans}" font-size="11.5">Estado Terminal de Éxito (Verde #16A34A)</text>')

    svg.append(f'<rect x="{c1_x}" y="{leg_y + 114}" width="16" height="12" fill="#DC2626" rx="3"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 124}" fill="#475569" font-family="{font_sans}" font-size="11.5">Contingencia y Recuperación (Rojo #DC2626)</text>')

    svg.append(f'<rect x="{c1_x}" y="{leg_y + 136}" width="16" height="12" fill="#7C3AED" rx="3"/>')
    svg.append(f'<text x="{c1_x + 26}" y="{leg_y + 146}" fill="#475569" font-family="{font_sans}" font-size="11.5">Microinteracción de Feedback (Púrpura #7C3AED)</text>')

    # Col 2: Heurísticas
    c2_x = leg_x + 480
    svg.append(f'<text x="{c2_x}" y="{leg_y + 58}" fill="#0F172A" font-family="{font_sans}" font-size="12" font-weight="800">Heurísticas de Usabilidad Modeladas:</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 80}" fill="#475569" font-family="{font_sans}" font-size="11.5">• <tspan font-weight="700" fill="#0F172A">Heurística #1 (Visibilidad):</tspan> Badge dinámico en bolsa y stepper de 4 etapas en S7.</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 102}" fill="#475569" font-family="{font_sans}" font-size="11.5">• <tspan font-weight="700" fill="#0F172A">Heurística #3 (Control):</tspan> Reversibilidad inmediata con botón Deshacer en S3_F.</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 124}" fill="#475569" font-family="{font_sans}" font-size="11.5">• <tspan font-weight="700" fill="#0F172A">Heurística #5 (Prevención):</tspan> Pago en efectivo bloqueado en envíos courier.</text>')
    svg.append(f'<text x="{c2_x}" y="{leg_y + 146}" fill="#475569" font-family="{font_sans}" font-size="11.5">• <tspan font-weight="700" fill="#0F172A">Heurística #9 (Recuperación):</tspan> Diagnóstico claro en S5_X conservando datos.</text>')

    # Col 3: Accesibilidad WCAG 2.2
    c3_x = leg_x + 1220
    svg.append(f'<text x="{c3_x}" y="{leg_y + 58}" fill="#0F172A" font-family="{font_sans}" font-size="12" font-weight="800">Garantías de Accesibilidad WCAG 2.2:</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 80}" fill="#475569" font-family="{font_sans}" font-size="11.5">• Contraste estricto superior a 14:1 en texto carbón #0F172A sobre blanco.</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 102}" fill="#475569" font-family="{font_sans}" font-size="11.5">• Indicador de foco de teclado accesible :focus-visible de 3px.</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 124}" fill="#475569" font-family="{font_sans}" font-size="11.5">• Anuncios dinámicos accesibles para lectores de pantalla con aria-live.</text>')
    svg.append(f'<text x="{c3_x}" y="{leg_y + 146}" fill="#475569" font-family="{font_sans}" font-size="11.5">• Etiquetas visibles persistentes en todos los campos de formulario.</text>')
    svg.append('</g>')

    svg.append('</svg>')
    return "\n".join(svg)

# Build and validate XML
svg_out = build_spaced_flowchart()
ET.fromstring(svg_out)

target_dirs = [
    r"c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce",
    r"c:\Users\patri\Desktop\PUCE TAREAS\IHC"
]

for d in target_dirs:
    filepath = os.path.join(d, "flujo_navegacion_estados.svg")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(svg_out)
    print(f"Validated and overwritten: {filepath}")

print("Clean spaced SVG flowchart updated successfully!")
