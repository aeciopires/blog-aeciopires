---
title: "myhealthcheck: health checks for your applications, with Kubernetes discovery"
slug: "myhealthcheck"
date: 2026-11-20T19:53:25-03:00
lastmod: 2026-11-20T19:53:25-03:00
draft: false
categories: ["devops", "docker", "kubernetes", "prometheus"]
tags: ["python", "kubernetes", "observability", "docker", "helm"]
description: "Open source health check system in Python: it checks your applications, discovers services on Kubernetes, and exposes an API, metrics, logs, and traces."
sourceHash: "b16b33cf250c7bcf"
---

Knowing whether an application is up seems simple: just hit an address and see if it responds. But when the environment has dozens of services, spread across several Kubernetes namespaces, each with its own health check path (`/health`, `/healthz`, `/status`, `/actuator/health`...), keeping that list up to date by hand becomes a tedious, error-prone chore.

To solve this, this week I created [myhealthcheck](https://github.com/aeciopires/myhealthcheck), an open source health check system written in [Python](https://www.python.org/). It reads the list of systems to check from a file, from an environment variable, or from its own API, and it can also **discover services automatically on Kubernetes**.

## How it works

{{< mermaid >}}
flowchart LR
    L[targets.yaml, HEALTH_ENDPOINTS or API] --> M[myhealthcheck]
    K[(Kubernetes Services)] -- discovery --> M
    M -- "GET /status, /health, ..." --> S[Monitored systems]
    M --> API[REST API + Swagger]
    M --> PR[Prometheus metrics]
    M --> LG[JSON logs]
    M --> TR[OpenTelemetry traces]
    M --> DB[(SQLite)]
{{< /mermaid >}}

On each cycle (every 60 seconds by default), myhealthcheck hits each system. If you don't provide the path, it tries the most common health check paths in order: `/status`, `/health`, `/healthz`, `/livez`, `/readyz`, `/ready`, `/ping`, `/-/healthy`, `/actuator/health`, and others. The result is stored in SQLite and exposed through the API, the metrics, and the logs.

## Main features

- **Static targets** in YAML, JSON, or text files, or in the `HEALTH_ENDPOINTS` variable, in the formats `protocolo://host:porta/caminho`, `protocolo:host:porta/caminho`, or `host:porta`.
- **Default health check paths** tried in order, or **custom paths** for each target.
- **Kubernetes discovery:** finds the Services in a list of namespaces, in all of them, or in all but a few (it accepts patterns such as `team-*`), on ports 80, 8080, and 8888 by default.
- **Smart checks:** timeout, retries only on network errors or 5xx, expected HTTP status code and content, and a threshold for flagging slow responses.
- **REST API documented with Swagger/OpenAPI** to list, add, and remove systems, run a check on demand, and query the history.
- **Observability:** [Prometheus](https://prometheus.io/) metrics, JSON logs with `trace_id`, [OpenTelemetry](https://opentelemetry.io/) traces, and a ready-made [Grafana](https://grafana.com/) dashboard.
- **Alerts** when a system changes state (JSON log and optional *webhook*) and Prometheus alerting rules.
- **`--once` mode** for CI and cron: it runs a single check and exits with code 1 if anything is down.
- **Helm chart** with least-privilege RBAC, a non-root, read-only container, a ServiceMonitor, and a PrometheusRule.

## Quick test with Docker

The `--once` mode is the simplest way to try it. It checks the addresses, prints a JSON report, and exits:

```bash
docker run --rm aeciopires/myhealthcheck:3.0.0 --once \
  -u https://github.com \
  -u https://blog.aeciopires.com/index.xml
```

For the first address, which has no path, the tool looked for a health check path and found `/status`. For the second, it checked exactly the path provided. The exit code is `0` when everything is up and `1` when any system is down, which makes it easy to use the command in a CI pipeline or a cron job:

```bash
docker run --rm aeciopires/myhealthcheck:3.0.0 --once -u http://127.0.0.1:9 || echo "algo está fora do ar"
```

## Running as a service

Without `--once`, myhealthcheck keeps running, checks the targets on each cycle, and serves the API on port 8000:

```bash
docker run -d --name myhealthcheck -p 8000:8000 \
  -e HEALTH_ENDPOINTS=https://github.com,https://blog.aeciopires.com/index.xml \
  -e CHECK_INTERVAL=30 \
  aeciopires/myhealthcheck:3.0.0
```

| Address | What for |
| --- | --- |
| [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API documentation (Swagger) |
| `http://localhost:8000/api/v1/summary` | Summary: how many systems are up, degraded, or down |
| `http://localhost:8000/api/v1/targets` | List of systems and the state of each one |
| `http://localhost:8000/metrics` | Metrics in Prometheus format |

You can also test an address on demand, without adding it:

```bash
curl -s -X POST http://localhost:8000/api/v1/probe \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://github.com"}'
```

To remove the test: `docker rm -f myhealthcheck`.

## With the observability stack

The repository includes a Docker Compose file with the application and a full stack: Grafana, Loki, Tempo, Prometheus, Jaeger, and Alloy, with the *myhealthcheck* dashboard already set up.

```bash
git clone https://github.com/aeciopires/myhealthcheck.git
cd myhealthcheck
make install-deps
make up
```

The API is at [http://localhost:8000/docs](http://localhost:8000/docs) and Grafana at [http://localhost:3000](http://localhost:3000). To stop: `make down`.

## On Kubernetes, with automatic discovery

With the repository cloned, install the chart and specify the namespaces myhealthcheck should watch:

```bash
helm upgrade --install myhealthcheck charts/myhealthcheck \
  -n myhealthcheck --create-namespace \
  --set 'config.discovery.namespaces={shop,payments}'
```

To test on a local cluster with [kind](https://kind.sigs.k8s.io/), use `make kind-deploy`.

Each Service can tune its check with annotations. For example, to use custom paths and require both of them to respond:

```yaml
metadata:
  annotations:
    myhealthcheck.io/port: "http"             # nome ou número da porta
    myhealthcheck.io/paths: "/livez,/readyz"  # no lugar dos caminhos padrão
    myhealthcheck.io/match: "all"             # os dois caminhos precisam responder
    myhealthcheck.io/expected-status: "200"
    # myhealthcheck.io/enabled: "false"       # ignora este Service
```

The complete discovery rules are in [docs/kubernetes-discovery.md](https://github.com/aeciopires/myhealthcheck/blob/main/docs/kubernetes-discovery.md).

## Configuration in 30 seconds

| I want to... | Configure |
| --- | --- |
| check a list of URLs | `HEALTH_ENDPOINTS=http://a:8080/health,https:b:443/status` |
| use a file | `TARGETS_FILE=config/targets.yaml` |
| change the interval | `CHECK_INTERVAL=30` |
| change the default paths | `DEFAULT_HEALTH_PATHS=/status,/health,/ping` |
| discover on Kubernetes | `DISCOVERY_ENABLED=true` |
| ...only in some namespaces | `DISCOVERY_NAMESPACES=shop,team-*` |
| ...in all but a few | `DISCOVERY_EXCLUDE_NAMESPACES=kube-system,*-dev` |
| ...on other ports | `DISCOVERY_PORTS=80,3000` or `*` |
| export traces | `OTEL_ENABLED=true` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4318` |
| receive alerts | `ALERT_WEBHOOK_URL=https://...` |

The complete reference is in [docs/configuration.md](https://github.com/aeciopires/myhealthcheck/blob/main/docs/configuration.md).

## Conclusion

With myhealthcheck, the list of systems to check follows the cluster itself: a new Service starts being monitored without anyone having to remember to add it, and the state of everything is available in the API, in Prometheus, and in Grafana.

The project is open source (GPL-3.0 license). Suggestions, *issues*, and *pull requests* are welcome in the repository: [https://github.com/aeciopires/myhealthcheck](https://github.com/aeciopires/myhealthcheck).

If you are getting started with Kubernetes, check out the [Kubernetes course](/en/curso-kubernetes-k8s/) I offer.
