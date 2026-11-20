---
title: "HomeLab do VictoriaMetrics (cluster mode) com apenas 1 comando"
slug: "homelab-do-victoriametrics-cluster-mode-com-apenas-1-comando"
date: 2025-05-09T11:04:43-03:00
lastmod: 2025-05-09T11:45:12-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes", "prometheus", "tutoriais"]
tags: ["victoriametrics", "homelab", "observability", "kubernetes", "argocd"]
description: "VictoriaMetrics é um banco de dados de séries temporais rápido, econômico e escalável. Pode ser usado como armazenamento remoto de longo prazo para o…"
wp_id: 3424
---

[VictoriaMetrics](https://victoriametrics.com/) é um banco de dados de séries temporais rápido, econômico e escalável. Pode ser usado como armazenamento remoto de longo prazo para o [Prometheus](https://prometheus.io/).

Trabalhei na Sensedia por quase 5 anos e utilizei o VIctoriaMetrics em produção, coletando métricas de mais de 100 clusters ([EKS](https://aws.amazon.com/pt/eks/) e [GKE](https://cloud.google.com/kubernetes-engine?hl=pt-BR)), executando centenas de pods em cada cluster e passando por 5 Black Friday sem tempo de inatividade na pilha de monitoramento.

Detalhes deste caso de uso podem ser encontrados nos seguintes links:

- [en-US] [https://victoriametrics.com/case-studies/sensedia/](https://victoriametrics.com/case-studies/sensedia/)
- [en-US] [https://docs.victoriametrics.com/casestudies/#sensedia](https://docs.victoriametrics.com/casestudies/#sensedia)
- [en-US] [https://nordicapis.com/api-monitoring-with-prometheus-grafana-alertmanager-and-victoriametrics/](https://nordicapis.com/api-monitoring-with-prometheus-grafana-alertmanager-and-victoriametrics/)
- [es] [https://www.sensedia.com.es/post/seguimiento-con-prometheus-grafana-alertmanager-and-victoriametrics](https://www.sensedia.com.es/post/seguimiento-con-prometheus-grafana-alertmanager-and-victoriametrics)
- [pt-BR] [https://www.sensedia.com.br/post/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics](https://www.sensedia.com.br/post/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics)
- [pt-BR] [https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics](https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics)
- Slides (pt-BR): [https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics](https://speakerdeck.com/aeciopires/monitoramento-de-aplicacoes-com-prometheus-grafana-alertmanager-e-victoriametrics)

Mas testar o VictoriaMetrics no modo cluster não é uma tarefa fácil e barata...

Para ajudar com isso, acabei de publicar o repositório [https://github.com/aeciopires/learning-victoriametrics](https://github.com/aeciopires/learning-victoriametrics) que contém uma automação e documentação sobre como criar um HomeLab usando os seguintes softwares:

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

Eu testei usando o Ubuntu 22.04 64 bits, mas adicionei o suporte a MacOs ARM64.

Espero que isso ajude no aprendizado do VictoriaMetrics.
