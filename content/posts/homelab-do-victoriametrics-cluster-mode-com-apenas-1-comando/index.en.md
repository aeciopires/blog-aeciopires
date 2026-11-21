---
title: "VictoriaMetrics (cluster mode) HomeLab with just 1 command"
slug: "homelab-do-victoriametrics-cluster-mode-com-apenas-1-comando"
date: 2025-05-09T11:04:43-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes", "prometheus", "tutoriais"]
tags: ["victoriametrics", "homelab", "observability", "kubernetes", "argocd"]
description: "VictoriaMetrics is a fast, cost-effective, and scalable time series database. It can be used as long-term remote storage for…"
sourceHash: "8bf6423fa63823d9"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** the versions listed below are the ones from when this post was published. The [learning-victoriametrics](https://github.com/aeciopires/learning-victoriametrics) repository is still being updated (Helm 4, Gateway API instead of ingress-nginx, VictoriaLogs, and VictoriaTraces), and the current versions are in its `mise.toml` and `CHANGELOG.md`. The repository's `make up` was tested on this date on Ubuntu 22.04: VictoriaMetrics 1.156.0 in cluster mode, VictoriaLogs 1.54.0, VictoriaTraces 0.13.0, Grafana 13.3.1, and Kubernetes 1.37, with writing and reading metrics, logs, and traces through `vmauth` working.
{{< /alert >}}

[VictoriaMetrics](https://victoriametrics.com/) is a fast, cost-effective, and scalable time series database. It can be used as long-term remote storage for [Prometheus](https://prometheus.io/).

I worked at Sensedia for almost 5 years and used VictoriaMetrics in production, collecting metrics from more than 100 clusters ([EKS](https://aws.amazon.com/pt/eks/) and [GKE](https://cloud.google.com/kubernetes-engine?hl=pt-BR)), running hundreds of pods in each cluster and going through 5 Black Fridays without any downtime in the monitoring stack.

Details about this use case can be found at the following links:

- [en-US] [https://victoriametrics.com/case-studies/sensedia/](https://victoriametrics.com/case-studies/sensedia/)
- [en-US] [https://docs.victoriametrics.com/casestudies/#sensedia](https://docs.victoriametrics.com/casestudies/#sensedia)
- [en-US] [https://nordicapis.com/api-monitoring-with-prometheus-grafana-alertmanager-and-victoriametrics/](https://nordicapis.com/api-monitoring-with-prometheus-grafana-alertmanager-and-victoriametrics/)
- [es] [https://www.sensedia.com.es/post/seguimiento-con-prometheus-grafana-alertmanager-and-victoriametrics](https://www.sensedia.com.es/post/seguimiento-con-prometheus-grafana-alertmanager-and-victoriametrics)
- [pt-BR] [https://www.sensedia.com.br/post/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics](https://www.sensedia.com.br/post/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics)
- [pt-BR] [https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics](https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics)
- Slides (pt-BR): [https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics](https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics)

But testing VictoriaMetrics in cluster mode is neither easy nor cheap...

To help with that, I just published the [https://github.com/aeciopires/learning-victoriametrics](https://github.com/aeciopires/learning-victoriametrics) repository, which contains automation and documentation on how to create a HomeLab using the following software:

- Kind: 0.27.0
- Kubernetes: 1.32.0
- MetalLB: 0.14.9
- ArgoCD: 3.0.0
- VictoriaMetrics Cluster (all components): 1.116.0
- Grafana: 12.0.0
- AlertManager: 0.28.1
- Prometheus: 3.3.1
- Prometheus-Operator: v0.82.0
- kube-pires: 1.1.0
- Ingress-Nginx: 1.12.2
- Cert-manager: 1.17.2

I tested it on Ubuntu 22.04 64-bit, but I also added support for macOS ARM64.

I hope this helps you learn VictoriaMetrics.
