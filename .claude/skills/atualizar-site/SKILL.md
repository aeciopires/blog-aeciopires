---
name: atualizar-site
description: Atualiza Hugo, o tema Blowfish (submódulo), as ferramentas do mise.toml e as imagens Docker do blog, lendo as notas de versão oficiais e respeitando a faixa de Hugo do Blowfish. Use quando pedirem para atualizar dependências, ferramentas, o tema ou o Hugo do blog.
---

# atualizar-site

Atualiza os softwares do blog com segurança, **uma coisa por vez**, sempre numa branch/PR. Obedece ao `CLAUDE.md` e à política de versões (`docs/MAINTENANCE.md`, seção 7).

## Política de versões

- A versão **estável mais nova possível**, limitada só por compatibilidade, com o motivo registrado.
- **Hugo** sempre dentro de `[module.hugoVersion]` (`min`/`max`) do `themes/blowfish/config.toml` da tag fixada.
- Sem alpha, beta, RC ou nightly. Node.js = **LTS mais novo**.
- Versões exatas no `mise.toml` (nunca `latest`). Blowfish = tag de release do submódulo.

## Passo a passo

1. `make check-updates` e leia `reports/updates.md` (em uso × mais nova × mais nova permitida).
2. Para cada item, leia as **notas de versão oficiais** (releases do Hugo e do Blowfish no GitHub, página *Updating* do Blowfish, changelog de cada ferramenta) procurando mudanças incompatíveis e *deprecations*. Cite os links no PR.
3. Atualize **um item por vez**, numa branch (`atualiza/<item>-<versao>`):
   - ferramenta do mise: editar a versão exata no `mise.toml` → `mise install`;
   - Blowfish: `make update-theme TAG=vX.Y.Z` (mostra changelog, diff da skill e faixa de Hugo). Se a faixa mudou, ajuste o Hugo **no mesmo PR**. Revise o diff da skill do Blowfish como código (sem hooks/comandos inesperados) e os overrides listados pelo alvo (inclusive `layouts/partials/recent-articles/cardview.html` da ordenação da home: siga o checklist de `docs/MAINTENANCE.md`, seção 8);
   - imagem do mermaid-cli: `MERMAID_IMAGE` no `Makefile` (e a tabela da política em `docs/MAINTENANCE.md`).
4. Valide: `make validate`, `hugo --logLevel info` (corrigir *deprecations*), `make validate-diagrams` se mexeu em docs, e `make serve` + `make serve-prod` para revisão visual nos modos claro e escuro e no celular.
5. Se mudou `Makefile`, scripts ou `mise.toml`: peça ao autor para testar também em macOS (ou Ubuntu, se você estiver no macOS).
6. Abra o PR com: o que mudou, versões antes/depois, links das notas de versão, riscos e como desfazer (`git revert` ou `make update-theme TAG=<anterior>`).

## Não faça

- Hugo fora da faixa do Blowfish, mesmo que seja "só uma minor".
- `git submodule update --remote` (vai para o topo da `main`, não para uma release).
- Atualizar na semana de um post importante ou com a CI vermelha por outro motivo.
- Commit/push sem pedido explícito do autor.
