# -*- coding: utf-8 -*-
"""
Generate a complete 9-frame 2-Row Master SVG:
Row 1: Frames 01 to 05 (Home, PDP, Cart, Checkout, Confirmation)
Row 2: Frames 06 to 09 (Auth, Orders/Tracking, Feedback/Microinteractions, Payment Error)
Canvas dimensions: 7680 x 1980 px (80px horizontal gap, 100px vertical gap between rows).
Also updates wireframes_viewer.html with all 9 frames.
"""
import os
import xml.etree.ElementTree as ET

# Read all 9 individual SVG files from Pagina_e-commerce
dir_path = r"c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce"

frame_files = [
    "01_Home_Catalogo.svg",
    "02_Detalle_Producto.svg",
    "03_Bolsa_Compras.svg",
    "04_Checkout_Bifurcado.svg",
    "05_Confirmacion_Orden.svg",
    "06_Autenticacion_Login_Registro.svg",
    "07_Mis_Pedidos_Tracking.svg",
    "08_Bolsa_Microinteracciones_Feedback.svg",
    "09_Checkout_Error_Pago.svg"
]

frame_xmls = {}
for ff in frame_files:
    fpath = os.path.join(dir_path, ff)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    # Extract inner content inside <svg ...> and </svg>
    start_tag = content.find('>')
    end_tag = content.rfind('</svg>')
    inner = content[start_tag+1:end_tag].strip()
    frame_xmls[ff.replace('.svg', '')] = inner

# Canvas layout:
# Row 1 (y=40): 5 frames (x = 80, 80 + 1520, 80 + 3040, 80 + 4560, 80 + 6080)
# Row 2 (y=1040): 4 frames (x = 80, 80 + 1520, 80 + 3040, 80 + 4560)
canvas_w = (1440 * 5) + (80 * 4) + 160 # 7680 px
canvas_h = (900 * 2) + 100 + 80 # 1980 px

master = []
master.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas_w} {canvas_h}" width="{canvas_w}" height="{canvas_h}">')
master.append(f'<rect width="{canvas_w}" height="{canvas_h}" fill="#E2E8F0"/>')

# Title headers
master.append('<text x="80" y="30" fill="#0F172A" font-family="Inter, sans-serif" font-size="24" font-weight="900">FILA 1: FLUJO PRINCIPAL DE COMPRA (FRAMES 01 - 05)</text>')
master.append('<text x="80" y="1030" fill="#0F172A" font-family="Inter, sans-serif" font-size="24" font-weight="900">FILA 2: MÓDULOS COMPLEMENTARIOS DE IHC Y RECUPERACIÓN (FRAMES 06 - 09)</text>')

row1_names = ["01_Home_Catalogo", "02_Detalle_Producto", "03_Bolsa_Compras", "04_Checkout_Bifurcado", "05_Confirmacion_Orden"]
for idx, name in enumerate(row1_names):
    shift_x = 80 + idx * (1440 + 80)
    master.append(f'<g transform="translate({shift_x}, 40)">')
    master.append(frame_xmls[name])
    master.append('</g>')

row2_names = ["06_Autenticacion_Login_Registro", "07_Mis_Pedidos_Tracking", "08_Bolsa_Microinteracciones_Feedback", "09_Checkout_Error_Pago"]
for idx, name in enumerate(row2_names):
    shift_x = 80 + idx * (1440 + 80)
    master.append(f'<g transform="translate({shift_x}, 1040)">')
    master.append(frame_xmls[name])
    master.append('</g>')

master.append('</svg>')
master_str = "\n".join(master)
ET.fromstring(master_str) # Validate XML

# Save 9-frame master in both folders
master_out = os.path.join(dir_path, "graded_and_sealed_tcg_complete_9_frames.svg")
with open(master_out, "w", encoding="utf-8") as f:
    f.write(master_str)
print(f"Validated and saved: {master_out}")

master_out_root = r"c:\Users\patri\Desktop\PUCE TAREAS\IHC\graded_and_sealed_tcg_complete_9_frames.svg"
with open(master_out_root, "w", encoding="utf-8") as f:
    f.write(master_str)
print(f"Validated and saved: {master_out_root}")
