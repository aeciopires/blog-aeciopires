---
name: escrever-post
description: Escreve um post novo do blog em pt-BR (por exemplo, apresentando um repositório ou ferramenta do autor), testando cada comando antes de publicar. Use quando pedirem para escrever, criar ou rascunhar um post.
---

# escrever-post

Cria um post em `content/posts/<slug>/index.md` seguindo o `CLAUDE.md`. O post fica como **rascunho** (`draft: true`) até o autor revisar; publicar é `make publish-post SLUG=<slug>`, só com pedido dele.

## Passo a passo

1. **Fonte do conteúdo.** Leia o material de origem inteiro: README, `docs/`, `CHANGELOG.md`, releases e licença (`gh api repos/<dono>/<repo>/readme`, `.../contents/docs`, `.../releases/latest`, `.../license`). Use só o que está lá; dúvida → pergunte ao autor.
2. **Teste antes de escrever** (protocolo da skill `revisar-conteudo`, seção "Como testar com segurança"): imagem publicada (`docker run` do início rápido), endpoints principais, modos especiais (ex.: `--once` e código de saída) e, se houver Helm chart, instalação num kind dedicado. Teste o exemplo **exatamente** como vai no post e anote as versões.
3. **Crie o rascunho:** `make new-post SLUG=<slug>` (slug curto, minúsculo, sem acento; nunca muda depois de publicado).
4. **Front matter:** `title` (específico, com o benefício), `description` (até ~155 caracteres; vai para o SEO e os cards), `categories` e 1–5 `tags` **só** de `data/taxonomia.yaml` (tag nova: `make new-tag`), `date` com `-03:00`.
5. **Estrutura sugerida** para apresentar uma ferramenta:
   - problema real que motivou (1–2 parágrafos, primeira pessoa, tom do autor);
   - "Como funciona" com um diagrama `{{< mermaid >}}` simples;
   - principais recursos (lista curta, em português);
   - teste rápido (um comando copiável) e o que abrir no navegador;
   - stack completa/Compose, Kubernetes/Helm, configuração (tabela das opções mais usadas);
   - conclusão com o link do repositório, licença e convite a contribuir; link interno para cursos ou posts relacionados (`/curso-docker/`, `/curso-kubernetes-k8s/`, `/primeiros-passos-com-docker/`).
6. **Imagens:** `feature.png` na pasta do post (imagem própria do autor ou captura da própria ferramenta; nunca de terceiros sem licença). Otimize com `mise exec -- oxipng -q -o 4 --strip safe <arquivo>`. Toda imagem com `alt`; legenda com `{{< figure ... caption="..." >}}`.
7. **Links:** externos em Markdown normal (abrem sozinhos em nova aba pelo tema; não escreva `target`); internos sempre relativos (`/slug/`) ou `{{< ref >}}`, nunca `https://blog.aeciopires.com/...`.
8. **Comandos nos exemplos:** use a tag de versão fixa da imagem (não `latest`), portas padrão do projeto, e explique o que trocar (`aeciopires` → sua organização). Placeholders evidentes; nada de token, e-mail ou dado pessoal.
9. **Revise:** `make verificar-texto SLUG=<slug>`, `make prosa SLUG=<slug>` (gramática, ver `revisar-conteudo`), `make validate-diagrams`, `make lint-md validate` e `make serve` (rascunhos aparecem só no `make serve`; confira claro, escuro e celular em 360 e 412 px, sem rolagem horizontal).
10. **Limpeza** dos testes como na `revisar-conteudo`. Commit/PR só com pedido do autor.
11. **Ao entregar**, avise que o post é rascunho: aparece no `make serve`, mas não no `make serve-prod` nem no site (página e card da home) até `make publish-post SLUG=<slug> DATE=now`. Não é erro de renderização.

## Não faça

- Copiar o README em inglês: escreva em pt-BR, explicando o porquê, com exemplos testados.
- Publicar (`draft: false`) sem o autor pedir.
- Incluir HTML cru, iframes ou scripts de terceiros (CSP); use shortcodes.
