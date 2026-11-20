#!/usr/bin/env python3
"""Recupera tabelas e embeds do WordPress que o wp2hugo achatou em texto corrido.

- Bloco wp:table  -> tabela Markdown (1a linha = cabeçalho; <thead> quando existir).
- Bloco wp:embed de página/post do próprio blog -> item de lista "[Título](/slug/)".

O texto achatado é localizado no post comparando só letras e números (sem espaços,
negrito, crases e links); nada é trocado se o parágrafo não for encontrado.

Uso:
  python3 -I scripts/migracao/tabelas_embeds.py --wxr <arquivo.xml>           # só relata
  python3 -I scripts/migracao/tabelas_embeds.py --wxr <arquivo.xml> --write   # aplica
"""
import argparse
import html
import os
import re
import sys
import xml.etree.ElementTree as ET

NS = {
    "wp": "http://wordpress.org/export/1.2/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}
DOMINIO = re.compile(r"^https?://blog\.aeciopires\.com", re.I)


def chave(texto):
    """Só letras e números, em minúsculas: base para comparar texto achatado."""
    texto = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", texto)  # [x](y) -> x
    return re.sub(r"[\W_]+", "", html.unescape(texto)).lower()


def inline_md(fragmento, cabecalho=False):
    """Converte o HTML de uma célula em Markdown de uma linha."""
    s = fragmento
    s = re.sub(r"<br\s*/?>", " ", s)

    def link(m):
        href = DOMINIO.sub("", m.group(1)) or "/"
        return "[%s](%s)" % (re.sub(r"<[^>]+>", "", m.group(2)).strip(), href)

    s = re.sub(r'(?s)<a\s[^>]*href="([^"]+)"[^>]*>(.*?)</a>', link, s)
    s = re.sub(r"(?s)<code[^>]*>(.*?)</code>", lambda m: "`%s`" % re.sub(r"<[^>]+>", "", m.group(1)), s)
    if cabecalho:
        s = re.sub(r"</?(strong|b)\b[^>]*>", "", s)
    else:
        s = re.sub(r"(?s)<(strong|b)\b[^>]*>(.*?)</\1>", r"**\2**", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace(" ", " ")
    s = " ".join(s.split()).replace("|", "\\|")
    s = re.sub(r"\*\*\s*\*\*", "", s)
    return s


def tabela_md(tabela_html):
    linhas = re.findall(r"(?s)<tr\b[^>]*>(.*?)</tr>", tabela_html)
    grade = [re.findall(r"(?s)<t[hd]\b[^>]*>(.*?)</t[hd]>", tr) for tr in linhas]
    if not grade:
        return None, ""
    cab = [inline_md(c, cabecalho=True) for c in grade[0]]
    corpo = [[inline_md(c) for c in linha] for linha in grade[1:]]
    largura = max(len(cab), *(len(r) for r in corpo)) if corpo else len(cab)
    cab += [""] * (largura - len(cab))
    md = ["| " + " | ".join(cab) + " |", "|" + "---|" * largura]
    for r in corpo:
        r += [""] * (largura - len(r))
        md.append("| " + " | ".join(r) + " |")
    texto = "".join(re.sub(r"<[^>]+>", "", c) for linha in grade for c in linha)
    return "\n".join(md), chave(texto)


def titulo_local(caminho):
    slug = caminho.strip("/")
    for f in ("content/posts/%s/index.md" % slug, "content/%s/index.md" % slug):
        if os.path.exists(f):
            with open(f, encoding="utf-8") as fh:
                m = re.search(r'(?m)^title:\s*"?(.*?)"?\s*$', fh.read())
                if m:
                    return m.group(1).replace('\\"', '"')
    return None


def arquivo_do_slug(slug):
    for f in ("content/posts/%s/index.md" % slug, "content/%s/index.md" % slug):
        if os.path.exists(f):
            return f
    return None


def corrigir(texto, tabelas, embeds):
    fm, corpo = texto.split("\n---\n", 1)
    paragrafos = re.split(r"(\n[ \t]*\n)", corpo)
    feitos = []
    for tab_md, tab_chave in tabelas:
        for i in range(0, len(paragrafos), 2):
            if paragrafos[i].lstrip().startswith("|"):
                continue
            if tab_chave and chave(paragrafos[i]) == tab_chave:
                paragrafos[i] = tab_md
                feitos.append("tabela")
                break
    for caminho, titulo in embeds:
        for i in range(0, len(paragrafos), 2):
            if paragrafos[i].strip() == caminho:
                paragrafos[i] = "- [%s](%s)" % (titulo, caminho)
                feitos.append("embed " + caminho)
                break
    corpo = "".join(paragrafos)
    # itens de embed vizinhos formam uma lista só (sem linha em branco entre eles)
    corpo = re.sub(r"(?m)^(- \[[^\n]+\]\(/[^\n]*\))\n[ \t]*\n(?=- \[[^\n]+\]\(/)", r"\1\n", corpo)
    return fm + "\n---\n" + corpo.rstrip("\n") + "\n", feitos


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--wxr", required=True)
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    falhas = 0
    for item in ET.parse(args.wxr).iter("item"):
        if item.findtext("wp:status", namespaces=NS) != "publish":
            continue
        slug = item.findtext("wp:post_name", namespaces=NS)
        c = item.findtext("content:encoded", namespaces=NS) or ""
        tabelas = [tabela_md(t) for t in re.findall(r"(?s)<table\b.*?</table>", c)]
        embeds = []
        for m in re.finditer(r'<!-- wp:embed (\{.*?\}) /?-->', c):
            url = re.search(r'"url":"([^"]+)"', m.group(1))
            if url and DOMINIO.match(url.group(1)):
                caminho = DOMINIO.sub("", url.group(1))
                titulo = titulo_local(caminho)
                if titulo:
                    embeds.append((caminho, titulo))
        if not tabelas and not embeds:
            continue
        arq = arquivo_do_slug(slug)
        if not arq:
            continue
        with open(arq, encoding="utf-8") as fh:
            texto = fh.read()
        novo, feitos = corrigir(texto, tabelas, embeds)
        esperado = len(tabelas) + len(embeds)
        # rodada anterior: tabela já em Markdown (linha do cabeçalho) ou link do embed já presente
        ja_ok = sum(1 for md, _ in tabelas if md and md.split("\n", 1)[0] in texto)
        ja_ok += sum(1 for caminho, _ in embeds if "](%s)" % caminho in texto)
        if len(feitos) == esperado:
            status = "OK"
        elif len(feitos) + ja_ok >= esperado:
            status = "já corrigido" if not feitos else "OK"
        else:
            status = "INCOMPLETO"
        if status == "INCOMPLETO":
            falhas += 1
        print("%s: %d tabela(s), %d embed(s) -> %d trocas [%s]" % (slug, len(tabelas), len(embeds), len(feitos), status))
        if args.write and feitos:
            with open(arq, "w", encoding="utf-8") as fh:
                fh.write(novo)
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
