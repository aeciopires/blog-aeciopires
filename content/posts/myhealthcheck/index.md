---
title: "myhealthcheck: health check das suas aplicações, com descoberta no Kubernetes"
slug: "myhealthcheck"
date: 2026-11-20T19:53:25-03:00
lastmod: 2026-11-20T19:53:25-03:00
draft: false
categories: ["devops", "docker", "kubernetes", "prometheus"]
tags: ["python", "kubernetes", "observability", "docker", "helm"]
description: "Sistema de health check open source em Python: verifica as suas aplicações, descobre serviços no Kubernetes e expõe API, métricas, logs e traces."
---

Saber se uma aplicação está no ar parece simples: basta acessar um endereço e ver se ele responde. Mas, quando o ambiente tem dezenas de serviços, espalhados em vários namespaces do Kubernetes, cada um com o seu caminho de health check (`/health`, `/healthz`, `/status`, `/actuator/health`...), manter essa lista atualizada à mão vira um trabalho chato e sujeito a erro.

Para resolver isso, criei nesta semana o [myhealthcheck](https://github.com/aeciopires/myhealthcheck), um sistema de health check de código aberto escrito em [Python](https://www.python.org/). Ele lê a lista de sistemas a verificar de um arquivo, de uma variável de ambiente ou da própria API, e também pode **descobrir os serviços automaticamente no Kubernetes**.

## Como funciona

{{< mermaid >}}
flowchart LR
    L[targets.yaml, HEALTH_ENDPOINTS ou API] --> M[myhealthcheck]
    K[(Services do Kubernetes)] -- descoberta --> M
    M -- "GET /status, /health, ..." --> S[Sistemas monitorados]
    M --> API[API REST + Swagger]
    M --> PR[Métricas do Prometheus]
    M --> LG[Logs em JSON]
    M --> TR[Traces do OpenTelemetry]
    M --> DB[(SQLite)]
{{< /mermaid >}}

A cada ciclo (por padrão, a cada 60 segundos), o myhealthcheck acessa cada sistema. Se você não informar o caminho, ele testa, em ordem, os caminhos de health check mais comuns: `/status`, `/health`, `/healthz`, `/livez`, `/readyz`, `/ready`, `/ping`, `/-/healthy`, `/actuator/health` e outros. O resultado fica guardado em SQLite e é exposto pela API, pelas métricas e pelos logs.

## Principais recursos

- **Alvos estáticos** em arquivos YAML, JSON ou texto, ou na variável `HEALTH_ENDPOINTS`, nos formatos `protocolo://host:porta/caminho`, `protocolo:host:porta/caminho` ou `host:porta`.
- **Caminhos de health check padrão** testados em ordem, ou **caminhos próprios** para cada alvo.
- **Descoberta no Kubernetes:** encontra os Services de uma lista de namespaces, de todos eles ou de todos menos alguns (aceita padrões como `team-*`), nas portas 80, 8080 e 8888 por padrão.
- **Verificações inteligentes:** tempo limite, novas tentativas só em erros de rede ou 5xx, código HTTP e conteúdo esperados, e um limite para marcar respostas lentas.
- **API REST documentada com Swagger/OpenAPI** para listar, cadastrar e remover sistemas, verificar na hora e consultar o histórico.
- **Observabilidade:** métricas do [Prometheus](https://prometheus.io/), logs em JSON com `trace_id`, traces do [OpenTelemetry](https://opentelemetry.io/) e dashboard pronto para o [Grafana](https://grafana.com/).
- **Alertas** quando um sistema muda de estado (log em JSON e *webhook* opcional) e regras de alerta do Prometheus.
- **Modo `--once`** para CI e cron: faz uma única verificação e sai com código 1 se algo estiver fora do ar.
- **Helm chart** com RBAC de privilégio mínimo, container sem root e somente leitura, ServiceMonitor e PrometheusRule.

## Teste rápido com Docker

O modo `--once` é a forma mais simples de experimentar. Ele verifica os endereços, mostra um relatório em JSON e termina:

```bash
docker run --rm aeciopires/myhealthcheck:3.0.0 --once \
  -u https://github.com \
  -u https://blog.aeciopires.com/index.xml
```

No primeiro endereço, sem caminho, a ferramenta procurou um caminho de health check e encontrou `/status`. No segundo, ela verificou exatamente o caminho informado. O código de saída é `0` quando tudo está no ar e `1` quando algum sistema está fora, o que facilita usar o comando num pipeline de CI ou num cron:

```bash
docker run --rm aeciopires/myhealthcheck:3.0.0 --once -u http://127.0.0.1:9 || echo "algo está fora do ar"
```

## Rodando como serviço

Sem o `--once`, o myhealthcheck fica rodando, verifica os alvos a cada ciclo e publica a API na porta 8000:

```bash
docker run -d --name myhealthcheck -p 8000:8000 \
  -e HEALTH_ENDPOINTS=https://github.com,https://blog.aeciopires.com/index.xml \
  -e CHECK_INTERVAL=30 \
  aeciopires/myhealthcheck:3.0.0
```

| Endereço | Para quê |
| --- | --- |
| [http://localhost:8000/docs](http://localhost:8000/docs) | Documentação interativa da API (Swagger) |
| `http://localhost:8000/api/v1/summary` | Resumo: quantos sistemas estão no ar, degradados ou fora |
| `http://localhost:8000/api/v1/targets` | Lista de sistemas e o estado de cada um |
| `http://localhost:8000/metrics` | Métricas no formato do Prometheus |

Também é possível testar um endereço na hora, sem cadastrá-lo:

```bash
curl -s -X POST http://localhost:8000/api/v1/probe \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://github.com"}'
```

Para remover o teste: `docker rm -f myhealthcheck`.

## Com a stack de observabilidade

O repositório traz um Docker Compose com a aplicação e uma stack completa: Grafana, Loki, Tempo, Prometheus, Jaeger e Alloy, com o dashboard *myhealthcheck* já configurado.

```bash
git clone https://github.com/aeciopires/myhealthcheck.git
cd myhealthcheck
make install-deps
make up
```

A API fica em [http://localhost:8000/docs](http://localhost:8000/docs) e o Grafana em [http://localhost:3000](http://localhost:3000). Para parar: `make down`.

## No Kubernetes, com descoberta automática

Com o repositório clonado, instale o chart e informe os namespaces que o myhealthcheck deve observar:

```bash
helm upgrade --install myhealthcheck charts/myhealthcheck \
  -n myhealthcheck --create-namespace \
  --set 'config.discovery.namespaces={shop,payments}'
```

Para testar num cluster local com o [kind](https://kind.sigs.k8s.io/), use `make kind-deploy`.

Cada Service pode ajustar a verificação com anotações. Por exemplo, para usar caminhos próprios e exigir que os dois respondam:

```yaml
metadata:
  annotations:
    myhealthcheck.io/port: "http"             # nome ou número da porta
    myhealthcheck.io/paths: "/livez,/readyz"  # no lugar dos caminhos padrão
    myhealthcheck.io/match: "all"             # os dois caminhos precisam responder
    myhealthcheck.io/expected-status: "200"
    # myhealthcheck.io/enabled: "false"       # ignora este Service
```

As regras completas da descoberta estão em [docs/kubernetes-discovery.md](https://github.com/aeciopires/myhealthcheck/blob/main/docs/kubernetes-discovery.md).

## Configuração em 30 segundos

| Eu quero... | Configure |
| --- | --- |
| verificar uma lista de URLs | `HEALTH_ENDPOINTS=http://a:8080/health,https:b:443/status` |
| usar um arquivo | `TARGETS_FILE=config/targets.yaml` |
| mudar o intervalo | `CHECK_INTERVAL=30` |
| mudar os caminhos padrão | `DEFAULT_HEALTH_PATHS=/status,/health,/ping` |
| descobrir no Kubernetes | `DISCOVERY_ENABLED=true` |
| ...só em alguns namespaces | `DISCOVERY_NAMESPACES=shop,team-*` |
| ...em todos, menos alguns | `DISCOVERY_EXCLUDE_NAMESPACES=kube-system,*-dev` |
| ...em outras portas | `DISCOVERY_PORTS=80,3000` ou `*` |
| exportar traces | `OTEL_ENABLED=true` e `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4318` |
| receber alertas | `ALERT_WEBHOOK_URL=https://...` |

A referência completa está em [docs/configuration.md](https://github.com/aeciopires/myhealthcheck/blob/main/docs/configuration.md).

## Conclusão

Com o myhealthcheck, a lista de sistemas a verificar acompanha o próprio cluster: um Service novo passa a ser monitorado sem ninguém precisar lembrar de cadastrá-lo, e o estado de tudo fica disponível na API, no Prometheus e no Grafana.

O projeto é open source (licença GPL-3.0). Sugestões, *issues* e *pull requests* são bem-vindos no repositório: [https://github.com/aeciopires/myhealthcheck](https://github.com/aeciopires/myhealthcheck).

Se você está começando com Kubernetes, veja o [curso de Kubernetes](/curso-kubernetes-k8s/) que ofereço.
