---
name: revisar-conteudo
description: Valida um post do blog (ou os N mais antigos/mais lidos) contra fontes OFICIAIS, testa os comandos com Docker/kind e propõe, numa branch, a atualização de conteúdo, comandos, versões de software e gramática. Use quando pedirem para revisar, atualizar, testar ou conferir posts do blog.
---

# revisar-conteudo

Revisa posts em `content/posts/<slug>/index.md` contra **fontes oficiais**, testa o que for testável e propõe as edições numa branch/PR. Obedece ao `CLAUDE.md` (segurança, URLs imutáveis, nada de commit/push sem pedido).

## Passo a passo

1. **Escopo.** Um post (`SLUG`) ou um grupo:
   - "os mais antigos": maior idade em `reports/content-audit.json`;
   - "os mais lidos": `data/visualizacoes.json` (gerado no deploy; localmente, `make visualizacoes` com o token) ou a lista do Cloudflare Web Analytics fornecida pelo autor;
   - "todos com comandos": posts com blocos de código e `docker`/`kubectl`/`helm` (ver `make audit-content`).
   Revisões grandes: pergunte se o autor prefere lotes ou tudo de uma vez.
2. **Levantamento.** `make audit-content SLUG=<slug>` e `reports/content-audit.md` (versões citadas, `apiVersion` removidas, links, idade). `make verificar-texto SLUG=<slug>` aponta restos da migração e erros recorrentes.
3. **Fontes oficiais, somente:** documentação do projeto, página de releases/changelog (`gh api repos/<org>/<repo>/releases/latest`), índice do repositório Helm, Docker Hub/registry oficial, guias de migração/depreciação, código-fonte da versão (quando a doc não basta). Exemplos de terceiros só para entender um formato, nunca como fonte citada. Anote **URL e data de acesso**.
4. **Classifique cada item:** atual; desatualizado com substituto direto; obsoleto/removido; **incerto → pergunte ao autor** (ex.: repositório do autor que sumiu, troca de exemplo).
5. **Teste** (seção "Como testar com segurança"). Teste o comando exatamente como está no post; só depois proponha a correção e teste de novo.
6. **Edite numa branch** (`revisao/<assunto>`), nunca na `main`:
   - atualize versões e comandos; corrija o que o teste mostrou estar errado;
   - `make aviso-atualizacao SLUG=<slug> RESUMO="..."`: insere ou substitui o aviso `{{< alert icon="circle-info" >}}**Atualizado em DD/MM/AAAA:** ...{{< /alert >}}` e atualiza o `lastmod` (troca também o formato antigo `**Atualizado em: 7 de outubro de 2026**`). O resumo diz **o que foi testado e com que versões** e o que mudou;
   - **preserve o sentido histórico**: anúncios e posts sobre uma versão específica ganham aviso, não reescrita; frases como "durante a elaboração foi usada a versão X" ficam;
   - não mude `slug`, `date` nem URLs; tags só as de `data/taxonomia.yaml`;
   - links para o próprio blog com domínio (`https://blog.aeciopires.com/x/`) viram relativos (`/x/`): com domínio, o tema os abre em nova aba como se fossem externos;
   - revise a gramática (seção "Gramática") de todo o post, não só do trecho alterado.
7. **Links:** link morto (404/410/DNS) → cópia do Internet Archive (`https://archive.org/wayback/available?url=...`), marcada `(cópia arquivada)`, ou endereço atual oficial; sem cópia útil (cursos interativos, serviços encerrados) → remover a linha. 403/429 costumam ser bloqueio de robô: não conclua nada. Repositórios do autor que deram 404: pergunte antes de trocar.
8. **Versão em inglês:** toda correção do pt-BR vai também para o `index.en.md` (mesmos comandos, versões e
   links; o `make check-i18n` exige comandos idênticos e bloqueia o commit com a tradução desatualizada).
   Use `make aviso-atualizacao SLUG=<slug> RESUMO="..." RESUMO_EN="..."`, depois a skill `traduzir-conteudo`
   (`make i18n-diff SLUG=<slug>` mostra o que mudou) e `make i18n-ok SLUG=<slug>`. Teste o pt-BR; a tradução
   herda os mesmos comandos.
   Correções de gramática e de texto feitas na revisão também vão para `reports/correcoes-conteudo-AAAA-MM-DD.md`
   (skill `traduzir-conteudo`, "Correções no original"), para o autor conferir antes do commit.
9. **Valide:** `make lint-md validate` verde, `make validate-diagrams` se houver Mermaid, e confira no `make serve`, em pt-BR e em `/en/<slug>/` (claro, escuro e celular em 360 e 412 px: sem rolagem horizontal; tabelas e blocos de código dentro da coluna).
10. **Relatório:** registre cada item em `reports/revisao-posts-<AAAA-MM-DD>.md` (ignorado pelo Git) com a tabela abaixo; ela vira o corpo do PR.
11. **Limpeza** (seção própria) e **PR** só com pedido explícito do autor.

| Post | Item | Antes | Depois | Teste | Fonte oficial (URL, data) |
|---|---|---|---|---|---|

## Como testar com segurança

A máquina é do autor e tem serviços dele rodando. Nada pode ser alterado fora do que o teste criar.

- **Antes de começar:** `docker ps --format '{{.Names}} {{.Ports}}'` e `kind get clusters`. Não toque nesses containers/clusters; use **portas alternativas no host** (`-p 127.0.0.1:18080:8080`), mantendo no post as portas originais.
- **Nomes próprios dos testes** (`revisao-*`, `teste-*`) em containers, redes, volumes e clusters kind, para a limpeza ser exata.
- **Kubernetes:** clusters kind dedicados; use `--context`. Quando a compatibilidade pedir outra versão, use a imagem `kindest/node` listada no release do kind. Vários workers: arquivo de config do kind. Registrar um kind em outro (Argo CD): IP do control-plane na rede `kind`.
- **Credenciais e contas reais: nunca.** Use emuladores (`fake-gcs-server`, Floci, Vault em modo dev), credenciais fictícias e `--dry-run=server --validate=strict` contra o CRD real quando o recurso exigir nuvem. O que não der para testar vai para o relatório como "não testável" com o motivo.
- **Sem mudanças no sistema:** nada de `sudo`, `sysctl`, `/etc/hosts`, `/usr/local`, `mise use -g`. Instaladores `curl ... | bash`: leia o script; prefira baixar o binário do release com checksum (`gh release download` + `sha256sum -c`) para o scratchpad. Script de terceiros que chama `sudo` para algo dispensável: `PATH` com um `sudo` falso que só registra a chamada, e teste com `curl --resolve` no lugar do `/etc/hosts`.
- **Ferramentas que gravam configuração** (girus, kubeconfig): `HOME` temporário e `KUBECONFIG` explícito. O `kind` troca o contexto atual do kubeconfig: avise o autor no fim.
- **Shell:** nunca `pkill -f` com padrão que case com a própria linha de comando (use `[p]adrão`); algumas ferramentas (girus) matam `kubectl.*port-forward.*girus` — rode-as em comandos separados do port-forward. Comandos longos: `run_in_background`. Saída de `docker pull`: `-q`.
- **Fidelidade:** reproduza o fluxo de quem lê (pausas entre `kubectl apply` e `curl`, arquivos criados com `vim` viram arquivos de verdade, um shell só para as variáveis). Falha de timing ou do seu roteiro não é erro do post; confira antes de corrigir.
- **Erros que os testes costumam revelar:** heredoc sem aspas (`<<EOF`) apagando `$var` de templates (use `<<'EOF'`); nome de arquivo diferente entre download e uso; variáveis de ambiente de imagem com nome errado; certificado que só vale para `localhost`; permissão de chave para serviço não-root; `mkdir` faltando; comandos v1 numa ferramenta que já está na v2; restos da migração (`<http://...>` em comandos).

## Gramática

Revise o texto corrido com `make prosa SLUG="slug1 slug2"` (sem código nem listas de links). Erros recorrentes neste blog:

- grafia: código-fonte, autoassinado, recém-criado, on-premises, "em vez de" (não "ao invés de" sem oposição), "acerca de" (sobre) × "a cerca de" (aproximadamente);
- crase e regência: "à identificação", "voltar à seção", "Agradecemos à Zabbix", "afeta os resultados";
- concordância: "são necessárias", "podem ser obtidas", "os pods", "as service accounts";
- frase sem sujeito: "Para mais informações sobre X e sobre como configurá-lo, acesse...";
- meses em minúscula (março/2022); nomes próprios: GitHub, GitLab, WordPress, macOS, Vault, Locust, Grafana;
- pontuação fora do texto do link (`[Docker](url),`); sem `**` soltos; vírgula antes de "acesse" em "Para ..., acesse".

Ao substituir trechos por script, **considere o NBSP** (` `) dos posts migrados e confirme que cada troca aconteceu (o `make verificar-texto` conta os NBSP de cada post). Mantenha o estilo de ênfase do arquivo (`_x_` ou `*x*`; regra MD049).

## Limpeza

Ao final, remova só o que os testes criaram: containers, redes, volumes, clusters kind, imagens baixadas e arquivos no scratchpad. Anote as imagens baixadas durante o trabalho; imagens que podem ser do autor (mesma tag usada por containers dele, `kindest/node`, ferramentas que ele usa) → **pergunte** antes de remover. Tags extras sobre imagens dele (`:latest` apontando para a mesma imagem): remova só a tag.

## Não faça

- Inventar versões ou comandos sem a fonte oficial aberta.
- Remover conteúdo histórico; prefira avisos.
- Usar HTML cru (o site usa `unsafe = false`); use os shortcodes do Blowfish.
- Alterar o sistema, a configuração global ou serviços do autor para fazer um teste passar.
