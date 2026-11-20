---
title: "CLI: Update-Git"
slug: "cli-update-git"
date: 2026-07-12T04:23:08-03:00
lastmod: 2026-07-12T04:23:44-03:00
draft: false
categories: ["devops", "git", "go"]
tags: ["git", "golang", "linux"]
description: "updateGit é uma ferramenta Golang CLI que descobre e atualiza automaticamente todos os repositórios git dentro de um diretório base especificado."
wp_id: 3519
---

**updateGit** é uma ferramenta Golang CLI que descobre e atualiza automaticamente todos os repositórios git dentro de um diretório base especificado.

No dia a dia, eu trabalho com dezenas de repositórios git clonados no ambiente local e eu tenho o costume de manter todos atualizados antes de fazer qualquer alteração. Em vez de atualizar cada repositório, individualmente eu criei esta ferramenta de forma que com um comando, eu mantenho atualizado todos os clones dos repositórios.

Funcionalidades:

- 🔍 Atualiza vários repositórios git:
  - Descoberta automática de repositórios git no diretório especificado
  - Execução em lote do comando git pull em todos os repositórios descobertos
  - Detecção de metadados do repositório Git
- ⚙️ Configuração: suporte para arquivos de configuração e variáveis de ambiente
- 🛡️ Tratamento de erros: tratamento abrangente de erros com mensagens detalhadas

Mais detalhes de uso podem ser encontrados em: [https://github.com/aeciopires/updateGit](https://github.com/aeciopires/updateGit)
