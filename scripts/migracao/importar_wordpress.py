#!/usr/bin/env python3
"""Fase 3 da migração (PLAN.md seção 6): WordPress (WXR) -> conteúdo Hugo/Blowfish. Uso único.

Fontes:
  - WXR (export do WordPress): metadados confiáveis (título, slug, datas, categorias, tags,
    imagem destacada, comentários). Lido com xml.etree (não resolve entidades externas).
  - Saída do wp2hugo 1.39.0 (sem -download-media): só o CORPO em Markdown de cada post/página.
  - uploads/ do backup: mídias copiadas para static/wp-content/uploads/ (mesmo caminho do WP).

Decisões aplicadas:
  - Só itens PUBLICADOS. Rascunhos do WordPress são ignorados (decisão do autor, 20/11/2026).
  - Comentários: só aprovados e do tipo comentário (sem pingbacks). Guardados SÓ nome, data,
    texto puro (sem HTML) e parent. Nunca e-mail, IP, user-agent ou site (PLAN.md 6.5).
  - Datas: post_date (horário exibido no WordPress) com fuso -03:00, como no exemplo da seção 6.2.
  - Tags no estado do WordPress; a limpeza é feita depois por `make normalize-tags` (6.7).

Uso:
  python3 -I scripts/migracao/importar_wordpress.py --wxr ARQ.xml --wp2hugo DIR/content \
      --uploads DIR/uploads [--write]
Sem --write, só mostra o relatório (simulação).
"""
import argparse
import html
import json
import os
import re
import shutil
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

NS = {
    "wp": "http://wordpress.org/export/1.2/",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "excerpt": "http://wordpress.org/export/1.2/excerpt/",
}
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HOST = r"https?://(?:www\.)?blog\.aeciopires\.com"
FUSO = "-03:00"
CAT_IGNORADAS = {"uncategorized"}
# Páginas do WordPress que viram páginas do Hugo. "contato" já existe (Jotform); "home" e
# "home2" viram aliases (/home/ -> /, /home2/ -> /posts/).
PAGINAS_MIGRADAS = {"sobre", "cursos", "curso-docker", "curso-kubernetes-k8s"}
PAGINAS_ALIAS = {"home": "content/_index.md", "home2": "content/posts/_index.md", "contato": "content/contato/index.md"}
# /category/uncategorized/ (não migrada) -> /posts/: alias manual em content/posts/_index.md
ROTAS_DO_SITE = {"posts", "tags", "categories", "category", "tag", "page", "contato", "privacidade",
                 "creditos", "wp-content", "index.xml", "sitemap.xml"}
VARIANTE = re.compile(r"-\d+x\d+(?=\.[A-Za-z]+$)")


def t(el, caminho):
    return (el.findtext(caminho, namespaces=NS) or "").strip()


def ystr(s):
    """String YAML segura (JSON é YAML válido)."""
    return json.dumps(s, ensure_ascii=False)


def data_wp(s):
    return s.replace(" ", "T") + FUSO if s and not s.startswith("0000") else ""


def texto_puro(conteudo):
    """HTML do comentário -> texto puro com parágrafos (sem tags, entidades resolvidas)."""
    s = re.sub(r"(?i)<br\s*/?>", "\n", conteudo)
    s = re.sub(r"(?i)</p\s*>", "\n\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("\r", "")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def ler_wxr(caminho):
    ch = ET.parse(caminho).getroot().find("channel")
    itens = ch.findall("item")
    anexos = {}
    for i in itens:
        if t(i, "wp:post_type") == "attachment":
            meta = {t(m, "wp:meta_key"): t(m, "wp:meta_value") for m in i.findall("wp:postmeta", NS)}
            anexos[t(i, "wp:post_id")] = {
                "url": t(i, "wp:attachment_url"),
                "titulo": t(i, "title"),
                "alt": meta.get("_wp_attachment_image_alt", ""),
            }
    cats = {t(c, "wp:category_nicename"): t(c, "wp:cat_name") for c in ch.findall("wp:category", NS)}
    return itens, anexos, cats


def corpos_wp2hugo(diretorio):
    """post_id -> corpo Markdown (sem front matter) da saída do wp2hugo."""
    corpos = {}
    for raiz, _, arquivos in os.walk(diretorio):
        for nome in arquivos:
            if not nome.endswith(".md"):
                continue
            texto = open(os.path.join(raiz, nome), encoding="utf-8").read()
            m = re.match(r"^---\n(.*?)\n---\n?", texto, re.S)
            if not m:
                continue
            pid = re.search(r'^post_id:\s*"?(\d+)"?\s*$', m.group(1), re.M)
            if pid:
                corpos[pid.group(1)] = texto[m.end():]
    return corpos


def caminho_upload(url):
    # só mídias do próprio blog (caminho relativo, depois de self.links); URLs de outros sites
    # que também usam /wp-content/uploads/ (ex.: cncf.io) não são do backup
    if re.match(r"^[a-z]+://", url or "") and not re.match(HOST, url or ""):
        return ""
    m = re.search(r"/wp-content/uploads/(.+)$", url or "")
    return urllib.parse.unquote(m.group(1)) if m else ""


def crases_escapadas(p):
    """WordPress: crases digitadas em volta de <strong> viram \\` **x** \\` no wp2hugo -> `x`."""
    def codigo(m):
        x = re.sub(r"\\([\\`*_{}\[\]()#+\-.!<>|~])", r"\1", m.group(1).strip())
        x = x.replace("**", "").strip()
        return "`%s`" % x if "`" not in x else "``%s``" % x
    # o conteúdo não pode conter outra crase escapada nem "**" (evita atravessar trechos)
    p = re.sub(r"\\` ?\*\*((?:(?!\\`|\*\*).)+?)\\`\*\*", codigo, p)        # \` **x\`** (negrito fecha depois)
    p = re.sub(r"\\` ?\*\*((?:(?!\\`|\*\*).)+?)\*\* ?\\`", codigo, p)
    p = re.sub(r"\\`([^`\n]+?)\\`", codigo, p)
    return p


def niveis_titulos(corpo):
    """Evita saltos de nível (ex.: ## seguido de #####): cada título sobe no máximo 1 nível."""
    partes = re.split(r"(^```.*?^```[ \t]*$)", corpo, flags=re.S | re.M)
    anterior = 1

    def ajusta(m):
        nonlocal anterior
        nivel = min(len(m.group(1)), anterior + 1)
        anterior = nivel
        return "#" * nivel + " "
    return "".join(p if k % 2 else re.sub(r"^(#{2,6}) ", ajusta, p, flags=re.M) for k, p in enumerate(partes))


class Conversor:
    def __init__(self, permalinks, anexos_por_arquivo, slugs_publicados=()):
        self.permalinks = permalinks
        self.anexos = anexos_por_arquivo
        self.publicados = set(slugs_publicados)
        self.links_removidos = Counter()
        self.referenciados = set()
        self.html_restante = Counter()

    def alt_para(self, src):
        nome = os.path.basename(caminho_upload(src) or src)
        base = VARIANTE.sub("", nome)
        a = self.anexos.get(base) or self.anexos.get(nome)
        if a and (a["alt"] or a["titulo"]):
            return a["alt"] or a["titulo"]
        return re.sub(r"[-_]+", " ", os.path.splitext(base)[0]).strip()

    def links(self, s):
        def por_id(m):
            return self.permalinks.get(m.group(1), m.group(0))
        s = re.sub(HOST + r"/?\?p=(\d+)", por_id, s)
        s = re.sub(HOST + r"/?\?page_id=(\d+)", por_id, s)
        s = re.sub(HOST + r"(/[^\s)\"'\]>]*)", r"\1", s)
        s = re.sub(HOST + r"/?(?=[\s)\"'\]>]|$)", "/", s)
        return s

    def converter(self, corpo, ident):
        partes = re.split(r"(^```.*?^```[ \t]*$)", corpo, flags=re.S | re.M)
        self.rebaixar = False
        saida = []
        for k, p in enumerate(partes):
            if k % 2 == 1:          # bloco de código: intocado
                saida.append(p)
                continue
            p = crases_escapadas(p)
            p = re.sub(r"^\{\{<\s*/?gallery[^>]*>\}\}[ \t]*\n?", "", p, flags=re.M)
            p = re.sub(r'\{\{<\s*youtube\s+(?:id=)?"?([\w-]{6,})"?\s*>\}\}',
                       r'{{< youtubeLite id="\1" >}}', p)

            def figura(m):
                src = urllib.parse.unquote(m.group(1))
                src = self.links(src)
                if "/wp-content/uploads/" in src:
                    self.referenciados.add(caminho_upload(src))
                alt = m.group(2) or self.alt_para(src)
                cap = m.group(3)
                return '{{< figure src=%s alt=%s%s >}}' % (
                    ystr(src), ystr(alt), (" caption=" + ystr(cap)) if cap else "")
            p = re.sub(r'\{\{<\s*figure\s+src="([^"]*)"\s+alt="([^"]*)"\s+caption="([^"]*)"\s*>\}\}', figura, p)

            def imagem_md(m):
                src = urllib.parse.unquote(self.links(m.group(2)))
                if "/wp-content/uploads/" in src:
                    self.referenciados.add(caminho_upload(src))
                return "![%s](%s)" % (m.group(1) or self.alt_para(src), src)
            p = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", imagem_md, p)
            p = re.sub(r'<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)</a>', lambda m: "[%s](%s)" % (re.sub(r"<[^>]+>", "", m.group(2)) or m.group(1), m.group(1)), p, flags=re.S)
            p = self.links(p)
            # links para rascunhos do WordPress (não migrados; já davam 404): mantém só o texto
            # links internos para o que não foi publicado (rascunhos do WP, sem slug no WXR;
            # já davam 404): mantém só o texto, ou remove se o texto for o próprio endereço
            def interno(m):
                texto, slug = m.group(1).strip(), m.group(2)
                if slug in self.publicados or slug in ROTAS_DO_SITE:
                    return "[%s](%s)" % (texto, m.group(0)[m.group(0).rindex("](") + 2:-1])
                self.links_removidos[slug] += 1
                return "" if texto.strip("/") == slug else texto
            p = re.sub(r"\[([^\]]+)\]\(/([a-z0-9][a-z0-9-]*)/?(?:#[^)]*)?\)", interno, p)
            # o título vem do front matter: H1 no corpo vira H2 (e os demais descem um nível)
            if k == 0 and re.search(r"^# ", "".join(partes[::2]), re.M):
                self.rebaixar = True
            if getattr(self, "rebaixar", False):
                p = re.sub(r"^(#{1,5}) ", lambda m: "#" + m.group(1) + " ", p, flags=re.M)
            for u in re.findall(r"(?<![\w.])/wp-content/uploads/[^\s)\"'\]>]+", p):
                self.referenciados.add(caminho_upload(u))
            # HTML cru restante (fora de código inline) será omitido pelo Hugo: só contar
            sem_inline = re.sub(r"`[^`\n]*`", "", p)
            for tag in re.findall(r"<(?!!--)([a-zA-Z][a-zA-Z0-9]*)[\s>/]", sem_inline):
                self.html_restante[(ident, tag.lower())] += 1
            saida.append(p)
        return niveis_titulos(re.sub(r"\n{3,}", "\n\n", "".join(saida)).strip()) + "\n"


def descricao(excerpt, corpo):
    def limpo(txt):
        txt = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", txt)
        txt = re.sub(r"[*_`\\]|<[^>]+>|\{\{<[^>]*>\}\}", "", html.unescape(txt))
        return " ".join(txt.split())
    candidatos = [limpo(l) for l in corpo.split("\n\n")
                  if l.strip() and not l.lstrip().startswith(("{{", "#", "!", "```", "|", "-", ">"))]
    base = limpo(excerpt) if excerpt else next((c for c in candidatos if len(c) >= 60), candidatos[0] if candidatos else "")
    return base if len(base) <= 155 else base[:152].rsplit(" ", 1)[0] + "…"


def front_matter(campos):
    linhas = ["---"]
    for k, v in campos:
        if v is None or v == "" or v == []:
            continue
        if isinstance(v, bool):
            linhas.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, (int,)):
            linhas.append(f"{k}: {v}")
        elif isinstance(v, list):
            linhas.append(f"{k}: [{', '.join(ystr(x) for x in v)}]")
        elif k in ("date", "lastmod"):
            linhas.append(f"{k}: {v}")
        else:
            linhas.append(f"{k}: {ystr(v)}")
    linhas.append("---")
    return "\n".join(linhas) + "\n\n"


def comentarios(item):
    aprovados = []
    for c in item.findall("wp:comment", NS):
        if t(c, "wp:comment_approved") != "1" or t(c, "wp:comment_type") not in ("", "comment"):
            continue
        texto = texto_puro(c.findtext("wp:comment_content", namespaces=NS) or "")
        if not texto:
            continue
        aprovados.append({
            "id": int(t(c, "wp:comment_id")),
            "parent": int(t(c, "wp:comment_parent") or 0),
            "nome": html.unescape(t(c, "wp:comment_author")) or "Anônimo",
            "data": data_wp(t(c, "wp:comment_date")),
            "texto": texto,
        })
    ids = {c["id"] for c in aprovados}
    filhos = defaultdict(list)
    for c in sorted(aprovados, key=lambda c: (c["data"], c["id"])):
        filhos[c["parent"] if c["parent"] in ids else 0].append(c)
    ordem = []

    def visitar(pai, nivel):
        for c in filhos.get(pai, []):
            c["parent"] = pai if nivel > 0 else 0
            ordem.append(c)
            visitar(c["id"], nivel + 1)
    visitar(0, 0)
    return ordem


def yaml_comentarios(lista):
    out = []
    for c in lista:
        out.append(f"- id: {c['id']}")
        if c["parent"]:
            out.append(f"  parent: {c['parent']}")
        out.append(f"  nome: {ystr(c['nome'])}")
        out.append(f"  data: {ystr(c['data'])}")
        out.append(f"  texto: {ystr(c['texto'])}")
    return "# Comentários do blog antigo (WordPress), somente leitura. Só nome, data e texto (PLAN.md 6.5).\n" + "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wxr", required=True)
    ap.add_argument("--wp2hugo", required=True, help="diretório content/ gerado pelo wp2hugo")
    ap.add_argument("--uploads", required=True)
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()

    itens, anexos, nomes_cat = ler_wxr(a.wxr)
    corpos = corpos_wp2hugo(a.wp2hugo)
    publicados = [i for i in itens if t(i, "wp:status") == "publish" and t(i, "wp:post_type") in ("post", "page")]
    permalinks = {t(i, "wp:post_id"): f"/{t(i, 'wp:post_name')}/" for i in publicados}
    for nome, destino in (("home", "/"), ("home2", "/posts/")):
        for i in publicados:
            if t(i, "wp:post_name") == nome:
                permalinks[t(i, "wp:post_id")] = destino
    por_arquivo = {}
    for an in anexos.values():
        nome = os.path.basename(caminho_upload(an["url"]))
        if nome:
            por_arquivo[nome] = an
    conv = Conversor(permalinks, por_arquivo, {t(i, "wp:post_name") for i in publicados})

    relatorio = Counter()
    escritas = []          # (caminho, conteúdo)
    copias = []            # (origem, destino)
    cats_usadas = Counter()
    total_coment = 0
    aliases_extra = defaultdict(list)

    for i in publicados:
        tipo, slug, pid = t(i, "wp:post_type"), t(i, "wp:post_name"), t(i, "wp:post_id")
        if tipo == "page" and slug in PAGINAS_ALIAS:
            aliases_extra[PAGINAS_ALIAS[slug]].append((f"/{slug}/", pid))
            if slug != "contato":
                continue
        if tipo == "page" and slug not in PAGINAS_MIGRADAS and slug != "contato":
            relatorio["paginas_ignoradas"] += 1
            continue
        corpo_md = corpos.get(pid)
        if corpo_md is None:
            print(f"AVISO: sem corpo do wp2hugo para {tipo} {slug} ({pid})", file=sys.stderr)
            corpo_md = ""
        dominio = defaultdict(list)
        for c in i.findall("category"):
            dominio[c.get("domain")].append(c.get("nicename"))
        categorias = [c for c in dominio["category"] if c not in CAT_IGNORADAS]
        tags = [x for x in dominio["post_tag"]]
        cats_usadas.update(categorias)
        meta = {t(m, "wp:meta_key"): t(m, "wp:meta_value") for m in i.findall("wp:postmeta", NS)}
        bundle = os.path.join("content", "posts" if tipo == "post" else "", slug).replace(os.sep + os.sep, os.sep)
        bundle = os.path.join("content", "posts", slug) if tipo == "post" else os.path.join("content", slug)

        corpo = conv.converter(corpo_md, slug) if slug != "contato" else ""
        thumb = anexos.get(meta.get("_thumbnail_id", ""))
        if thumb and tipo == "post":
            rel = caminho_upload(thumb["url"])
            origem = os.path.join(a.uploads, rel)
            if os.path.isfile(origem):
                copias.append((origem, os.path.join(RAIZ, bundle, "feature" + os.path.splitext(rel)[1].lower())))
                conv.referenciados.add(rel)
            else:
                relatorio["feature_ausente"] += 1
        campos = [
            ("title", html.unescape(t(i, "title"))),
            ("slug", slug),
            ("date", data_wp(t(i, "wp:post_date"))),
            ("lastmod", data_wp(t(i, "wp:post_modified"))),
            ("draft", False),
            ("categories", categorias if tipo == "post" else []),
            ("tags", tags if tipo == "post" else []),
            ("description", descricao(html.unescape(t(i, "excerpt:encoded")), corpo)),
            ("wp_id", int(pid)),
        ]
        if tipo == "page":
            campos += [("showDate", False), ("showReadingTime", False), ("showWordCount", False), ("showAuthor", False)]
        lista = comentarios(i)
        if lista:
            total_coment += len(lista)
            escritas.append((os.path.join(RAIZ, "data", "comments", f"{slug}.yaml"), yaml_comentarios(lista)))
        if slug == "contato":
            continue           # a página Contato do Hugo já existe; só recebe wp_id (abaixo)
        escritas.append((os.path.join(RAIZ, bundle, "index.md"), front_matter(campos) + corpo))
        relatorio[tipo] += 1

    # mídias: originais + variações referenciadas
    for raiz, _, arquivos in os.walk(a.uploads):
        for nome in arquivos:
            rel = os.path.relpath(os.path.join(raiz, nome), a.uploads)
            if not re.search(r"\.(png|jpe?g|gif|webp|svg|pdf)$", nome, re.I):
                continue
            if VARIANTE.search(nome) and rel not in conv.referenciados:
                relatorio["variacoes_descartadas"] += 1
                continue
            copias.append((os.path.join(raiz, nome), os.path.join(RAIZ, "static", "wp-content", "uploads", rel)))
            relatorio["midias_copiadas"] += 1
    faltando = sorted(r for r in conv.referenciados if r and not os.path.isfile(os.path.join(a.uploads, r)))

    # categorias: título exibido = nome do WordPress (ex.: zabbix-2 -> "Zabbix")
    for slug_cat in sorted(cats_usadas):
        escritas.append((os.path.join(RAIZ, "content", "categories", slug_cat, "_index.md"),
                         front_matter([("slug", slug_cat), ("title", nomes_cat.get(slug_cat, slug_cat))])))

    print(f"posts: {relatorio['post']} · páginas: {relatorio['page']} (+ contato com wp_id) · "
          f"comentários: {total_coment} · mídias: {relatorio['midias_copiadas']} "
          f"(variações descartadas: {relatorio['variacoes_descartadas']}) · "
          f"imagem destacada ausente: {relatorio['feature_ausente']}")
    print(f"categorias em uso ({len(cats_usadas)}): {', '.join(f'{c}={n}' for c, n in cats_usadas.most_common())}")
    print(f"aliases de páginas: {dict(aliases_extra)}")
    if conv.links_removidos:
        print(f"links internos para itens não publicados (removidos): {dict(conv.links_removidos)}")
    if faltando:
        print(f"MÍDIAS REFERENCIADAS AUSENTES NO BACKUP ({len(faltando)}): {faltando[:20]}")
    html_por_post = Counter()
    for (ident, tag), n in conv.html_restante.items():
        html_por_post[ident] += n
    print(f"HTML cru restante (será omitido; revisar na Fase 4): {sum(html_por_post.values())} ocorrência(s) em {len(html_por_post)} item(ns)")
    for ident, n in html_por_post.most_common(15):
        tags = sorted({tg for (i2, tg) in conv.html_restante if i2 == ident})
        print(f"  {ident}: {n} ({', '.join(tags)})")

    if not a.write:
        print("\nSIMULAÇÃO: nada foi gravado. Use --write.")
        return
    for caminho, texto in escritas:
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            f.write(texto)
    for origem, destino in copias:
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.copy2(origem, destino)
    # aliases de páginas e wp_id da Contato
    for arquivo, pares in aliases_extra.items():
        p = os.path.join(RAIZ, arquivo)
        texto = open(p, encoding="utf-8").read()
        als = [al for al, _ in pares if not (arquivo.endswith("contato/index.md"))]
        extra = ""
        m = re.search(r"^aliases:\s*\[(.*)\]\s*$", texto, re.M)
        if als and m:                      # junta com os aliases que já existem
            atuais = [x.strip().strip('"') for x in m.group(1).split(",") if x.strip()]
            todos = sorted(set(atuais) | set(als))
            texto = texto.replace(m.group(0), f"aliases: [{', '.join(ystr(x) for x in todos)}]")
            open(p, "w", encoding="utf-8").write(texto)
        elif als:
            extra += f"aliases: [{', '.join(ystr(x) for x in als)}]\n"
        if arquivo.endswith("contato/index.md"):
            extra += f"wp_id: {int(pares[0][1])}\n"
        if extra and extra.strip() not in texto:
            texto = texto.replace("---\n", "---\n" + extra, 1)
            open(p, "w", encoding="utf-8").write(texto)
    print(f"\ngravado: {len(escritas)} arquivo(s), {len(copias)} cópia(s) de mídia.")


if __name__ == "__main__":
    main()
