---
title: "Helm Chart: Kubernetes Watchdog Pod Restart/Delete"
slug: "helm-chart-kubernetes-watchdog-pod-restart-delete"
date: 2025-03-21T15:29:56-03:00
lastmod: 2025-03-21T15:31:14-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes"]
tags: ["docker", "helm", "kubernetes", "bash"]
description: "Acabei de publicar este helm chart: 📌 https://artifacthub.io/packages/helm/helm-watchdog-pod-delete/helm-watchdog-pod-delete 📌…"
wp_id: 3369
---

Oi, pessoal!

Acabei de publicar este helm chart:  
📌 [https://artifacthub.io/packages/helm/helm-watchdog-pod-delete/helm-watchdog-pod-delete](https://artifacthub.io/packages/helm/helm-watchdog-pod-delete/helm-watchdog-pod-delete)  
📌 [https://github.com/aeciopires/helm-watchdog-pod-delete](https://github.com/aeciopires/helm-watchdog-pod-delete)

Ele instala um watchdog no cluster que monitora os Pods e remove os que estiverem com o status CrashLoopBackOff ou Error, forçando uma recriação (se estiverem sendo gerenciados por um controller, tal como: deployment, replicaset, daemonset, statefulset, etc).

O caso de uso é:  
🔧 Reduzir a intervenção manual para recriar os Pods.  
🔥 Corrigir problemas com sidecars e initContainers garantindo que os Pods sejam totalmente reiniciados em vez de permanecerem em um estado parcialmente funcional.  
🌍 Resolver condições de corrida causadas por dependências externas indisponíveis na inicialização, garantindo que os Pods tentem novamente a inicialização quando as dependências estiverem prontas.

\-\-\---

Hi, guys!

I just published this helm chart:  
📌 [https://artifacthub.io/packages/helm/helm-watchdog-pod-delete/helm-watchdog-pod-delete](https://artifacthub.io/packages/helm/helm-watchdog-pod-delete/helm-watchdog-pod-delete)  
📌 [https://github.com/aeciopires/helm-watchdog-pod-delete](https://github.com/aeciopires/helm-watchdog-pod-delete)

It installs a watchdog in the cluster that monitors the Pods and removes those with the CrashLoopBackOff or Error status, forcing a rebuild (if they are being managed by a controller, such as: deployment, replicaset, daemonset, statefulset, etc).

The use case is:  
🔧 Reduce manual intervention to rebuild Pods.  
🔥 Fix issues with sidecars and initContainers by ensuring that Pods are fully restarted instead of remaining in a partially functional state.  
🌍 Resolve race conditions caused by external dependencies being unavailable at startup, ensuring that Pods retry startup when dependencies are ready.
