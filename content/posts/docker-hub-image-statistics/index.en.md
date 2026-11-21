---
title: "Docker Hub Image Statistics: how many pulls did your images get today?"
slug: "docker-hub-image-statistics"
date: 2026-11-20T19:53:25-03:00
lastmod: 2026-11-20T19:53:25-03:00
draft: false
categories: ["devops", "docker", "go", "prometheus"]
tags: ["docker", "golang", "observability", "prometheus", "helm"]
description: "Open source tool written in Go that shows the pulls of images published on Docker Hub by day, week, month, and hour, with a web interface, an API, and metrics."
sourceHash: "cec2944f12b45575"
---

Anyone who publishes images on [Docker Hub](https://hub.docker.com/) knows the frustration: the repository page only shows the **cumulative total** of pulls. How many downloads did the image get today? And this week? Is the new version being used? Docker Hub doesn't answer these questions.

To solve this, this week I created [docker-hub-image-statistics](https://github.com/aeciopires/docker-hub-image-statistics), an open source tool written in the [Go language](https://go.dev/) that collects statistics for the public images of a user or organization and shows the pulls for the last day, the last 7 and 30 days, and hour by hour.

## How it works

Docker Hub only reports the **cumulative** pull counter for each image. The tool saves a "snapshot" of this counter on every collection (by default, every hour) and calculates the pulls for each period from the difference between snapshots. It's like reading your home water meter every hour to know how much water was used in each interval.

{{< mermaid >}}
flowchart LR
    hub[(Docker Hub API)] -- "every interval" --> col[Collector]
    col --> cache[("Cache<br/>SQLite, disk, and memory")]
    cache --> stats["1 day, 7 days, 30 days, and hourly"]
    stats --> ui[Web interface and JSON API]
    stats --> metrics["/metrics (Prometheus)"]
    col -. OTLP .-> otel[(Traces and logs)]
{{< /mermaid >}}

Because of this, the 1-, 7-, and 30-day values are only complete after the application has been running for that long. Until then, they are minimums and are marked with `*`.

## Main features

- **Automatic discovery** of all public images of the configured users and organizations, plus individual images, with include and exclude filters.
- **Pull statistics:** total, last 24 hours, 7 days, and 30 days per image and overall, with an **hour-by-hour** series (chart and table).
- **Scheduled collection** (by default, every hour), with the last and next update shown in the interface, the API, and the metrics.
- **Respects Docker Hub limits:** controls the request rate and obeys the quota headers and `Retry-After`.
- **Three-layer cache** (SQLite, disk, and memory), with automatic fallback if one of them fails.
- **Web interface** in the Material Design 3 style, with dark mode by default and no external dependencies.
- **Observability:** metrics for [Prometheus](https://prometheus.io/), [OpenTelemetry](https://opentelemetry.io/) traces, JSON logs, and ready-made dashboards for [Grafana](https://grafana.com/).
- **Secure image:** *distroless*, non-root, about 26 MB, scanned with [Trivy](https://trivy.dev/), and available for `amd64` and `arm64`.
- **Helm chart** for Kubernetes, with probes, NetworkPolicy, restricted Pod Security, Ingress, Gateway API `HTTPRoute`, and ServiceMonitor.

## Testing with Docker

The fastest way to see the tool working is with a single command. Replace `aeciopires` with your Docker Hub user or organization:

```bash
docker run -d --name dhis -p 8080:8080 \
  --read-only --cap-drop ALL --security-opt no-new-privileges \
  -v dhis-data:/data \
  -e DHIS_DOCKERHUB_NAMESPACES=aeciopires \
  -e DHIS_DOCKERHUB_REPOSITORIES=grafana/grafana,prom/prometheus \
  aeciopires/docker-hub-image-statistics:1.0.0
```

The `DHIS_DOCKERHUB_REPOSITORIES` variable is optional and adds images from other owners to the list. Open the interface at [http://localhost:8080](http://localhost:8080).

Other useful endpoints:

| Path | What for |
| --- | --- |
| `/api/v1/summary` | Totals for all images, in JSON |
| `/api/v1/images` | Statistics for each image, in JSON |
| `/metrics` | Metrics in the Prometheus format |
| `/healthz` and `/readyz` | Health checks for Docker and Kubernetes |

To see the version:

```bash
docker run --rm aeciopires/docker-hub-image-statistics:1.0.0 -v
```

To remove the test:

```bash
docker rm -f dhis
docker volume rm dhis-data
```

## With the full observability stack

The repository includes a Docker Compose file with the application and an observability stack: OpenTelemetry Collector, Prometheus, Loki, Tempo, Jaeger, and Grafana, with the dashboards already configured.

```bash
git clone https://github.com/aeciopires/docker-hub-image-statistics.git
cd docker-hub-image-statistics
make stack-up
```

| Service | Address |
| --- | --- |
| Application | [http://localhost:8080](http://localhost:8080) |
| Grafana | [http://localhost:3000](http://localhost:3000) |
| Prometheus | [http://localhost:9090](http://localhost:9090) |
| Jaeger | [http://localhost:16686](http://localhost:16686) |

To stop everything, use `make stack-down`.

{{< figure src="grafana-images.png" alt="Grafana dashboard with the image pulls: totals, pulls per period, and the hour-by-hour series" caption="Grafana dashboard with the image statistics." >}}

## On Kubernetes, with Helm

With the repository cloned, install the chart passing your organizations:

```bash
helm upgrade --install dhis charts/docker-hub-image-statistics \
  -n dhis --create-namespace --set 'config.dockerhub.namespaces={myorg}'
```

The [chart README](https://github.com/aeciopires/docker-hub-image-statistics/blob/main/charts/docker-hub-image-statistics/README.md) lists all the options.

## Configuration

The configuration can come from a YAML file, from `DHIS_*` environment variables, or from command-line parameters, in that order of priority. The most commonly used options:

| Option | Variable | Default |
| --- | --- | --- |
| `dockerhub.namespaces` | `DHIS_DOCKERHUB_NAMESPACES` | `library` |
| `dockerhub.repositories` | `DHIS_DOCKERHUB_REPOSITORIES` | empty |
| `collector.interval` | `DHIS_COLLECTOR_INTERVAL` | `1h` |
| `log.level` | `DHIS_LOG_LEVEL` | `info` |
| `dockerhub.username` and `token` | `DHIS_DOCKERHUB_USERNAME` and `DHIS_DOCKERHUB_TOKEN` | anonymous access |

Without a login, Docker Hub limits each IP to 180 calls per minute and returns only the first 100 repositories of each organization. A **read-only** personal access token removes both limitations. The full reference is in [docs/configuration.md](https://github.com/aeciopires/docker-hub-image-statistics/blob/main/docs/configuration.md).

## Conclusion

Now I can track how many times my images are downloaded each day and notice when a new version starts being used, without depending on Docker Hub's cumulative counter.

The project is open source (GPL-3.0 license). Suggestions, *issues*, and *pull requests* are welcome in the repository: [https://github.com/aeciopires/docker-hub-image-statistics](https://github.com/aeciopires/docker-hub-image-statistics).

If you don't know Docker yet, I recommend starting with the links on [this page](/en/primeiros-passos-com-docker/) or taking the [Docker course](/en/curso-docker/) with me.
