---
title: "Deploying applications to Kubernetes using Argo CD with support for Helm, Sops, and Multiple Sources"
slug: "deploy-no-kubernetes-usando-argo-cd-com-suporte-a-helm-sops-e-multiple-sources"
date: 2022-12-31T13:45:32-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes"]
tags: ["argocd", "gitops", "helm", "sops", "kms"]
description: "In another tutorial, I talked about the GitOps approach and using Argo CD to deploy applications to Kubernetes clusters… I recommend reading it to…"
sourceHash: "961f06e975dddc14"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** the *Multiple Sources* feature, announced here in version 2.6.0-rc1, is now part of the stable release of Argo CD (3.6.2). See the [official documentation](https://argo-cd.readthedocs.io/en/stable/user-guide/multiple_sources/). The text below was kept as a historical record.
{{< /alert >}}

In another [tutorial](/en/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/), I talked about the [GitOps](https://www.gitops.tech/) approach and using [Argo CD](https://argoproj.github.io/argo-cd/) to deploy applications to [Kubernetes](https://kubernetes.io/) clusters… I recommend reading it to understand a few concepts before moving on to the subject explained here.

**Multiple Sources**

When I wrote the previous tutorial, Argo CD was at version 2.1.1 and didn't support deploying applications by simultaneously fetching the [helm chart](https://helm.sh/docs/topics/charts/) from a [helm repository](https://helm.sh/docs/topics/chart_repository/#create-a-chart-repository) and the [values](https://helm.sh/docs/chart_template_guide/values_files/) files from a git repository. This type of deployment only worked if the application's helm chart and values files were in the same git repository.

With the release of version [2.6.0-rc1 (release candidate)](https://github.com/argoproj/argo-cd/releases/tag/v2.6.0-rc1), Argo CD gained, among other features, the ability to **deploy** an application by fetching the helm chart and the values files from **different repositories** **simultaneously**. This was a **long-awaited** feature in the community, and it **took a few years** to be implemented. Some of the new features are explained in this tutorial: [https://blog.argoproj.io/draft-argo-cd-v2-6-release-candidate-ced1853bbfdb](https://blog.argoproj.io/draft-argo-cd-v2-6-release-candidate-ced1853bbfdb).
