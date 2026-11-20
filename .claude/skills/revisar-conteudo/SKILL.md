---
name: revisar-conteudo
description: Valida um post do blog (ou os N mais antigos/mais lidos) contra fontes OFICIAIS e propõe, numa branch, a atualização de conteúdo, comandos e versões de software. Use quando pedirem para revisar, atualizar ou conferir posts do blog.
---

# revisar-conteudo

Revisa posts em `content/posts/<slug>/index.md` contra **fontes oficiais** e propõe as edições numa branch/PR. Obedece ao `CLAUDE.md` (segurança, URLs imutáveis, nada de push sem pedido).

## Passo a passo

1. **Escopo.** Um post (`SLUG`) ou um grupo ("os 5 mais antigos": maior idade em `reports/content-audit.json`; "os mais lidos": peça ao autor a lista do Cloudflare Web Analytics, você não tem acesso a ela).
2. **Levantamento.** Rode `make audit-content SLUG=<slug>` e leia `reports/content-audit.md` (versões citadas, `apiVersion` removidas, links, idade).
3. **Fontes oficiais, somente.** Para cada software, comando ou API citado, consulte apenas: documentação do projeto, página de releases/changelog, guias de migração/depreciação. Nada de blogs, fóruns ou respostas de terceiros como fonte. Anote **URL e data de acesso** de cada fonte.
4. **Classifique cada item:**
   - **atual**;
   - **desatualizado com substituto direto** (ex.: nova versão do chart);
   - **obsoleto/removido** (ex.: API do Kubernetes removida);
   - **incerto** → pergunte ao autor, não decida sozinho.
5. **Edite numa branch** (`revisao/<slug>`), nunca na `main`:
   - atualize versões e comandos;
   - no início do post, adicione `{{< alert >}}Atualizado em DD/MM/AAAA: <resumo>{{< /alert >}}`;
   - atualize `lastmod` no front matter (com fuso `-03:00`);
   - **preserve o sentido histórico**: se atualizar mudaria o tutorial (ex.: post sobre uma versão específica), acrescente um aviso em vez de reescrever;
   - não mude `slug`, `date` nem URLs; não crie tags (só as de `data/taxonomia.yaml`).
6. **Teste o testável localmente**, sem tocar em infraestrutura real: `helm template`, `docker run --rm`, `kubectl --dry-run=client`, validação de YAML. Nunca use credenciais nem contas reais.
7. **Valide:** `make lint-md validate` verde e mostre o resultado no `make serve` (claro, escuro e celular).
8. **PR** com a tabela abaixo. **Nunca** faça push direto na `main` nem publique sem aprovação do autor. Não faça commit/push sem pedido explícito.

| Item | Antes | Depois | Fonte oficial (URL, data) |
|---|---|---|---|

## Não faça

- Inventar versões ou comandos sem a fonte oficial aberta.
- Remover conteúdo histórico; prefira avisos.
- Usar HTML cru (o site usa `unsafe = false`); use os shortcodes do Blowfish.
