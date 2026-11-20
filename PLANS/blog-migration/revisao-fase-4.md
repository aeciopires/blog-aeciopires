# Revisão da Fase 4 — pendências da migração

Gerado em 20/11/2026 a partir do conteúdo convertido pelo `scripts/migracao/migrar.sh`. Marque cada item ao resolver.

**Concluída em 20/11/2026:** o autor validou todo o conteúdo do site (posts, páginas e comentários arquivados). Hook local ativado (`make install-hooks`).

> Atenção: rodar `migrar.sh` de novo **refaz** o conteúdo migrado do zero e desfaz edições manuais nos posts. Depois de começar esta revisão, não rode mais o pipeline.

## 1. Tags fora da regra de 1 a 5 por post (`make check-tags` falha até resolver)

- [x] Tags `alertmanager`, `azure`, `cert-manager`, `fargate` e `ingress-nginx` ficaram sem posts após a aplicação e foram removidas (`make rm-tag`), com `/tag/<nome>/` → `/tags/`.
- [x] Proposta de 20/11/2026 **aprovada e aplicada** (depois da remoção das tags `cidade-viva`, `codeac`, `medusa`, `worldcup`, `webapp` e `livro`). `make check-tags` OK.

### Posts sem nenhuma tag (15)

| Post | Proposta |
|---|---|
| a-carta-de-amor-do-pai, cidade-viva-eificando-relacionamentos-acima-da-media-parte-i, cidade-viva-eificando-relacionamentos-acima-da-media-parte-ii, deus-usa-menino-que-liga-para-uma-radio-e-a-sua-licao-se-espalha-pelo-mundo, faca-parte-da-missao-portas-abertas, gratidao-o-milagre-dentro-de-mim, jornais-divulgam-sinais-da-vinda-de-jesus, preparados-para-enfrentar-os-invernos-da-vida, testemunho-de-uma-norte-coreana, testemunhos-sobre-a-vida-na-coreia-do-norte (10) | `fe` (tag **nova**: "Fé e vida cristã") |
| comunidade-zabbix-brasil-10-anos-depoimento-hernandes, entrevista-com-os-autores-do-livro-de-a-a-zabbix, lancamento-do-livro-de-a-a-zabbix-no-ifpb-campus-joao-pessoa, novidades-sobre-o-curso-de-a-a-zabbix, parabens-zabbix-br (5) | `zabbix` |

### Posts com mais de 5 tags (14)

| Post | Fica | Sai |
|---|---|---|
| aprendendo-amazon-ecs-com-aws-cdk-python-e-floci | aws, cdk, ecs, iac, python | docker, fargate, git |
| aprendendo-aws-cdk-com-python-e-floci | aws, cdk, iac, python, docker | git, linux |
| codeac-suporte-e-novidades | iac, terraform, puppet, saltstack, bash | git |
| deploy-no-kubernetes-usando-argo-cd-com-suporte-a-helm-sops-e-multiple-sources | argocd, gitops, helm, sops, kms | aws, docker, git, kubernetes, linux |
| devopsdays-campinas-introducao-a-service-mesh-usando-o-istio | istio, service-mesh, kubernetes, helm | aws, azure, docker, gcp, linux |
| go-sse | golang, docker, kubernetes, helm | git, linux |
| hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes | vault, kubernetes, helm, gcp | docker, linux |
| helm-chart-zabbix-8-0-0 | zabbix, helm, kubernetes, observability, gitops | argocd, docker, git, linux |
| homelab-do-victoriametrics-cluster-mode-com-apenas-1-comando | victoriametrics, homelab, observability, kubernetes, argocd | alertmanager, aws, cert-manager, docker, gcp, gitops, grafana, helm, iac, ingress-nginx, prometheus |
| instalando-o-zabbix-no-kubernetes-usando-o-helm | zabbix, helm, kubernetes, gitops | docker, git, linux |
| learning-istio-cka-terraform-aws-and-gcp | istio, cka, terraform (nova no post), aws, gcp | docker, git, helm, kubernetes, linux |
| livro-integracao-continua-com-jenkins | jenkins, ci-cd (nova no post), sonarqube, nexus, docker | bash, terraform |
| primeiros-passos-com-docker | docker, kubernetes, helm, istio, swarm | linux |
| usando-o-argocd-para-gerenciar-recursos-na-aws | argocd, aws, gitops, kubernetes, helm | cloud, docker, git, linux |

## 2. Tags marcadas para decisão (PLAN.md 6.7)

- [x] Removidas em 20/11/2026 (`make rm-tag`): `cidade-viva`, `codeac`, `medusa`, `worldcup`, `webapp`, `livro`. As URLs `/tag/<nome>/` (e `/tag/novatec/`, que apontava para `livro`) redirecionam para `/tags/`.

## 3. Mídias externas quebradas

A verificação inicial estava errada: as 5 referências eram de **outros sites** (não do blog). Conferido em 20/11/2026:

- [x] `indiangnu.org/…/Devops-Comparison-v3.pdf` → **404**. Trocado pelo shortcode `removido` (só o nome, com tooltip "não está mais disponível") nos posts do Ansible, SaltStack e Puppet.
- [x] `leaptest.com/…/jenkins.png`, `logos-download.com/…/Kubernetes_Logo.png`, `cncf.io/…/AD_4nX….png`, `altoros.com/…/Kubernetes-Kubectl-CLI-Cheat-Sheet.pdf` → **200**, mantidos.

## 4. Links internos removidos (apontavam para rascunhos do WordPress, já davam 404)

O texto foi mantido e só o link saiu (ou a linha inteira, quando o texto era o próprio endereço). Conferir se a frase ainda faz sentido:

- [x] `palestra-transportando-as-aplicacoes-entre-varios-ambientes-com-docker` (10 posts "… via Docker": prometheus, grafana, wordpress, gitlab, graylog, elastic/kibana/logstash, rabbitmq, nexus, redmine, zabbix)
- [x] `instalando-configurando-puppetdb-puppetexplorer-puppetboard` e `configurando-um-ambiente-puppet` (em `primeiros-passos-com-o-puppet`)
- [x] `curso-de-a-a-zabbix` (em `novidades-sobre-o-curso-de-a-a-zabbix`). Desde 20/11/2026 `/curso-de-a-a-zabbix/` redireciona para `/cursos/`; o link pode voltar, se fizer sentido

## 5. Blocos de código sem linguagem identificável (44 marcados como `text`)

A linguagem foi definida automaticamente só quando inequívoca (bash, yaml, json…). Estes ficaram `text` (sem destaque); trocar quando for código:

- [x] `instalando-o-rabbitmq-via-docker`: 15
- [x] `instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento`: 5
- [x] `aprendendo-kubernetes-gateway-api-na-pratica-com-o-girus-cli`: 4
- [x] `instalando-o-locust-no-kubernetes-para-testes-de-carga`: 4
- [x] `usando-o-argocd-para-gerenciar-recursos-na-aws`: 3
- [x] `criando-json-mais-simples-em-shell-script-com-jo`: 2
- [x] `instalando-o-k0s-distribuicao-kubernetes-all-inclusive`: 2
- [x] `redmine-docker`: 2
- [x] `zabbix-docker`: 2
- [x] `autoscaling-de-aplicacoes-orientado-a-eventos-no-kubernetes-usando-o-keda`: 1
- [x] `gitlab-docker`: 1
- [x] `graylog-docker`: 1
- [x] `instalando-o-wordpress-via-docker`: 1
- [x] `integrando-o-grafana-ao-elk-elasticsearch-logstash-e-kibana`: 1

## 6. Comentários arquivados (PLAN.md 6.5, passo 4)

161 comentários em 22 arquivos de `data/comments/`. Revisar uma vez e apagar spam que tenha passado no Akismet:

- [x] `zabbix-docker.yaml`: 81
- [x] `sobre.yaml`: 14
- [x] `redmine-docker.yaml`: 9
- [x] `graylog-docker.yaml`: 8
- [x] `gitlab-docker.yaml`: 7
- [x] `configurando-o-grafana-para-funcionar-sobre-https.yaml`: 7
- [x] `instalando-o-rabbitmq-via-docker.yaml`: 5
- [x] `instalando-o-elastic-kibana-e-logstash-via-docker.yaml`: 5
- [x] `livro-de-a-a-zabbix-sera-publicado-pela-novatec.yaml`: 3
- [x] `instalando-o-wordpress-via-docker.yaml`: 2
- [x] `instalando-o-prometheus-via-docker.yaml`: 2
- [x] `novidades-sobre-o-curso-de-a-a-zabbix.yaml`: 2
- [x] `instalando-o-zabbix-no-kubernetes-usando-o-helm.yaml`: 2
- [x] `configurando-link-failover-no-mikrotik.yaml`: 2
- [x] `instalando-o-docker-docker-swarm-docker-registry-e-portainer.yaml`: 2
- [x] `livro-integracao-continua-com-jenkins.yaml`: 2
- [x] `a-carta-de-amor-do-pai.yaml`: 2
- [x] `conhecendo-o-terraform.yaml`: 2
- [x] `cidade-viva-eificando-relacionamentos-acima-da-media-parte-ii.yaml`: 1
- [x] `primeiros-passos-com-python.yaml`: 1
- [x] `codeac-ferramenta-para-analisar-a-qualidade-do-codigo-que-gerencia-a-infraestrutura-e-aplicacao.yaml`: 1
- [x] `integrando-o-grafana-ao-elk-elasticsearch-logstash-e-kibana.yaml`: 1

## 7. Demais itens da Fase 4 (PLAN.md 5 e 16)

- [x] Revisar os posts mais acessados no `make serve` (código, tabelas, imagens, embeds).
- [x] Conferir as `description` geradas automaticamente (primeiro parágrafo com ≥ 60 caracteres) nos posts principais.
- [x] `make tags-report` revisado.
- [x] `make install-hooks` ativado (20/11/2026).
- [x] Páginas Sobre, Cursos, Curso Docker e Curso Kubernetes: conferir o texto (reorganizadas em 20/11/2026; preços, histórico de turmas e formulários Jotform de cada curso como botão; slides do Docker como link para o SlideShare).
