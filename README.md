# blog-aeciopires

Código-fonte do [blog.aeciopires.com](https://blog.aeciopires.com): compartilhando conhecimento sobre DevOps, SRE, Platform Engineering e Cloud.

- **Gerador:** [Hugo](https://gohugo.io/) *extended* + tema [Blowfish](https://blowfish.page/) (git submodule em `themes/blowfish`, tag fixada).
- **Hospedagem:** GitHub Pages, publicado pelo GitHub Actions a cada push em `main`.
- **Borda:** Cloudflare (DNS, proxy, cache, segurança e Web Analytics).
- **Comentários:** [giscus](https://giscus.app) (GitHub Discussions deste repositório); os do blog antigo ficam somente leitura.
- **Ferramentas:** versões exatas no [`mise.toml`](mise.toml), as mesmas na máquina local e na CI.

## Início rápido

Pré-requisitos: `git`, `make`, `curl` e `bash` (Ubuntu 22.04/24.04/26.04 amd64 ou macOS amd64/arm64). Docker é opcional.

```bash
git clone --recurse-submodules git@github.com:aeciopires/blog-aeciopires.git
cd blog-aeciopires
make check-deps      # diagnóstico, não altera nada
make install-deps    # mise + ferramentas + submódulo do tema + skill do Blowfish
make serve           # http://localhost:1313
```

No macOS, para os alvos com Docker, inicie o Colima antes:

```bash
colima start --cpu 2 --memory 4 --vm-type vz --mount-type virtiofs
docker context use colima
```

## Comandos mais usados

| Comando | O que faz |
|---|---|
| `make help` | Lista todos os alvos |
| `make serve` | Servidor local com rascunhos e *live reload* |
| `make serve-prod` | Servidor local como o leitor vê (sem rascunhos) |
| `make new-post SLUG=meu-post TITLE="Meu post"` | Cria um post como rascunho |
| `make publish-post SLUG=meu-post DATE=now` | Publica o post (sai no próximo push em `main`) |
| `make unpublish-post SLUG=meu-post` | Volta o post para rascunho |
| `make check-tags` | Valida tags e categorias contra `data/taxonomia.yaml` |
| `make lint-md validate` | Mesma validação da CI |
| `make check-updates` | Mostra atualizações disponíveis (não altera nada) |
| `make update-theme TAG=vX.Y.Z` | Atualiza o Blowfish para uma release |

## Publicar

1. `make lint-md validate`
2. `git commit` e `git push` em `main` (publica em ~2 minutos) ou abra um PR para o `pr-check` validar sem publicar.

## Documentação

- [docs/MAINTENANCE.md](docs/MAINTENANCE.md): manual de operação, manutenção e evolução.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): arquitetura com diagramas.
- [docs/cloudflare.md](docs/cloudflare.md): configuração do Cloudflare e contingências.
- [CLAUDE.md](CLAUDE.md): regras para o Claude Code.
- [PLANS/blog-migration/](PLANS/blog-migration/): plano e decisões da migração do WordPress.

## Licenças

O conteúdo do blog (textos, imagens próprias e arte) é © Aécio Pires, todos os direitos reservados. O tema Blowfish é MIT (`themes/blowfish/LICENSE`); veja a página [Créditos e licenças](https://blog.aeciopires.com/creditos/).
