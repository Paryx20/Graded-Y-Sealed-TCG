"""
Convierte las fotos de sobres generadas con Gemini en WebP optimizados y uniformes.

Detecta el sobre sobre el fondo, encuadra una ventana 2:3 centrada en él para que
ocupe siempre el mismo alto (si hace falta, extiende el fondo con su propio color)
y guarda un WebP de 800x1200 en assets/img/packs/.

Uso (desde la raíz del proyecto):
    python tools/optimizar_sobres.py assets/img/packs/_originales

Los nombres de salida salen del nombre del archivo de entrada:
    booster-pack-fossil-1999-frontal.png -> assets/img/packs/booster-pack-fossil-1999-frontal.webp
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SALIDA = ROOT / 'assets' / 'img' / 'packs'
ANCHO, ALTO = 800, 1200
OCUPACION = 0.80  # el sobre ocupa el 80 % del alto del lienzo
EXTENSIONES = {'.png', '.jpg', '.jpeg', '.jpe', '.webp'}


def color_de_fondo(img):
    """Color medio del borde de la imagen (el fondo de estudio)."""
    w, h = img.size
    borde = [img.crop((0, 0, w, 8)), img.crop((0, h - 8, w, h)), img.crop((0, 0, 8, h)), img.crop((w - 8, 0, w, h))]
    muestras = [b.resize((32, 32)) for b in borde]
    pixeles = [m.getpixel((x, y)) for m in muestras for x in range(32) for y in range(32)]
    return tuple(sorted(c[i] for c in pixeles)[len(pixeles) // 2] for i in range(3))


def caja_del_sobre(img, fondo):
    """Rectángulo del sobre: lo que se aleja claramente del color de fondo (la sombra suave no cuenta)."""
    diff = ImageChops.difference(img, Image.new('RGB', img.size, fondo)).convert('L')
    mascara = diff.point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MedianFilter(9))
    return mascara.getbbox() or (0, 0, *img.size)


def procesar(origen):
    img = Image.open(origen).convert('RGB')
    fondo = color_de_fondo(img)
    x0, y0, x1, y1 = caja_del_sobre(img, fondo)

    # Ventana 2:3 centrada en el sobre, con el sobre al OCUPACION del alto (y que quepa a lo ancho)
    alto_ventana = max((y1 - y0) / OCUPACION, (x1 - x0) / (0.9 * ANCHO / ALTO))
    ancho_ventana = alto_ventana * ANCHO / ALTO
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ventana = (round(cx - ancho_ventana / 2), round(cy - alto_ventana / 2),
               round(cx + ancho_ventana / 2), round(cy + alto_ventana / 2))

    # Si la ventana se sale de la foto, se rellena con el color del fondo
    lienzo = Image.new('RGB', (ventana[2] - ventana[0], ventana[3] - ventana[1]), fondo)
    lienzo.paste(img, (-ventana[0], -ventana[1]))
    lienzo = lienzo.resize((ANCHO, ALTO), Image.LANCZOS)

    destino = SALIDA / (origen.stem.lower().replace(' ', '-') + '.webp')
    lienzo.save(destino, 'WEBP', quality=82, method=6)
    print(f'{destino.relative_to(ROOT)}  {destino.stat().st_size / 1024:.0f} KB')


def main():
    if len(sys.argv) != 2:
        sys.exit('Uso: python tools/optimizar_sobres.py <carpeta_con_imagenes>')
    carpeta = Path(sys.argv[1])
    archivos = sorted(p for p in carpeta.iterdir() if p.suffix.lower() in EXTENSIONES)
    if not archivos:
        sys.exit(f'No hay imágenes en {carpeta}')
    SALIDA.mkdir(parents=True, exist_ok=True)
    for archivo in archivos:
        procesar(archivo)


if __name__ == '__main__':
    main()
