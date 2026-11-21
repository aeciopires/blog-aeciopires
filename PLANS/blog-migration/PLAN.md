# Plano de migração: blog.aeciopires.com (WordPress) → Hugo + Blowfish + GitHub Pages + Cloudflare

> **Status:** plano aprovado em partes e guardado como **registro histórico** em `PLANS/blog-migration/` (decisões na seção 18). Nada foi implementado ainda.
> **Repositório:** `github.com/aeciopires/blog-aeciopires`
> **Domínio final:** `https://blog.aeciopires.com`
> **Tema:** [Blowfish](https://blowfish.page/) v3.10.0 como *git submodule*, visual **T9 · Blowfish Vitrine** (modos escuro e claro, como o blowfish.page). Segue a documentação oficial do Hugo e do Blowfish e usa a *agent skill* do Blowfish (seções 3.2.2 e 3.6).
> **Comentários:** os antigos ficam somente leitura; os novos entram via **giscus** (GitHub Discussions), seção 6.6.
> **Cloudflare (plano Free):** continua responsável por DNS, proxy, cache, segurança e analytics.
> **Ferramentas:** gerenciadas pelo [mise](https://mise.jdx.dev/); Docker/Compose (e Colima no macOS) gerenciados por fora.

## Sumário

1. [Diagnóstico do blog atual](#1-diagnóstico-do-blog-atual)
2. [Arquitetura alvo](#2-arquitetura-alvo)
3. [Tema Blowfish](#3-tema-blowfish)
4. [Estrutura do repositório](#4-estrutura-do-repositório)
5. [Fases da migração](#5-fases-da-migração)
6. [Conversão do conteúdo](#6-conversão-do-conteúdo)
7. [Preservação de URLs e SEO](#7-preservação-de-urls-e-seo)
8. [Pipeline de publicação (GitHub Actions)](#8-pipeline-de-publicação-github-actions)
9. [Ambiente local: mise, Make e Docker](#9-ambiente-local-mise-make-e-docker)
10. [Domínio, DNS e integração Cloudflare ↔ GitHub Pages](#10-domínio-dns-e-integração-cloudflare--github-pages)
11. [Cloudflare: cache e segurança](#11-cloudflare-cache-e-segurança)
12. [Manutenção e atualizações ao longo do tempo](#12-manutenção-e-atualizações-ao-longo-do-tempo)
13. [Documentação do projeto (arquitetura e manutenção)](#13-documentação-do-projeto-arquitetura-e-manutenção)
14. [CLAUDE.md](#14-claudemd)
15. [Substituição dos plugins do WordPress](#15-substituição-dos-plugins-do-wordpress)
16. [Checklist de validação](#16-checklist-de-validação)
17. [Riscos e rollback](#17-riscos-e-rollback)
18. [Decisões](#18-decisões)

---

## 1. Diagnóstico do blog atual

Levantamento feito em 19/11/2026 via HTML público e API REST do WordPress (`/wp-json/wp/v2`).

| Item | Valor encontrado |
|---|---|
| Plataforma | WordPress 7.1.5 |
| Tema | **SolarGrove 1.5** (Themegrove) — tema *full-site editing* (blocos), sem versão para Hugo |
| Fonte | **Heebo** (Google Fonts) |
| Cores principais | `#1c6470` (teal — cabeçalho, botões de curso) · `#ff7c2a` (laranja — botões, tags) · `#111111` (texto/faixas) · `#f5f8fe` (fundo da sidebar) |
| Posts | **81** (mais antigo: 18/04/2013, mais recente: 06/11/2026) |
| Páginas | Sobre, Cursos, Contato (+ eventuais páginas ocultas — a API de páginas retorna 403, confirmar pelo painel) |
| Formulário de contato | **Jotform** embutido via script `form.jotformz.com/jsform/<ID>` |
| Categorias | 26 (ex.: tutoriais 41, devops 37, docker 37, kubernetes 23, git 21…), algumas vazias |
| Tags | 224 |
| Mídias | 211 arquivos em `wp-content/uploads` (banner da home: `wp-content/uploads/2024/11/b.jpeg`) |
| Comentários | 219 |
| Permalink | `/%postname%/` → ex.: `https://blog.aeciopires.com/helm-chart-zabbix-8-0-0/` |
| Plugins visíveis | Jetpack (+ Boost, Stats), Google Site Kit, MonsterInsights, Akismet |
| DNS | Cloudflare (`dax`/`kara.ns.cloudflare.com`), registro `blog` com proxy ativo |

**Layout atual:**

| Home | Post |
|---|---|
| ![Home atual](images/01-atual-home.png) | ![Post atual](images/02-atual-post.png) |

---

## 2. Arquitetura alvo

![Arquitetura e pipeline](images/03-arquitetura-pipeline.png)

- **Gerador:** Hugo *extended* + tema **Blowfish**, instalado como **git submodule** em `themes/blowfish` e fixado numa tag de release (seção 3.3).
- **Versões das ferramentas:** definidas uma única vez em `mise.toml` e usadas igualmente na máquina local e na CI (`jdx/mise-action`). O Docker usa a imagem oficial do Hugo na mesma versão.
- **Conteúdo:** Markdown em *page bundles* (`content/posts/<slug>/index.md` + imagens do post na mesma pasta).
- **Origem:** GitHub Pages com fonte **GitHub Actions**. O Pages só faz build automático para Jekyll; para Hugo **é necessário um workflow** (seção 8).
- **Borda:** Cloudflare Free em modo **proxy** — DNS, TLS de borda, DDoS, WAF, rate limit, cache, redirects, headers de segurança e **Cloudflare Web Analytics**.
- **Busca:** a nativa do Blowfish (Fuse.js sobre um `index.json` gerado no build, sem servidor e sem dependências extras).
- **Contato:** formulário **Jotform** já existente.
- **Comentários:** os 219 antigos viram HTML estático, somente leitura (seção 6.5). Os novos usam **giscus**, guardados no GitHub Discussions do próprio repositório, com login do GitHub (seção 6.6).
- **Publicação:** cada `git push` em `main` publica. Não haverá agendamento automático (baixa frequência de posts).
- **Acesso direto à origem do GitHub Pages:** aceito como risco residual (seção 11.6).

---

## 3. Tema Blowfish

### 3.1 Por que Blowfish

Tema Hugo muito ativo, baseado em Tailwind. Traz pronto quase tudo que o blog precisa: esquemas de cores customizáveis, modo claro/escuro, cards com imagem destacada, busca embutida, índice (TOC), breadcrumbs, botão de copiar código, compartilhamento, caixa do autor, posts relacionados, páginas de tags/categorias e vários shortcodes (`alert`, `button`, `github`, `mermaid`, `tabs`, `youtubeLite`…). Suporta PT-BR.

### 3.2 Demonstração (mockups com o conteúdo real do blog)

> Os mockups simulam o Blowfish já customizado com a paleta, a fonte e o banner atuais. As notas amarelas indicam o recurso ou a configuração responsável por cada elemento.

**Home** — cabeçalho, banner atual, chamada, botões dos cursos, cards de posts recentes e rodapé:

![Home Blowfish](images/07-blowfish-home.png)

**Post (conteúdo)** — hero com imagem destacada, breadcrumbs, metadados, categorias e tags, TOC, alerta, comandos com destaque de sintaxe e botão Copiar, tabela e citação:

![Post Blowfish](images/08-blowfish-post-conteudo.png)

**Post (final)** — compartilhamento, autor, anterior/próximo, relacionados e comentários antigos somente leitura:

![Fim do post](images/09-blowfish-post-autor-comentarios.png)

**Tags e categorias** — página de termos com contagem e listagem de uma tag agrupada por ano:

![Tags](images/10-blowfish-tags-categorias.png)

**Contato** — formulário Jotform atual embutido via script (como hoje) + outros canais:

![Contato](images/11-blowfish-contato.png)

**Modo escuro:**

![Modo escuro](images/12-blowfish-modo-escuro.png)

**Celular** — home, menu aberto e post em modo escuro:

![Mobile](images/13-blowfish-mobile.png)

**Cabeçalho, busca, rodapé e shortcodes:**

![Componentes](images/14-blowfish-cabecalho-busca-rodape.png)

### 3.2.1 Catálogo de temas (escolha pelo código T1–T10)

Os mockups 07–14 mostram **todos os recursos** do Blowfish. O catálogo abaixo mostra **as mesmas páginas em 10 propostas**, cada uma com nome e código, para facilitar a escolha. Todas usam o mesmo tema Blowfish:

- **T1–T7** mudam apenas o esquema de cores e a aparência padrão.
- **T8–T10** reproduzem o estilo de sites de referência e mudam também layout, tipografia e alguns componentes (detalhes e esforço em cada proposta).

Paletas lado a lado, com o contraste WCAG de cada uma (verde = passa no AA ≥ 4,5:1):

![Paletas e contraste](images/temas/00-paletas-e-contraste.png)

![Paletas e contraste T8–T10](images/temas/00-paletas-t8-t10.png)

| Código | Nome | Proposta | Aparência padrão | Esquema (`colorScheme`) | Ajuste de contraste necessário | Imagens |
|---|---|---|---|---|---|---|
| **T1** | **Claro Clássico** | Fundo claro com teal e laranja; o mais próximo do blog atual. Modo escuro opcional. | claro (escuro opcional) | `aeciopires` (próprio) | botão (texto branco no laranja) 2,6:1 e tags 3,1:1 → usar laranja mais escuro `#c2410c` nos botões e tags | [home](images/temas/T1-claro-classico/computador-home.png) · [post](images/temas/T1-claro-classico/computador-post.png) · [celular](images/temas/T1-claro-classico/celular.png) |
| **T2** | **Azul Blowfish** | Azul-marinho com gradiente, cabeçalho flutuante translúcido e botão azul, como o [blowfish.page](https://blowfish.page/). | escuro | `blowfish` (nativo do tema) | — | [home](images/temas/T2-azul-blowfish/computador-home.png) · [post](images/temas/T2-azul-blowfish/computador-post.png) · [celular](images/temas/T2-azul-blowfish/celular.png) |
| **T3** | **Noite Teal** | Escuro com as cores atuais sem ajuste (teal + laranja vivo). | escuro | `aeciopires-dark` (próprio) | botão 2,6:1 → texto escuro no botão laranja | [home](images/temas/T3-noite-teal/computador-home.png) · [post](images/temas/T3-noite-teal/computador-post.png) · [celular](images/temas/T3-noite-teal/celular.png) |
| **T4** | **Oceano** | Azul-petróleo profundo + teal/ciano. Tons análogos e calmos; evolução natural do teal atual. | escuro | `oceano` (próprio) | — | [home](images/temas/T4-oceano/computador-home.png) · [post](images/temas/T4-oceano/computador-post.png) · [celular](images/temas/T4-oceano/celular.png) |
| **T5** | **Grafite Âmbar** | Cinza grafite neutro + âmbar quente. Sóbrio, ótimo para leitura de código. | escuro | `grafite-ambar` (próprio) | — | [home](images/temas/T5-grafite-ambar/computador-home.png) · [post](images/temas/T5-grafite-ambar/computador-post.png) · [celular](images/temas/T5-grafite-ambar/celular.png) |
| **T6** | **Índigo** | Índigo noturno + violeta/lilás. Tons análogos, moderno. | escuro | `indigo` (próprio) | — | [home](images/temas/T6-indigo/computador-home.png) · [post](images/temas/T6-indigo/computador-post.png) · [celular](images/temas/T6-indigo/celular.png) |
| **T7** | **Teal Coral** | Identidade atual refinada: teal mais luminoso + laranja suavizado para coral. Complementares equilibrados. | escuro | `teal-coral` (próprio) | — | [home](images/temas/T7-teal-coral/computador-home.png) · [post](images/temas/T7-teal-coral/computador-post.png) · [celular](images/temas/T7-teal-coral/celular.png) |
| **T8** | **Ciano Minimal** | Mesmo estilo e CSS do [agha.dev](https://agha.dev) (também feito com Blowfish): preto profundo com brilho ciano nos cantos, cabeçalho flutuante com borda, home em layout de perfil, lista de posts em cards só de texto, tags contornadas, fontes Inter + Fira Code. | escuro | `ciano` (próprio, mesmas escalas do agha.dev) | — | [home](images/temas/T8-ciano-minimal/computador-home.png) · [post](images/temas/T8-ciano-minimal/computador-post.png) · [celular](images/temas/T8-ciano-minimal/celular.png) |
| **T9** | **Blowfish Vitrine** | Mesmo estilo e CSS do [blowfish.page](https://blowfish.page) **atual**: arte de fundo no topo, título gigante com *eyebrow*, botões azul + contorno, cards de vidro (*glass*), números em destaque, alertas azuis, código inline coral. Evolução do T2, que mostrava a versão anterior do site. | escuro | `blowfish` (nativo do tema) | — | [home](images/temas/T9-blowfish-vitrine/computador-home.png) · [post](images/temas/T9-blowfish-vitrine/computador-post.png) · [celular](images/temas/T9-blowfish-vitrine/celular.png) |
| **T10** | **Material Teal** | Segue o [Material Design 3](https://m3.material.io): esquema de cores *tonal spot* gerado da semente `#1c6470` (teal atual), *navigation rail* no computador e *navigation drawer* no celular, barra de busca, cantos de 28 px, botões em pílula, *chips* de tags, tipografia Roboto Flex. Modos **claro e escuro** com alternância automática pelo sistema. | claro + escuro (automático) | `material-teal` (próprio, gerado pela biblioteca oficial do M3) | — | claro: [home](images/temas/T10-material-teal/computador-home-claro.png) · [post](images/temas/T10-material-teal/computador-post-claro.png) · [celular](images/temas/T10-material-teal/celular-claro.png) — escuro: [home](images/temas/T10-material-teal/computador-home-escuro.png) · [post](images/temas/T10-material-teal/computador-post-escuro.png) · [celular](images/temas/T10-material-teal/celular-escuro.png) |

> **Escolhido: T9 · Blowfish Vitrine**, com o botão de modo claro no padrão oficial do blowfish.page (seção 3.2.2). As demais propostas ficam como registro histórico.

Contraste WCAG AA (≥ 4,5:1) de T8–T10: **todos os itens passam**. Os valores de cada item estão na folha `00-paletas-t8-t10.png`.

#### T1 · Claro Clássico

Fundo claro com teal e laranja; o mais próximo do blog atual. Modo escuro opcional.

| Computador — home | Computador — post |
|---|---|
| ![T1 home](images/temas/T1-claro-classico/computador-home.png) | ![T1 post](images/temas/T1-claro-classico/computador-post.png) |

**Celular** (home, menu aberto, post):

![T1 celular](images/temas/T1-claro-classico/celular.png)

#### T2 · Azul Blowfish

Azul-marinho com gradiente, cabeçalho flutuante translúcido e botão azul, como o [blowfish.page](https://blowfish.page/).

| Computador — home | Computador — post |
|---|---|
| ![T2 home](images/temas/T2-azul-blowfish/computador-home.png) | ![T2 post](images/temas/T2-azul-blowfish/computador-post.png) |

**Celular** (home, menu aberto, post):

![T2 celular](images/temas/T2-azul-blowfish/celular.png)

#### T3 · Noite Teal

Escuro com as cores atuais sem ajuste (teal + laranja vivo).

| Computador — home | Computador — post |
|---|---|
| ![T3 home](images/temas/T3-noite-teal/computador-home.png) | ![T3 post](images/temas/T3-noite-teal/computador-post.png) |

**Celular** (home, menu aberto, post):

![T3 celular](images/temas/T3-noite-teal/celular.png)

#### T4 · Oceano

Azul-petróleo profundo + teal/ciano. Tons análogos e calmos; evolução natural do teal atual.

| Computador — home | Computador — post |
|---|---|
| ![T4 home](images/temas/T4-oceano/computador-home.png) | ![T4 post](images/temas/T4-oceano/computador-post.png) |

**Celular** (home, menu aberto, post):

![T4 celular](images/temas/T4-oceano/celular.png)

#### T5 · Grafite Âmbar

Cinza grafite neutro + âmbar quente. Sóbrio, ótimo para leitura de código.

| Computador — home | Computador — post |
|---|---|
| ![T5 home](images/temas/T5-grafite-ambar/computador-home.png) | ![T5 post](images/temas/T5-grafite-ambar/computador-post.png) |

**Celular** (home, menu aberto, post):

![T5 celular](images/temas/T5-grafite-ambar/celular.png)

#### T6 · Índigo

Índigo noturno + violeta/lilás. Tons análogos, moderno.

| Computador — home | Computador — post |
|---|---|
| ![T6 home](images/temas/T6-indigo/computador-home.png) | ![T6 post](images/temas/T6-indigo/computador-post.png) |

**Celular** (home, menu aberto, post):

![T6 celular](images/temas/T6-indigo/celular.png)

#### T7 · Teal Coral

Identidade atual refinada: teal mais luminoso + laranja suavizado para coral. Complementares equilibrados.

| Computador — home | Computador — post |
|---|---|
| ![T7 home](images/temas/T7-teal-coral/computador-home.png) | ![T7 post](images/temas/T7-teal-coral/computador-post.png) |

**Celular** (home, menu aberto, post):

![T7 celular](images/temas/T7-teal-coral/celular.png)

#### T8 · Ciano Minimal (estilo agha.dev)

Referência analisada em 19/11/2026: o [agha.dev](https://agha.dev) usa o próprio Blowfish (Tailwind v4) com um esquema de cores personalizado. As características reproduzidas são:

- **Cores:**
  - neutros em cinza puro, com fundo `rgb(10,10,10)`;
  - primária ciano, com `primary-400` `#00ccff`;
  - secundária azul-acinzentada;
  - gradiente radial azul-petróleo nos cantos do fundo.
- **Tipografia:** Inter no texto e Fira Code no código.
- **Home:** layout `profile`, com avatar grande, nome, *headline* e ícones sociais. Para o blog, acrescentam-se os botões dos cursos e a lista de posts recentes, que o agha.dev não mostra na home.
- **Componentes:**
  - posts em cards de texto, só com borda e sem imagem;
  - tags contornadas em ciano;
  - TOC à direita com borda lateral;
  - código inline com fundo escuro e negrito.

| Computador · home | Computador · post |
|---|---|
| ![T8 home](images/temas/T8-ciano-minimal/computador-home.png) | ![T8 post](images/temas/T8-ciano-minimal/computador-post.png) |

![T8 celular](images/temas/T8-ciano-minimal/celular.png)

#### T9 · Blowfish Vitrine (estilo blowfish.page atual)

O [blowfish.page](https://blowfish.page) usa o esquema nativo **`blowfish`**:

- neutros azul-marinho, de `#0d1233` a `#f6f7fc`;
- primária azul `#4a9ef0`;
- secundária coral `#f0705a`.

Sobre esse esquema, o site acrescenta:

- arte de fundo no topo (`homepage.layout = "background"` e `heroStyle = "background"`);
- cabeçalho flutuante com desfoque;
- cards de vidro, ou seja, fundo semitransparente com `backdrop-filter`.

O T2 reproduzia a versão anterior do site. O T9 reproduz a atual.

- **Arte de fundo:** a ilustração do blowfish.page é do próprio projeto e não deve ser copiada. Nos mockups ela foi simulada com gradientes CSS. Na implementação, será usada uma arte própria (por exemplo, o banner atual em versão escura ou uma imagem com licença livre), em `assets/img/background.webp`.
- **Esforço extra:** o efeito de vidro e os números em destaque (81 posts, 26 categorias, 20 anos) exigem `custom.css` e um partial `layouts/partials/home/custom.html`.

| Computador · home | Computador · post |
|---|---|
| ![T9 home](images/temas/T9-blowfish-vitrine/computador-home.png) | ![T9 post](images/temas/T9-blowfish-vitrine/computador-post.png) |

![T9 celular](images/temas/T9-blowfish-vitrine/celular.png)

#### T10 · Material Teal (Material Design 3, claro e escuro)

Segue as especificações do [Material Design 3](https://m3.material.io):

- **Cor:**
  - Esquema *tonal spot* gerado pela biblioteca oficial [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities), com a cor semente `#1c6470` (teal atual do blog). Assim, a identidade do blog se mantém dentro das regras do M3.
  - Os papéis de cor (`primary`, `surface`, `surfaceContainer*`, `secondaryContainer`, `tertiaryContainer` etc.) já vêm com contraste garantido pelo algoritmo.
- **Formas:**
  - containers grandes com 28 px de cantos (`extra-large`);
  - cards com 24 px;
  - imagens com 16 px;
  - chips com 8 px;
  - botões em pílula.
- **Navegação, conforme o tamanho da tela:**
  - **computador:** *navigation rail* com FAB de busca, indicador ativo em pílula e alternância de tema no rodapé;
  - **celular:** *top app bar* com *navigation drawer* modal (são 7 destinos, mais do que os 3–5 que a *navigation bar* comporta).
- **Tipografia:** escala M3 (*display-large* 57/64, *headline*, *title*, *body-large* 16/24) com **Roboto Flex** *self-hosted*. A Google Sans, usada no m3.material.io, não tem licença livre para uso próprio.
- **Componentes:** *search bar*, *filled*/*tonal*/*outlined buttons*, *assist*/*filter chips*, *elevated*/*filled cards* e alertas em `tertiaryContainer`.
- **Modos:** claro e escuro com `autoSwitchAppearance = true`, que segue o sistema, mais o botão manual.

**Esforço:** é a proposta mais trabalhosa. Cores, formas e tipografia saem de um esquema e de `custom.css`. Já o *navigation rail* e o *drawer* exigem sobrescrever os partials de cabeçalho do Blowfish (`layouts/partials/header/*.html`). Esses overrides precisam ser revisados a cada atualização do tema (seção 3.6).

| Modo | Computador · home | Computador · post |
|---|---|---|
| Claro | ![T10 claro home](images/temas/T10-material-teal/computador-home-claro.png) | ![T10 claro post](images/temas/T10-material-teal/computador-post-claro.png) |
| Escuro | ![T10 escuro home](images/temas/T10-material-teal/computador-home-escuro.png) | ![T10 escuro post](images/temas/T10-material-teal/computador-post-escuro.png) |

![T10 celular claro](images/temas/T10-material-teal/celular-claro.png)

![T10 celular escuro](images/temas/T10-material-teal/celular-escuro.png)

### 3.2.2 Tema escolhido: T9 · Blowfish Vitrine (versão final)

Decisão: **T9**, seguindo o padrão oficial do [blowfish.page](https://blowfish.page):

- **Esquema de cores:** `blowfish`, o nativo do tema.
- **Aparência:**
  - abre no modo escuro (`defaultAppearance = "dark"`);
  - acompanha o modo do sistema operacional (`autoSwitchAppearance = true`);
  - **mantém o botão de alternar claro/escuro** no cabeçalho.
  Esses são os mesmos valores que o blowfish.page usa (`data-default-appearance="dark"` e `data-auto-appearance="true"`, conferidos em 20/11/2026).
- **Modo claro:** como no blowfish.page, usa a mesma arte de fundo com um véu claro por cima, cards de vidro claros, texto azul-marinho (`neutral-900`), botões e links azuis (`primary-600`), código inline em coral escuro (`secondary-700`) e alertas em azul-claro (`primary-100`).
- **Tipografia:** a pilha de fontes do sistema, como o blowfish.page (`-apple-system, "Segoe UI", Roboto…`). Não há fonte web para baixar nem licença de fonte para gerenciar. A Heebo do blog antigo sai.

As telas finais incluem:

- o **banner de tecnologias** novo (seção 3.7);
- os **comentários**, com os novos via giscus e os arquivados (seção 6.6);
- o **aviso de licença do tema** no rodapé (seção 3.8).

| Modo | Computador · home | Computador · post |
|---|---|---|
| Escuro | ![T9 escuro home](images/temas/T9-blowfish-vitrine/final/computador-home-escuro.png) | ![T9 escuro post](images/temas/T9-blowfish-vitrine/final/computador-post-escuro.png) |
| Claro | ![T9 claro home](images/temas/T9-blowfish-vitrine/final/computador-home-claro.png) | ![T9 claro post](images/temas/T9-blowfish-vitrine/final/computador-post-claro.png) |

![T9 celular escuro](images/temas/T9-blowfish-vitrine/final/celular-escuro.png)

![T9 celular claro](images/temas/T9-blowfish-vitrine/final/celular-claro.png)

**Navegação pelos posts antigos: paginação, não rolagem infinita**

- **Home:** mostra os 6 posts mais recentes e o botão **"Ver todos os posts"**, que leva a `/posts/` (`showMoreLink` e `showMoreLinkDest`, 3.4).
- **`/posts/`:**
  - os 81 posts agrupados por ano (`groupByYear`), em cards, **10 por página**;
  - a navegação fica no fim da lista: "‹ Anterior · 1 2 3 4 … 9 · Próxima ›" no computador e "‹ 1 2 … 9 ›" no celular;
  - as páginas ficam em `/posts/page/2/` … `/posts/page/9/` (`pagerSize = 10`, 7.1), no mesmo formato do WordPress.
- **Outros caminhos:**
  - dentro do post: anterior e próximo (`showPagination`) e 3 relacionados;
  - páginas de tags e categorias;
  - busca (`Ctrl K`).
- **Sem rolagem infinita:**
  - o Blowfish não oferece esse recurso, e seria JS próprio a manter e a liberar na CSP;
  - impediria chegar ao rodapé (Créditos, Privacidade, Contato);
  - prejudicaria o SEO, porque as páginas deixariam de ter URL própria;
  - o leitor perderia a posição ao voltar de um post;
  - seria pior para teclado e leitor de tela.

| Modo | Computador · `/posts/` (página 1 de 9) | Celular · `/posts/` |
|---|---|---|
| Escuro | ![T9 posts escuro](images/temas/T9-blowfish-vitrine/final/computador-posts-escuro.png) | ![T9 posts celular escuro](images/temas/T9-blowfish-vitrine/final/celular-posts-escuro.png) |
| Claro | ![T9 posts claro](images/temas/T9-blowfish-vitrine/final/computador-posts-claro.png) | ![T9 posts celular claro](images/temas/T9-blowfish-vitrine/final/celular-posts-claro.png) |

Os títulos, as datas, as tags e as imagens são os 10 posts reais mais recentes do blog atual. Como todos são de 2026, a página 1 mostra só o grupo "2026"; os demais anos aparecem nas páginas seguintes.

**Nuvem de tags**

- **Página `/tags/`:** nuvem com **tamanho proporcional ao número de posts**, com a contagem ao lado de cada tag e cor por faixa (as mais usadas em azul). Logo abaixo, a **lista completa de A a Z**, para quem procura uma tag específica.
- **Home:** o painel "Explorar" passa a mostrar as **20 tags mais usadas**, com os botões "Ver todas as tags →" e "Categorias".
- **Acessibilidade:** a nuvem é uma lista (`<ul aria-label="Nuvem de tags">`), e cada link informa a contagem (`title` e número visível). Não depende só do tamanho da fonte.
- **Implementação:** override de `layouts/tags/terms.html` (página de termos só da taxonomia `tags`) e um *partial* `tag-cloud.html`, usado na página de tags e na home. O tamanho segue escala logarítmica entre 14 e 44 px. Não há JavaScript.
- Os mockups usam as **67 tags que sobram depois da limpeza** (6.7), com as contagens reais.

| Modo | Computador · `/tags/` | Celular · `/tags/` |
|---|---|---|
| Escuro | ![T9 tags escuro](images/temas/T9-blowfish-vitrine/final/computador-tags-escuro.png) | ![T9 tags celular escuro](images/temas/T9-blowfish-vitrine/final/celular-tags-escuro.png) |
| Claro | ![T9 tags claro](images/temas/T9-blowfish-vitrine/final/computador-tags-claro.png) | ![T9 tags celular claro](images/temas/T9-blowfish-vitrine/final/celular-tags-claro.png) |

A mininuvem da home aparece nas telas da home acima, logo abaixo do botão "Ver todos os posts".

Contraste WCAG AA (≥ 4,5:1), todos os itens passam:

| Modo | Texto | Corpo | Secundário | Links | Botão | Tags | Código inline | Alerta |
|---|---|---|---|---|---|---|---|---|
| Escuro | 18,2 | 11,0 | 6,2 | 6,5 | 4,7 | 9,9 | 6,7 | 9,5 |
| Claro | 14,7 | 9,1 | 6,4 | 4,7 | 4,7 | 4,7 | 5,1 | 9,5 |

Pontos de implementação:

- **Arte de fundo:** arte **própria**, gerada para o projeto (seção 3.2.3). A ilustração do blowfish.page pertence ao projeto e **não é copiada**.
- **Números em destaque e banner:** os números (81 posts, 26 categorias, 20 anos) e o banner de tecnologias são *shortcodes* próprios usados em `content/_index.md`. O layout `background` do Blowfish exibe esse conteúdo na home, então nenhum layout do tema precisa ser sobrescrito.
- **Efeito de vidro:** classes em `assets/css/custom.css` (`backdrop-filter`). Os textos ficam legíveis mesmo em navegadores sem suporte a esse efeito, porque o fundo semitransparente garante o contraste.

### 3.2.3 Arte de fundo do T9 (aprovada para gerar)

Arte abstrata **própria**, feita para harmonizar com o esquema `blowfish` **sem tirar a atenção do conteúdo**:

- **Base:** gradiente vertical do azul-marinho do tema (`#202868` → `#0d1233`, o `neutral-900` do Blowfish). O fundo da página continua igual ao da arte.
- **Brilhos suaves só no topo:** azul `#4a9ef0` à esquerda, violeta ao centro e coral `#f0705a` à direita. São as cores primária e secundária do esquema, todas com opacidade baixa.
- **Linhas de fluxo:** 14 curvas finas e quase paralelas (opacidade de 5 a 10%), que sugerem fluxo e *pipelines*.
- **Constelação discreta:** nós e arestas no canto superior direito, sugerindo infraestrutura e redes, que desaparecem em direção ao texto.
- **Granulação leve,** para evitar faixas no gradiente.
- **Leitura protegida:** a metade de baixo esmaece até o azul-marinho liso. O título e o texto ficam sobre uma área calma, com o contraste da seção 3.2.2.
- **Modo claro:** a **mesma imagem**, com um véu claro por CSS (`rgba(236,238,248,.76–.84)`), como no blowfish.page. Não há segundo arquivo.

| Modo escuro | Modo claro (com véu) |
|---|---|
| ![Arte de fundo](images/arte/background-preview.png) | ![Arte de fundo no modo claro](images/arte/background-preview-claro.png) |

**Arquivos:**

| Arquivo | Detalhes |
|---|---|
| [background.webp](images/arte/background.webp) | 2560×1440, ~26 KB. Vai para `assets/img/background.webp`, e o Hugo gera tamanhos menores para o celular |
| [art/background.svg](art/background.svg) | Fonte vetorial |
| [art/gerar-arte.py](art/gerar-arte.py) | Gerador. A semente é fixa, então a arte é reproduzível; para variar, basta mudar a semente ou as cores |

As telas finais do T9 (3.2.2) e o banner (3.7.1) já usam esta arte.

**Direitos:** a arte foi criada para o blog e segue a mesma regra do conteúdo: **todos os direitos reservados** ao autor. A página de créditos registra isso.

#### Configuração por tema (`params.toml`) — referência histórica do catálogo

```toml
# T1 · Claro Clássico
colorScheme = "aeciopires"        # assets/css/schemes/aeciopires.css
defaultAppearance = "light"
autoSwitchAppearance = true        # segue o sistema operacional

# T2 · Azul Blowfish (esquema nativo; nenhuma paleta própria para manter)
colorScheme = "blowfish"
defaultAppearance = "dark"
autoSwitchAppearance = false       # abre sempre escuro
[header]
  layout = "fixed-fill-blur"       # cabeçalho flutuante translúcido
[homepage]
  layout = "background"

# T3–T7 · esquemas próprios escuros (um arquivo em assets/css/schemes/<nome>.css)
colorScheme = "oceano"             # ou "aeciopires-dark", "grafite-ambar", "indigo", "teal-coral"
defaultAppearance = "dark"
autoSwitchAppearance = false
showAppearanceSwitcher = true      # false = remove o botão de modo claro

# T8 · Ciano Minimal (estilo agha.dev)
colorScheme = "ciano"              # assets/css/schemes/ciano.css
defaultAppearance = "dark"
autoSwitchAppearance = false
[header]
  layout = "fixed-fill-blur"
[homepage]
  layout = "profile"
  showRecent = true
  cardView = false                 # lista em cards de texto, sem imagem
[article]
  showHero = false

# T9 · Blowfish Vitrine (estilo blowfish.page atual)
colorScheme = "blowfish"
defaultAppearance = "dark"
autoSwitchAppearance = false
[header]
  layout = "fixed-fill-blur"
[homepage]
  layout = "background"
  homepageImage = "img/background.webp"   # arte própria
  showRecent = true
  cardView = true
[article]
  showHero = true
  heroStyle = "background"

# T10 · Material Teal (Material Design 3)
colorScheme = "material-teal"      # assets/css/schemes/material-teal.css (gerado do M3)
defaultAppearance = "light"
autoSwitchAppearance = true        # claro/escuro conforme o sistema
showAppearanceSwitcher = true
[homepage]
  layout = "custom"                # layouts/partials/home/custom.html (hero + mosaico + chips)
  showRecent = true
  cardView = true
```

Esquema `material-teal.css` (T10), mapeando as **paletas tonais** do M3 para as escalas 50–900 que o Blowfish usa. Os valores foram gerados com `@material/material-color-utilities` a partir da semente `#1c6470`. A correspondência é tom 95 → 50, tom 90 → 100, …, tom 10 → 900. A `secondary` do Blowfish recebe a paleta *tertiary* do M3, porque a *secondary* do M3 é quase neutra.

```css
:root {
  --color-neutral: 255, 255, 255;
  --color-neutral-50: 236, 242, 243;   --color-neutral-100: 222, 227, 229;
  --color-neutral-200: 194, 199, 201;  --color-neutral-300: 166, 172, 174;
  --color-neutral-400: 140, 146, 147;  --color-neutral-500: 114, 120, 122;
  --color-neutral-600: 89, 95, 97;     --color-neutral-700: 66, 72, 73;
  --color-neutral-800: 43, 49, 51;     --color-neutral-900: 23, 29, 30;
  --color-primary-50: 211, 247, 255;   --color-primary-100: 160, 239, 255;
  --color-primary-200: 131, 211, 227;  --color-primary-300: 102, 183, 199;
  --color-primary-400: 74, 156, 171;   --color-primary-500: 42, 130, 145;
  --color-primary-600: 0, 104, 118;    --color-primary-700: 0, 78, 89;
  --color-primary-800: 0, 54, 62;      --color-primary-900: 0, 31, 37;
  --color-secondary-50: 238, 240, 255; --color-secondary-100: 219, 225, 255;
  --color-secondary-200: 188, 197, 235;--color-secondary-300: 161, 170, 206;
  --color-secondary-400: 134, 144, 178;--color-secondary-500: 108, 118, 152;
  --color-secondary-600: 84, 93, 126;  --color-secondary-700: 60, 70, 101;
  --color-secondary-800: 38, 47, 77;   --color-secondary-900: 16, 26, 55;
}
```

Os papéis M3 que não existem no Blowfish (`surfaceContainer*`, `primaryContainer` etc.) viram variáveis CSS em `custom.css` (`--md-sys-color-*`), com um bloco para `:root` e outro para `.dark`. Os valores ficam guardados no repositório em `assets/css/material-tokens.json`, gerado por um script versionado (`scripts/m3-scheme.mjs`), e não são editados à mão.

Notas:

- **T2** e **T9** usam as cores do próprio Blowfish: menos CSS para manter e atualizações do tema mais simples.
- **T8** usa um esquema próprio (`ciano.css`) com as mesmas escalas RGB do agha.dev: neutros de `255,255,255` a `0,0,0`, primária de `245,252,255` a `0,59,77` e secundária de `249,254,255` a `18,60,76`.
- **T10** é a única com overrides de layout (cabeçalho em *rail*/*drawer* e home `custom`). Por isso, tem o maior custo de manutenção a cada atualização do Blowfish.
- **T3–T7** exigem um arquivo de esquema (`assets/css/schemes/<nome>.css`) com as escalas de cor em RGB. Os valores das paletas acima viram a base desse arquivo.
- Nos temas escuros, os componentes do modo claro (quando o botão de alternância for mantido) usam a mesma paleta em versão clara, gerada no mesmo arquivo de esquema.
- O banner atual tem **fundo branco**. Nos temas escuros, ele será exportado com fundo transparente (PNG); nos mockups isso foi simulado por CSS.
- Imagens destacadas com fundo branco (LangChain, CDK) continuam claras dentro dos cards; é o comportamento esperado.

### 3.3 Instalação

Decisão: **git submodule**, o método recomendado pela documentação do Blowfish. O submódulo é **fixado numa tag de release** (não no topo da branch `main`), para que o build seja reproduzível:

```bash
git submodule add https://github.com/nunocoracao/blowfish.git themes/blowfish
git -C themes/blowfish checkout v3.10.0        # última release em 20/11/2026
git add .gitmodules themes/blowfish
```

```toml
# config/_default/hugo.toml
theme = "blowfish"
```

- **Sem Go:** o submódulo dispensa o Go, e o `mise.toml` fica com uma ferramenta a menos.
- **Clonar o repositório:** usar `git clone --recurse-submodules`. Num clone existente, `make install-deps` roda `git submodule update --init`.
- **CI:** usa `actions/checkout` com `submodules: true` (seção 8.1).
- **Atualizar:** `make update-theme TAG=vX.Y.Z` (seção 9.3). Não usar `git submodule update --remote --merge`, que leva ao topo da `main` em vez de uma release.
- **Configuração inicial:** apagar o `hugo.toml` gerado na raiz pelo `hugo new site` e copiar `themes/blowfish/config/_default/*.toml` para `config/_default/`, conforme a documentação e a *skill*.
- **Licença:** o submódulo traz o arquivo `LICENSE` (MIT) do Blowfish para dentro do repositório. Isso faz parte do cumprimento da licença (seção 3.8).

### 3.4 Configuração (rascunho)

A configuração fica dividida em `config/_default/`. Os nomes exatos dos parâmetros serão conferidos na documentação da versão fixada do Blowfish.

`params.toml`:

```toml
# T9 · Blowfish Vitrine — mesmo padrão do blowfish.page
colorScheme = "blowfish"             # esquema nativo do tema
defaultAppearance = "dark"           # abre escuro…
autoSwitchAppearance = true          # …e segue o modo do sistema
showAppearanceSwitcher = true        # botão claro/escuro no cabeçalho
enableSearch = true                  # busca Fuse.js (gera index.json)
enableCodeCopy = true
mainSections = ["posts"]

[header]
  layout = "fixed-fill-blur"         # cabeçalho flutuante com desfoque

[footer]
  showMenu = true
  showCopyright = true
  showThemeAttribution = true
  showAppearanceSwitcher = true
  showScrollToTop = true

[homepage]
  layout = "background"
  homepageImage = "img/background.webp"   # arte própria (3.2.2)
  showRecent = true
  showRecentItems = 6
  showMoreLink = true
  showMoreLinkDest = "/posts/"
  cardView = true

[article]
  showDate = true
  showReadingTime = true
  showAuthor = true
  showBreadcrumbs = true
  showTableOfContents = true
  showTaxonomies = true
  showRelatedContent = true
  relatedContentLimit = 3
  showPagination = true
  showHero = true
  heroStyle = "background"
  showComments = true                # layouts/partials/comments.html: giscus + comentários antigos (6.5, 6.6)
  sharingLinks = ["linkedin"]         # sem X/Twitter e sem compartilhar por e-mail

[list]
  showCards = true
  groupByYear = true
  cardView = true

[taxonomy]
  showTermCount = true

# Parâmetros próprios do projeto (lidos pelos partials/shortcodes do site)
[giscus]
  repo = "aeciopires/blog-aeciopires"
  repoId = "<R_...>"                 # IDs públicos, obtidos em https://giscus.app
  category = "Comentários"
  categoryId = "<DIC_...>"
[jotform]
  formId = "<ID>"
```

`languages.pt-br.toml`: título, `params.author` (nome, foto, headline, bio) e links sociais:

```toml
[params.author]
  name = "Aécio Pires"
  links = [
    { github = "https://github.com/aeciopires" },
    { linkedin = "https://www.linkedin.com/in/aeciopires" },
    # Só GitHub e LinkedIn. Sem YouTube, sem X/Twitter e sem e-mail (decisão)
  ]
```

- **Onde os links aparecem:**
  - na caixa do autor no fim de cada post e no perfil;
  - nos ícones do cabeçalho;
  - no rodapé;
  - no menu do celular;
  - o GitHub também aparece no **@aeciopires** do banner de tecnologias (3.7.1) e no botão "GitHub" da home.
- **Sem YouTube, sem X/Twitter e sem e-mail público:**
  - você não tem canal no YouTube nem conta no X, e não vai divulgar o e-mail; nada disso aparece como perfil no site;
  - **vídeos incorporados continuam:** 7 posts antigos incorporam vídeos de outros canais (ex.: `comunidade-zabbix-brasil-10-anos-depoimento-hernandes`). Eles viram `{{< youtubeLite >}}` na conversão (6.4), por isso `youtube-nocookie.com` segue na CSP (11.5). Outros 17 posts só têm links para vídeos e não precisam de nada;
  - o **contato direto** é só o formulário **Jotform** da página Contato, que entrega a mensagem sem expor o endereço;
  - o `CLAUDE.md` proíbe publicar endereço de e-mail em páginas, posts, rodapé ou dados estruturados.
- **Fonte única:** os endereços ficam **só** nesse arquivo; *partials* e *shortcodes* próprios leem `site.Params.author.links`, sem repetir as URLs no código.
- **Segurança:** links externos com `rel="noopener noreferrer"` (padrão do Blowfish para links do autor). Os dois domínios só recebem cliques; não carregam nada na página, então não entram na CSP.
- **SEO:** os dois perfis entram também em `sameAs` no JSON-LD do autor, gerado pelo Blowfish a partir desses links. Isso ajuda os buscadores a associar o blog ao autor.

`menus.pt-br.toml`: menu principal (Posts, Categorias, Tags, Cursos, Sobre, Contato) e rodapé (Sobre, Contato, Privacidade).

### 3.5 Customizações (sem alterar o tema)

| Arquivo | Para quê |
|---|---|
| `assets/css/custom.css` | Efeito de vidro (cards e painéis), números em destaque, placas do banner de tecnologias, véu do modo claro sobre a arte. **Sem esquema próprio:** as cores vêm do esquema nativo `blowfish` |
| `assets/img/background.webp` | Arte de fundo própria da home e dos posts (3.2.2) |
| `layouts/partials/comments.html` | giscus (comentários novos, 6.6) + `data/comments/<slug>.yaml` (comentários antigos, somente leitura, 6.5) |
| `layouts/partials/extend-footer.html` | Aviso de licença do Blowfish + link para Créditos e licenças (3.8) |
| `layouts/shortcodes/stats.html` | Números em destaque da home (posts, categorias, anos), calculados no build |
| `layouts/shortcodes/tecnologias.html` + `data/tecnologias.yaml` + `assets/img/logos/*.svg` | Banner de tecnologias com os logos oficiais (3.7) |
| `content/creditos.md` | Página Créditos e licenças: texto MIT completo do Blowfish, demais componentes, autoria da arte e marcas (3.8) |
| `layouts/partials/extend-head.html` | Beacon do **Cloudflare Web Analytics** (só quando `hugo.IsProduction`) |
| `layouts/shortcodes/jotform.html` | `{{< jotform >}}` → `<script src="https://form.jotformz.com/jsform/<ID>">` do formulário atual (ID em `params`) |
| `content/_index.md` | Chamada "Compartilhando conhecimento há 20 anos" + `{{< button >}}` dos cursos |
| `content/privacidade.md` | Página nova: Cloudflare Web Analytics (sem cookies), Jotform, giscus/GitHub (dados do comentário ficam públicos no GitHub) |

Ajustes em relação ao visual atual:

- A foto de "painéis solares" do cabeçalho dos posts (imagem de demonstração do SolarGrove) sai. Entra a arte de fundo do T9 (`heroStyle = "background"`); a imagem destacada do post continua nos cards.
- O banner atual (fundo branco) sai da home e é substituído pelo banner de tecnologias (3.7).
- Ganhos: modo escuro, TOC, tempo de leitura, posts relacionados e layout mobile melhor.

### 3.6 Boas práticas: documentação oficial do Hugo e do Blowfish + *agent skill*

A implementação e toda manutenção futura seguem a documentação oficial **da versão fixada** de cada componente:

| Fonte | Endereço | Uso |
|---|---|---|
| Documentação do Hugo | <https://gohugo.io/documentation/> | Configuração, conteúdo, templates, processamento de imagens, segurança, hospedagem no GitHub Pages |
| Documentação do Blowfish | <https://blowfish.page/docs/> | Instalação, parâmetros, esquemas de cor, layouts, *front matter*, *shortcodes*, atualização |
| *Agent skill* do Blowfish | <https://blowfish.page/docs/installation/#agent-skill> | Ensina o Claude Code a instalar, configurar e construir sites com o tema |
| Notas de versão | releases do Hugo e do Blowfish no GitHub | Ler antes de toda atualização (mudanças incompatíveis e *deprecations*) |

#### 3.6.1 *Agent skill* do Blowfish

O Blowfish distribui uma *skill* para agentes de IA. Ela ensina ao Claude Code onde ficam os arquivos de configuração, os layouts, o *front matter* e os *shortcodes* do tema. A documentação oferece duas formas de instalação:

| Forma | Como | Quando usar |
|---|---|---|
| **A. Pelo submódulo** (decisão) | A *skill* vem dentro do próprio tema, em `themes/blowfish/.claude/skills/blowfish/` (caminho conferido na tag v3.10.0). O projeto versiona um **link simbólico** `.claude/skills/blowfish → ../../themes/blowfish/.claude/skills/blowfish`, e o Claude Code carrega as *skills* de `.claude/skills/`. Se o link não for seguido em algum ambiente, `make skill-sync` copia a pasta | A *skill* fica **sempre na mesma versão do tema**, sem passo extra. Funciona em qualquer clone com `--recurse-submodules` |
| B. Plugin do Claude Code | `/plugin marketplace add nunocoracao/blowfish` e `/plugin install blowfish@blowfish` | Uso pessoal ou exploratório. Segue a versão mais recente do plugin, que pode ser diferente da versão do tema fixada no projeto |

Regras:

- **Atualizar junto com o tema:** como a *skill* vem pelo submódulo, `make update-theme TAG=…` a atualiza no mesmo passo. O alvo exibe o diff da *skill* entre a tag antiga e a nova (`git -C themes/blowfish diff vA..vB -- .claude/skills`), porque o PR do repositório mostra só o hash do submódulo.
- **Revisar como código:** uma *skill* são instruções para o agente. Revisar o diff a cada atualização e conferir que ela não traz *hooks*, comandos ou scripts inesperados (a mesma regra de cadeia de suprimentos da seção 8.2).
- **Usar sempre:** o `CLAUDE.md` (seção 14) determina que qualquer tarefa de tema, configuração, layout, *shortcode* ou *front matter* use a *skill* e consulte a documentação do Blowfish antes de inventar uma solução.
- **Se houver conflito:** valem as regras do `CLAUDE.md` do projeto (segurança, CSP, URLs) e a documentação da versão fixada.

#### 3.6.2 Boas práticas do Blowfish (documentação oficial)

- **Versão do Hugo:** a página de instalação fala em Hugo ≥ 0.162.0, mas o que vale é a faixa declarada pelo próprio tema em `config.toml` (`[module.hugoVersion]`), como a *skill* orienta. Na **v3.10.0** essa faixa é **mín. 0.166.0 e máx. 0.169.0** (*extended*). Por isso o projeto usa o **Hugo 0.169.0**, e não o 0.170.1 (o mais novo em 20/11/2026), que está fora da faixa testada pelo tema (seção 9.2.1).
- **Configuração:** partir dos arquivos de configuração que acompanham o tema (`config/_default/*.toml`), copiados para o projeto, e alterar só o necessário. Assim os comentários e valores padrão ficam documentados.
- **Nunca editar o tema:**
  - todo ajuste é feito por override, criando o mesmo caminho em `layouts/`;
  - para o visual: `assets/css/custom.css` e `assets/css/schemes/<nome>.css`;
  - para extensões: os *partials* de extensão `extend-head.html` e `extend-footer.html`.
- **Imagens:**
  - a imagem destacada fica no *page bundle* como `feature*`, e a de fundo como `background*`;
  - imagens globais ficam em `assets/`, para o Hugo processá-las (redimensionar e gerar WebP).
- **Conteúdo:** preferir os *shortcodes* do tema (`alert`, `button`, `figure`, `mermaid`, `tabs`, `youtubeLite`…) a HTML cru.
- **Esquemas de cor:** seguir o formato de `assets/css/schemes/` (escalas 50–900 em RGB para `neutral`, `primary` e `secondary`).
- **Método de instalação:** **git submodule** (decisão), o recomendado pela documentação, fixado numa tag de release (seção 3.3).
- **Atualização:** seguir a página *Updating* da documentação e as notas de versão. Testar localmente (`make serve`, `make validate`) antes do PR.

#### 3.6.3 Boas práticas do Hugo (documentação oficial)

- **Versão:** a mais nova dentro da faixa suportada pelo Blowfish fixado (3.6.2).

- **Configuração:**
  - usar o diretório de configuração (`config/_default/`) para os valores comuns;
  - criar `config/production/` só para valores exclusivos de produção, quando necessário;
  - conferir a configuração final com `hugo config`.
- **Conteúdo:**
  - *page bundles* (`content/posts/<slug>/index.md` com as imagens ao lado);
  - datas no *front matter* com fuso (`-03:00`) e `timeZone = "America/Sao_Paulo"`;
  - `enableGitInfo = true` para o `lastmod`, o que exige `fetch-depth: 0` no checkout da CI.
- **Imagens:** processar com os métodos de recurso do Hugo (`Resize`/`Fit`, WebP) em vez de servir originais grandes.
- **Segurança:**
  - manter a configuração `security` padrão do Hugo, com `exec.allow` restrito, `funcs.getenv` limitado a `^HUGO_` e `^CI$`, e `http.urls` sem curingas;
  - `markup.goldmark.renderer.unsafe = false` é o objetivo;
  - se algum post migrado precisar de HTML cru, avaliar caso a caso na Fase 4. Ligar `unsafe` é aceitável apenas porque todo o conteúdo é do próprio autor; os comentários antigos são renderizados à parte, com *escape*.
- **Build:**
  - `hugo --gc --minify` em produção;
  - `HUGO_CACHEDIR` com cache na CI;
  - o `deploy.yml` segue o guia oficial [*Host on GitHub Pages*](https://gohugo.io/host-and-deploy/host-on-github-pages/).
- **Qualidade:**
  - no `pr-check`, rodar `hugo --logLevel info --printPathWarnings`;
  - tratar *deprecations* como tarefa de manutenção (aviso hoje vira erro em versões futuras);
  - usar `refLinksErrorLevel = "ERROR"` para links internos quebrados.
- **Templates próprios:** usar `partialCached` quando o resultado não depende da página. Não usar funções marcadas como *deprecated*.

### 3.7 Banner de tecnologias (logos com identidade preservada)

O banner atual (`wp-content/uploads/2024/11/b.jpeg`, 1400×350) tem **fundo branco** e 14 logos: GitHub, AWS, Google Cloud, Kubernetes, Terraform, Bash, Helm, Argo, Datadog, Prometheus, Zabbix, Grafana, Docker e HashiCorp Vault. Vários são escuros (GitHub, a palavra "aws", Helm, Vault, Bash) e sumiriam no fundo azul-marinho do T9.

**Decisão (aprovada):** o banner atual **não é usado** sobre o fundo escuro, e **nenhum logo é recolorido**. A inversão de cores, usada nos primeiros mockups, altera as marcas e foi descartada. No lugar entra um **banner novo**, coerente com o T9: cada logo nas **cores originais, sobre uma placa branca**, dentro de um painel de vidro. Como as placas são brancas nos dois modos, os logos ficam idênticos no claro e no escuro.

![Comparação: inversão (descartada) × placas brancas](images/banner/banner-comparacao.png)

#### 3.7.1 Banner v2 (versão aprovada, com os ajustes pedidos)

| Modo escuro (computador) | Modo claro (computador) |
|---|---|
| ![Banner v2 escuro](images/banner/banner-v2-computador-escuro.png) | ![Banner v2 claro](images/banner/banner-v2-computador-claro.png) |

![Banner v2 no celular, escuro e claro](images/banner/banner-v2-celular.png)

**Composição:**

- **Cabeçalho do banner:**
  - à esquerda, **@aeciopires** com a marca do GitHub ao lado, como link para `https://github.com/aeciopires`;
  - à direita, o título **"Stacks que uso no dia a dia"** e o subtítulo **"Tecnologias com as quais tenho experiência prática"**.
  - O texto deixa claro que os logos (inclusive AWS e Google Cloud) representam **experiência profissional do autor**, e não parceria ou patrocínio.
- **Rodapé do banner:** "As marcas pertencem aos seus respectivos donos e indicam apenas os assuntos tratados no blog."
- **27 tecnologias em 5 grupos.** No computador, cada grupo ocupa uma linha, com o rótulo à esquerda; no celular, o rótulo vai em cima, com 3 placas por linha:

| Grupo | Tecnologias |
|---|---|
| Kubernetes e containers | Kubernetes, Docker, Helm, **Kustomize**, Argo, **Istio** |
| Cloud e IaC | AWS, Google Cloud, Terraform, **Terragrunt**, Vault |
| Observabilidade | Prometheus, Grafana, **VictoriaMetrics** (representa a stack Victoria: VictoriaMetrics, VictoriaLogs e VictoriaTraces), Zabbix, Datadog |
| IA no dia a dia | **Claude**, **ChatGPT**, **Gemini**, **GitHub Copilot**, **Cursor** |
| Sistemas, linguagens e ferramentas | **Linux**, **macOS**, Bash, **Git** (substitui o GitHub, que passou para o cabeçalho), **Python**, **Go** |

- **Legenda em todas as placas:** o nome aparece abaixo de cada logo. Vários logos são só símbolo (Claude, Cursor, Copilot, VictoriaMetrics, Gemini, ChatGPT), e a legenda deixa o banner legível e acessível.
- **Funciona nos dois modos:**
  - **placas brancas e logos:** iguais no claro e no escuro;
  - **título, @aeciopires, rótulos e bordas dos grupos:** usam as cores do tema ativo;
  - **marca do GitHub:** é desenhada com a cor do texto, o que dá a versão preta no modo claro e a branca no escuro. As duas são variantes oficiais da marca (GitHub Logos and Usage).
  - Por isso o banner é um **componente HTML/CSS** (`{{< tecnologias >}}`), e não uma imagem única.

Regras para os logos:

- **Arquivos oficiais:**
  - usar sempre os arquivos oficiais, de preferência em SVG, baixados da página de marca ou do *press kit* de cada projeto;
  - os mockups usaram recortes do banner atual e arquivos de bibliotecas de ícones apenas como aproximação.

| Logo | Fonte oficial para a implementação |
|---|---|
| Kubernetes, Helm, Prometheus, Argo, Istio | CNCF artwork (`github.com/cncf/artwork`, pasta `projects/<nome>`) |
| Kustomize | Repositório `kubernetes-sigs/kustomize` (ícones do site oficial) |
| Docker | Página de marca da Docker |
| Terraform, Vault | Página de marca da HashiCorp |
| Terragrunt | Repositório `gruntwork-io/terragrunt` (`docs/src/assets/logo-light.svg`) |
| VictoriaMetrics | Página de marca/press kit da VictoriaMetrics (no mockup, o ícone da vmui) |
| Grafana, Zabbix, Datadog | Páginas de marca da Grafana Labs, da Zabbix e da Datadog |
| AWS, Google Cloud, Gemini | Diretrizes de marca da AWS e do Google |
| Claude | Kit de imprensa da Anthropic |
| ChatGPT | Diretrizes de marca da OpenAI |
| GitHub Copilot, GitHub (marca no cabeçalho) | GitHub Logos and Usage |
| Cursor | Página de marca da Cursor (Anysphere) |
| Git | `git-scm.com/downloads/logos` (licença CC BY 3.0, com atribuição na página de créditos) |
| Go | `go.dev/blog/go-brand` (logo azul oficial) |
| Python | `python.org/community/logos` (respeitar a política de marca da PSF) |
| Linux | Tux, de Larry Ewing (uso livre com crédito: "lewing@isc.tamu.edu and The GIMP") |
| Bash | Logo comunitário; conferir a licença |
| macOS | **Sem logo:** a Apple não autoriza o uso do logo da maçã. A placa mostra o nome **"macOS"** em texto, que é o uso nominativo permitido |

- **Não alterar:** cor, proporção, orientação, recorte ou elementos do logo. Não aplicar sombra, contorno, filtro, inversão nem transparência sobre o próprio logo.
- **Respeitar as diretrizes de cada marca:** área de respiro (as placas têm margem interna), tamanho mínimo e uso de versões alternativas.
  - Se uma marca publicar oficialmente uma versão para fundo escuro, ela pode ser usada **só como arquivo oficial**. Por padrão, porém, ficam as placas brancas, que mantêm a versão colorida principal.
  - **Ponto de atenção:**
    - as diretrizes da **AWS**, do **Google** e da **OpenAI** restringem o uso dos logos;
    - o título "Stacks que uso no dia a dia" e a nota de marcas enquadram o uso como indicação de experiência e de assunto;
    - se mesmo assim alguma diretriz não permitir, a placa mostra só o **nome em texto**, nunca um logo modificado.
- **Registro:** `assets/img/logos/SOURCES.md` lista cada logo com a URL de origem, a diretriz ou licença e a data de download. A página de créditos (3.8) traz as atribuições exigidas (Git, Tux) e a nota de marcas.
- **Implementação:**
  - *shortcode* `{{< tecnologias >}}`, lendo `data/tecnologias.yaml` (grupos → itens com nome, arquivo e link do site oficial);
  - `alt` com o nome da tecnologia, e `width`/`height` definidos (sem salto de layout);
  - placa de 112×74 px no computador e 92×66 px no celular;
  - incluir ou remover uma tecnologia é só editar o YAML e adicionar o arquivo oficial.
- **O que sai do banner antigo:** o texto "aeciopires.com" vai para o perfil do autor e o rodapé, como texto; o "@aeciopires" passa para o cabeçalho do banner, também como texto, com a marca do GitHub.
- **Imagem de compartilhamento:** a imagem padrão para redes sociais (`og:image`) é gerada com o mesmo painel sobre a arte do T9.

### 3.8 Licença do Blowfish e créditos

O Blowfish é distribuído sob a **licença MIT** (`Copyright (c) 2022 Nuno Coração`). A MIT exige que **o aviso de copyright e o texto da permissão acompanhem todas as cópias ou partes substanciais** do software. O site publicado inclui CSS e JS do tema, então o aviso precisa estar presente. A forma de cumprir, em camadas:

| Onde | O quê | Por quê |
|---|---|---|
| Repositório | `themes/blowfish/LICENSE`, que vem com o submódulo | Cópia do código-fonte com a licença |
| CSS/JS gerados | Manter o comentário `/*! Blowfish \| MIT License \| … */` que o tema inclui no bundle | Cópia distribuída aos visitantes. **Conferir na Fase 2** se o `--minify` preserva esse comentário (`grep "MIT License" public/css/*.css`). Se não preservar, a página de créditos supre o aviso |
| **Rodapé** (todas as páginas) | "© 2026 Aécio Pires · Todos os direitos reservados" + "Feito com Hugo e Blowfish · Tema Blowfish © 2022 Nuno Coração, licença MIT", com link para **Créditos e licenças**. `showThemeAttribution = true` + `extend-footer.html` | Aviso visível e curto em todo o site |
| Página `/creditos/` | Texto **completo** da licença MIT do Blowfish e dos componentes que o tema embute e o site usa (ex.: Fuse.js, sob Apache-2.0, e as demais listadas nas licenças do tema na tag fixada), arte de fundo própria (todos os direitos reservados), atribuições dos logos (Git, Tux), nota sobre marcas registradas | Texto integral num lugar só, sem poluir o rodapé |

**Resposta à pergunta "o rodapé é o melhor lugar?":** sim, para o **aviso curto**, porque aparece em todas as páginas e é onde os sites com Blowfish costumam creditar o tema. O **texto integral** da licença fica na página `/creditos/`, linkada no rodapé. As duas coisas juntas, com o `LICENSE` no repositório, cumprem a MIT com folga.

Outros créditos na mesma página:
- **Hugo:** Apache-2.0; é uma ferramenta de build e não é distribuída, então o crédito é cortesia.
- **giscus:** MIT, serviço externo.
- **Cloudflare Web Analytics** e **Jotform:** serviços de terceiros, citados também na página Privacidade.
- **Marcas do banner (3.7):** pertencem aos respectivos donos.

---

## 4. Estrutura do repositório

```text
blog-aeciopires/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml          # build + deploy (push em main, manual) + purge Cloudflare
│   │   ├── pr-check.yml        # build + validação em PRs (sem publicar)
│   │   └── origin-cert.yml     # verifica semanalmente o certificado da origem (GitHub Pages)
│   └── dependabot.yml          # só github-actions (tema e ferramentas: sob demanda)
├── .claude/
│   └── skills/
│       ├── blowfish -> ../../themes/blowfish/.claude/skills/blowfish   # skill oficial (3.6.1)
│       ├── revisar-conteudo/SKILL.md     # valida posts contra fontes oficiais (9.3.3)
│       └── atualizar-site/SKILL.md       # atualiza Hugo, Blowfish e ferramentas (9.3.3)
├── .githooks/pre-commit        # check-tags + lint-md nos .md alterados (6.8)
├── .gitmodules                 # submódulo do Blowfish
├── .markdownlint-cli2.yaml     # regras do lint de Markdown (9.3.2)
├── archetypes/posts.md         # modelo de front matter
├── assets/
│   ├── css/custom.css          # vidro, números, placas do banner (T9)
│   └── img/                    # background.webp (arte própria, 3.2.3), autor, logos/ (+ SOURCES.md)
├── config/_default/            # hugo.toml, params.toml, languages.pt-br.toml, menus.pt-br.toml, markup.toml, module.toml
├── content/
│   ├── _index.md               # chamada da home + botões
│   ├── posts/<slug>/index.md   # 81 posts + imagens de cada post
│   ├── sobre/ · cursos/ · contato/ · privacidade/ · creditos/   # páginas (page bundles)
├── data/
│   ├── comments/<slug>.yaml    # comentários antigos (somente leitura, sanitizados)
│   ├── tecnologias.yaml        # grupos e logos do banner (3.7.1)
│   └── taxonomia.yaml          # registro de tags, sinônimos e categorias (6.8)
├── layouts/                    # só overrides/partials/shortcodes próprios
├── static/
│   ├── wp-content/uploads/...  # mídias antigas no MESMO caminho do WordPress
│   └── favicon.ico
├── docs/
│   ├── ARCHITECTURE.md         # arquitetura com diagramas Mermaid (seção 13)
│   ├── MAINTENANCE.md          # como manter e evoluir conteúdo e softwares (seção 13)
│   ├── cloudflare.md           # configuração do Cloudflare documentada (regras, valores, contingências)
├── PLANS/
│   └── blog-migration/         # ESTE plano + images/ (registro histórico das decisões)
├── reports/                    # saídas de make audit-content / check-updates (no .gitignore)
├── scripts/                    # check-deps.sh, install-deps.sh, content.sh, audit-content.mjs, compare-urls.sh…
├── themes/blowfish/            # git submodule fixado na tag v3.10.0
├── mise.toml                   # versões das ferramentas (fonte única)
├── docker-compose.yml
├── Makefile
├── CLAUDE.md                   # instruções para o Claude Code (seção 14)
└── README.md                   # guia para humanos: escrever, rodar local, publicar
```

---

## 5. Fases da migração

![Fases](images/04-fases-migracao.png)

O WordPress continua no ar durante todas as fases até a virada de DNS.

### Fase 0 — Preparação (~0,5 dia)

- [ ] Backup completo do WordPress: **Ferramentas → Exportar → Todo o conteúdo** (WXR `.xml`), dump do banco e cópia de `wp-content/uploads`. Guardar fora do repositório.
- [ ] Inventário de URLs a partir de `sitemap.xml` → `scripts/urls-wordpress.txt`.
- [ ] Anotar o registro DNS atual de `blog` no Cloudflare (para rollback) e o ID do formulário Jotform.
- [ ] Exportar relatórios desejados do Jetpack Stats/Google Analytics (o histórico não migra).
- [ ] Conferir de novo as versões mais novas (seção 9.2.1), respeitando a faixa de Hugo do Blowfish, e fixá-las no `mise.toml` e no submódulo.
- [ ] Ativar 2FA no GitHub e no Cloudflare (se ainda não estiver).

### Fase 1 — Esqueleto (~0,5 dia)

- [ ] `mise.toml`, `Makefile` (com `check-deps` e `install-deps`), `docker-compose.yml`, scripts.
- [ ] `hugo new site . --force`, Blowfish como submódulo na tag v3.10.0, apagar o `hugo.toml` da raiz e copiar os `config/_default/*.toml` do tema (seção 3.3).
- [ ] Link simbólico da *agent skill* (`.claude/skills/blowfish`) e leitura do `SKILL.md` (seção 3.6.1); criar as *skills* `revisar-conteudo` e `atualizar-site` (9.3.3).
- [ ] giscus: instalar o app giscus **só neste repositório**, criar a categoria "Comentários" (tipo *Announcements*) e anotar `repoId`/`categoryId` (seção 6.6).
- [ ] Workflows de CI e `dependabot.yml`.
- [ ] `CLAUDE.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/MAINTENANCE.md` e `docs/cloudflare.md` iniciais; `make validate-diagrams` verde.
- [ ] `.gitignore`: `public/`, `resources/_gen/`, `.hugo_build.lock`.
- [ ] Testar `make check-deps && make install-deps && make serve` em Ubuntu e macOS.

### Fase 2 — Tema (~1–2 dias)

- [ ] Aplicar o **T9** (seção 3.2.2): esquema `blowfish`, aparência escuro + automático + botão, cabeçalho `fixed-fill-blur`, home `background` com arte própria, vidro, números e banner de tecnologias (3.7). Fazer com a *skill* do Blowfish e a documentação oficial (3.6).
- [ ] Partials e shortcodes: comentários (giscus + antigos), analytics, rodapé com licença, `stats`, `tecnologias`, `jotform`; páginas Privacidade e Créditos (3.8).
- [ ] Conferir que o aviso MIT do Blowfish continua no CSS minificado (3.8).
- [ ] Revisar contra os mockups da seção 3.2.

### Fase 3 — Conversão do conteúdo (~1 dia)

Ver seção 6. Inclui aplicar o mapa de limpeza das tags (`scripts/normalize-tags`, 6.7) e gerar o `data/taxonomia.yaml` inicial (6.8).

### Fase 4 — Revisão (~2–4 dias, o maior esforço)

- [ ] Revisar todos os posts localmente, priorizando os mais acessados.
- [ ] `compare-urls.sh` sem diferenças; `make validate` sem links/imagens quebrados.
- [ ] Decidir as tags marcadas como "revisar" (6.7); `make check-tags` sem erros; `make tags-report` revisado; `make install-hooks` ativado.

### Fase 5 — Staging (~0,5 dia)

- [ ] Publicar em `https://aeciopires.github.io/blog-aeciopires/` (`baseURL` vem da CI).
- [ ] Testar em celular, Lighthouse, feed RSS, busca, modos claro/escuro, formulário Jotform e comentário de teste via giscus (apagar depois).
- [ ] Preparar as regras do Cloudflare (seção 11) e documentá-las em `docs/cloudflare.md`.

### Fase 6 — Virada de DNS (~0,5 dia + 30 dias de observação)

Ver seção 10. Após 30 dias estável, cancelar a hospedagem do WordPress (mantendo o backup da Fase 0).

---

## 6. Conversão do conteúdo

### 6.1 Ferramenta

| Opção | Prós | Contras |
|---|---|---|
| **[wp2hugo](https://github.com/ashishb/wp2hugo)** (recomendada) | Feita para Hugo; lê o WXR; baixa mídias; gera front matter com categorias/tags; preserva slugs; converte embeds em shortcodes | Exige revisão manual de blocos Gutenberg complexos |
| [wordpress-export-to-markdown](https://github.com/lonekorean/wordpress-export-to-markdown) | Muito usada, configurável | Genérica; requer ajuste de front matter |

O wp2hugo é um binário Go, instalado pelo mise apenas durante a migração (`make migrate-install`). Ele roda sobre o WXR exportado e gera saída em diretório temporário; só depois o conteúdo é movido para `content/`.

### 6.2 Front matter alvo

```yaml
---
title: "helm chart zabbix 8.0.0"
slug: "helm-chart-zabbix-8-0-0"
date: 2026-11-06T00:47:26-03:00
lastmod: 2026-11-06T00:47:26-03:00
draft: false
categories: ["DevOps", "Kubernetes", "Zabbix"]
tags: ["helm", "kubernetes", "zabbix", "gitops", "observability"]
description: "Resumo para SEO e cards de redes sociais"
wp_id: 1234                 # ID original, usado para redirecionar /?p=1234
---
```

Imagem destacada: arquivo `feature*.png|jpg` dentro do *page bundle* (convenção do Blowfish).

### 6.3 Mídias

- Manter as mídias antigas em `static/wp-content/uploads/AAAA/MM/arquivo.ext` — **mesmo caminho do WordPress**. Preserva links externos e evita reescrever referências.
- Descartar variações do WP (`-150x150`, `-300x200`…) não referenciadas.
- Otimizar PNGs grandes com `oxipng` (via mise). O repositório deve ficar bem abaixo de 1 GB, o limite do Pages.
- A imagem destacada de cada post é copiada para o *page bundle* como `feature.<ext>`.

### 6.4 Pontos que exigem revisão manual

- Blocos de código: linguagem correta e entidades HTML (`&amp;`, `&lt;`) convertidas.
- Tabelas, listas aninhadas, colunas/botões do Gutenberg.
- Embeds (YouTube, Gist) → `{{< youtubeLite >}}`, bloco de código ou `{{< github >}}`. São **7 posts** com vídeo do YouTube incorporado (levantamento de 20/11/2026), todos de outros canais.
- Links internos `http://blog.aeciopires.com/...` → relativos.
- Categoria com slug `zabbix-2`: manter o slug e ajustar só o nome exibido.
- Categorias vazias (glassfish, influxdb, r, redmine, tomcat, vagrant): não geradas.

### 6.5 Comentários antigos (219) — migração segura

Publicar os comentários antigos como **HTML estático, somente leitura**. Sem formulário, sem endpoint e sem banco, não há nada que spammer ou atacante possa enviar ao blog. O risco vem de **aceitar** comentários, não de exibir os antigos.

1. Extrair do WXR apenas comentários **aprovados** (ignorar pendentes, spam, lixeira).
2. Salvar em `data/comments/<slug>.yaml` somente: nome, data, texto e `parent` (respostas). **Não migrar e-mail, IP, user-agent nem site do autor.**
3. Sanitizar: texto puro/Markdown seguro, sem HTML; remover links (ou `rel="nofollow ugc noopener"`). Nunca usar `safeHTML` nesse conteúdo.
4. Revisar a lista uma vez e excluir spam que tenha passado no Akismet.
5. Exibir como "Comentários do blog antigo (somente leitura)" (mockup 09).

**Decisão:** os comentários antigos são migrados assim, em modo somente leitura, e exibidos **abaixo** dos comentários novos (giscus) com o rótulo "Comentários arquivados do blog antigo". Eles **não** são importados para o GitHub Discussions, porque apareceriam como escritos pela conta do autor do blog, e não pelos leitores originais.

### 6.6 Comentários novos com giscus (GitHub Discussions)

**Decisão:** aceitar comentários novos via [giscus](https://giscus.app), integrado ao Blowfish pelo *partial* `layouts/partials/comments.html` (mecanismo documentado pelo tema; `showComments = true`). As **Discussions já estão ativadas** no repositório.

**Por que é seguro o suficiente:**

- Não há servidor, banco nem formulário no blog: o comentário vai direto para o **GitHub Discussions** do repositório, dentro de um *iframe* de `giscus.app`.
- Só comenta quem entra com **conta do GitHub**, o que corta quase todo o spam anônimo.
- A moderação usa as ferramentas do GitHub: esconder, editar ou apagar comentários, **travar** uma discussão, **bloquear** usuários, **limitar interações** temporariamente (Settings → Moderation options → *Interaction limits*) e receber denúncias.
- O blog não guarda nenhum segredo: `repoId` e `categoryId` são identificadores públicos.

**Configuração (Fase 1):**

1. Instalar o [app giscus](https://github.com/apps/giscus) **apenas** no repositório `aeciopires/blog-aeciopires` (menor privilégio). Ele pede acesso a Discussions e metadados.
2. Em Discussions:
   - criar a categoria **"Comentários"** do tipo **Announcements** (só mantenedores e o giscus abrem tópicos; os leitores apenas respondem);
   - remover ou arquivar as categorias padrão que não serão usadas, para que ninguém abra tópicos soltos.
3. Gerar os IDs em <https://giscus.app> e colocá-los em `params.toml` (`[giscus]`, seção 3.4).
   > **Registro da implementação (20/11/2026):** app instalado e categoria "Comentários" criada (<https://github.com/aeciopires/blog-aeciopires/discussions/categories/53362060>).
   > O giscus exige os **IDs GraphQL** (`node_id`). O `id` numérico da API REST (`gh api repos/aeciopires/blog-aeciopires --jq .id` → `1464650030`) e o número da URL da categoria (`53362060`) **não funcionam**.
   > Comando usado: `gh api graphql -f query='{repository(owner:"aeciopires",name:"blog-aeciopires"){id discussionCategories(first:25){nodes{id name}}}}'`
   > → `repoId = "R_kgDOV0zJLg"` e `categoryId = "DIC_kwDOV0zJLs4DLj2M"` (também obtido com `gh api repos/aeciopires/blog-aeciopires --jq .node_id`). Passo a passo completo da instalação (repositório público, Discussions, categoria Announcement, app só neste repositório, validação em giscus.app) em `docs/MAINTENANCE.md`, seção 9.
4. O *partial* inclui o script com:
   - `data-mapping="pathname"` e `data-strict="1"`: um tópico por URL, sem colisões;
   - `data-reactions-enabled="1"`;
   - `data-emit-metadata="0"`;
   - `data-input-position="top"`;
   - `data-lang="pt"`;
   - `data-loading="lazy"`: só carrega quando o leitor rola até os comentários;
   - `crossorigin="anonymous"`.
5. **Tema do giscus acompanhando o Blowfish:**
   - duas folhas de estilo próprias, `static/giscus/t9-dark.css` e `t9-light.css`, com as cores do T9;
   - um pequeno script em `assets/js/` observa a classe `dark` do `<html>` (o botão de aparência do Blowfish) e envia `setConfig({theme})` ao *iframe*;
   - o GitHub Pages serve CSS com `Access-Control-Allow-Origin: *`, o que o giscus exige para temas por URL.
6. **CSP (11.5):** `https://giscus.app` em `script-src` e em `frame-src`.
7. **Desligar em um post:** `showComments: false` no *front matter*. Para todo o site, `showComments = false` no `params.toml`. Os comentários arquivados continuam aparecendo.

**Rotina de moderação:**

- Acompanhar o repositório em **Watch → Custom → Discussions** para receber os comentários por e-mail.
- **Semanal:** revisar os comentários novos.
- **Em ondas de spam:** ativar *Interaction limits* por 24 h a 1 semana, ou desligar comentários no post afetado.

**Riscos aceitos:**

- O giscus é um serviço de terceiros. Se ficar fora do ar, só a área de comentários deixa de carregar; o blog continua normal.
- O script `client.js` não tem versão fixa nem hash (SRI). É mitigado pela CSP restrita a `giscus.app`.
- Se um dia for preciso, é possível hospedar o próprio giscus (é *open source*).

**Privacidade:** os comentários e o perfil de quem comenta ficam **públicos no GitHub**. A página Privacidade explica isso e aponta a política do GitHub.


### 6.7 Limpeza das tags (uma vez, na migração)

Levantamento feito em 20/11/2026 pela API pública do WordPress:

| | Tags |
|---|---|
| Total | **224** |
| Sem nenhum post publicado | **116** |
| Com 1 post | 60 |
| **Depois da limpeza** | **67** (25 com 1 post) |

Uma nuvem com 224 tags seria uma parede de texto, e a maioria levaria a páginas vazias ou com um post só.

**Regra de organização:**
- **Categorias** são as áreas amplas e poucas (tutoriais, devops, docker, kubernetes, git…).
- **Tags** são tecnologias e assuntos específicos, de 1 a 5 por post.

| Ação | Exemplos | Para onde vai a URL antiga |
|---|---|---|
| **Remover as sem posts** (116) | `apache2`, `centos`, `drbd`, `ecd2010`… | alias `/tag/<antiga>/` → `/tags/` |
| **Unir sinônimos e variações** | `k8s`→`kubernetes`, `go`→`golang`, `argo-cd`→`argocd`, `infraascode`→`iac`, `conteiner`/`container`→`containers`, `elastic`→`elasticsearch`, `gke`/`google-cloud`→`gcp`, `flux`→`fluxcd`, `salt`→`saltstack`, `shell`/`script`→`bash`, `zabbix-br`→`zabbix`, `sonatype`→`nexus`, `mesh`→`service-mesh`, `monitoring`→`observability`, `homelab-*`→`homelab`, `novatec`→`livro` | alias `/tag/<antiga>/` → `/tag/<nova>/` |
| **Corrigir tags quebradas** | `fail` + `over` → `failover`; `continua` + `integracao` → `ci-cd` | alias para a tag corrigida |
| **Remover as que repetem categoria** | `devops`, `tutorial`, `tutoriais-2` | alias → `/category/<categoria>/` |
| **Remover palavras genéricas de 1 post** | `server`, `links`, `json`, `router`, `proxy`, `network`, `cluster`, `deploy`, `tools`… | alias → `/tags/` |
| **Revisar (decisão sua na Fase 4)** | `cidade-viva`, `codeac`, `medusa`, `worldcup`, `webapp`, `livro` | conforme a decisão |

- **Mapa completo:** [tags/tags-map.yaml](tags/tags-map.yaml), com todas as tags, a ação de cada uma e o resultado. O script de análise é [tags/analisar-tags.py](tags/analisar-tags.py).
- **Aplicação:** na Fase 3, o `scripts/normalize-tags` aplica o mapa ao *front matter* convertido pelo wp2hugo. Na Fase 4, você revisa o resultado.
- **SEO:**
  - cada tag removida ou unida ganha um **alias** (`content/tags/<nova>/_index.md` com `aliases: ["/tag/<antiga>/"]`), e o Hugo gera o redirecionamento;
  - o `compare-urls.sh` passa a aceitar esses redirecionamentos como esperados;
  - os feeds `/tag/<antiga>/feed/` seguem a regra R2 (11.4) e, para tags removidas, terminam no índice de tags.

### 6.8 Governança contínua das tags (a cada post)

Para a consolidação **não se perder com o tempo**, as tags passam a ter uma **fonte única** e uma **verificação automática** em todo post novo ou editado.

**1. Registro de tags: `data/taxonomia.yaml`** (versionado). Exemplo:

```yaml
tags:                       # tags permitidas (slug: descrição curta)
  kubernetes: Kubernetes e ecossistema
  golang: Linguagem Go
  ...
sinonimos:                  # variação -> tag oficial (corrigidas automaticamente)
  k8s: kubernetes
  go: golang
  argo-cd: argocd
  conteiner: containers
  ...
categorias: [tutoriais, devops, docker, kubernetes, git, cluster, gitops, zabbix, go, prometheus, vault, grafana, jenkins, puppet, ansible, ia, mikrotik, saltstack, terraform]
regras:
  max_tags_por_post: 5
  min_tags_por_post: 1
  proibidas: [devops, tutorial, tutoriais-2]   # já são categorias
```

**2. Verificação automática: `make check-tags`** (`scripts/check-tags.mjs`, roda com o Node do mise). Roda dentro do `make validate`, no `pr-check` da CI e no *hook* de *pre-commit*:

| Situação no *front matter* | Resultado |
|---|---|
| Tag que é **sinônimo** (`k8s`) | ❌ erro, com a sugestão `k8s → kubernetes` (o `make fix-tags` corrige) |
| Tag **fora do registro** | ❌ erro: "tag nova; use uma existente ou registre com `make new-tag`" |
| Tag **proibida** (repete categoria) | ❌ erro |
| Tag com maiúscula, acento ou espaço | ❌ erro, com o slug sugerido |
| Mais de 5 tags, ou nenhuma | ❌ erro |
| Categoria fora da lista | ❌ erro |
| Tag do registro sem nenhum post publicado | ⚠️ aviso no `make tags-report` (candidata a remover) |
| Tag com 1 post há mais de 6 meses | ⚠️ aviso no `make tags-report` (candidata a unir) |

**3. Alvos do Makefile**

| Alvo | O que faz |
|---|---|
| `make check-tags` | Valida tags e categorias de todos os posts e páginas, conforme a tabela acima |
| `make fix-tags [SLUG=…]` | Troca sinônimos pela tag oficial, normaliza o slug e remove duplicadas. Mostra o diff; grava só com `CONFIRM=sim` |
| `make new-tag NAME=… DESC="…"` | Registra uma tag nova em `data/taxonomia.yaml`, depois de checar que não é sinônimo de uma existente (distância de edição e lista de sinônimos) |
| `make merge-tag FROM=… TO=…` | Une duas tags: troca nos posts, move para `sinonimos`, cria o alias `/tag/<from>/` → `/tag/<to>/` |
| `make tags-report` | Gera `reports/tags.md` com as tags por número de posts, as tags com 0 ou 1 post e os sinônimos ainda em uso |
| `make install-hooks` | Ativa o *hook* de *pre-commit* versionado (`.githooks/pre-commit` → `git config core.hooksPath .githooks`), que roda `check-tags` e `lint-md` nos `.md` alterados |

**4. No fluxo de escrita**

- O `make new-post` mostra as 20 tags mais usadas e o modelo (`archetypes/posts.md`) traz um comentário lembrando o registro.
- Ao publicar (`make publish-post`), o `check-tags` roda antes. Um post com tag fora do padrão **não é publicado**.
- A *skill* `revisar-conteudo` e o `CLAUDE.md` seguem o mesmo registro: o Claude nunca cria tag sem `make new-tag`, e prefere as existentes.

**5. Rotina:** no **trimestral** (12.2), rodar `make tags-report`, unir ou remover tags fracas com `make merge-tag`, e conferir a nuvem em `/tags/`.

---

## 7. Preservação de URLs e SEO

### 7.1 Configuração do Hugo (`config/_default/hugo.toml`, rascunho)

```toml
baseURL      = "https://blog.aeciopires.com/"
languageCode = "pt-br"
defaultContentLanguage = "pt-br"
timeZone     = "America/Recife"
enableRobotsTXT = true
summaryLength = 30

[pagination]
  pagerSize = 10            # gera /page/2/, igual ao WordPress

[taxonomies]
  category = "categories"
  tag      = "tags"

[permalinks.page]
  posts = "/:slug/"         # mesmo formato do WP: /%postname%/
[permalinks.term]
  categories = "/category/:slug/"
  tags       = "/tag/:slug/"

[outputs]
  home = ["HTML", "RSS", "JSON"]   # JSON = índice da busca do Blowfish
```

### 7.2 Mapa de URLs

| WordPress | Hugo | Como |
|---|---|---|
| `/<slug>/` | `/<slug>/` | permalink `/:slug/` |
| `/category/<slug>/` | `/category/<slug>/` | permalink de termo |
| `/tag/<slug>/` | `/tag/<slug>/` | permalink de termo; tags unidas ou removidas na limpeza viram alias para a tag nova, a categoria ou `/tags/` (6.7) |
| `/page/2/` | `/page/2/` | paginação padrão |
| `/sobre/`, `/cursos/`, `/contato/` | idem | `content/*.md` |
| `/wp-content/uploads/...` | idem | arquivos em `static/` |
| `/sitemap.xml` | `/sitemap.xml` | nativo |
| `/feed/`, `/comments/feed/` | `/index.xml` | Cloudflare Single Redirect 301 (11.4) |
| `/category/x/feed/`, `/tag/x/feed/` | `/category/x/index.xml` | Single Redirect com wildcard (11.4) |
| `/?p=1234` | `/<slug>/` | JS na home (`assets/js/legacy-redirect.js` + mapa `wp_id → slug` gerado pelo Hugo) |
| `/?s=termo` | abre a busca com `termo` | JS na home |
| `/AAAA/MM/` | não gerado | baixo tráfego; 404 com busca |

### 7.3 Verificação automática

`scripts/compare-urls.sh` compara `scripts/urls-wordpress.txt` (Fase 0) com o `public/sitemap.xml` e lista o que sumiu. Meta: **zero** URLs faltando.

### 7.4 SEO

- Blowfish já gera `<title>`, description, canonical, Open Graph e Twitter Cards.
- `robots.txt` e `sitemap.xml` nativos.
- Google Search Console: reenviar o sitemap após a virada e acompanhar 404 por 30 dias.

---

## 8. Pipeline de publicação (GitHub Actions)

| Workflow | Quando | O que faz |
|---|---|---|
| `deploy.yml` | push em `main` + manual | mise instala ferramentas → build → validação → publica no Pages → **limpa cache do Cloudflare** |
| `pr-check.yml` | pull request | mesmo build + validação + `actionlint` + `validate-diagrams` (quando `*.md` mudar), **sem** publicar |
| `origin-cert.yml` | semanal | verifica o certificado da origem (seção 10.3) |

Configuração no GitHub:

- **Settings → Pages → Source: GitHub Actions**.
- **Secrets/variables:** secret `CLOUDFLARE_API_TOKEN` (permissão **somente** `Zone → Cache Purge`, zona `aeciopires.com`, com data de expiração) e variable `CLOUDFLARE_ZONE_ID`.
- **Branch protection** em `main`: exigir `pr-check`, proibir force-push.

### 8.1 Rascunho do `deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<SHA>  # v7.0.1
        with:
          fetch-depth: 0              # .Lastmod via git
          submodules: true            # tema Blowfish (themes/blowfish)

      - uses: jdx/mise-action@<SHA>   # v5.2.10 — instala as versões do mise.toml (com cache)
        with:
          install: true
          cache: true

      - id: pages
        uses: actions/configure-pages@<SHA>   # v6.0.0

      - name: Build
        env:
          HUGO_ENVIRONMENT: production
        run: hugo --gc --minify --baseURL "${{ steps.pages.outputs.base_url }}/"

      - name: Validar links internos e imagens
        run: make validate-links      # lychee --offline sobre public/

      - uses: actions/upload-pages-artifact@<SHA>   # v5.0.0
        with:
          path: ./public

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@<SHA>   # v5.0.1

      - name: Limpar cache do Cloudflare
        env:
          CF_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CF_ZONE: ${{ vars.CLOUDFLARE_ZONE_ID }}
        run: |
          sleep 30   # aguarda a CDN do GitHub Pages propagar
          curl -fsS -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/purge_cache" \
            -H "Authorization: Bearer ${CF_TOKEN}" \
            -H "Content-Type: application/json" \
            --data '{"hosts":["blog.aeciopires.com"]}'
```

Observações:

- `base_url` vem do `configure-pages`: no staging é `https://aeciopires.github.io/blog-aeciopires`; com o domínio configurado passa a ser `https://blog.aeciopires.com`.
- Com deploy via Actions, o arquivo `CNAME` no repositório **não** é usado; o domínio é configurado em Settings → Pages.
- Purge por hostname limpa só o blog. Se não estiver disponível no plano no momento da implementação, usar `{"purge_everything":true}`.
- Posts com data futura não são publicados (padrão do Hugo). Como não haverá agendamento, a data do post deve ser a do momento da publicação.
- Versões das *actions* indicadas nos comentários são as mais novas em 20/11/2026. No arquivo real, cada `uses:` aponta para o **SHA completo** do commit dessa versão, com o número da versão em comentário.
- O `pr-check.yml` roda também `make lint-md` e `hugo --logLevel info --printPathWarnings`.
- Do push até o ar: ~1–2 minutos.

### 8.2 Segurança da cadeia de publicação

O risco mais realista **não** é um ataque ao site estático, e sim alguém publicar conteúdo malicioso pelo GitHub ou pelo Cloudflare:

- 2FA no GitHub e no Cloudflare.
- Actions fixadas por SHA; Dependabot atualizando-as (único ecossistema no `dependabot.yml`).
- Tema e ferramentas só mudam por PR, com teste local antes (`make update-theme`, edição do `mise.toml`).
- App giscus instalado só neste repositório, com as permissões mínimas que ele pede (6.6).
- `permissions` mínimas nos workflows.
- Token do Cloudflare com escopo apenas de *Cache Purge* e com expiração.
- Branch protection em `main`.
- Secret scanning e push protection habilitados.
- Verificação do domínio na conta GitHub (impede *takeover*).

---

## 9. Ambiente local: mise, Make e Docker

![Fluxo local](images/06-fluxo-local.png)

### 9.1 Plataformas suportadas

| SO | Arquitetura | Docker |
|---|---|---|
| Ubuntu 22.04 LTS | amd64 | Docker Engine + plugin Compose v2 (instalados por fora) |
| Ubuntu 24.04 LTS | amd64 | idem |
| Ubuntu 26.04 LTS | amd64 | idem |
| macOS | amd64 (Intel) | **Colima** + Docker CLI + Compose (instalados por fora) |
| macOS | arm64 (Apple Silicon) | **Colima** + Docker CLI + Compose (instalados por fora) |

O Docker é **opcional**: com o mise, tudo roda nativamente. O Docker serve como alternativa isolada (`make serve-docker`).

### 9.2 Ferramentas gerenciadas pelo mise (`mise.toml`)

Todas têm binários pré-compilados para linux-amd64, darwin-amd64 e darwin-arm64. Versões **conferidas em 20/11/2026** (seção 9.2.1):

```toml
[tools]
hugo-extended     = "0.169.0"   # gerador; máximo suportado pelo Blowfish v3.10.0 (0.166.0–0.169.0)
lychee            = "0.24.2"    # verificação de links
actionlint        = "1.7.12"    # lint dos workflows
shellcheck        = "0.11.0"    # lint dos scripts (portabilidade)
oxipng            = "10.2.1"    # otimização de PNG
node              = "26.13.1"   # LTS; necessário para markdownlint-cli2 e scripts .mjs
"npm:markdownlint-cli2" = "0.24.1"   # lint de Markdown (make lint-md)

[env]
HUGO_ENVIRONMENT = "development"
```

- **Sem Go:** o tema entra por submódulo (3.3), então o Go saiu do `mise.toml`.
- Versões **exatas** (nunca `latest`), as mesmas na máquina local e na CI.
- Só para a migração: `wp2hugo` 1.39.0 via `github:ashishb/wp2hugo`, que publica binários para Linux e macOS (amd64/arm64), instalado por `make migrate-install`.
- **Fora do mise (pré-requisitos do sistema):** `git`, `make`, `curl` e `bash`. No Ubuntu vêm via apt; no macOS, via Xcode Command Line Tools.
- **Gerenciados por fora (não instalados pelo Make):** Docker Engine/CLI, Docker Compose e Colima.
- O próprio mise: usar a versão mais nova (2026.11.10 nesta data), atualizada com `mise self-update`.

### 9.2.1 Política de versões: sempre a mais nova possível

**Regra:** usar a **versão estável mais nova** de cada software, **exceto quando outro componente limitar**. Nesse caso, usar a mais nova **dentro do limite** e registrar o motivo. Não usar versões *alpha*, *beta*, *RC* ou *nightly*. Para runtimes com LTS (Node.js), usar o **LTS mais novo**.

| Software | Mais nova em 20/11/2026 | Usada | Motivo |
|---|---|---|---|
| Hugo *extended* | 0.170.1 | **0.169.0** | Blowfish v3.10.0 declara `hugoVersion` máx. 0.169.0 |
| Blowfish | v3.10.0 | **v3.10.0** | — |
| lychee | 0.24.2 | 0.24.2 | — |
| actionlint | 1.7.12 | 1.7.12 | — |
| shellcheck | 0.11.0 | 0.11.0 | — |
| oxipng | 10.2.1 | 10.2.1 | — |
| Node.js | 27.0.0-alpha (current) | **26.13.1 (LTS)** | LTS mais novo; versões alpha estão fora |
| markdownlint-cli2 | 0.24.1 | 0.24.1 | — |
| wp2hugo | 1.39.0 | 1.39.0 | Só na migração |
| mise | 2026.11.10 | 2026.11.10 | — |
| Imagem `ghcr.io/gohugoio/hugo` | v0.170.1 | **v0.169.0** | Igual ao Hugo do `mise.toml` |
| mermaid-cli | 12.2.0 (release) | **imagem `minlag/mermaid-cli:12.0.1`** | 12.0.1 é a imagem mais nova publicada no Docker Hub; atualizar quando a 12.2.x sair |
| `actions/checkout` | v7.0.1 | v7.0.1 | fixada por SHA |
| `actions/configure-pages` | v6.0.0 | v6.0.0 | fixada por SHA |
| `actions/upload-pages-artifact` | v5.0.0 | v5.0.0 | fixada por SHA |
| `actions/deploy-pages` | v5.0.1 | v5.0.1 | fixada por SHA |
| `actions/cache` | v6.1.0 | v6.1.0 | fixada por SHA |
| `jdx/mise-action` | v5.2.10 | v5.2.10 | fixada por SHA |

- **Na implementação (Fase 0):** repetir a consulta. `make check-updates` (9.3) mostra a versão em uso e a mais nova de cada item, já respeitando a faixa de Hugo do Blowfish.
- **Depois:** a atualização é **sob demanda**, decidida pelo autor e testada localmente antes do push (seção 12).

### 9.3 Alvos do `Makefile`

`make help` lista todos os alvos com descrição. Todo alvo que **apaga ou altera** conteúdo funciona em **modo simulação** por padrão: mostra o que faria e só executa com `CONFIRM=sim`.

**Ambiente e dependências**

| Alvo | O que faz |
|---|---|
| **`make check-deps`** | Diagnóstico do ambiente, sem alterar nada (9.4) |
| **`make install-deps`** | Instala mise, ferramentas e submódulo do tema (9.5) |
| `make serve` | `hugo server -D --navigateToChanged` em `http://localhost:1313` (mostra rascunhos) |
| `make serve-prod` | Servidor local **como o leitor vê**: sem rascunhos, `--environment production`, sem analytics |
| `make serve-docker` | Mesmo servidor via Docker/Compose (Colima no macOS) |
| `make build` | Build de produção em `public/` |
| `make clean` | Remove `public/`, `resources/_gen/`, `.hugo_build.lock`, `reports/` |

**Conteúdo (9.3.1)**

| Alvo | O que faz |
|---|---|
| `make new-post SLUG=… [TITLE="…"]` | Cria `content/posts/<slug>/index.md` a partir de `archetypes/posts.md`, com `draft: true` (alias: `make new`) |
| `make new-page SLUG=… [TITLE="…"]` | Cria `content/<slug>/index.md` (página fixa, *page bundle*) a partir de `archetypes/pages.md`, com `draft: true`. Lembra de incluir no menu (`menus.pt-br.toml`), se for o caso |
| `make unpublish-post SLUG=…` | **Despublica:** muda para `draft: true`. Sai do site no próximo deploy e continua visível no `make serve` local |
| `make unpublish-page SLUG=…` | Mesmo comportamento, para páginas. Avisa se a página estiver no menu |
| `make publish-post SLUG=… [DATE=now]` | Volta para `draft: false`. Com `DATE=now`, atualiza `date` para o momento atual |
| `make publish-page SLUG=…` | Idem, para páginas |
| `make rm-post SLUG=… [REDIRECT=<slug>] CONFIRM=sim` | **Remove** o post (`git rm -r`). Antes, lista os posts e páginas que apontam para ele. Com `REDIRECT`, adiciona `aliases` no destino, para o endereço antigo não virar 404 |
| `make rm-page SLUG=… [REDIRECT=<slug>] CONFIRM=sim` | Idem, para páginas; também avisa se estiver no menu |
| `make list-drafts` | Lista tudo que está como rascunho (`hugo list drafts`) |
| `make check-tags` · `fix-tags` · `new-tag` · `merge-tag` · `tags-report` · `install-hooks` | Governança das tags: validação, correção de sinônimos, registro, união e relatório (6.8) |
| `make optimize-images` | `oxipng` nos PNGs novos ou alterados |

**Qualidade e manutenção (9.3.2)**

| Alvo | O que faz |
|---|---|
| `make lint-md` | Análise de sintaxe do Markdown com **markdownlint-cli2** em `content/`, `README.md`, `CLAUDE.md`, `docs/` e `PLANS/` |
| `make lint-md-fix` | Corrige automaticamente o que for seguro (`--fix`) e mostra o diff |
| `make validate` | `lint-md` + `check-tags` + `build` + `validate-links` (lychee offline) + `actionlint` + `shellcheck` + `compare-urls`: o mesmo que a CI |
| `make validate-diagrams` | Valida os blocos Mermaid via Docker (13.4) |
| `make check-links-online` | lychee **online** nos links externos dos posts (não bloqueante; gera `reports/links.md`) |
| `make audit-content [SLUG=…]` | Varre os posts e gera `reports/content-audit.md` e `.json` com as versões de software citadas, comandos e APIs possivelmente obsoletos, links externos e idade do post. É a entrada da *skill* `revisar-conteudo` (9.3.3) |
| `make check-updates` | Compara as versões em uso com as mais novas: ferramentas do mise (`mise outdated`), Hugo (com a faixa permitida pelo Blowfish), tag mais nova do Blowfish, imagem do mermaid-cli. Gera `reports/updates.md`; **não altera nada** |
| `make update-theme TAG=vX.Y.Z` | Move o submódulo para a tag, mostra o changelog e o diff da *skill* do Blowfish, avisa se a faixa de Hugo mudou, roda `make validate` |
| `make skill-sync` | Recria o link (ou a cópia) `.claude/skills/blowfish` a partir do submódulo |
| `make outdated` | Atalho de leitura: `mise outdated` + tag do Blowfish |

#### 9.3.1 Como os alvos de conteúdo funcionam

- **Despublicar ≠ remover.** `unpublish-*` só marca o rascunho:
  - o Hugo não gera rascunhos em produção, então a página some do site, do RSS, do sitemap e da busca no próximo deploy;
  - a URL passa a dar 404, e o deploy limpa o cache;
  - o comentário do giscus, que fica no GitHub, é preservado e volta se o conteúdo for republicado.
- **Atenção à privacidade dos rascunhos:**
  - o GitHub Pages no plano gratuito exige **repositório público**;
  - portanto, um rascunho fica **invisível no site, mas legível no GitHub**, junto com o histórico do git.
  - **Decisão:** o padrão é `draft: true` versionado. A despublicação privada acontece **só quando você pedir**, com `PRIVATE=1` (`make unpublish-post SLUG=… PRIVATE=1`):
    - o *bundle* vai para `_privado/`, que está no `.gitignore`;
    - essa pasta só é montada como conteúdo no ambiente de desenvolvimento (`config/development/module.toml`, `[[module.mounts]]`), então você continua vendo o rascunho no `make serve`;
    - ele nunca é commitado. **Faça backup próprio** dessa pasta.
  - O que já foi commitado continua no histórico do git.
- **Remoção segura:**
  - `rm-*` exige `CONFIRM=sim`;
  - recusa se houver alterações não commitadas no *bundle*;
  - mostra os links internos que vão quebrar e sugere `REDIRECT`;
  - também lembra de travar ou arquivar a discussão do giscus correspondente, e de pedir remoção no Search Console se o conteúdo for sensível.
- **Edição de *front matter* portátil:** feita por `scripts/content.sh` com `awk` e arquivo temporário (sem `sed -i`), compatível com bash 3.2 e BSD (9.7). Só altera a chave `draft`/`date` dentro do bloco `---`.
- **Validação:** todos os alvos validam o `SLUG` (minúsculas, números e hífens) e recusam caminhos fora de `content/`.

#### 9.3.2 Lint e auditoria de conteúdo

- **`.markdownlint-cli2.yaml` ajustado para Hugo:**
  - aceita *front matter*;
  - desliga o limite de largura de linha (MD013);
  - permite os *shortcodes* `{{< … >}}`;
  - exige linguagem nos blocos de código (MD040), títulos em sequência (MD001) e texto alternativo em imagens (MD045).
- **Bloqueio:** o `make lint-md` entra no `make validate` e no `pr-check`. Os posts antigos podem receber exceções pontuais (`<!-- markdownlint-disable-next-line -->`) até serem revisados.
- **`make audit-content`** (`scripts/audit-content.mjs`, roda com o Node do mise) não acessa a internet. Ele só **extrai e organiza** o que precisa de checagem:
  - versões em comandos (`--version`, `image: x:tag`, `FROM x:tag`, `helm … --version`, `go 1.xx`, `python 3.x`);
  - `apiVersion` do Kubernetes marcadas como removidas;
  - URLs de documentação e releases;
  - posts com mais de 2 anos sem `lastmod`.
- **Validação contra as fontes oficiais:** comparar com a documentação e as releases oficiais e reescrever trechos exige julgamento. Por isso fica na *skill* `revisar-conteudo`, que usa esse relatório (9.3.3).

#### 9.3.3 Skills do projeto (Claude Code)

| Skill | Origem | Para quê |
|---|---|---|
| `blowfish` | Oficial, via submódulo (3.6.1) | Tema: configuração, layouts, *shortcodes*, *front matter*, atualização |
| `revisar-conteudo` | Própria (`.claude/skills/revisar-conteudo/SKILL.md`) | Validar um post (ou os N mais antigos/mais lidos) **contra fontes oficiais** e propor atualização de conteúdo e de versões de software |
| `atualizar-site` | Própria (`.claude/skills/atualizar-site/SKILL.md`) | Atualizar Hugo, Blowfish, ferramentas do mise e imagens, lendo as notas de versão oficiais |

**`revisar-conteudo`, passo a passo** (o que o `SKILL.md` instrui):

1. Rodar `make audit-content SLUG=<slug>` e ler `reports/content-audit.md`.
2. Para cada software, comando ou API citado, consultar **somente fontes oficiais**: documentação do projeto, página de releases/changelog, guias de migração. Anotar URL e data de cada fonte.
3. Classificar cada item:
   - **atual**;
   - **desatualizado com substituto direto** (ex.: nova versão do chart);
   - **obsoleto/removido** (ex.: API Kubernetes removida);
   - **incerto**, que precisa da sua decisão.
4. Propor as edições numa **branch**:
   - atualizar versões e comandos;
   - adicionar no início a nota "Atualizado em DD/MM/AAAA: …" com o resumo;
   - atualizar `lastmod`;
   - **preservar o sentido histórico**: quando atualizar mudaria o tutorial, adicionar um aviso em vez de reescrever.
5. Testar o que for testável localmente (ex.: comandos `helm template`, `docker run --rm`), sem tocar em infraestrutura real.
6. Rodar `make lint-md validate` e mostrar o resultado no `make serve`.
7. Abrir o PR com uma tabela "item · antes · depois · fonte oficial". **Nunca** fazer push direto na `main` nem publicar sem a sua aprovação.

**`atualizar-site`, passo a passo:**

1. Rodar `make check-updates`.
2. Para cada item, ler as notas de versão oficiais (Hugo releases, Blowfish releases e *Updating*, changelog de cada ferramenta), procurando mudanças incompatíveis e *deprecations*.
3. Respeitar a política 9.2.1, principalmente a faixa de Hugo do Blowfish.
4. Atualizar **uma coisa por vez**:
   - `mise.toml`, seguido de `mise install`;
   - ou `make update-theme TAG=…`;
   - depois, `make validate` e `make serve` para a revisão visual nos modos claro e escuro e no celular.
5. Abrir um PR com o resumo das mudanças e os links das notas de versão.

As três *skills* obedecem ao `CLAUDE.md` (seção 14): segurança, CSP, URLs imutáveis, nada de push sem pedido.

### 9.4 `make check-deps` (via `scripts/check-deps.sh`)

Saída em tabela `OK / AVISO / FALTA`:

| Verificação | Tipo |
|---|---|
| SO e arquitetura (`uname -s`, `uname -m`; Ubuntu via `/etc/os-release` = 22.04/24.04/26.04; macOS amd64/arm64). Outras combinações: aviso de "não testado" | aviso |
| `git`, `make`, `curl`, `bash` presentes | obrigatório |
| `mise` presente e ativado no shell (`mise doctor`) | obrigatório |
| Ferramentas do `mise.toml` instaladas nas versões exatas (`mise ls --missing`) | obrigatório |
| `mise.toml` confiável (`mise trust`) | obrigatório |
| Hugo é *extended* (`hugo version` contém `+extended`) | obrigatório |
| Hugo dentro da faixa `[module.hugoVersion]` do Blowfish fixado (lida de `themes/blowfish/config.toml`) | obrigatório |
| Submódulo `themes/blowfish` inicializado e na tag registrada | obrigatório |
| Link `.claude/skills/blowfish` válido | aviso (corrigir com `make skill-sync`) |
| Docker CLI, `docker compose` (v2) ou `docker-compose`, daemon acessível (`docker info`) | opcional |
| macOS: `colima` instalado e em execução (`colima status`), contexto Docker `colima` | opcional |
| Porta 1313 livre | aviso |

### 9.5 `make install-deps` (via `scripts/install-deps.sh`)

1. **Pré-requisitos do sistema:**
   - Ubuntu: se faltar `git`/`make`/`curl`/`ca-certificates`, mostra e executa (pedindo confirmação) `sudo apt-get install -y ...`.
   - macOS: se faltar, orienta `xcode-select --install`.
2. **mise:** se não existir, instala pelo instalador oficial (`curl https://mise.run | sh`). No macOS com Homebrew, a alternativa é `brew install mise`. Em seguida mostra a linha de ativação para `~/.bashrc` ou `~/.zshrc` (`eval "$(mise activate bash|zsh)"`), sem editar arquivos do usuário automaticamente.
3. `mise trust` + `mise install`: instala as versões exatas do `mise.toml`.
4. `git submodule update --init`: baixa o Blowfish na tag fixada; depois `make skill-sync`.
5. **Docker/Compose/Colima:** **não instala**. Apenas informa o status e aponta a documentação oficial (Docker Engine para Ubuntu; Colima para macOS).
6. Ao final, roda `make check-deps`.

O script é idempotente: pode ser executado várias vezes.

### 9.6 Docker / Colima

`docker-compose.yml` (rascunho):

```yaml
services:
  hugo:
    image: ghcr.io/gohugoio/hugo:v${HUGO_VERSION}   # mesma versão do mise.toml
    command: server -D --bind 0.0.0.0 --port 1313 --poll 700ms
    ports:
      - "127.0.0.1:1313:1313"     # exposto só na máquina local
    volumes:
      - ./:/project
      - hugo_cache:/cache         # cache de recursos do Hugo
    working_dir: /project
volumes:
  hugo_cache:
```

- O Makefile lê a versão do Hugo do `mise.toml` (`awk`) e a passa como `HUGO_VERSION`. Assim, quem usa só Docker não precisa do mise.
- O Makefile detecta `docker compose` (v2) ou, se não houver, `docker-compose` (legado).
- A imagem oficial do Hugo (`ghcr.io/gohugoio/hugo`) é multi-arquitetura (amd64/arm64). O tema já está no diretório montado (submódulo), então não há download de módulos.
- **macOS + Colima** (configuração sugerida, documentada no README):

  ```bash
  colima start --cpu 2 --memory 4 --vm-type vz --mount-type virtiofs
  docker context use colima
  ```

  `--poll 700ms` garante o *live reload*, já que eventos de arquivo nem sempre atravessam o mount da VM.

### 9.7 Regras de portabilidade (Ubuntu × macOS)

O macOS traz GNU Make 3.81, bash 3.2 e utilitários BSD. Por isso:

- Makefile compatível com GNU Make 3.81: sem `.ONESHELL`, `$(file ...)` ou `undefine`; `SHELL := /bin/bash`.
- Scripts compatíveis com bash 3.2: sem arrays associativos, `mapfile` ou `${var,,}`.
- Sem `sed -i` (sintaxe difere entre GNU e BSD; usar arquivo temporário), `date -d`, `readlink -f` ou `grep -P`.
- `sha256sum` (Linux) × `shasum -a 256` (macOS): detectar.
- `shellcheck` em todos os scripts (`make validate` e CI).
- A CI roda em `ubuntu-latest`. Opcional: matriz `pr-check` com `macos-latest` para validar `check-deps`/`build` no macOS.

### 9.8 Fluxo de trabalho

1. Primeira vez: `git clone --recurse-submodules …` → `make check-deps` → `make install-deps`.
2. `make new-post SLUG=meu-post` → escrever → `make serve` (live reload em `http://localhost:1313`).
3. `make lint-md` → `make validate` (mesmo resultado que a CI) → `make serve-prod` (ver como o leitor vai ver).
4. `make publish-post SLUG=meu-post DATE=now` → `git commit` → `git push` (publica em ~2 min). Para revisar com calma, abrir PR: o `pr-check` valida sem publicar.

O passo a passo completo de operação, manutenção e evolução está no `docs/MAINTENANCE.md` (seção 13.3).

---

## 10. Domínio, DNS e integração Cloudflare ↔ GitHub Pages

![Virada de DNS](images/05-virada-dns.png)

### 10.1 Como as peças se encaixam

- O **Cloudflare** continua dono do DNS e fica na frente como **proxy** (nuvem laranja).
- **Dois certificados:** *Universal SSL* do Cloudflare na borda (visitante ↔ Cloudflare) e Let's Encrypt emitido pelo GitHub Pages na origem (Cloudflare ↔ GitHub).
- Modo SSL/TLS **Full (strict)**: criptografia ponta a ponta com validação do certificado da origem.

### 10.2 Passo a passo da virada (ordem importa)

O GitHub só emite o certificado se enxergar o DNS apontando para ele, por isso o proxy é ligado **por último**.

1. **Verificar o domínio na conta GitHub:** Settings (usuário) → Pages → *Add a domain* → `aeciopires.com` → TXT `_github-pages-challenge-aeciopires` no Cloudflare → Verify. Pode ser feito dias antes.
2. **Cloudflare → DNS:** `blog` → `CNAME aeciopires.github.io`, **DNS only (nuvem cinza)**. Remover `A`/`AAAA` antigos de `blog`.
3. **Repositório → Settings → Pages → Custom domain:** `blog.aeciopires.com`. Aguardar "DNS check successful".
4. Aguardar o certificado do GitHub e marcar **Enforce HTTPS**.
5. **Cloudflare → SSL/TLS:** **Full (strict)**; *Always Use HTTPS*; TLS mínimo 1.2; TLS 1.3; *Automatic HTTPS Rewrites*. **Não** ligar o HSTS da zona (vale para todos os subdomínios); o HSTS vai só para o blog via Transform Rule (11.5).
6. **Cloudflare → DNS:** ligar o **proxy** (nuvem laranja) em `blog`.
7. Aplicar as regras da seção 11 e ativar o Web Analytics.
8. Testar: `curl -sI https://blog.aeciopires.com/` (`server: cloudflare`, `cf-cache-status`), `/feed/`, navegação anônima, Jotform.
9. Search Console: reenviar `sitemap.xml`.
10. Manter o WordPress em subdomínio temporário com acesso restrito por 30 dias.

Com o proxy ligado, o GitHub Pages pode exibir aviso de DNS ("not pointing to GitHub"). **É esperado**.

### 10.3 Renovação do certificado da origem (ponto de atenção)

O GitHub renova o certificado (~90 dias) automaticamente. Com o proxy ligado, a validação passa pelo Cloudflare. Normalmente funciona, mas se falhar e o certificado vencer, o Full (strict) passa a retornar **erro 526**.

- Nenhuma regra de WAF, redirect ou cache pode afetar `/.well-known/acme-challenge/*` (regras W1/C1).
- `origin-cert.yml` semanal: falha (e o GitHub envia e-mail) se faltarem menos de 20 dias ou se o certificado não for de `blog.aeciopires.com`:

  ```bash
  echo | openssl s_client -connect 185.199.108.153:443 -servername blog.aeciopires.com 2>/dev/null \
    | openssl x509 -noout -subject -enddate
  ```

- Contingência (em `docs/cloudflare.md`): desligar o proxy por ~1 hora para o GitHub renovar e religar. Emergencial: SSL **Full** temporariamente.

---

## 11. Cloudflare: cache e segurança

![Camadas Cloudflare](images/15-cloudflare-camadas.png)

> Limites do plano Free usados como referência (confirmar no painel na implementação): WAF custom rules **5**, rate limiting **1**, Single Redirects **10**, Cache Rules **10**, Transform Rules **10** por tipo.

### 11.1 Precisa de regras de segurança?

Sem PHP, banco, `/wp-admin`, login, XML-RPC e plugins, as principais classes de ataque do WordPress desaparecem.

| Ameaça | Relevância | Proteção |
|---|---|---|
| DDoS L3/L4/L7 | média | **Automático e ilimitado no Free**; cache absorve a carga |
| Esgotar banda do GitHub Pages (limite *soft* 100 GB/mês) | baixa–média | Cache de tudo na borda (11.3) |
| Scanners procurando WordPress (`/wp-login.php`, `.env`…) | alta frequência, impacto baixo | WAF bloqueia na borda |
| Scraping agressivo / bots | baixa | Rate limiting (*Block AI bots* **desligado** por decisão: o conteúdo é público e pode ser indexado por IAs) |
| Scripts de terceiros comprometidos (Jotform, giscus, analytics) | baixa | CSP restritiva (11.5) |
| Spam/abuso nos comentários | média | giscus exige login do GitHub; moderação, bloqueio e *interaction limits* do GitHub (6.6) |
| Clickjacking, MIME sniffing | baixa | Headers de segurança (11.5) |
| Comprometimento de conta GitHub/Cloudflare | **a mais relevante** | 2FA, branch protection, tokens mínimos, actions por SHA (8.2) |
| *Takeover* do subdomínio | média se não tratado | Verificação de domínio no GitHub (10.2) |

**Conclusão:** as regras **não são críticas**, mas são **recomendadas e gratuitas**. Reduzem ruído, protegem a banda da origem e endurecem o navegador do visitante.

### 11.2 Configurações gerais da zona

| Onde | Configuração |
|---|---|
| SSL/TLS | Full (strict) · Always Use HTTPS · TLS ≥ 1.2 · TLS 1.3 · Automatic HTTPS Rewrites |
| Security → Settings | Security Level *Medium* · Browser Integrity Check ligado |
| Security → Bots | *Block AI bots* **desligado** (decisão, seção 18) · *Bot Fight Mode* **desligado** (não pode ser contornado por regras; pode bloquear leitores RSS e a validação do certificado) |
| Security → WAF → Managed rules | *Cloudflare Free Managed Ruleset* (padrão) |
| Speed / Network | HTTP/3, 0-RTT, Brotli, Early Hints · **Rocket Loader desligado** (reescreve scripts, conflita com a CSP e com o Blowfish) |
| Caching | Tiered Cache (Smart Topology) ligado |
| Scrape Shield | Email Obfuscation ligado · Hotlink Protection **desligado** |
| DNS | **DNSSEC** ligado (DS no registrador). Se houver CAA, incluir `letsencrypt.org` |
| Notifications | Alertas de certificado e DDoS disponíveis no Free |
| Analytics | **Web Analytics** para `blog.aeciopires.com` (11.7) |

### 11.3 Cache

O GitHub Pages envia `Cache-Control: max-age=600`, e por padrão o Cloudflare não guarda HTML em cache. Como o deploy limpa o cache, é seguro guardar mais tempo na borda.

| # | Cache Rule | Expressão | Ação |
|---|---|---|---|
| C1 | Não cachear ACME | `starts_with(http.request.uri.path, "/.well-known/acme-challenge/")` | Bypass |
| C2 | Cachear o blog | `http.host eq "blog.aeciopires.com"` | Eligible · **Edge TTL 1 dia** · Browser TTL: respeitar origem |
| C3 | Assets com fingerprint | `http.host eq "blog.aeciopires.com" and (starts_with(http.request.uri.path, "/css/") or starts_with(http.request.uri.path, "/js/") or starts_with(http.request.uri.path, "/fonts/"))` | Browser TTL **1 ano** |

### 11.4 WAF, rate limiting e redirects

**WAF custom rules (5):**

| # | Nome | Expressão | Ação |
|---|---|---|---|
| W1 | Liberar ACME | `starts_with(http.request.uri.path, "/.well-known/acme-challenge/")` | **Skip** (demais regras + rate limit) |
| W2 | Só leitura | `not http.request.method in {"GET" "HEAD" "OPTIONS"}` | Block |
| W3 | Scanners e arquivos sensíveis | `http.request.uri.path contains ".php" or http.request.uri.path contains "/wp-admin" or http.request.uri.path contains "/wp-includes" or http.request.uri.path contains "/xmlrpc" or http.request.uri.path contains "/.env" or http.request.uri.path contains "/.git" or http.request.uri.path contains "/cgi-bin"` | Block |
| W4 | User-agent vazio | `http.user_agent eq ""` | Block |
| W5 | Emergência | ex.: país/ASN de ataque em curso | Managed Challenge (**desativada**) |

> W3 **não** bloqueia `/wp-content/`, porque `/wp-content/uploads/` continua servindo as imagens antigas.

**Rate limiting (1):** `http.host eq "blog.aeciopires.com"` → 100 requisições / 10 s por IP → Block 10 s. Uma página carrega ~20–40 arquivos, então o limite nunca afeta leitores reais.

**Single Redirects:**

| # | Origem | Destino | Tipo |
|---|---|---|---|
| R1 | `/feed/`, `/feed`, `/comments/feed/` | `https://blog.aeciopires.com/index.xml` | 301 |
| R2 | wildcard `https://blog.aeciopires.com/*/feed/` | `https://blog.aeciopires.com/${1}/index.xml` | 301 |

### 11.5 Headers de segurança (Transform Rules → Response Headers, só `blog.aeciopires.com`)

| Header | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000` (começar com `max-age=300`; **sem** `includeSubDomains`/`preload`) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | abaixo |

CSP proposta. Publicar primeiro como `Content-Security-Policy-Report-Only` por 1–2 semanas:

```text
default-src 'self';
script-src 'self' https://static.cloudflareinsights.com https://form.jotformz.com https://cdn.jotfor.ms https://giscus.app;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self';
connect-src 'self' https://cloudflareinsights.com;
frame-src https://form.jotformz.com https://giscus.app https://www.youtube-nocookie.com https://www.youtube.com;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests
```

- Se o Blowfish tiver scripts inline (ex.: aplicar o modo escuro antes da renderização), incluir os *hashes* (`'sha256-…'`) desses scripts em vez de `'unsafe-inline'`. A fase Report-Only revela isso.
- giscus: `client.js` vem de `giscus.app` e cria um *iframe* do mesmo domínio (seção 6.6). As folhas de tema do giscus são servidas pelo próprio blog e lidas pelo *iframe*, sem exigir nada na CSP do blog.
- Jotform: **embed por script** (decisão, seção 18), igual ao blog atual. O script `form.jotformz.com/jsform/<ID>` carrega recursos de `cdn.jotfor.ms` e cria um iframe apontando para `form.jotformz.com`. Por isso os dois domínios entram em `script-src`, e `form.jotformz.com` continua em `frame-src`. O CSP fica um pouco menos restritivo que com iframe puro, risco aceito pela decisão. Confirmar a lista exata na fase Report-Only (o Jotform pode usar outros subdomínios, como `*.jotfor.ms`).
- Novos embeds (YouTube, Gist etc.) exigem atualizar a CSP. Essa regra fica registrada no `CLAUDE.md`.

### 11.6 Acesso somente via Cloudflare — decisão: **risco aceito**

| Caminho | Situação |
|---|---|
| `https://blog.aeciopires.com` | passa pelo Cloudflare ✅ |
| `https://aeciopires.github.io/blog-aeciopires/` | 301 → domínio, passa pelo Cloudflare ✅ |
| IPs do GitHub Pages (`185.199.108–111.153`) com `Host: blog.aeciopires.com` | responde sem Cloudflare ❌ — não há como bloquear |

O GitHub Pages é hospedagem compartilhada: não oferece allowlist de IP, firewall, mTLS (*Authenticated Origin Pulls*), verificação de header secreto nem Tunnel. **Impacto baixo:** quem contorna só obtém o mesmo conteúdo público. Se um dia virar requisito, a alternativa é migrar a origem para **Cloudflare Pages** (sem origem pública), sem retrabalho no conteúdo ou no tema.

### 11.7 Cloudflare Web Analytics

- Ativar em **Analytics & Logs → Web Analytics → `blog.aeciopires.com`**.
- Beacon incluído pelo partial `extend-head.html` só em produção, mantendo o controle no código e na CSP.
- Sem cookies → **sem banner de consentimento (LGPD)**; descrito na página Privacidade.
- Complementa o Analytics de tráfego da zona (requisições, cache hit, ameaças bloqueadas).
- Google Search Console continua para SEO.

---

## 12. Manutenção e atualizações ao longo do tempo

### 12.1 Quem atualiza o quê

| Componente | Onde a versão fica | Como atualizar |
|---|---|---|
| GitHub Actions | `.github/workflows/*.yml` (SHA + comentário com a versão) | **Dependabot** (semanal) abre PR → `pr-check` → merge |
| Blowfish (+ *skill* oficial) | submódulo `themes/blowfish` (tag) | **Sob demanda:** `make check-updates` → `make update-theme TAG=…` → teste local → PR. O Dependabot não é usado para o submódulo porque segue commits da `main`, não releases |
| Hugo, lychee, actionlint, shellcheck, oxipng, Node, markdownlint-cli2 | `mise.toml` | **Manual, sob demanda:** `make check-updates` → editar a versão no `mise.toml` → `mise install` → `make validate` + `make serve` → PR. Sem Renovate: nenhuma ferramenta muda sem teste local antes do push |
| Imagem Docker do Hugo | derivada do `mise.toml` | automática (Makefile) |
| Imagem do mermaid-cli | `Makefile` (`MERMAID_IMAGE`) | Sob demanda, junto com as ferramentas |
| Conteúdo dos posts (versões, comandos, links) | `content/posts/` | `make audit-content` + *skill* `revisar-conteudo` → PR |
| Regras do Cloudflare | `docs/cloudflare.md` | Revisão trimestral; toda mudança no painel atualiza o documento |
| Token do Cloudflare | GitHub Secrets | Rotação anual (expiração configurada no token) |
| App giscus / Discussions | GitHub (Settings → Integrations) | Revisão anual das permissões; moderação semanal |

Todas as atualizações seguem a **política de versões** (9.2.1): a estável mais nova possível, limitada só por compatibilidade, com o motivo registrado.

### 12.2 Rotina sugerida

| Frequência | Tarefa |
|---|---|
| Semanal | Moderar comentários do giscus (e-mails de Discussions); olhar falhas de workflow |
| A cada PR do Dependabot | Ler o changelog da *action*, deixar o `pr-check` rodar e fazer merge |
| Mensal | `make check-updates` (só **ver** o que há de novo); conferir alertas de segurança do GitHub; `make check-links-online` |
| Trimestral | `make tags-report` + `make merge-tag` nas tags fracas (6.8); `make audit-content` + *skill* `revisar-conteudo` nos 5 posts mais lidos (Cloudflare Web Analytics) e nos 5 mais antigos; revisar eventos do WAF, métricas de cache e relatórios da CSP; checar limites do plano Free |
| Quando sair versão do Hugo ou do Blowfish | *Skill* `atualizar-site` ou `make update-theme`; ler as notas de migração; `hugo --logLevel info` para ver *deprecations*; testar com `make serve` (claro/escuro/celular) e `make validate` antes do PR |
| Anual | Rotacionar o token do Cloudflare; revisar permissões do app giscus e do token; revisar `CLAUDE.md`, `README.md`, `docs/*.md`, página Créditos (licenças e versões) e `assets/img/logos/SOURCES.md` (diretrizes de marca) |
| Sempre que o `origin-cert.yml` falhar | Seguir a contingência da seção 10.3 |

### 12.3 Regras para atualizações seguras

- Uma atualização por PR (ou um grupo coerente), nunca direto na `main`.
- `make lint-md validate` local + `pr-check` verde antes do merge.
- Testar localmente **antes do push** (`make serve` e `make serve-prod`), sempre que mudar tema, ferramenta ou layout.
- Testar em pelo menos um Ubuntu e um macOS quando mudar `Makefile`, scripts ou `mise.toml`.
- Rollback de código: `git revert` + push (o site volta em ~2 min). Rollback de tema: `make update-theme TAG=<tag anterior>`.

---

## 13. Documentação do projeto (arquitetura e manutenção)

### 13.1 Documentos a criar

| Arquivo | Público | Conteúdo |
|---|---|---|
| `README.md` | quem chega ao repositório | O que é o projeto, *quick start* (clone com submódulo, `make check-deps`, `make install-deps`, `make serve`), os 10 comandos mais usados e links para `docs/` |
| `docs/ARCHITECTURE.md` | quem precisa entender o sistema | Componentes, fluxos e decisões, com **diagramas Mermaid** (13.2) |
| `docs/MAINTENANCE.md` | você, mantenedor do blog | **Manual de operação completo:** Makefile, conteúdo, testes locais, *skills*, atualizações de Hugo/Blowfish/ferramentas, ajustes, segurança, rotina e troubleshooting (13.3) |
| `docs/cloudflare.md` | quem mexe no Cloudflare | Todas as regras (WAF, cache, redirects, headers) com valores, e contingências |
| `CLAUDE.md` | Claude Code | Regras de segurança, deploy e atualização (seção 14) |

Os diagramas ficam **em Mermaid, dentro dos próprios `.md`**. O GitHub renderiza Mermaid nativamente, então os documentos ficam legíveis direto no repositório, sem imagens para manter sincronizadas.

### 13.2 `docs/ARCHITECTURE.md` — estrutura e diagramas

Seções: 1) Visão geral · 2) Componentes e responsabilidades · 3) Fluxo de publicação · 4) Caminho de uma requisição (Cloudflare) · 5) Ambiente local · 6) Ciclo de manutenção · 7) Decisões e trade-offs (resumo das seções 11.6 e 18 deste plano) · 8) Limites conhecidos (plano Free, GitHub Pages).

Os diagramas abaixo já foram **validados** com `minlag/mermaid-cli:12.0.1` (Docker). As versões renderizadas estão em `images/16` a `20`.

**1. Visão geral**

```mermaid
flowchart LR
  subgraph DEV["Máquina do autor (Ubuntu / macOS)"]
    A["Autor"] --> E["Editor<br/>Markdown"]
    E --> L["make serve<br/>Hugo + Blowfish<br/>(mise ou Docker)"]
  end
  subgraph GH["GitHub"]
    R[("Repositório<br/>aeciopires/blog-aeciopires")]
    CI["GitHub Actions<br/>deploy.yml / pr-check.yml"]
    P["GitHub Pages<br/>(origem)"]
  end
  subgraph CF["Cloudflare - plano Free"]
    DNS["DNS<br/>blog CNAME aeciopires.github.io"]
    EDGE["Proxy de borda<br/>TLS, WAF, rate limit,<br/>redirects, cache, headers"]
    WA["Web Analytics"]
  end
  JF["Jotform<br/>(formulário de contato)"]
  GS["giscus<br/>(comentários)"]
  DI[("GitHub Discussions")]
  U["Leitor"]
  E -- "git push" --> R
  R --> CI
  CI -- "deploy" --> P
  CI -- "purge cache (API)" --> EDGE
  U -- "https://blog.aeciopires.com" --> DNS
  DNS --> EDGE
  EDGE -- "HTTPS Full (strict)" --> P
  U -. "beacon" .-> WA
  U -. "script" .-> JF
  U -. "iframe + login GitHub" .-> GS
  GS --> DI
```

**2. Fluxo de publicação**

```mermaid
sequenceDiagram
  autonumber
  actor Autor
  participant Repo as GitHub (main)
  participant CI as GitHub Actions
  participant Pages as GitHub Pages
  participant CF as Cloudflare
  actor Leitor
  Autor->>Autor: make validate (local)
  Autor->>Repo: git push / merge do PR
  Repo->>CI: dispara deploy.yml
  CI->>CI: mise install (versões do mise.toml)
  CI->>CI: hugo --gc --minify
  CI->>CI: lychee (links e imagens)
  alt validação falhou
    CI-->>Autor: e-mail de falha, nada é publicado
  else validação ok
    CI->>Pages: upload-pages-artifact + deploy-pages
    CI->>CF: purge_cache (hosts: blog.aeciopires.com)
  end
  Leitor->>CF: GET /meu-post/
  alt cache MISS
    CF->>Pages: busca na origem
    Pages-->>CF: HTML
  end
  CF-->>Leitor: HTML + headers de segurança
```

**3. Caminho de uma requisição no Cloudflare**

```mermaid
flowchart TD
  Q["Requisição para blog.aeciopires.com"] --> T["TLS de borda + DDoS<br/>(automático)"]
  T --> ACME{"/.well-known/<br/>acme-challenge/ ?"}
  ACME -- "sim" --> ORIG
  ACME -- "não" --> M{"Método GET,<br/>HEAD ou OPTIONS?"}
  M -- "não" --> B1["403 bloqueado (W2)"]
  M -- "sim" --> S{"Scanner? .php, /wp-admin,<br/>/.env, /.git, UA vazio"}
  S -- "sim" --> B2["403 bloqueado (W3/W4)"]
  S -- "não" --> RL{"Mais de 100 req/10s<br/>do mesmo IP?"}
  RL -- "sim" --> B3["429 bloqueado 10s"]
  RL -- "não" --> RD{"/feed/ ou */feed/ ?"}
  RD -- "sim" --> R301["301 para index.xml"]
  RD -- "não" --> C{"Está no cache<br/>de borda?"}
  C -- "HIT" --> H["Adiciona headers<br/>HSTS, CSP, nosniff..."]
  C -- "MISS" --> ORIG["GitHub Pages (origem)"]
  ORIG --> H
  H --> RESP["Resposta ao leitor"]
```

**4. Ambiente local**

```mermaid
flowchart LR
  CD["make check-deps"] --> OK{"Tudo OK?"}
  OK -- "não" --> ID["make install-deps<br/>mise + ferramentas"]
  ID --> CD
  OK -- "sim" --> N["make new-post SLUG=meu-post"]
  N --> W["Escrever<br/>content/posts/slug/index.md"]
  W --> SV{"Como rodar?"}
  SV -- "nativo" --> S1["make serve<br/>(mise)"]
  SV -- "container" --> S2["make serve-docker<br/>(Docker / Colima)"]
  S1 --> V["localhost:1313<br/>revisão com live reload"]
  S2 --> V
  V --> VA["make lint-md + validate"]
  VA -- "erros" --> W
  VA -- "ok" --> PUB{"Publicar"}
  PUB -- "direto" --> PU["git push main"]
  PUB -- "revisar" --> PR["Pull request<br/>pr-check"]
  PR --> PU
```

**5. Ciclo de manutenção**

```mermaid
flowchart TD
  subgraph FONTES["Origem da atualização"]
    D1["Dependabot<br/>GitHub Actions"]
    D2["make check-updates<br/>Hugo, Blowfish, mise.toml"]
    D4["make audit-content<br/>skill revisar-conteudo"]
    D3["Alerta de segurança<br/>ou mudança no Cloudflare"]
  end
  D1 --> BR["Branch + Pull request"]
  D2 --> UP["skill atualizar-site<br/>mise.toml ou make update-theme"] --> BR
  D4 --> ED["Editar posts<br/>com fontes oficiais"] --> BR
  D3 --> FIX["Ajuste no código<br/>ou em docs/cloudflare.md"] --> BR
  BR --> CL["Ler changelog e notas de migração"]
  CL --> LV["make lint-md + validate + serve<br/>(Ubuntu e macOS se mudou Makefile/scripts)"]
  LV --> PC{"pr-check verde?"}
  PC -- "não" --> AJ["Corrigir ou adiar"] --> LV
  PC -- "sim" --> MG["Merge em main"]
  MG --> DP["deploy.yml publica + purge"]
  DP --> MON{"Site ok?"}
  MON -- "não" --> RV["git revert + push"] --> DP
  MON -- "sim" --> FIM["Atualizar docs se o comportamento mudou"]
```

### 13.3 `docs/MAINTENANCE.md` — manual de operação e evolução

É o documento que você vai consultar no dia a dia. Explica **como manter o site em constante evolução, seguindo boas práticas, oferecendo o melhor ao leitor e com segurança para você**. O rascunho abaixo já define a estrutura e o conteúdo de cada capítulo.

**1. Primeiros passos (uma vez por máquina)**

```bash
git clone --recurse-submodules git@github.com:aeciopires/blog-aeciopires.git
cd blog-aeciopires
make check-deps      # diagnóstico, não altera nada
make install-deps    # mise + ferramentas + submódulo do tema + skill
make serve           # http://localhost:1313
```

No macOS, iniciar o Colima antes de usar qualquer alvo com Docker (`colima start …`, seção 9.6).

**2. Referência do Makefile**

- Tabela completa dos alvos (seção 9.3), agrupados em ambiente, conteúdo, qualidade e atualizações, cada um com um exemplo.
- **Convenções:**
  - parâmetros em MAIÚSCULAS (`SLUG=`, `TITLE=`, `TAG=`);
  - alvos destrutivos só executam com `CONFIRM=sim`;
  - todo alvo retorna código de erro diferente de zero se falhar, igual à CI.

**3. Conteúdo: tarefas do dia a dia**

| Tarefa | Como |
|---|---|
| Novo post | `make new-post SLUG=… TITLE="…"` → escrever → `make serve` → `make lint-md validate` → `make publish-post SLUG=… DATE=now` → push/PR |
| Nova página | `make new-page SLUG=… TITLE="…"` → menu em `config/_default/menus.pt-br.toml` (se aplicável) → mesmo fluxo |
| Editar post | Editar → atualizar `lastmod` → se a mudança for relevante, nota "Atualizado em DD/MM/AAAA" no início |
| Despublicar (rascunho) | `make unpublish-post SLUG=…` / `make unpublish-page SLUG=…`. Some do site, continua no `make serve`. **Lembrete:** o repositório é público; para rascunho realmente privado, `PRIVATE=1` (9.3.1) |
| Republicar | `make publish-post SLUG=…` / `make publish-page SLUG=…` |
| Remover de vez | `make rm-post SLUG=… REDIRECT=<outro-slug> CONFIRM=sim` (ou `rm-page`). Sempre preferir despublicar ou redirecionar a deixar 404 |
| Renomear slug | **Evitar.** Se inevitável, `aliases: ["/slug-antigo/"]` no *front matter* |
| Ver rascunhos | `make list-drafts` |
| Imagens | No *page bundle*: `feature.*` = imagem destacada; texto alternativo em todas; `make optimize-images` antes do commit |
| Categorias e tags | Usar só as registradas em `data/taxonomia.yaml` (1 a 5 tags por post). Tag nova: `make new-tag`; sinônimo: `make fix-tags`; unir: `make merge-tag`. O `make check-tags` bloqueia o que estiver fora do padrão (6.8) |
| Diagramas em posts | *Shortcode* `{{< mermaid >}}` do Blowfish |
| Novos embeds | *Shortcodes* do Blowfish. Se envolver um novo domínio, **atualizar a CSP** (`docs/cloudflare.md` + Cloudflare) |
| Banner de tecnologias | `data/tecnologias.yaml` + logo oficial em `assets/img/logos/` + linha em `SOURCES.md` (3.7) |

**Checklist de qualidade por post (o melhor para o leitor):**
- título claro e `description` de até ~155 caracteres;
- comandos testados na versão citada, que deve aparecer explicitamente;
- links para a documentação oficial;
- blocos de código com linguagem;
- imagens leves e com `alt`;
- sem segredos, IPs internos ou dados pessoais nos exemplos;
- leitura conferida nos modos claro e escuro e no celular.

**4. Testar localmente antes de publicar**

| Objetivo | Comando |
|---|---|
| Escrever com *live reload* (mostra rascunhos) | `make serve` |
| Ver exatamente como o leitor verá (sem rascunhos, modo produção) | `make serve-prod` |
| Ambiente isolado / sem mise | `make serve-docker` |
| Mesma validação da CI | `make lint-md validate` |
| Diagramas da documentação | `make validate-diagrams` |

O que olhar no navegador:
- home, um post longo, tags e contato;
- botão claro/escuro;
- largura de celular (DevTools, 390 px);
- busca (`Ctrl K`);
- comentários: o giscus só carrega com o domínio real, então localmente aparece só a parte arquivada.

**5. Manter o conteúdo atualizado e verificado**

1. Rodar `make audit-content` (todo o site ou `SLUG=…`) e ler `reports/content-audit.md`.
2. Para validar contra fontes oficiais e atualizar, pedir ao Claude Code, por exemplo:
   - "Use a skill revisar-conteudo no post helm-chart-zabbix-8-0-0";
   - "Use a skill revisar-conteudo nos 5 posts mais antigos".
3. Revisar o PR proposto: a tabela "antes, depois e fonte oficial", o `make serve` e o `make validate`.
4. Links externos: `make check-links-online` mensal. Para link morto, trocar pela fonte oficial atual ou pelo Wayback Machine.

**6. Usar as skills do Claude Code**

| Skill | Quando usar | Exemplo de pedido |
|---|---|---|
| `blowfish` | Qualquer mudança de tema, configuração, layout, *shortcode* ou *front matter* | "Usando a skill blowfish, adicione uma série 'Helm Chart do Zabbix' aos 4 posts" |
| `revisar-conteudo` | Atualizar posts com base em fontes oficiais | "Revise o post X com a skill revisar-conteudo" |
| `atualizar-site` | Atualizar Hugo, Blowfish, ferramentas e imagens | "Use a skill atualizar-site e proponha as atualizações disponíveis" |

- As *skills* nunca publicam sozinhas: entregam uma branch ou PR para você revisar.
- O `CLAUDE.md` vale para todas.

**7. Atualizar softwares**

- **Ver o que há de novo:** `make check-updates`. Mostra cada item com a versão atual, a mais nova e a mais nova *permitida* (ex.: o Hugo limitado pela faixa do Blowfish).
- **Ferramentas do mise:**
  1. editar a versão no `mise.toml`;
  2. `mise install`;
  3. `make validate`;
  4. `make serve`;
  5. abrir o PR.
- **Blowfish:**
  1. `make update-theme TAG=vX.Y.Z`, que mostra o changelog, o diff da *skill* e a faixa de Hugo;
  2. se a faixa mudou, ajustar o Hugo no `mise.toml` **no mesmo PR**;
  3. revisar o visual nos modos claro e escuro e no celular.
- **Hugo:**
  - só dentro da faixa do Blowfish;
  - ler as notas de versão e rodar `hugo --logLevel info` para ver *deprecations*.
- **GitHub Actions:** merge dos PRs do Dependabot depois de ler o changelog.
- **Quando NÃO atualizar:**
  - versão *alpha*, *beta* ou *RC*;
  - Hugo fora da faixa do tema;
  - semana de publicação importante;
  - CI vermelha por outro motivo.
- **Desfazer:** `git revert` do PR, ou `make update-theme TAG=<anterior>`.

**8. Fazer ajustes e evoluir o site**

| Mudança | Onde |
|---|---|
| Cores, vidro, banner | `assets/css/custom.css` (as cores vêm do esquema nativo `blowfish`; não criar esquema próprio sem necessidade) |
| Parâmetros do tema | `config/_default/params.toml`, sempre conferindo a documentação da versão fixada |
| Comportamento de layout | Override em `layouts/partials/`, **nunca** editar `themes/blowfish/` |
| Novo *shortcode* | `layouts/shortcodes/` + exemplo de uso neste documento |
| Novo serviço de terceiros | Avaliar privacidade e segurança → CSP → `docs/cloudflare.md` → página Privacidade → `CLAUDE.md` se virar regra |
| Mudança de arquitetura | `docs/ARCHITECTURE.md` (diagramas) + registro da decisão e do motivo em `PLANS/<nome>/` |

**9. Segurança (para você e para o leitor)**

- **Contas:**
  - 2FA no GitHub e no Cloudflare;
  - *branch protection* na `main`;
  - *secret scanning* e *push protection* ligados.
- **Segredos:** nunca no repositório. O único segredo é o token do Cloudflare, só com *Cache Purge* e com expiração.
- **Workflows:** *actions* por SHA, com `permissions` mínimas.
- **Navegador do leitor:**
  - CSP, HSTS e demais headers (11.5);
  - qualquer novo script ou *iframe* exige atualizar a CSP primeiro, em modo *Report-Only*.
- **Comentários:**
  - moderação semanal;
  - *interaction limits* em ondas de spam;
  - nunca renderizar HTML vindo de comentários.
- **Conteúdo:** exemplos sem credenciais, IPs internos ou dados pessoais. Revisar *screenshots* antes de publicar.
- **Privacidade:** página Privacidade atualizada sempre que entrar ou sair um serviço de terceiros.

**10. Calendário de manutenção:** a tabela da seção 12.2.

**11. Troubleshooting (problema → causa provável → ação)**

| Problema | Causa provável | Ação |
|---|---|---|
| Erro 526 | Certificado da origem | Seção 10.3 |
| Conteúdo antigo após o deploy | O purge falhou | Purge manual |
| Build falha após atualização | *Deprecation* do Hugo ou do Blowfish | Ler as notas de versão |
| Hugo avisa versão fora da faixa | Hugo e tema desalinhados | Alinhar com 9.2.1 |
| `themes/blowfish` vazio | Clone sem submódulo | `git submodule update --init` |
| *Skill* `blowfish` não aparece | Link simbólico não foi seguido | `make skill-sync` |
| `mise` não encontrado | Shell não ativado | Ativar o mise no shell |
| *Live reload* não funciona no macOS | Colima sem `--poll` | Iniciar com `--poll` |
| Porta 1313 ocupada | Outro processo usando a porta | Liberar a porta |
| Feed antigo não redireciona | Regras R1/R2 | Revisar as regras |
| giscus não carrega | CSP sem `giscus.app` ou app desinstalado | Corrigir a CSP ou reinstalar o app |
| Tema do giscus não troca | Script de observação da classe `dark` | Revisar o script |

### 13.4 Validação dos diagramas Mermaid com Docker

`make validate-diagrams` renderiza todos os blocos ` ```mermaid ` dos documentos. O mermaid-cli aceita `.md` como entrada e processa cada bloco; qualquer erro de sintaxe falha o comando:

```makefile
MERMAID_IMAGE := minlag/mermaid-cli:12.0.1
MD_FILES      := README.md CLAUDE.md $(wildcard docs/*.md)

validate-diagrams: ## Valida os diagramas Mermaid dos .md (Docker)
	@mkdir -p .mermaid-out
	@for f in $(MD_FILES); do \
	  docker run --rm -u "$$(id -u):$$(id -g)" -v "$$PWD":/data $(MERMAID_IMAGE) \
	    -q -i "/data/$$f" -o "/data/.mermaid-out/$$(basename $$f)" || exit 1; \
	done
	@echo "Diagramas Mermaid OK"
```

- `.mermaid-out/` fica no `.gitignore` (é só evidência da renderização).
- Funciona em Ubuntu (Docker Engine) e macOS (Colima). A imagem roda em arm64 via emulação, se necessário.
- Na CI, o `pr-check` executa o mesmo alvo quando algum `.md` muda (o Docker já está disponível nos runners `ubuntu-latest`).
- **Validação feita neste plano:** os 5 diagramas da seção 13.2 foram renderizados com sucesso com `minlag/mermaid-cli:12.0.1`. Resultado nas imagens 16 a 20.

---

## 14. CLAUDE.md

Criar um `CLAUDE.md` na raiz do repositório. Ele é lido automaticamente pelo Claude Code em toda sessão e garante que qualquer ajuste futuro feito com o Claude siga as mesmas práticas de segurança, deploy e manutenção. Deve ser **curto e objetivo** (idealmente < 200 linhas), porque é carregado no contexto de toda conversa. Detalhes longos ficam em `README.md` e `docs/` e são referenciados.

Estrutura proposta:

```markdown
# CLAUDE.md

## Projeto
- Blog pessoal (pt-BR) em Hugo + tema Blowfish (git submodule em themes/blowfish, tag fixada),
  visual T9 (esquema `blowfish`, escuro + automático + botão claro/escuro, como o blowfish.page).
- Publicado no GitHub Pages via GitHub Actions, com Cloudflare Free na frente (DNS, proxy, cache, WAF, analytics).
- Domínio: https://blog.aeciopires.com — URLs herdadas do WordPress NÃO podem mudar.
- Decisões e histórico: PLANS/blog-migration/PLAN.md.

## Comandos
- Dependências: `make check-deps`, `make install-deps` (ferramentas via mise; Docker/Colima por fora)
- Rodar: `make serve` (com rascunhos) | `make serve-prod` (como o leitor vê) | `make serve-docker`
- Validar (obrigatório antes de commit): `make lint-md validate`
- Conteúdo: `make new-post|new-page SLUG=`, `make publish-post|publish-page SLUG= [DATE=now]`,
  `make unpublish-post|unpublish-page SLUG= [PRIVATE=1]`, `make rm-post|rm-page SLUG= [REDIRECT=] CONFIRM=sim`
- Qualidade: `make audit-content [SLUG=]`, `make check-links-online`, `make validate-diagrams`
- Atualizações: `make check-updates`, `make update-theme TAG=vX.Y.Z`, `make skill-sync`

## Skills
- `blowfish` (oficial, via submódulo): use para QUALQUER mudança de tema, config, layout, shortcode ou front matter.
- `revisar-conteudo`: validar/atualizar posts contra fontes oficiais (só fontes oficiais; citar URL e data).
- `atualizar-site`: atualizar Hugo, Blowfish, ferramentas do mise e imagens, lendo as notas de versão.
- Docs de referência da versão fixada: https://gohugo.io/documentation/ e https://blowfish.page/docs/

## Conteúdo
- Posts em `content/posts/<slug>/index.md`; páginas em `content/<slug>/index.md`; imagem destacada `feature.*`.
- Front matter obrigatório: title, slug, date (com fuso -03:00), categories, tags, description.
- Mídias antigas em `static/wp-content/uploads/` — não mover nem renomear.
- Shortcodes permitidos: alert, button, figure, github, mermaid, tabs, youtubeLite, jotform, stats, tecnologias.
- Tags e categorias: só as de `data/taxonomia.yaml` (1–5 tags/post). Nunca criar tag sem `make new-tag`;
  trocar sinônimos com `make fix-tags`; `make check-tags` deve passar.
- Atualizar post: `lastmod` + nota "Atualizado em DD/MM/AAAA"; preservar o sentido histórico do tutorial.
- Remover: preferir unpublish ou REDIRECT; nunca deixar 404 sem motivo.
- Rascunhos ficam públicos no GitHub (repo público); para privado usar PRIVATE=1 (_privado/ no .gitignore).

## Segurança (regras obrigatórias)
- Nunca commitar segredos, tokens, `.env` ou dados pessoais; segredos só em GitHub Secrets.
- Nunca publicar o e-mail do autor (páginas, posts, rodapé, JSON-LD); contato só via Jotform. Sem X/Twitter.
- Não adicionar scripts/iframes de terceiros sem atualizar a CSP (docs/cloudflare.md) e pedir aprovação.
- Comentários: novos só via giscus (GitHub Discussions); antigos em `data/comments/` são somente leitura.
  Nunca usar `safeHTML`/`unsafe` em conteúdo de terceiros ou de `data/comments/`.
- JavaScript próprio só em `assets/js/` (nada inline).
- Actions fixadas por SHA, `permissions` mínimas; não ampliar permissões de workflows.
- Não alterar regras que tocam `/.well-known/acme-challenge/` (renovação do certificado).
- Não alterar DNS/Cloudflare/GitHub settings pelo Claude; propor a mudança e documentar.
- Logos de tecnologias: só arquivos oficiais, sem recolorir/distorcer; registrar em assets/img/logos/SOURCES.md.
- Manter os avisos de licença (rodapé, /creditos/, LICENSE do tema).

## Deploy
- Push em `main` publica (deploy.yml) e limpa o cache do Cloudflare. Preferir PR (pr-check).
- Nunca force-push em `main`. Rollback = `git revert` + push.
- Não fazer commit/push sem pedido explícito do usuário.

## Atualizações e ajustes
- Política: a versão estável mais nova possível, limitada só por compatibilidade
  (ex.: Hugo dentro de [module.hugoVersion] do Blowfish); sem alpha/beta/RC; Node = LTS mais novo.
- Versões exatas em `mise.toml` (nunca `latest`); Blowfish = tag do submódulo; atualização sob demanda, testada localmente.
- Uma atualização por PR; ler changelog/notas de migração; `make lint-md validate` verde; revisar claro/escuro/celular.
- Scripts e Makefile: Ubuntu 22.04/24.04/26.04 (amd64) e macOS (amd64/arm64);
  GNU Make 3.81, bash 3.2, sem `sed -i`, `date -d`, `readlink -f`, `grep -P`; passar no shellcheck.
- Customizar o tema só por override (assets/css, layouts/partials, layouts/shortcodes), nunca editando themes/blowfish/.
- Corrigir avisos de `hugo --logLevel info`; não usar funções deprecated.
- Ao mudar comportamento, atualizar README.md, docs/ARCHITECTURE.md, docs/MAINTENANCE.md, docs/cloudflare.md e este arquivo.

## Referências
- README.md · docs/ARCHITECTURE.md · docs/MAINTENANCE.md (manual de operação) · docs/cloudflare.md
- PLANS/blog-migration/PLAN.md (decisões da migração)
- Diagramas: sempre Mermaid; validar com `make validate-diagrams` antes do commit.
```

---

## 15. Substituição dos plugins do WordPress

| Plugin / recurso atual | Substituto |
|---|---|
| Busca do WordPress | Busca nativa do Blowfish (Fuse.js) |
| Comentários + Akismet | **giscus** (GitHub Discussions, login GitHub, moderação do GitHub) + comentários antigos estáticos somente leitura |
| Google Site Kit / MonsterInsights / Jetpack Stats | **Cloudflare Web Analytics** + Analytics da zona |
| Jetpack Boost | desnecessário — site estático, `--minify`, cache na borda |
| Jetpack (proteção de login) | desnecessário — não há login; WAF/DDoS do Cloudflare |
| Formulário de contato | **Jotform** (mesmo formulário, embed por script) |
| Compartilhamento social | `sharingLinks` do Blowfish |
| Editor Gutenberg | VS Code + Markdown |

---

## 16. Checklist de validação

Antes da virada (Fase 5):

- [ ] `make check-deps` e `make install-deps` funcionando em Ubuntu (22.04/24.04/26.04) e macOS (amd64/arm64 com Colima).
- [ ] 81 posts e as páginas Sobre, Cursos, Contato e Privacidade presentes.
- [ ] `compare-urls.sh` sem URLs faltando; `make validate` sem erros.
- [ ] Code blocks corretos nos 10 posts mais acessados.
- [ ] Contagens de categorias e tags próximas às do WordPress.
- [ ] Busca, modo escuro, TOC e layout mobile ok; Lighthouse ≥ 90 em performance e SEO.
- [ ] Links do GitHub (`github.com/aeciopires`) e do LinkedIn (`linkedin.com/in/aeciopires`) corretos no cabeçalho, no rodapé, na caixa do autor, no menu do celular e no banner; nenhum link de perfil no YouTube, de X/Twitter nem de e-mail do autor no HTML gerado (`grep -r "mailto:\|x.com\|twitter.com" public/` vazio).
- [ ] `/tags/` com nuvem e lista A–Z; mininuvem na home; aliases das tags antigas funcionando (ex.: `/tag/k8s/` → `/tag/kubernetes/`); `make check-tags` sem erros.
- [ ] Botão "Ver todos os posts" na home; `/posts/` com 9 páginas de 10 posts agrupados por ano; `/posts/page/2/` … `/page/9/` respondendo 200.
- [ ] RSS válido (<https://validator.w3.org/feed/>).
- [ ] Formulário Jotform envia e chega no e-mail.
- [ ] Comentários antigos sem e-mail/IP e sem HTML ativo.
- [ ] giscus carregando nos modos claro e escuro, um tópico por URL na categoria "Comentários"; comentário de teste apagado.
- [ ] Rodapé com "Todos os direitos reservados" e o aviso do Blowfish (MIT) e página `/creditos/` com o texto completo; aviso MIT presente no CSS gerado (ou coberto por `/creditos/`).
- [ ] Banner de tecnologias com logos oficiais, sem alteração de cor ou proporção; `SOURCES.md` preenchido.
- [ ] `make lint-md` sem erros; `make audit-content` executado e relatório revisado.
- [ ] Alvos de conteúdo testados (`new-*`, `publish-*`, `unpublish-*` com e sem `PRIVATE=1`, `rm-*` em simulação e com `CONFIRM=sim`).

Depois da virada (Fase 6):

- [ ] `server: cloudflare` e `cf-cache-status: HIT` na 2ª requisição.
- [ ] SSL Labs nota A; securityheaders.com nota A (após CSP aplicada).
- [ ] `/feed/` e `/tag/helm/feed/` → 301 para `index.xml`.
- [ ] `/wp-login.php` e `POST /` → 403.
- [ ] `/wp-content/uploads/...` → 200.
- [ ] Deploy de teste aparece em ~2 min (purge ok).
- [ ] Cloudflare Web Analytics registrando visitas; `origin-cert.yml` verde.
- [ ] Search Console sem aumento relevante de 404 em 7 e 30 dias.

---

## 17. Riscos e rollback

| Risco | Mitigação |
|---|---|
| Formatação quebrada em posts antigos (2013+) | Fase 4 dedicada |
| URLs mudarem e perder SEO | Permalinks idênticos + `compare-urls.sh` + Search Console |
| Assinantes RSS perderem o feed | Redirects `/feed/` (11.4) |
| Falha na renovação do certificado da origem → 526 | Skip ACME, `origin-cert.yml`, contingência (10.3) |
| Cache servindo versão antiga | Purge pós-deploy; *Development Mode* para depuração |
| CSP bloquear recurso legítimo | Fase Report-Only (11.5) |
| Atualização do Hugo/Blowfish quebrar o site | Versões fixas (Hugo dentro da faixa do tema); uma atualização por PR; `pr-check`; `git revert` |
| Clone sem submódulo → build sem tema | `--recurse-submodules`; `make install-deps`; `submodules: true` na CI |
| Spam ou abuso nos comentários | Login GitHub obrigatório; moderação semanal; *interaction limits*; `showComments: false` no post |
| giscus fora do ar | Só os comentários deixam de carregar; arquivados continuam visíveis |
| Uso indevido de marca no banner | Arquivos oficiais, sem alteração, diretrizes conferidas; fallback para nome em texto (3.7) |
| Rascunho exposto no GitHub | Repo é público; `PRIVATE=1` para rascunhos privados (9.3.1) |
| Diferenças Ubuntu × macOS nos scripts | Regras de portabilidade + shellcheck (9.7) |
| Acesso direto à origem | Risco aceito (11.6) |
| Comprometimento de contas | 2FA, branch protection, tokens mínimos, actions por SHA |
| Exposição de dados de comentaristas | Só nome, data e texto sanitizado (6.5) |

**Rollback da virada:** restaurar no Cloudflare o registro `blog` original (Fase 0). A mudança vale em segundos/minutos. O WordPress só é desligado 30 dias após a virada.

---

## 18. Decisões

### Definidas

| Tema | Decisão |
|---|---|
| Tema | **Blowfish v3.10.0**, visual **T9 · Blowfish Vitrine** (3.2.2): esquema nativo `blowfish`, abre escuro, segue o sistema e **mantém o botão claro/escuro**, como o blowfish.page; fontes do sistema |
| Instalação do tema | **git submodule** em `themes/blowfish`, fixado em tag de release (3.3); *skill* oficial pelo submódulo (3.6.1) |
| Licença do tema | Aviso curto no **rodapé** + texto MIT completo em `/creditos/` + `LICENSE` no submódulo (3.8) |
| Banner | **Banner v2 aprovado** (3.7.1): @aeciopires com a marca do GitHub, título "Stacks que uso no dia a dia", 27 tecnologias em 5 grupos, logos **oficiais, sem recolorir**, em placas brancas; funciona nos modos claro e escuro |
| Versões de software | **A estável mais nova possível**, limitada só por compatibilidade, com motivo registrado (9.2.1) |
| Makefile | Alvos de conteúdo (`new-*`, `publish-*`, `unpublish-*`, `rm-*`, `list-drafts`), `lint-md`, `audit-content`, `check-updates`, `update-theme` (9.3) |
| Skills | `blowfish` (oficial), `revisar-conteudo` e `atualizar-site` (próprias) (9.3.3) |
| Documentação de operação | `docs/MAINTENANCE.md` como manual completo (13.3) |
| Plano | Guardado em `PLANS/blog-migration/` como registro histórico |
| Tags | **Limpeza** de 224 para 67 tags na migração (6.7) + **governança contínua** com `data/taxonomia.yaml`, `make check-tags` (no validate, no pre-commit e na CI) e alvos de correção (6.8). **Nuvem de tags** em `/tags/` e mininuvem na home (3.2.2) |
| Perfis do autor | GitHub `https://github.com/aeciopires` e LinkedIn `https://www.linkedin.com/in/aeciopires`, definidos uma vez em `params.author.links` (3.4). **Sem YouTube, sem X/Twitter e sem e-mail público**; contato direto só pelo Jotform. Compartilhamento dos posts só pelo LinkedIn |
| Lista de posts | Botão "Ver todos os posts" na home + `/posts/` paginado (10 por página, agrupado por ano). **Sem rolagem infinita** (3.2.2) |
| Direitos do conteúdo | **Todos os direitos reservados** (rodapé: "© 2026 Aécio Pires · Todos os direitos reservados"); vale também para a arte de fundo |
| Rascunhos | Padrão `draft: true` (versionado e visível no GitHub); privado **só com `PRIVATE=1`** (9.3.1) |
| Arte de fundo do T9 | **Arte própria gerada** (3.2.3): azul-marinho do tema, brilhos suaves, linhas de fluxo e constelação discreta só no topo; mesma imagem nos dois modos |
| Boas práticas | Seguir a documentação oficial do **Hugo** (<https://gohugo.io/documentation/>) e do **Blowfish** (<https://blowfish.page/docs/>) da versão fixada, e usar a ***agent skill* do Blowfish** versionada em `.claude/skills/blowfish/` (seção 3.6) |
| Bots de IA | ***Block AI bots* desligado** no Cloudflare |
| Jotform | **Embed por script** (como hoje); CSP com `form.jotformz.com` e `cdn.jotfor.ms` em `script-src` (11.5) |
| Atualização do `mise.toml` | **Manual, sob demanda**, testando localmente antes do push. Sem Renovate (12.1) |
| Hospedagem | GitHub Pages (origem) |
| DNS, proxy, cache, segurança | Cloudflare Free, proxy ligado |
| Acesso direto à origem | **Risco aceito** |
| Analytics | Cloudflare Web Analytics |
| Página Contato | Jotform (formulário atual) |
| Agendamento de posts | **Não haverá** — publica no push |
| Ferramentas | **mise** (versões exatas), Docker/Compose/Colima por fora |
| Plataformas | Ubuntu 22.04/24.04/26.04 amd64 · macOS amd64/arm64 (Colima) |
| Make | Inclui `check-deps` e `install-deps` |
| Comentários | **Novos via giscus** (GitHub Discussions já ativado; seção 6.6) + **antigos somente leitura** (migração estática e sanitizada, 6.5) |
| Documentação | `docs/ARCHITECTURE.md` (diagramas Mermaid validados via Docker) e `docs/MAINTENANCE.md` (seção 13) |
| CLAUDE.md | Criado na Fase 1 com regras de segurança, deploy e atualização (seção 14) |

### Pendentes

Nenhuma. Todas as decisões foram tomadas; o plano está pronto para a implementação.

---

### Imagens deste plano

| Arquivo | Conteúdo |
|---|---|
| [01-atual-home.png](images/01-atual-home.png) | Home atual (WordPress) |
| [02-atual-post.png](images/02-atual-post.png) | Post atual (WordPress) |
| [03-arquitetura-pipeline.png](images/03-arquitetura-pipeline.png) | Arquitetura alvo e pipeline |
| [04-fases-migracao.png](images/04-fases-migracao.png) | Fases da migração |
| [05-virada-dns.png](images/05-virada-dns.png) | DNS antes/depois e ordem da virada |
| [06-fluxo-local.png](images/06-fluxo-local.png) | Ambiente local: mise + Make + plataformas |
| [07-blowfish-home.png](images/07-blowfish-home.png) | Blowfish: home, cabeçalho e rodapé |
| [08-blowfish-post-conteudo.png](images/08-blowfish-post-conteudo.png) | Blowfish: post com comandos, alertas, TOC, tabela |
| [09-blowfish-post-autor-comentarios.png](images/09-blowfish-post-autor-comentarios.png) | Blowfish: compartilhar, autor, relacionados, comentários |
| [10-blowfish-tags-categorias.png](images/10-blowfish-tags-categorias.png) | Blowfish: tags e categorias |
| [11-blowfish-contato.png](images/11-blowfish-contato.png) | Blowfish: contato com Jotform |
| [12-blowfish-modo-escuro.png](images/12-blowfish-modo-escuro.png) | Blowfish: modo escuro |
| [13-blowfish-mobile.png](images/13-blowfish-mobile.png) | Blowfish: celular |
| [14-blowfish-cabecalho-busca-rodape.png](images/14-blowfish-cabecalho-busca-rodape.png) | Blowfish: cabeçalho claro/escuro, busca, rodapé, shortcodes |
| [15-cloudflare-camadas.png](images/15-cloudflare-camadas.png) | Camadas do Cloudflare Free e acesso direto à origem |
| [16-mermaid-visao-geral.png](images/16-mermaid-visao-geral.png) | Mermaid renderizado: visão geral |
| [17-mermaid-publicacao.png](images/17-mermaid-publicacao.png) | Mermaid renderizado: publicação |
| [18-mermaid-requisicao-cloudflare.png](images/18-mermaid-requisicao-cloudflare.png) | Mermaid renderizado: caminho da requisição |
| [19-mermaid-ambiente-local.png](images/19-mermaid-ambiente-local.png) | Mermaid renderizado: ambiente local |
| [20-mermaid-manutencao.png](images/20-mermaid-manutencao.png) | Mermaid renderizado: ciclo de manutenção |
| [temas/00-paletas-e-contraste.png](images/temas/00-paletas-e-contraste.png) | Catálogo de temas: paletas e contraste WCAG |
| [temas/T1-claro-classico/](images/temas/T1-claro-classico/) | T1 · Claro Clássico: computador-home, computador-post, celular |
| [temas/T2-azul-blowfish/](images/temas/T2-azul-blowfish/) | T2 · Azul Blowfish: computador-home, computador-post, celular |
| [temas/T3-noite-teal/](images/temas/T3-noite-teal/) | T3 · Noite Teal: computador-home, computador-post, celular |
| [temas/T4-oceano/](images/temas/T4-oceano/) | T4 · Oceano: computador-home, computador-post, celular |
| [temas/T5-grafite-ambar/](images/temas/T5-grafite-ambar/) | T5 · Grafite Âmbar: computador-home, computador-post, celular |
| [temas/T6-indigo/](images/temas/T6-indigo/) | T6 · Índigo: computador-home, computador-post, celular |
| [temas/T7-teal-coral/](images/temas/T7-teal-coral/) | T7 · Teal Coral: computador-home, computador-post, celular |
| [temas/00-paletas-t8-t10.png](images/temas/00-paletas-t8-t10.png) | Catálogo T8–T10: paletas e contraste WCAG |
| [temas/T8-ciano-minimal/](images/temas/T8-ciano-minimal/) | T8 · Ciano Minimal (estilo agha.dev): computador-home, computador-post, celular |
| [temas/T9-blowfish-vitrine/](images/temas/T9-blowfish-vitrine/) | T9 · Blowfish Vitrine (estilo blowfish.page atual): computador-home, computador-post, celular |
| [temas/T10-material-teal/](images/temas/T10-material-teal/) | T10 · Material Teal (Material 3): computador-home, computador-post e celular, cada um em claro e escuro |
| [temas/T9-blowfish-vitrine/final/](images/temas/T9-blowfish-vitrine/final/) | **T9 escolhido, versão final:** home (com "Ver todos os posts" e mininuvem de tags), post (giscus + arquivados), `/posts/` com paginação, `/tags/` com nuvem e celular, em escuro e claro |
| [banner/banner-comparacao.png](images/banner/banner-comparacao.png) | Banner: inversão (descartada) × placas brancas nos modos escuro e claro |
| [arte/background.webp](images/arte/background.webp) | **Arte de fundo do T9** (2560×1440, WebP) |
| [arte/background-preview.png](images/arte/background-preview.png) · [claro](images/arte/background-preview-claro.png) | Prévia da arte nos modos escuro e claro |
| [banner/banner-v1-proposta.png](images/banner/banner-v1-proposta.png) | Banner v1 (histórico): 14 logos do banner atual em placas brancas |
| [banner/banner-v2-computador-escuro.png](images/banner/banner-v2-computador-escuro.png) | **Banner v2 aprovado**, computador, modo escuro |
| [banner/banner-v2-computador-claro.png](images/banner/banner-v2-computador-claro.png) | **Banner v2 aprovado**, computador, modo claro |
| [banner/banner-v2-celular.png](images/banner/banner-v2-celular.png) | **Banner v2 aprovado**, celular, escuro e claro |

---

## 19. Evolução depois da migração (registro retroativo)

> Acréscimo de 21/11/2026. O plano acima continua como registro histórico e **não foi alterado**; esta seção só registra, em ordem, as decisões tomadas depois da migração, para que o plano e o site publicado não divirjam sem explicação. Status, desvios e detalhes de implementação: [IMPLEMENTACAO.md](IMPLEMENTACAO.md), seção "Depois da migração".

| Data | PR | Decisão | Onde está documentado |
|---|---|---|---|
| 20/11/2026 | #6 | Linktree do autor como terceiro perfil (ícone genérico "link"); registros do Search Console e do Cloudflare | `docs/cloudflare.md`, seção 10 |
| 20/11/2026 | #7 | Home com ordenação escolhida pelo leitor (mais recentes, mais antigos, mais lidos, menos lidos), com leituras do Cloudflare Web Analytics (180 dias, gerado no deploy e toda segunda); nuvem de tags sem número visível; revisão dos posts de Docker/Kubernetes testada em Docker/kind; post do ArgoCD na AWS removido com redirecionamento | `docs/MAINTENANCE.md`, seção 8 |
| 21/11/2026 | #8 | **Home leve** (6 cards no HTML, o resto por JSON com SRI montado a partir de um molde do tema; `make check-home`); cartões da home como links e total de repositórios do GitHub (`data/github.json`, pre-commit); CSP **aplicada** (não mais *Report-Only*); escape dos resultados da busca; taxonomia `series` desligada | `docs/MAINTENANCE.md`, seção 8; `docs/cloudflare.md`, seção 5 |
| 21/11/2026 | #9 | Acessibilidade **100** no Lighthouse (contrastes, nomes acessíveis `nav.*`, botão de busca); logos raster em WebP no build; `make lighthouse` (Docker) | `docs/MAINTENANCE.md`, seção 4 |
| 21/11/2026 | #10 | **Versão em inglês (en-US) em `/en/`**, mantendo o pt-BR como idioma padrão e fonte (na raiz, URLs do WordPress intactas). Tradução feita **localmente, antes do commit**, por IA (skill `traduzir-conteudo`, agente `tradutor-en`), nunca no build ou no navegador; garantia por `make check-i18n` (pre-commit, validate, CI): tradução completa, em dia e com comandos, código e links idênticos ao pt-BR. Conteúdo já bilíngue no original (`bilingue: true`) não tem tradução. Seletor de idioma, hreflang e sitemap do Blowfish; **redirecionamento da home pelo idioma do navegador ligado**, sem script inline (CSP inalterada; robôs não são redirecionados; `make test-idioma`). Correções de conteúdo feitas pela IA ao traduzir são registradas em `reports/` e conferidas pelo autor antes do commit (`make check-correcoes`) | `docs/MAINTENANCE.md`, seção 3 ("Versão em inglês" e "Redirecionamento pelo idioma do navegador"); `docs/cloudflare.md`, seção 10; skill `traduzir-conteudo` |

Decisões da seção 18 que mudaram por causa disso:

| Tema (seção 18) | Antes | Agora |
|---|---|---|
| Idioma do blog | Só pt-BR | pt-BR (padrão e fonte) + en-US em `/en/`, traduzido antes do commit |
| Perfis do autor | `params.author.links` em `languages.pt-br.toml` | `[author]` em `params.toml`, válido para os dois idiomas (fonte única mantida); os ícones dos dois menus repetem as URLs |
| Skills | `blowfish`, `revisar-conteudo`, `atualizar-site` | + `escrever-post` (#7) e `traduzir-conteudo` (#10), agente `tradutor-en` |
| Lista de posts na home | Mais recentes, fixa | Ordenação escolhida pelo leitor, home leve (#7, #8) |
