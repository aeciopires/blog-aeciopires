---
title: "Installing Prometheus via Docker"
slug: "instalando-o-prometheus-via-docker"
date: 2019-11-17T13:17:45-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "prometheus"]
description: "Prometheus is an open source systems monitoring and alerting toolkit inspired by BorgMon (the monitoring system of Borg,…"
sourceHash: "03cfddb0b7266611"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with the `prom/prometheus` image (Prometheus 3.16.0): this post's `prometheus.yml` passes `promtool check config`, and the `172.17.0.1:9090` target shows up as `up`. No changes were needed.
{{< /alert >}}

[Prometheus](https://prometheus.io) is an open source systems monitoring and alerting toolkit inspired by [BorgMon](https://landing.google.com/sre/sre-book/chapters/practical-alerting/) (the monitoring system of [Borg](https://ai.google/research/pubs/pub43438), Google's container management platform that inspired the development of [Kubernetes](https://kubernetes.io/)).

It was originally created by former Google employees who worked at [SoundCloud](https://soundcloud.com) (a music company). Since its creation in 2012, many companies and organizations have adopted Prometheus, and the project has a very active community of developers and users. [[1]](https://prometheus.io/docs/introduction/overview) [[2]](https://www.slideshare.net/brianbrazil/prometheus-and-docker-docker-galway-november-2015)

Prometheus is an independent open source project, maintained independently of any company. To emphasize this and clarify the project's governance structure, Prometheus joined the [Cloud Native Computing Foundation](https://www.cncf.io) in 2016 as the second hosted project, after Kubernetes.

The Prometheus source code is available at: [https://github.com/prometheus/prometheus](https://github.com/prometheus/prometheus)

Prometheus is made up of several components, described in the [Prometheus overview](https://prometheus.io/docs/introduction/overview/). The source code of these components is available at: [https://github.com/prometheus](https://github.com/prometheus)

Installing with Docker is much simpler and faster.

If you don't know what Docker is, I recommend starting by reading the links below. It's a long road, but this technology is worth getting to know.

 [/primeiros-passos-com-docker/](/en/primeiros-passos-com-docker/)

I also teach a Docker course: [/curso-docker](/en/curso-docker)

1) Create the directory below to persist the data outside the container.

```bash
sudo mkdir -p /docker/prometheus
```

2) Create the configuration file **/docker/prometheus/prometheus.yml** with the following content. This content may change over time, and more information about the configuration can be found at: [https://prometheus.io/docs/prometheus/latest/getting\_started/](https://prometheus.io/docs/prometheus/latest/getting_started/)

```yaml
global:
  # Metrics scrape interval. The default is every 60s
  scrape_interval:  10s
  # Rule evaluation interval. The default is every 60s
  evaluation_interval: 10s
  # scrape_timeout is set to the global default (10s).

alerting:
  alertmanagers:
  - static_configs:
    - targets:
    # - alertmanager:9093

rule_files:
   # - "first_rules.yml"
   # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
  # metrics_path defaults to '/metrics'
  #    scheme defaults to 'http'.
    static_configs:
    - targets: ['172.17.0.1:9090']
```

3) Start Prometheus using Docker with the following command.

```bash
docker run -d -p 9090:9090 \
 --name prometheus \
 -v /docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
 prom/prometheus
```

Prometheus is accessible at the URL: **http://IP-Servidor:9090**

Source: [https://prometheus.io/docs/prometheus/latest/installation/](https://prometheus.io/docs/prometheus/latest/installation/)

4) If you want to stop the container, just run the command below.

```bash
docker stop prometheus
```

5) To start it again, run the command below.

```bash
docker start prometheus
```

6) To view the logs, run the command below.

```bash
docker logs -f prometheus
```

For documentation on using Prometheus, see: [https://prometheus.io/docs/introduction/overview/](https://prometheus.io/docs/introduction/overview/)
