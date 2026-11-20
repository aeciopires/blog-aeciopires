---
title: "Docker Hub Image Statistics: quantos pulls as suas imagens tiveram hoje?"
slug: "docker-hub-image-statistics"
date: 2026-11-20T19:53:25-03:00
lastmod: 2026-11-20T19:53:25-03:00
draft: false
categories: ["devops", "docker", "go", "prometheus"]
tags: ["docker", "golang", "observability", "prometheus", "helm"]
description: "Ferramenta open source em Go que mostra os pulls das imagens publicadas no Docker Hub por dia, semana, mês e hora, com interface web, API e métricas."
---

Quem publica imagens no [Docker Hub](https://hub.docker.com/) conhece a frustração: a página do repositório mostra só o **total acumulado** de pulls. Quantos downloads a imagem teve hoje? E nesta semana? A versão nova está sendo usada? O Docker Hub não responde essas perguntas.

Para resolver isso, criei nesta semana o [docker-hub-image-statistics](https://github.com/aeciopires/docker-hub-image-statistics), uma ferramenta de código aberto escrita em [Go](https://go.dev/) que coleta as estatísticas das imagens públicas de um usuário ou organização e mostra os pulls do último dia, dos últimos 7 e 30 dias e hora a hora.

## Como funciona

O Docker Hub só informa o contador **acumulado** de pulls de cada imagem. A ferramenta guarda uma "foto" desse contador a cada coleta (por padrão, a cada hora) e calcula os pulls de cada período pela diferença entre as fotos. É como ler o hidrômetro de casa toda hora para saber quanto de água foi gasto em cada intervalo.

{{< mermaid >}}
flowchart LR
    hub[(API do Docker Hub)] -- "a cada intervalo" --> col[Coletor]
    col --> cache[("Cache<br/>SQLite, disco e memória")]
    cache --> stats["1 dia, 7 dias, 30 dias e por hora"]
    stats --> ui[Interface web e API JSON]
    stats --> metrics["/metrics (Prometheus)"]
    col -. OTLP .-> otel[(Traces e logs)]
{{< /mermaid >}}

Por isso, os valores de 1, 7 e 30 dias ficam completos depois que a aplicação está rodando há esse tempo. Até lá, eles são mínimos e aparecem marcados com `*`.

## Principais recursos

- **Descoberta automática** de todas as imagens públicas dos usuários e organizações configurados, além de imagens avulsas, com filtros de inclusão e exclusão.
- **Estatísticas de pulls:** total, últimas 24 horas, 7 dias e 30 dias por imagem e no total, com uma série **hora a hora** (gráfico e tabela).
- **Coleta agendada** (por padrão, a cada hora), com a última e a próxima atualização na interface, na API e nas métricas.
- **Respeita os limites do Docker Hub:** controla o ritmo das requisições e obedece os cabeçalhos de cota e o `Retry-After`.
- **Cache em três camadas** (SQLite, disco e memória), com troca automática se uma delas falhar.
- **Interface web** no estilo Material Design 3, com modo escuro por padrão e sem dependências externas.
- **Observabilidade:** métricas para o [Prometheus](https://prometheus.io/), traces do [OpenTelemetry](https://opentelemetry.io/), logs em JSON e dashboards prontos para o [Grafana](https://grafana.com/).
- **Imagem segura:** *distroless*, sem root, com cerca de 26 MB, verificada com o [Trivy](https://trivy.dev/) e disponível para `amd64` e `arm64`.
- **Helm chart** para Kubernetes, com probes, NetworkPolicy, Pod Security restrito, Ingress, `HTTPRoute` da Gateway API e ServiceMonitor.

## Testando com Docker

O jeito mais rápido de ver a ferramenta funcionando é com um único comando. Troque `aeciopires` pelo seu usuário ou organização no Docker Hub:

```bash
docker run -d --name dhis -p 8080:8080 \
  --read-only --cap-drop ALL --security-opt no-new-privileges \
  -v dhis-data:/data \
  -e DHIS_DOCKERHUB_NAMESPACES=aeciopires \
  -e DHIS_DOCKERHUB_REPOSITORIES=grafana/grafana,prom/prometheus \
  aeciopires/docker-hub-image-statistics:1.0.0
```

A variável `DHIS_DOCKERHUB_REPOSITORIES` é opcional e acrescenta imagens de outros donos à lista. Acesse a interface em [http://localhost:8080](http://localhost:8080).

Outros endereços úteis:

| Caminho | Para quê |
| --- | --- |
| `/api/v1/summary` | Totais de todas as imagens, em JSON |
| `/api/v1/images` | Estatísticas de cada imagem, em JSON |
| `/metrics` | Métricas no formato do Prometheus |
| `/healthz` e `/readyz` | Health checks para o Docker e o Kubernetes |

Para ver a versão:

```bash
docker run --rm aeciopires/docker-hub-image-statistics:1.0.0 -v
```

Para remover o teste:

```bash
docker rm -f dhis
docker volume rm dhis-data
```

## Com a stack de observabilidade completa

O repositório traz um Docker Compose com a aplicação e uma stack de observabilidade: OpenTelemetry Collector, Prometheus, Loki, Tempo, Jaeger e Grafana, com os dashboards já configurados.

```bash
git clone https://github.com/aeciopires/docker-hub-image-statistics.git
cd docker-hub-image-statistics
make stack-up
```

| Serviço | Endereço |
| --- | --- |
| Aplicação | [http://localhost:8080](http://localhost:8080) |
| Grafana | [http://localhost:3000](http://localhost:3000) |
| Prometheus | [http://localhost:9090](http://localhost:9090) |
| Jaeger | [http://localhost:16686](http://localhost:16686) |

Para parar tudo, use `make stack-down`.

{{< figure src="grafana-images.png" alt="Dashboard do Grafana com os pulls das imagens: totais, pulls por período e a série hora a hora" caption="Dashboard do Grafana com as estatísticas das imagens." >}}

## No Kubernetes, com o Helm

Com o repositório clonado, instale o chart informando as suas organizações:

```bash
helm upgrade --install dhis charts/docker-hub-image-statistics \
  -n dhis --create-namespace --set 'config.dockerhub.namespaces={myorg}'
```

O [README do chart](https://github.com/aeciopires/docker-hub-image-statistics/blob/main/charts/docker-hub-image-statistics/README.md) lista todas as opções.

## Configuração

A configuração pode vir de um arquivo YAML, de variáveis de ambiente `DHIS_*` ou de parâmetros da linha de comando, nessa ordem de prioridade. As opções mais usadas:

| Opção | Variável | Padrão |
| --- | --- | --- |
| `dockerhub.namespaces` | `DHIS_DOCKERHUB_NAMESPACES` | `library` |
| `dockerhub.repositories` | `DHIS_DOCKERHUB_REPOSITORIES` | vazio |
| `collector.interval` | `DHIS_COLLECTOR_INTERVAL` | `1h` |
| `log.level` | `DHIS_LOG_LEVEL` | `info` |
| `dockerhub.username` e `token` | `DHIS_DOCKERHUB_USERNAME` e `DHIS_DOCKERHUB_TOKEN` | acesso anônimo |

Sem login, o Docker Hub limita cada IP a 180 chamadas por minuto e devolve só os 100 primeiros repositórios de cada organização. Um token pessoal de acesso **somente leitura** remove essas duas limitações. A referência completa está em [docs/configuration.md](https://github.com/aeciopires/docker-hub-image-statistics/blob/main/docs/configuration.md).

## Conclusão

Agora consigo acompanhar quanto as minhas imagens são baixadas a cada dia e perceber quando uma versão nova começa a ser usada, sem depender do contador acumulado do Docker Hub.

O projeto é open source (licença GPL-3.0). Sugestões, *issues* e *pull requests* são bem-vindos no repositório: [https://github.com/aeciopires/docker-hub-image-statistics](https://github.com/aeciopires/docker-hub-image-statistics).

Se você ainda não conhece Docker, recomendo começar pelos links [desta página](/primeiros-passos-com-docker/) ou fazer o [curso de Docker](/curso-docker/) comigo.
