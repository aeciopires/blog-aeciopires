# Blog do Aécio Pires — Hugo + Blowfish (PLAN.md seção 9.3).
# Compatível com GNU Make 3.81 (macOS) e 4.x (Ubuntu): sem .ONESHELL, $(file), undefine.
# Alvos que apagam ou alteram conteúdo simulam por padrão; executam só com CONFIRM=sim.
# Parâmetros em MAIÚSCULAS: SLUG=, TITLE=, TAG=, DATE=now, PRIVATE=1, REDIRECT=, CONFIRM=sim.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Ferramentas: usa as do PATH (mise ativado) ou cai para "mise exec".
MISE_EXEC := $(shell command -v hugo >/dev/null 2>&1 || echo "mise exec --")
HUGO      := $(MISE_EXEC) hugo
NODE      := $(MISE_EXEC) node
RUN       := $(MISE_EXEC)

HUGO_VERSION  := $(shell awk -F'"' '/^hugo-extended/{print $$2}' mise.toml)
MERMAID_IMAGE := minlag/mermaid-cli:12.0.1
MD_DIAGRAMS   := README.md CLAUDE.md $(wildcard docs/*.md)
MD_LINT       := "content/**/*.md" README.md CLAUDE.md "docs/**/*.md" "PLANS/**/*.md" "!content/**/_index.md"

# Aspas simples seguras para texto livre (TITLE, DESC): ' vira '"'"'
q = '$(subst ','"'"',$(1))'

# docker compose (v2) ou docker-compose (legado)
COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

.PHONY: help check-deps install-deps serve serve-prod serve-docker build clean \
	new new-post new-page publish-post publish-page unpublish-post unpublish-page rm-post rm-page list-drafts \
	check-tags fix-tags new-tag merge-tag rm-tag tags-report install-hooks normalize-tags optimize-images \
	lint-md lint-md-fix validate validate-links actionlint shellcheck compare-urls validate-diagrams \
	check-links-online audit-content check-updates update-theme skill-sync outdated migrate-install

help: ## Lista os alvos
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^## / { printf "\n%s\n", substr($$0, 4) }' $(MAKEFILE_LIST)

## Ambiente e dependências

check-deps: ## Diagnóstico do ambiente (não altera nada)
	@bash scripts/check-deps.sh

install-deps: ## Instala mise, ferramentas, submódulo do tema e skill
	@bash scripts/install-deps.sh

serve: ## Servidor local com rascunhos e live reload (http://localhost:1313)
	$(HUGO) server -D --navigateToChanged

serve-prod: ## Servidor local como o leitor vê (sem rascunhos, produção, sem analytics)
	$(HUGO) server --environment production --navigateToChanged

serve-docker: ## Servidor local via Docker/Compose (Colima no macOS)
	HUGO_VERSION=$(HUGO_VERSION) $(COMPOSE) up

build: ## Build de produção em public/
	HUGO_ENVIRONMENT=production $(HUGO) --gc --minify

clean: ## Remove public/, resources/_gen/, .hugo_build.lock, reports/, .mermaid-out/
	rm -rf public resources/_gen .hugo_build.lock reports .mermaid-out

## Conteúdo

new: new-post ## Atalho de new-post

new-post: ## Novo post: SLUG=… [TITLE="…"] (draft: true)
	@$(RUN) bash scripts/content.sh new post "$(SLUG)" $(call q,$(TITLE))

new-page: ## Nova página: SLUG=… [TITLE="…"] (draft: true)
	@$(RUN) bash scripts/content.sh new page "$(SLUG)" $(call q,$(TITLE))

publish-post: ## Publica post: SLUG=… [DATE=now]
	@$(RUN) bash scripts/content.sh publish post "$(SLUG)" "$(DATE)"

publish-page: ## Publica página: SLUG=… [DATE=now]
	@$(RUN) bash scripts/content.sh publish page "$(SLUG)" "$(DATE)"

unpublish-post: ## Despublica post (draft: true): SLUG=… [PRIVATE=1]
	@$(RUN) bash scripts/content.sh unpublish post "$(SLUG)" "$(PRIVATE)"

unpublish-page: ## Despublica página (draft: true): SLUG=… [PRIVATE=1]
	@$(RUN) bash scripts/content.sh unpublish page "$(SLUG)" "$(PRIVATE)"

rm-post: ## Remove post: SLUG=… [REDIRECT=<slug>] CONFIRM=sim
	@$(RUN) bash scripts/content.sh rm post "$(SLUG)" "$(REDIRECT)" "$(CONFIRM)"

rm-page: ## Remove página: SLUG=… [REDIRECT=<slug>] CONFIRM=sim
	@$(RUN) bash scripts/content.sh rm page "$(SLUG)" "$(REDIRECT)" "$(CONFIRM)"

list-drafts: ## Lista rascunhos (inclusive os privados em _privado/)
	@$(RUN) bash scripts/content.sh list-drafts

check-tags: ## Valida tags e categorias contra data/taxonomia.yaml
	@$(NODE) scripts/tags.mjs check

fix-tags: ## Troca sinônimos e normaliza tags [SLUG=…] (grava só com CONFIRM=sim)
	@$(NODE) scripts/tags.mjs fix $(if $(SLUG),--slug $(SLUG)) $(if $(filter sim,$(CONFIRM)),--write)

new-tag: ## Registra tag: NAME=… DESC="…" [FORCE=1]
	@$(NODE) scripts/tags.mjs new "$(NAME)" $(call q,$(DESC)) $(if $(FORCE),--force)

merge-tag: ## Une tags: FROM=… TO=… (grava só com CONFIRM=sim)
	@$(NODE) scripts/tags.mjs merge "$(FROM)" "$(TO)" $(if $(filter sim,$(CONFIRM)),--write)

rm-tag: ## Remove tag dos posts e do registro: NAME=… (grava só com CONFIRM=sim)
	@$(NODE) scripts/tags.mjs remove "$(NAME)" $(if $(filter sim,$(CONFIRM)),--write)

tags-report: ## Relatório de tags em reports/tags.md
	@$(NODE) scripts/tags.mjs report

normalize-tags: ## (Fase 3, uma vez) aplica o mapa de limpeza das tags (grava só com CONFIRM=sim)
	@$(NODE) scripts/tags.mjs normalize PLANS/blog-migration/tags/tags-map.yaml $(if $(filter sim,$(CONFIRM)),--write)

install-hooks: ## Ativa o pre-commit versionado (.githooks/)
	git config core.hooksPath .githooks
	@echo "pre-commit ativo: check-tags + lint-md nos .md alterados"

optimize-images: ## oxipng nos PNGs novos ou alterados
	@files="$$( { git diff --name-only --diff-filter=AM HEAD; git ls-files --others --exclude-standard; } | grep -Ei '\.png$$' | sort -u)"; \
	if [ -z "$$files" ]; then echo "nenhum PNG novo ou alterado"; else $(RUN) oxipng -o 4 --strip safe $$files; fi

## Qualidade e manutenção

lint-md: ## Lint de Markdown (markdownlint-cli2)
	$(RUN) markdownlint-cli2 $(MD_LINT)

lint-md-fix: ## Corrige o que for seguro no Markdown e mostra o diff
	-$(RUN) markdownlint-cli2 --fix $(MD_LINT)
	git --no-pager diff --stat

validate: lint-md check-tags build validate-links actionlint shellcheck compare-urls ## O mesmo que a CI
	@echo "validate: OK"

validate-links: ## Links internos e imagens (lychee offline sobre public/)
	$(RUN) lychee --offline --no-progress --root-dir "$(CURDIR)/public" 'public/**/*.html'

actionlint: ## Lint dos workflows
	$(RUN) actionlint

shellcheck: ## Lint dos scripts e hooks
	$(RUN) shellcheck scripts/*.sh scripts/migracao/*.sh .githooks/pre-commit

compare-urls: ## URLs do WordPress presentes em public/
	@bash scripts/compare-urls.sh

validate-diagrams: ## Valida os diagramas Mermaid dos .md (Docker)
	@mkdir -p .mermaid-out
	@for f in $(MD_DIAGRAMS); do \
	  if grep -q '```mermaid' "$$f"; then \
	    docker run --rm -u "$$(id -u):$$(id -g)" -v "$$PWD":/data $(MERMAID_IMAGE) \
	      -q -i "/data/$$f" -o "/data/.mermaid-out/$$(basename $$f)" || exit 1; \
	  fi; \
	done
	@echo "Diagramas Mermaid OK"

check-links-online: ## lychee online nos links externos (não bloqueante; reports/links.md)
	@mkdir -p reports
	-$(RUN) lychee --no-progress --format markdown --output reports/links.md 'content/**/*.md'
	@echo "relatório: reports/links.md"

audit-content: ## Auditoria dos posts [SLUG=…] (reports/content-audit.md e .json)
	@$(NODE) scripts/audit-content.mjs "$(SLUG)"

check-updates: ## Versões em uso × mais novas (não altera nada; reports/updates.md)
	@bash scripts/check-updates.sh

update-theme: ## Move o Blowfish para TAG=vX.Y.Z e valida
	@bash scripts/update-theme.sh "$(TAG)"

skill-sync: ## Recria .claude/skills/blowfish a partir do submódulo [COPY=1]
	@bash scripts/skill-sync.sh

outdated: ## Atalho: mise outdated + tag do Blowfish
	-@mise outdated
	@echo "Blowfish em uso: $$(git -C themes/blowfish describe --tags --exact-match 2>/dev/null)"
	@echo "Blowfish mais nova: $$(git ls-remote --tags --refs https://github.com/nunocoracao/blowfish.git | awk -F/ '{print $$3}' | grep -Ev -- '-(alpha|beta|rc)' | sort -V | tail -1)"

migrate-install: ## (Só na migração) instala o wp2hugo via mise, sem gravar no mise.toml
	mise install github:ashishb/wp2hugo@1.39.0
	@echo "Uso: mise exec github:ashishb/wp2hugo@1.39.0 -- wp2hugo --help"
