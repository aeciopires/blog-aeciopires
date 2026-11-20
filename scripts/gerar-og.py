#!/usr/bin/env python3
"""Gera a imagem padrão de compartilhamento (og:image, 1200x630) sobre a arte do T9.

Uso: python3 scripts/gerar-og.py [saida]   (padrão: assets/img/og-default.png)
Requer Pillow. Fontes: primeira encontrada na lista FONTES (Ubuntu/macOS).
A imagem gerada é versionada; só rode de novo se mudar título, subtítulo ou arte.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTE = os.path.join(RAIZ, "assets", "img", "background.webp")
SAIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "assets", "img", "og-default.png")
W, H = 1200, 630

TITULO = "Blog do Aécio Pires"
SUBTITULO = "DevOps · SRE · Kubernetes · Cloud · Observabilidade"
RODAPE = "blog.aeciopires.com"

FONTES_BOLD = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]
FONTES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]


def fonte(lista, tamanho):
    for caminho in lista:
        if os.path.exists(caminho):
            return ImageFont.truetype(caminho, tamanho)
    return ImageFont.load_default()


def main():
    arte = Image.open(ARTE).convert("RGB")
    # recorte central superior (onde estão os brilhos e a constelação)
    escala = W / arte.width
    arte = arte.resize((W, int(arte.height * escala)), Image.LANCZOS).crop((0, 0, W, H))

    # painel de vidro: desfoque + véu azul-marinho semitransparente
    x0, y0, x1, y1 = 70, 150, W - 70, H - 150
    painel = arte.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(18))
    veu = Image.new("RGB", painel.size, (13, 18, 51))
    painel = Image.blend(painel, veu, 0.55)
    mascara = Image.new("L", painel.size, 0)
    ImageDraw.Draw(mascara).rounded_rectangle((0, 0, painel.width - 1, painel.height - 1), radius=28, fill=255)
    arte.paste(painel, (x0, y0), mascara)

    d = ImageDraw.Draw(arte)
    d.rounded_rectangle((x0, y0, x1, y1), radius=28, outline=(138, 197, 250), width=2)
    d.text((W // 2, 255), TITULO, font=fonte(FONTES_BOLD, 68), fill=(255, 255, 255), anchor="mm")
    d.text((W // 2, 340), SUBTITULO, font=fonte(FONTES, 30), fill=(203, 213, 245), anchor="mm")
    d.text((W // 2, 420), RODAPE, font=fonte(FONTES_BOLD, 28), fill=(138, 197, 250), anchor="mm")

    arte.save(SAIDA, optimize=True)
    print(f"gerado: {SAIDA}")


if __name__ == "__main__":
    main()
