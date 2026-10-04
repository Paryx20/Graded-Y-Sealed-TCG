# -*- coding: utf-8 -*-
"""
Generate the 4 complementary wireframe frames (06, 07, 08, 09) for "Graded & Sealed TCG".
Desktop standard 1440x900 px each.
Strict native SVG vectors (<rect>, <text>, <g>, <line>, <circle>, <path>, <polyline>).
No HTML, no <foreignObject>, strictly valid XML.
Saved directly into c:/Users/patri/Desktop/PUCE TAREAS/IHC/Pagina_e-commerce/
"""
import os
import re
import xml.etree.ElementTree as ET

font_sans = "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
font_mono = "Menlo, Monaco, Consolas, Courier New, monospace"

def clean_id(raw_str):
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', raw_str)
    clean = re.sub(r'_+', '_', clean).strip('_')
    return clean[:24]

def escape_xml(text):
    return (text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
                .replace("'", "&apos;"))

def draw_pokeball_icon(cx, cy, r=17):
    return f'''<g id="{clean_id(f'Pokeball_{int(cx)}_{int(cy)}')}" pointer-events="none">
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5"/>
  <path d="M {cx - r} {cy} A {r} {r} 0 0 1 {cx + r} {cy} Z" fill="#EF4444"/>
  <path d="M {cx - r} {cy} A {r} {r} 0 0 0 {cx + r} {cy} Z" fill="#FFFFFF"/>
  <line x1="{cx - r}" y1="{cy}" x2="{cx + r}" y2="{cy}" stroke="#0F172A" stroke-width="2.5"/>
  <circle cx="{cx}" cy="{cy}" r="{r * 0.42}" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5"/>
  <circle cx="{cx}" cy="{cy}" r="{r * 0.2}" fill="#0F172A"/>
</g>'''

def draw_image_container(x, y, w, h, label, alt_text):
    safe_alt = escape_xml(alt_text)
    safe_id = clean_id(f"Media_{label}")
    res = []
    res.append(f'<g id="{safe_id}">')
    res.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    res.append(f'<line x1="{x}" y1="{y}" x2="{x+w}" y2="{y+h}" stroke="#E2E8F0" stroke-width="1.2"/>')
    res.append(f'<line x1="{x+w}" y1="{y}" x2="{x}" y2="{y+h}" stroke="#E2E8F0" stroke-width="1.2"/>')
    cx, cy = x + w/2, y + h/2 - 12
    res.append(f'<circle cx="{cx}" cy="{cy}" r="22" fill="#E2E8F0" opacity="0.8"/>')
    res.append(f'<path d="M {cx - 22} {cy} A 22 22 0 0 1 {cx + 22} {cy} Z" fill="#CBD5E1" opacity="0.6"/>')
    res.append(f'<line x1="{cx - 22}" y1="{cy}" x2="{cx + 22}" y2="{cy}" stroke="#94A3B8" stroke-width="1.5"/>')
    res.append(f'<circle cx="{cx}" cy="{cy}" r="7" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5"/>')
    bw = min(w - 20, len(alt_text) * 6.8 + 24)
    bx = x + (w - bw)/2
    by = y + h - 28
    res.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="20" fill="#0F172A" rx="4" ry="4"/>')
    res.append(f'<text x="{bx + bw/2}" y="{by + 14}" fill="#F8FAFC" font-family="{font_mono}" font-size="10" font-weight="500" text-anchor="middle">alt: &quot;{safe_alt}&quot;</text>')
    res.append('</g>')
    return "\n".join(res)

# =====================================================================
# FRAME 06: 06_Autenticacion_Login_Registro
# =====================================================================
def generate_frame_06():
    f = []
    f.append('<rect width="1440" height="900" fill="#F8FAFC"/>')
    
    # Standard Header
    f.append('<g id="Header_Navbar">')
    f.append('<rect x="0" y="0" width="1440" height="74" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>')
    f.append('<rect x="0" y="0" width="1440" height="3" fill="#DC2626"/>')
    f.append(draw_pokeball_icon(48, 38, 17))
    f.append(f'<text x="76" y="44" fill="#0F172A" font-family="{font_sans}" font-size="19" font-weight="900" letter-spacing="-0.5">GRADED &amp; SEALED</text>')
    f.append(f'<text x="264" y="44" fill="#DC2626" font-family="{font_sans}" font-size="19" font-weight="900" letter-spacing="-0.5">TCG</text>')
    f.append(f'<text x="420" y="44" fill="#64748B" font-family="{font_sans}" font-size="13">Portal de Acceso y Gestión de Cuenta Segura</text>')
    f.append('<rect x="1294" y="18" width="114" height="38" fill="#DC2626" rx="8" ry="8"/>')
    f.append(f'<text x="1351" y="42" fill="#FFFFFF" font-family="{font_sans}" font-size="14" font-weight="700" text-anchor="middle">Bolsa (0)</text>')
    f.append('</g>')

    # Breadcrumbs & Title
    f.append(f'<text x="48" y="112" fill="#64748B" font-family="{font_sans}" font-size="13">Inicio &gt; Mi Cuenta &gt; Identificación de Usuario</text>')
    f.append(f'<text x="48" y="142" fill="#0F172A" font-family="{font_sans}" font-size="26" font-weight="900">Acceso a Graded &amp; Sealed TCG</text>')

    # Centered Two-Column Container (w=1344, x=48, y=165, h=695)
    box_x = 48
    box_y = 165
    box_w = 1344
    box_h = 695
    col_w = (box_w - 48) / 2 # 648px each

    # Col A: Iniciar Sesion
    ca_x = box_x
    f.append('<g id="Columna_A_Iniciar_Sesion">')
    f.append(f'<rect x="{ca_x}" y="{box_y}" width="{col_w}" height="{box_h}" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" rx="14" ry="14"/>')
    f.append(f'<rect x="{ca_x + 36}" y="{box_y + 36}" width="140" height="28" fill="#FEF2F2" stroke="#FECACA" stroke-width="1.5" rx="6" ry="6"/>')
    f.append(f'<text x="{ca_x + 106}" y="{box_y + 55}" fill="#DC2626" font-family="{font_sans}" font-size="12" font-weight="800" text-anchor="middle">USUARIO REGISTRADO</text>')
    f.append(f'<text x="{ca_x + 36}" y="{box_y + 98}" fill="#0F172A" font-family="{font_sans}" font-size="22" font-weight="900">Iniciar Sesión</text>')
    f.append(f'<text x="{ca_x + 36}" y="{box_y + 124}" fill="#64748B" font-family="{font_sans}" font-size="13.5">Accede a tus pedidos, direcciones y bóveda de cartas guardadas</text>')
    f.append(f'<line x1="{ca_x + 36}" y1="{box_y + 145}" x2="{ca_x + col_w - 36}" y2="{box_y + 145}" stroke="#E2E8F0" stroke-width="1.5"/>')

    # Input Correo
    f.append(f'<text x="{ca_x + 36}" y="{box_y + 184}" fill="#0F172A" font-family="{font_sans}" font-size="13.5" font-weight="700">Correo Electrónico (visible label):</text>')
    f.append(f'<rect x="{ca_x + 36}" y="{box_y + 196}" width="{col_w - 72}" height="46" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{ca_x + 52}" y="{box_y + 225}" fill="#0F172A" font-family="{font_sans}" font-size="14">patrick.mora@puce.edu.ec</text>')

    # Input Contraseña (WITH FOCUS RING HIGHLIGHT)
    f.append(f'<text x="{ca_x + 36}" y="{box_y + 276}" fill="#0F172A" font-family="{font_sans}" font-size="13.5" font-weight="700">Contraseña (visible label):</text>')
    f.append(f'<rect x="{ca_x + 36}" y="{box_y + 288}" width="{col_w - 72}" height="46" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{ca_x + 52}" y="{box_y + 317}" fill="#0F172A" font-family="{font_sans}" font-size="14">••••••••••••••••</text>')
    # 3px Focus Ring
    f.append(f'<rect x="{ca_x + 32}" y="{box_y + 284}" width="{col_w - 64}" height="54" fill="none" stroke="#0F172A" stroke-width="3" rx="12" ry="12"/>')
    f.append(f'<rect x="{ca_x + 36}" y="{box_y + 258}" width="165" height="20" fill="#0F172A" rx="4" ry="4"/>')
    f.append(f'<text x="{ca_x + 118}" y="{box_y + 272}" fill="#FFFFFF" font-family="{font_mono}" font-size="10" font-weight="700" text-anchor="middle">:focus-visible (3px)</text>')

    # Forgot password link
    f.append(f'<text x="{ca_x + col_w - 36}" y="{box_y + 362}" fill="#DC2626" font-family="{font_sans}" font-size="13" font-weight="700" text-anchor="end">¿Olvidaste tu contraseña?</text>')

    # Remember me checkbox
    f.append(f'<rect x="{ca_x + 36}" y="{box_y + 348}" width="18" height="18" fill="#DC2626" rx="4" ry="4"/>')
    f.append(f'<text x="{ca_x + 45}" y="{box_y + 361}" fill="#FFFFFF" font-family="{font_sans}" font-size="12" font-weight="900" text-anchor="middle">✓</text>')
    f.append(f'<text x="{ca_x + 64}" y="{box_y + 362}" fill="#0F172A" font-family="{font_sans}" font-size="13">Mantener mi sesión activa</text>')

    # Acceder button
    f.append(f'<rect x="{ca_x + 36}" y="{box_y + 400}" width="{col_w - 72}" height="54" fill="#DC2626" rx="10" ry="10"/>')
    f.append(f'<text x="{ca_x + col_w/2}" y="{box_y + 434}" fill="#FFFFFF" font-family="{font_sans}" font-size="16" font-weight="800" text-anchor="middle">Acceder a mi Cuenta ➔</text>')

    # Security Badge
    f.append(f'<rect x="{ca_x + 36}" y="{box_y + 510}" width="{col_w - 72}" height="120" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" rx="10" ry="10"/>')
    f.append(f'<text x="{ca_x + 56}" y="{box_y + 546}" fill="#0F172A" font-family="{font_sans}" font-size="14" font-weight="800">🔒 Autenticación Segura y Cifrada</text>')
    f.append(f'<text x="{ca_x + 56}" y="{box_y + 572}" fill="#64748B" font-family="{font_sans}" font-size="12.5">Tus credenciales están protegidas con hashing Argon2 y protocolos de seguridad PCI-DSS para e-commerce de coleccionismo.</text>')
    f.append('</g>')

    # Col B: Crear Cuenta
    cb_x = box_x + col_w + 48
    f.append('<g id="Columna_B_Crear_Cuenta">')
    f.append(f'<rect x="{cb_x}" y="{box_y}" width="{col_w}" height="{box_h}" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" rx="14" ry="14"/>')
    f.append(f'<rect x="{cb_x + 36}" y="{box_y + 36}" width="120" height="28" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.5" rx="6" ry="6"/>')
    f.append(f'<text x="{cb_x + 96}" y="{box_y + 55}" fill="#1D4ED8" font-family="{font_sans}" font-size="12" font-weight="800" text-anchor="middle">NUEVO CLIENTE</text>')
    f.append(f'<text x="{cb_x + 36}" y="{box_y + 98}" fill="#0F172A" font-family="{font_sans}" font-size="22" font-weight="900">Crear Cuenta</text>')
    f.append(f'<text x="{cb_x + 36}" y="{box_y + 124}" fill="#64748B" font-family="{font_sans}" font-size="13.5">Regístrate para comprar en 1 clic y acumular puntos Pokémon Vault</text>')
    f.append(f'<line x1="{cb_x + 36}" y1="{box_y + 145}" x2="{cb_x + col_w - 36}" y2="{box_y + 145}" stroke="#E2E8F0" stroke-width="1.5"/>')

    # Row 1: Nombre & Cedula/RUC
    hw = (col_w - 72 - 20) / 2
    f.append(f'<text x="{cb_x + 36}" y="{box_y + 180}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Nombre Completo:</text>')
    f.append(f'<rect x="{cb_x + 36}" y="{box_y + 192}" width="{hw}" height="42" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{cb_x + 48}" y="{box_y + 218}" fill="#0F172A" font-family="{font_sans}" font-size="13.5">Patrick Mora</text>')

    f.append(f'<text x="{cb_x + 36 + hw + 20}" y="{box_y + 180}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Cédula o RUC:</text>')
    f.append(f'<rect x="{cb_x + 36 + hw + 20}" y="{box_y + 192}" width="{hw}" height="42" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{cb_x + 48 + hw + 20}" y="{box_y + 218}" fill="#0F172A" font-family="{font_sans}" font-size="13.5">1724589201</text>')

    # Row 2: Correo Electronico
    f.append(f'<text x="{cb_x + 36}" y="{box_y + 260}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Correo Electrónico:</text>')
    f.append(f'<rect x="{cb_x + 36}" y="{box_y + 272}" width="{col_w - 72}" height="42" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{cb_x + 48}" y="{box_y + 298}" fill="#0F172A" font-family="{font_sans}" font-size="13.5">coleccionista@gmail.com</text>')

    # Row 3: Contraseña & Confirmacion
    f.append(f'<text x="{cb_x + 36}" y="{box_y + 340}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Contraseña (mín 8 car.):</text>')
    f.append(f'<rect x="{cb_x + 36}" y="{box_y + 352}" width="{hw}" height="42" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{cb_x + 48}" y="{box_y + 378}" fill="#94A3B8" font-family="{font_sans}" font-size="13.5">••••••••••••</text>')

    f.append(f'<text x="{cb_x + 36 + hw + 20}" y="{box_y + 340}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Confirmar Contraseña:</text>')
    f.append(f'<rect x="{cb_x + 36 + hw + 20}" y="{box_y + 352}" width="{hw}" height="42" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{cb_x + 48 + hw + 20}" y="{box_y + 378}" fill="#94A3B8" font-family="{font_sans}" font-size="13.5">••••••••••••</text>')

    # Terms Checkbox (Accessible)
    f.append(f'<rect x="{cb_x + 36}" y="{box_y + 420}" width="20" height="20" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" rx="4" ry="4"/>')
    f.append(f'<text x="{cb_x + 66}" y="{box_y + 435}" fill="#0F172A" font-family="{font_sans}" font-size="13">He leído y acepto los <tspan fill="#DC2626" font-weight="700">Términos de Servicio</tspan> y <tspan fill="#DC2626" font-weight="700">Política de Privacidad</tspan></text>')

    # Newsletter Checkbox
    f.append(f'<rect x="{cb_x + 36}" y="{box_y + 456}" width="20" height="20" fill="#DC2626" rx="4" ry="4"/>')
    f.append(f'<text x="{cb_x + 46}" y="{box_y + 471}" fill="#FFFFFF" font-family="{font_sans}" font-size="13" font-weight="900" text-anchor="middle">✓</text>')
    f.append(f'<text x="{cb_x + 66}" y="{box_y + 471}" fill="#0F172A" font-family="{font_sans}" font-size="13">Deseo recibir alertas de drops de cartas raras y cajas selladas</text>')

    # Registrarse Button
    f.append(f'<rect x="{cb_x + 36}" y="{box_y + 510}" width="{col_w - 72}" height="54" fill="#0F172A" rx="10" ry="10"/>')
    f.append(f'<text x="{cb_x + col_w/2}" y="{box_y + 544}" fill="#FFFFFF" font-family="{font_sans}" font-size="16" font-weight="800" text-anchor="middle">Crear mi Cuenta de Coleccionista</text>')
    f.append('</g>')

    return "\n".join(f)

# =====================================================================
# FRAME 07: 07_Mis_Pedidos_Tracking
# =====================================================================
def generate_frame_07():
    f = []
    f.append('<rect width="1440" height="900" fill="#F8FAFC"/>')
    
    # Header with User Avatar
    f.append('<g id="Header_Navbar_User">')
    f.append('<rect x="0" y="0" width="1440" height="74" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>')
    f.append('<rect x="0" y="0" width="1440" height="3" fill="#DC2626"/>')
    f.append(draw_pokeball_icon(48, 38, 17))
    f.append(f'<text x="76" y="44" fill="#0F172A" font-family="{font_sans}" font-size="19" font-weight="900">GRADED &amp; SEALED</text>')
    f.append(f'<text x="264" y="44" fill="#DC2626" font-family="{font_sans}" font-size="19" font-weight="900">TCG</text>')
    
    # Search bar
    f.append('<rect x="420" y="16" width="560" height="42" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="440" y="42" fill="#64748B" font-family="{font_sans}" font-size="13">Buscar en mis pedidos o certificados...</text>')

    # Authenticated Avatar Pill
    f.append('<rect x="1150" y="18" width="160" height="38" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="20" ry="20"/>')
    f.append('<circle cx="1170" cy="37" r="13" fill="#DC2626"/>')
    f.append(f'<text x="1170" y="42" fill="#FFFFFF" font-family="{font_sans}" font-size="12" font-weight="800" text-anchor="middle">PM</text>')
    f.append(f'<text x="1192" y="42" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Patrick M. ▾</text>')

    # Cart
    f.append('<rect x="1324" y="18" width="84" height="38" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="1366" y="42" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700" text-anchor="middle">Bolsa (0)</text>')
    f.append('</g>')

    # Title & Subtitle
    f.append(f'<text x="48" y="114" fill="#64748B" font-family="{font_sans}" font-size="13">Inicio &gt; Mi Cuenta &gt; Mis Pedidos</text>')
    f.append(f'<text x="48" y="146" fill="#0F172A" font-family="{font_sans}" font-size="26" font-weight="900">Historial de Pedidos y Seguimiento</text>')

    # Active Order Card (w=1344, x=48, y=168, h=692)
    card_x = 48
    card_y = 168
    card_w = 1344
    card_h = 692
    f.append('<g id="Tarjeta_Pedido_Activo">')
    f.append(f'<rect x="{card_x}" y="{card_y}" width="{card_w}" height="{card_h}" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" rx="14" ry="14"/>')

    # Card Top Header Bar
    f.append(f'<rect x="{card_x}" y="{card_y}" width="{card_w}" height="64" fill="#F8FAFC" rx="14" ry="14"/>')
    f.append(f'<rect x="{card_x}" y="{card_y + 40}" width="{card_w}" height="24" fill="#F8FAFC"/>')
    f.append(f'<line x1="{card_x}" y1="{card_y + 64}" x2="{card_x + card_w}" y2="{card_y + 64}" stroke="#E2E8F0" stroke-width="1.5"/>')
    
    f.append(f'<text x="{card_x + 32}" y="{card_y + 38}" fill="#0F172A" font-family="{font_sans}" font-size="16" font-weight="900">Pedido Activo: #PKM-2026-88941</text>')
    f.append(f'<rect x="{card_x + 300}" y="{card_y + 20}" width="140" height="26" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5" rx="6" ry="6"/>')
    f.append(f'<text x="{card_x + 370}" y="{card_y + 37}" fill="#B45309" font-family="{font_sans}" font-size="11.5" font-weight="800" text-anchor="middle">EN PREPARACIÓN</text>')
    f.append(f'<text x="{card_x + 460}" y="{card_y + 38}" fill="#64748B" font-family="{font_sans}" font-size="13">Fecha: 03 Octubre 2026 | Total: $22,013.60 USD</text>')

    # Top Action Buttons in header
    btn_inv_x = card_x + card_w - 440
    f.append(f'<rect x="{btn_inv_x}" y="{card_y + 14}" width="220" height="36" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="6" ry="6"/>')
    f.append(f'<text x="{btn_inv_x + 110}" y="{card_y + 37}" fill="#0F172A" font-family="{font_sans}" font-size="12.5" font-weight="700" text-anchor="middle">📄 Descargar Factura Electrónica</text>')

    btn_sup_x = card_x + card_w - 200
    f.append(f'<rect x="{btn_sup_x}" y="{card_y + 14}" width="168" height="36" fill="#FFFFFF" stroke="#EF4444" stroke-width="1.5" rx="6" ry="6"/>')
    f.append(f'<text x="{btn_sup_x + 84}" y="{card_y + 37}" fill="#DC2626" font-family="{font_sans}" font-size="12.5" font-weight="700" text-anchor="middle">Solicitar Devolución</text>')

    # 4-Step Accessible Stepper
    stepper_y = card_y + 100
    f.append('<g id="Stepper_Estado_Pedido">')
    f.append(f'<text x="{card_x + 32}" y="{stepper_y}" fill="#0F172A" font-family="{font_sans}" font-size="15" font-weight="800">Estado del Envío y Custodia:</text>')
    
    # Connecting lines
    step_y_pos = stepper_y + 40
    f.append(f'<line x1="{card_x + 120}" y1="{step_y_pos}" x2="{card_x + 400}" y2="{step_y_pos}" stroke="#16A34A" stroke-width="4"/>')
    f.append(f'<line x1="{card_x + 400}" y1="{step_y_pos}" x2="{card_x + 720}" y2="{step_y_pos}" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="6,4"/>')
    f.append(f'<line x1="{card_x + 720}" y1="{step_y_pos}" x2="{card_x + 1040}" y2="{step_y_pos}" stroke="#CBD5E1" stroke-width="4" stroke-dasharray="6,4"/>')

    # Step 1: Orden Recibida (Completed)
    f.append(f'<circle cx="{card_x + 120}" cy="{step_y_pos}" r="16" fill="#16A34A"/>')
    f.append(f'<text x="{card_x + 120}" y="{step_y_pos + 6}" fill="#FFFFFF" font-family="{font_sans}" font-size="14" font-weight="900" text-anchor="middle">✓</text>')
    f.append(f'<text x="{card_x + 120}" y="{step_y_pos + 32}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="800" text-anchor="middle">1. Orden Recibida</text>')
    f.append(f'<text x="{card_x + 120}" y="{step_y_pos + 48}" fill="#64748B" font-family="{font_sans}" font-size="11" text-anchor="middle">03 Oct, 10:45 AM</text>')

    # Step 2: En Preparación (Active Focus)
    f.append(f'<circle cx="{card_x + 400}" cy="{step_y_pos}" r="16" fill="#DC2626"/>')
    f.append(f'<circle cx="{card_x + 400}" cy="{step_y_pos}" r="7" fill="#FFFFFF"/>')
    # Focus Ring around active step
    f.append(f'<circle cx="{card_x + 400}" cy="{step_y_pos}" r="22" fill="none" stroke="#0F172A" stroke-width="3"/>')
    f.append(f'<rect x="{card_x + 325}" y="{step_y_pos - 45}" width="150" height="19" fill="#0F172A" rx="3" ry="3"/>')
    f.append(f'<text x="{card_x + 400}" y="{step_y_pos - 32}" fill="#FFFFFF" font-family="{font_mono}" font-size="9.5" font-weight="700" text-anchor="middle">:focus-visible (3px)</text>')
    f.append(f'<text x="{card_x + 400}" y="{step_y_pos + 32}" fill="#DC2626" font-family="{font_sans}" font-size="13" font-weight="800" text-anchor="middle">2. En Preparación</text>')
    f.append(f'<text x="{card_x + 400}" y="{step_y_pos + 48}" fill="#64748B" font-family="{font_sans}" font-size="11" text-anchor="middle">Verificación PSA en Bóveda</text>')

    # Step 3: En Camino / Listo para Retiro (Pending)
    f.append(f'<circle cx="{card_x + 720}" cy="{step_y_pos}" r="16" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3"/>')
    f.append(f'<text x="{card_x + 720}" y="{step_y_pos + 5}" fill="#94A3B8" font-family="{font_sans}" font-size="12" font-weight="800" text-anchor="middle">3</text>')
    f.append(f'<text x="{card_x + 720}" y="{step_y_pos + 32}" fill="#64748B" font-family="{font_sans}" font-size="13" font-weight="600" text-anchor="middle">3. Listo para Retiro / Courier</text>')
    f.append(f'<text x="{card_x + 720}" y="{step_y_pos + 48}" fill="#94A3B8" font-family="{font_sans}" font-size="11" text-anchor="middle">Estimado: 04 Octubre</text>')

    # Step 4: Entregado (Pending)
    f.append(f'<circle cx="{card_x + 1040}" cy="{step_y_pos}" r="16" fill="#FFFFFF" stroke="#94A3B8" stroke-width="3"/>')
    f.append(f'<text x="{card_x + 1040}" y="{step_y_pos + 5}" fill="#94A3B8" font-family="{font_sans}" font-size="12" font-weight="800" text-anchor="middle">4</text>')
    f.append(f'<text x="{card_x + 1040}" y="{step_y_pos + 32}" fill="#64748B" font-family="{font_sans}" font-size="13" font-weight="600" text-anchor="middle">4. Entregado con Éxito</text>')
    f.append(f'<text x="{card_x + 1040}" y="{step_y_pos + 48}" fill="#94A3B8" font-family="{font_sans}" font-size="11" text-anchor="middle">Firma Requerida</text>')
    f.append('</g>')

    # Divider
    items_start_y = stepper_y + 90
    f.append(f'<line x1="{card_x + 32}" y1="{items_start_y}" x2="{card_x + card_w - 32}" y2="{items_start_y}" stroke="#E2E8F0" stroke-width="1.5"/>')
    
    # Items Section
    f.append(f'<text x="{card_x + 32}" y="{items_start_y + 30}" fill="#0F172A" font-family="{font_sans}" font-size="16" font-weight="800">Artículos en esta Entrega (3 cartas / sobres):</text>')

    order_items = [
        ("Charizard Base Set 1999 #4/102", "PSA 10 GEM MT • Certificado Oficial #48291034", "1 unidad", "$18,500.00 USD", "Charizard Base Set PSA 10"),
        ("Umbreon VMAX Moonbreon Alt Art", "Sin Gradear / Raw (Near Mint) • Manga UltraPro", "1 unidad", "$780.00 USD", "Umbreon VMAX Moonbreon Raw"),
        ("Booster Pack Team Rocket 1999", "Sellado de Fábrica (21.2g Heavy Pack)", "1 unidad", "$350.00 USD", "Sobre sellado Team Rocket 1999")
    ]
    cur_iy = items_start_y + 48
    for idx, (iname, icond, iqty, iprice, ialt) in enumerate(order_items):
        f.append(f'<g id="OrderItem_{idx+1}">')
        f.append(f'<rect x="{card_x + 32}" y="{cur_iy}" width="{card_w - 64}" height="90" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" rx="8" ry="8"/>')
        f.append(draw_image_container(card_x + 48, cur_iy + 10, 80, 70, f"OrderThumb_{idx+1}", ialt))
        f.append(f'<text x="{card_x + 144}" y="{cur_iy + 36}" fill="#0F172A" font-family="{font_sans}" font-size="15" font-weight="800">{escape_xml(iname)}</text>')
        f.append(f'<text x="{card_x + 144}" y="{cur_iy + 60}" fill="#64748B" font-family="{font_sans}" font-size="12.5">{escape_xml(icond)}</text>')
        f.append(f'<text x="{card_x + 850}" y="{cur_iy + 48}" fill="#0F172A" font-family="{font_sans}" font-size="14" font-weight="700">Cant: {iqty}</text>')
        f.append(f'<text x="{card_x + card_w - 64}" y="{cur_iy + 48}" fill="#0F172A" font-family="{font_sans}" font-size="16" font-weight="900" text-anchor="end">{escape_xml(iprice)}</text>')
        cur_iy += 102
        f.append('</g>')

    # Bottom Delivery Details Banner
    del_box_y = cur_iy + 10
    f.append(f'<rect x="{card_x + 32}" y="{del_box_y}" width="{card_w - 64}" height="76" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="{card_x + 56}" y="{del_box_y + 32}" fill="#1D4ED8" font-family="{font_sans}" font-size="14" font-weight="800">🚚 Destino de Entrega:</text>')
    f.append(f'<text x="{card_x + 220}" y="{del_box_y + 32}" fill="#0F172A" font-family="{font_sans}" font-size="13.5">Av. 12 de Octubre y Roca, Edificio PUCE, Depto 402 • Quito, Ecuador</text>')
    f.append(f'<text x="{card_x + 56}" y="{del_box_y + 54}" fill="#64748B" font-family="{font_sans}" font-size="12.5">Transportista: Courier Especializado de Alta Gama | Código de Rastreo: <tspan font-family="{font_mono}" font-weight="700" fill="#0F172A">PKM-EC-994821</tspan></text>')
    f.append('</g>')

    return "\n".join(f)

# =====================================================================
# FRAME 08: 08_Bolsa_Microinteracciones_Feedback
# =====================================================================
def generate_frame_08():
    f = []
    f.append('<rect width="1440" height="900" fill="#F8FAFC"/>')
    
    # Top Navbar with Live Feedback Toast
    f.append('<g id="Header_Navbar_Feedback">')
    f.append('<rect x="0" y="0" width="1440" height="74" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>')
    f.append('<rect x="0" y="0" width="1440" height="3" fill="#DC2626"/>')
    f.append(draw_pokeball_icon(48, 38, 17))
    f.append(f'<text x="76" y="44" fill="#0F172A" font-family="{font_sans}" font-size="19" font-weight="900">GRADED &amp; SEALED</text>')
    f.append(f'<text x="264" y="44" fill="#DC2626" font-family="{font_sans}" font-size="19" font-weight="900">TCG</text>')
    
    # Cart with Updated Counter (+1 item)
    f.append('<rect x="1270" y="16" width="138" height="42" fill="#DC2626" rx="8" ry="8"/>')
    f.append(f'<text x="1325" y="42" fill="#FFFFFF" font-family="{font_sans}" font-size="14" font-weight="800" text-anchor="middle">Bolsa</text>')
    f.append('<circle cx="1374" cy="22" r="12" fill="#FEF3C7" stroke="#DC2626" stroke-width="2"/>')
    f.append(f'<text x="1374" y="27" fill="#B45309" font-family="{font_mono}" font-size="11.5" font-weight="900" text-anchor="middle">3</text>')

    # Floating Feedback Toast above cart button (Nielsen #1: System Status Visibility)
    f.append('<g id="Toast_Feedback_Navbar">')
    f.append('<rect x="1080" y="16" width="180" height="42" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="1170" y="41" fill="#065F46" font-family="{font_sans}" font-size="12" font-weight="800" text-anchor="middle">+1 Booster Pack añadido</text>')
    f.append('</g>')
    f.append('</g>')

    # Accessible Banner / Toast Superior: Undo Item Deletion (Nielsen #3: User Control & Freedom)
    banner_y = 86
    f.append('<g id="Banner_Toast_Deshacer">')
    f.append(f'<rect x="32" y="{banner_y}" width="1376" height="54" fill="#0F172A" rx="10" ry="10"/>')
    f.append(f'<circle cx="62" cy="{banner_y + 27}" r="12" fill="#16A34A"/>')
    f.append(f'<text x="62" y="{banner_y + 32}" fill="#FFFFFF" font-family="{font_sans}" font-size="13" font-weight="900" text-anchor="middle">✓</text>')
    f.append(f'<text x="86" y="{banner_y + 33}" fill="#FFFFFF" font-family="{font_sans}" font-size="14" font-weight="700">Ítem &quot;Gengar VMAX Secret Rare (PSA 10)&quot; eliminado de la bolsa de compras.</text>')
    
    # Accessible Undo Button inside Banner (FOCUS VISIBLE ELEMENT)
    undo_x = 1240
    undo_y = banner_y + 9
    f.append(f'<rect x="{undo_x}" y="{undo_y}" width="150" height="36" fill="#DC2626" rx="6" ry="6"/>')
    f.append(f'<text x="{undo_x + 75}" y="{undo_y + 23}" fill="#FFFFFF" font-family="{font_sans}" font-size="13" font-weight="800" text-anchor="middle">⟲ Deshacer acción</text>')
    # 3px Focus Ring
    f.append(f'<rect x="{undo_x - 3}" y="{undo_y - 3}" width="156" height="42" fill="none" stroke="#FFFFFF" stroke-width="3" rx="9" ry="9"/>')
    f.append(f'<rect x="{undo_x}" y="{banner_y - 20}" width="145" height="18" fill="#FFFFFF" rx="3" ry="3"/>')
    f.append(f'<text x="{undo_x + 72}" y="{banner_y - 7}" fill="#0F172A" font-family="{font_mono}" font-size="9.5" font-weight="800" text-anchor="middle">:focus-visible (3px)</text>')
    f.append('</g>')

    # HCI Justification Callout
    callout_y = banner_y + 64
    f.append('<g id="Anotacion_HCI_Feedback">')
    f.append(f'<rect x="32" y="{callout_y}" width="1376" height="42" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" rx="8" ry="8"/>')
    f.append(f'<text x="48" y="{callout_y + 26}" fill="#1D4ED8" font-family="{font_sans}" font-size="12.5" font-weight="800">🧠 Justificación IHC &amp; WCAG 2.2:</text>')
    f.append(f'<text x="260" y="{callout_y + 26}" fill="#1E3A8A" font-family="{font_sans}" font-size="12.5">Cumple Heurística #1 (Visibilidad del estado del sistema con microinteracción visual) y Heurística #3 (Control y libertad del usuario al permitir revertir la eliminación accidental sin recargar la página).</text>')
    f.append('</g>')

    # 2 Columns (70% Items list / 30% Summary)
    content_y = callout_y + 54
    lw = 900
    f.append('<g id="Cart_Items_Remaining">')
    f.append(f'<text x="32" y="{content_y + 24}" fill="#0F172A" font-family="{font_sans}" font-size="22" font-weight="900">Bolsa Actualizada (2 artículos restantes)</text>')

    active_items = [
        ("Charizard Base Set 1999 #4/102", "PSA 10 GEM MT • Cert #48291034", "$18,500.00", "1", "Charizard Base Set PSA 10"),
        ("Umbreon VMAX Moonbreon Alt Art", "Sin Gradear / Raw (Near Mint)", "$780.00", "1", "Umbreon VMAX Raw")
    ]
    cur_cy = content_y + 44
    for idx, (iname, icond, iprice, iqty, ialt) in enumerate(active_items):
        f.append(f'<g id="ActiveCartItem_{idx+1}">')
        f.append(f'<rect x="32" y="{cur_cy}" width="{lw}" height="142" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" rx="10" ry="10"/>')
        f.append(draw_image_container(48, cur_cy + 16, 115, 110, f"CartThumb_{idx+1}", ialt))
        f.append(f'<text x="180" y="{cur_cy + 46}" fill="#0F172A" font-family="{font_sans}" font-size="17" font-weight="800">{escape_xml(iname)}</text>')
        f.append(f'<text x="180" y="{cur_cy + 72}" fill="#64748B" font-family="{font_sans}" font-size="13">{escape_xml(icond)}</text>')
        
        # Stepper
        st_x = 520
        st_y = cur_cy + 52
        f.append(f'<text x="{st_x}" y="{st_y + 22}" fill="#64748B" font-family="{font_sans}" font-size="13">Cant:</text>')
        f.append(f'<rect x="{st_x + 50}" y="{st_y}" width="36" height="36" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="6" ry="6"/>')
        f.append(f'<text x="{st_x + 68}" y="{st_y + 23}" fill="#0F172A" font-family="{font_sans}" font-size="16" font-weight="800" text-anchor="middle">−</text>')
        f.append(f'<rect x="{st_x + 94}" y="{st_y}" width="44" height="36" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>')
        f.append(f'<text x="{st_x + 116}" y="{st_y + 23}" fill="#0F172A" font-family="{font_sans}" font-size="15" font-weight="800" text-anchor="middle">{iqty}</text>')
        f.append(f'<rect x="{st_x + 146}" y="{st_y}" width="36" height="36" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" rx="6" ry="6"/>')
        f.append(f'<text x="{st_x + 164}" y="{st_y + 23}" fill="#0F172A" font-family="{font_sans}" font-size="16" font-weight="800" text-anchor="middle">+</text>')

        # Price
        f.append(f'<text x="730" y="{st_y + 24}" fill="#0F172A" font-family="{font_sans}" font-size="18" font-weight="900">{escape_xml(iprice)}</text>')
        # Delete
        f.append(f'<rect x="820" y="{st_y}" width="92" height="36" fill="#FFFFFF" stroke="#EF4444" stroke-width="1.5" rx="8" ry="8"/>')
        f.append(f'<text x="866" y="{st_y + 23}" fill="#EF4444" font-family="{font_sans}" font-size="13" font-weight="700" text-anchor="middle">Eliminar</text>')
        cur_cy += 156
        f.append('</g>')

    # Item counter note
    f.append(f'<rect x="32" y="{cur_cy + 10}" width="{lw}" height="175" fill="#FEF2F2" stroke="#FECACA" stroke-width="1.5" rx="10" ry="10"/>')
    f.append(f'<text x="56" y="{cur_cy + 45}" fill="#991B1B" font-family="{font_sans}" font-size="15" font-weight="800">Recuperación de Ítem en Memoria Temporal</text>')
    f.append(f'<text x="56" y="{cur_cy + 75}" fill="#7F1D1D" font-family="{font_sans}" font-size="13">El ítem eliminado se almacena en caché durante 60 segundos antes de ser liberado al stock público general de la tienda. Puedes pulsar &quot;Deshacer acción&quot; para restaurarlo de inmediato.</text>')
    f.append(draw_pokeball_icon(70, cur_cy + 125, 20))
    f.append(f'<text x="105" y="{cur_cy + 130}" fill="#0F172A" font-family="{font_sans}" font-size="13.5" font-weight="700">Stock preservado temporalmente para garantizar disponibilidad.</text>')
    f.append('</g>')

    # Right Column Summary (w=448, x=960)
    sum_x = 960
    sum_w = 448
    f.append('<g id="Cart_Summary_Updated">')
    f.append(f'<rect x="{sum_x}" y="{content_y + 44}" width="{sum_w}" height="490" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" rx="12" ry="12"/>')
    f.append(f'<text x="{sum_x + 28}" y="{content_y + 84}" fill="#0F172A" font-family="{font_sans}" font-size="21" font-weight="900">Resumen Actualizado</text>')
    f.append(f'<line x1="{sum_x + 28}" y1="{content_y + 106}" x2="{sum_x + sum_w - 28}" y2="{content_y + 106}" stroke="#E2E8F0" stroke-width="1.5"/>')
    
    updated_summary = [
        ("Subtotal (2 artículos)", "$19,280.00"),
        ("Envío Asegurado", "$25.00"),
        ("Impuestos (IVA 12%)", "$2,316.60"),
        ("Seguro de Custodia", "GRATIS")
    ]
    u_sly = content_y + 144
    for usl, usv in updated_summary:
        f.append(f'<text x="{sum_x + 28}" y="{u_sly}" fill="#64748B" font-family="{font_sans}" font-size="14">{escape_xml(usl)}</text>')
        f.append(f'<text x="{sum_x + sum_w - 28}" y="{u_sly}" fill="#0F172A" font-family="{font_sans}" font-size="14" font-weight="700" text-anchor="end">{escape_xml(usv)}</text>')
        u_sly += 38

    f.append(f'<line x1="{sum_x + 28}" y1="{u_sly + 10}" x2="{sum_x + sum_w - 28}" y2="{u_sly + 10}" stroke="#CBD5E1" stroke-width="1.5"/>')
    f.append(f'<text x="{sum_x + 28}" y="{u_sly + 48}" fill="#0F172A" font-family="{font_sans}" font-size="19" font-weight="900">Total a Pagar:</text>')
    f.append(f'<text x="{sum_x + sum_w - 28}" y="{u_sly + 48}" fill="#0F172A" font-family="{font_sans}" font-size="26" font-weight="900" text-anchor="end">$21,621.60</text>')

    f.append(f'<rect x="{sum_x + 28}" y="{content_y + 400}" width="{sum_w - 56}" height="58" fill="#DC2626" rx="10" ry="10"/>')
    f.append(f'<text x="{sum_x + sum_w/2}" y="{content_y + 436}" fill="#FFFFFF" font-family="{font_sans}" font-size="16" font-weight="800" text-anchor="middle">Proceder al Checkout ➔</text>')
    f.append('</g>')

    return "\n".join(f)

# =====================================================================
# FRAME 09: 09_Checkout_Error_Pago
# =====================================================================
def generate_frame_09():
    f = []
    f.append('<rect width="1440" height="900" fill="#F8FAFC"/>')
    
    # Top Navbar
    f.append('<g id="Header_Navbar_Error">')
    f.append('<rect x="0" y="0" width="1440" height="74" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>')
    f.append('<rect x="0" y="0" width="1440" height="3" fill="#DC2626"/>')
    f.append(draw_pokeball_icon(48, 38, 17))
    f.append(f'<text x="76" y="44" fill="#0F172A" font-family="{font_sans}" font-size="19" font-weight="900">GRADED &amp; SEALED</text>')
    f.append(f'<text x="264" y="44" fill="#DC2626" font-family="{font_sans}" font-size="19" font-weight="900">TCG</text>')
    f.append(f'<text x="420" y="44" fill="#64748B" font-family="{font_sans}" font-size="13">🔒 Checkout Seguro Encriptado (256-bit TLS)</text>')
    f.append(f'<text x="1270" y="44" fill="#DC2626" font-family="{font_sans}" font-size="13" font-weight="800">⚠️ Transacción No Completada</text>')
    f.append('</g>')

    # Centered Diagnostic & Recovery Card (w=960, x=240, y=94, h=774)
    bx = 240
    bw = 960
    by = 94
    bh = 774
    f.append('<g id="Tarjeta_Diagnostico_Error">')
    f.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" rx="16" ry="16"/>')

    # Red Error Badge Icon (Warning Shield)
    f.append(f'<circle cx="{bx + bw/2}" cy="{by + 58}" r="32" fill="#FEF2F2" stroke="#FECACA" stroke-width="2"/>')
    f.append(f'<circle cx="{bx + bw/2}" cy="{by + 58}" r="22" fill="#DC2626"/>')
    f.append(f'<text x="{bx + bw/2}" y="{by + 67}" fill="#FFFFFF" font-family="{font_sans}" font-size="26" font-weight="900" text-anchor="middle">!</text>')

    # Heading (Nielsen #9: Help users recognize, diagnose, and recover from errors)
    f.append(f'<text x="{bx + bw/2}" y="{by + 124}" fill="#0F172A" font-family="{font_sans}" font-size="26" font-weight="900" text-anchor="middle">No pudimos procesar tu pago</text>')
    f.append(f'<text x="{bx + bw/2}" y="{by + 154}" fill="#DC2626" font-family="{font_sans}" font-size="15" font-weight="800" text-anchor="middle">Código de Respuesta Bancaria: #DECLINED-SEC-054</text>')
    
    # Friendly, Non-Cryptic Diagnostic Message Box
    msg_box_w = bw - 96
    msg_box_x = bx + 48
    f.append(f'<rect x="{msg_box_x}" y="{by + 178}" width="{msg_box_w}" height="106" fill="#FEF2F2" stroke="#FECACA" stroke-width="1.5" rx="10" ry="10"/>')
    f.append(f'<text x="{msg_box_x + 24}" y="{by + 208}" fill="#991B1B" font-family="{font_sans}" font-size="14.5" font-weight="800">Diagnóstico Claro de la Operación:</text>')
    f.append(f'<text x="{msg_box_x + 24}" y="{by + 234}" fill="#7F1D1D" font-family="{font_sans}" font-size="13.5">La transacción fue rechazada por la entidad emisora de tu tarjeta bancaria terminada en <tspan font-weight="800">4242</tspan> (posible límite de compras o autorización telefónica requerida).</text>')
    f.append(f'<text x="{msg_box_x + 24}" y="{by + 258}" fill="#16A34A" font-family="{font_sans}" font-size="13" font-weight="700">✓ Tranquilidad garantizada: NO se ha realizado ningún cobro a tu cuenta bancaria.</text>')

    # Preserved Order & Delivery Summary (No resetting state!)
    state_y = by + 304
    f.append(f'<rect x="{msg_box_x}" y="{state_y}" width="{msg_box_w}" height="175" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" rx="10" ry="10"/>')
    f.append(f'<text x="{msg_box_x + 24}" y="{state_y + 32}" fill="#0F172A" font-family="{font_sans}" font-size="15" font-weight="800">Tus Datos y Carrito Permanecen Guardados:</text>')
    f.append(f'<text x="{msg_box_x + 24}" y="{state_y + 54}" fill="#64748B" font-family="{font_sans}" font-size="12.5">No necesitas volver a escribir tu dirección ni seleccionar tus cartas.</text>')
    f.append(f'<line x1="{msg_box_x + 24}" y1="{state_y + 68}" x2="{msg_box_x + msg_box_w - 24}" y2="{state_y + 68}" stroke="#E2E8F0" stroke-width="1.5"/>')
    
    f.append(f'<text x="{msg_box_x + 24}" y="{state_y + 96}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Comprador: <tspan font-weight="400">Patrick Mora (patrick.mora@puce.edu.ec)</tspan></text>')
    f.append(f'<text x="{msg_box_x + 24}" y="{state_y + 120}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Dirección Guardada: <tspan font-weight="400">Av. 12 de Octubre y Roca, Edificio PUCE, Depto 402</tspan></text>')
    f.append(f'<text x="{msg_box_x + 24}" y="{state_y + 144}" fill="#0F172A" font-family="{font_sans}" font-size="13" font-weight="700">Total Reservado en Bóveda: <tspan font-weight="900" fill="#DC2626">$22,013.60 USD</tspan> (1x Charizard PSA 10, 1x Umbreon Raw, 1x Booster Rocket)</text>')

    # Clear Recovery Routes (Primary, Secondary, Support)
    routes_y = state_y + 196
    f.append(f'<text x="{bx + bw/2}" y="{routes_y}" fill="#0F172A" font-family="{font_sans}" font-size="16" font-weight="900" text-anchor="middle">¿Cómo deseas proceder?</text>')

    # Route 1: Primary Action (FOCUS VISIBLE ELEMENT)
    btn1_w = msg_box_w
    btn1_x = msg_box_x
    btn1_y = routes_y + 18
    f.append(f'<rect x="{btn1_x}" y="{btn1_y}" width="{btn1_w}" height="56" fill="#DC2626" rx="10" ry="10"/>')
    f.append(f'<text x="{btn1_x + btn1_w/2}" y="{btn1_y + 35}" fill="#FFFFFF" font-family="{font_sans}" font-size="16" font-weight="800" text-anchor="middle">💳 Reintentar con otro método de pago (Tarjeta o Transferencia)</text>')
    # 3px Focus Ring
    f.append(f'<rect x="{btn1_x - 4}" y="{btn1_y - 4}" width="{btn1_w + 8}" height="64" fill="none" stroke="#0F172A" stroke-width="3" rx="13" ry="13"/>')
    f.append(f'<rect x="{btn1_x + btn1_w/2 - 75}" y="{btn1_y - 24}" width="150" height="19" fill="#0F172A" rx="3" ry="3"/>')
    f.append(f'<text x="{btn1_x + btn1_w/2}" y="{btn1_y - 10}" fill="#FFFFFF" font-family="{font_mono}" font-size="9.5" font-weight="700" text-anchor="middle">:focus-visible (3px)</text>')

    # Route 2: Secondary Action (Cambiar a Retiro en Local y Pago en Efectivo)
    btn2_y = btn1_y + 74
    f.append(f'<rect x="{btn1_x}" y="{btn2_y}" width="{btn1_w}" height="52" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5" rx="10" ry="10"/>')
    f.append(f'<text x="{btn1_x + btn1_w/2}" y="{btn2_y + 32}" fill="#0F172A" font-family="{font_sans}" font-size="15" font-weight="800" text-anchor="middle">🏬 Cambiar a Retiro en Tienda y Pagar en Efectivo (Gratis)</text>')

    # Route 3: Support Link
    f.append(f'<text x="{bx + bw/2}" y="{btn2_y + 88}" fill="#64748B" font-family="{font_sans}" font-size="13.5" text-anchor="middle">¿El problema persiste? <tspan fill="#DC2626" font-weight="700">Contactar a soporte local por WhatsApp (+593 99 876 5432)</tspan> o volver a la tienda.</text>')
    f.append('</g>')

    return "\n".join(f)

# Build map
new_frames = {
    "06_Autenticacion_Login_Registro": generate_frame_06,
    "07_Mis_Pedidos_Tracking": generate_frame_07,
    "08_Bolsa_Microinteracciones_Feedback": generate_frame_08,
    "09_Checkout_Error_Pago": generate_frame_09
}

target_dirs = [
    r"c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce",
    r"c:\Users\patri\Desktop\PUCE TAREAS\IHC"
]

for d in target_dirs:
    for name, gen_fn in new_frames.items():
        doc = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900">',
            f'<g id="{name}">',
            gen_fn(),
            '</g>',
            '</svg>'
        ]
        svg_code = "\n".join(doc)
        ET.fromstring(svg_code) # Validation
        file_path = os.path.join(d, f"{name}.svg")
        with open(file_path, "w", encoding="utf-8") as out:
            out.write(svg_code)
        print(f"Validated and saved: {file_path}")

print("All 4 complementary frames successfully generated and validated!")
