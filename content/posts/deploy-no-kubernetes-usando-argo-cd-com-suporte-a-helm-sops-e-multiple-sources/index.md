---
title: "Deploy de aplicações no Kubernetes usando Argo CD com suporte a Helm, Sops e Multiple Sources"
slug: "deploy-no-kubernetes-usando-argo-cd-com-suporte-a-helm-sops-e-multiple-sources"
date: 2022-12-31T13:45:32-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes"]
tags: ["argocd", "gitops", "helm", "sops", "kms"]
description: "Em outro tutorial, eu falei sobre a abordagem GitOps e uso do Argo CD para deploy de aplicações em clusters Kubernetes… Recomendo a leitura para…"
wp_id: 2826
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** o recurso *Multiple Sources*, anunciado aqui na versão 2.6.0-rc1, hoje faz parte da versão estável do Argo CD (3.6.2). Veja a [documentação oficial](https://argo-cd.readthedocs.io/en/stable/user-guide/multiple_sources/). O texto abaixo foi mantido como registro histórico.
{{< /alert >}}

Em outro [tutorial](/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/), eu falei sobre a abordagem [GitOps](https://www.gitops.tech/) e uso do [Argo CD](https://argoproj.github.io/argo-cd/) para deploy de aplicações em clusters [Kubernetes](https://kubernetes.io/)… Recomendo a leitura para entender alguns conceitos antes de partir para o assunto que será explicado aqui.

**Multiple Sources**

Quando eu escrevi o tutorial anterior, o Argo CD estava na versão 2.1.1 e não tinha suporte a deploy de aplicações obtendo simultaneamente o [helm chart](https://helm.sh/docs/topics/charts/) de um [repositório helm](https://helm.sh/docs/topics/chart_repository/#create-a-chart-repository) e os arquivos de [values](https://helm.sh/docs/chart_template_guide/values_files/) de um repositório git. Este tipo de deploy só funcionava se o helm chart e os arquivos de values da aplicação estivessem no mesmo repositório git.

Com o lançamento da versão [2.6.0-rc1 (release candidate)](https://github.com/argoproj/argo-cd/releases/tag/v2.6.0-rc1), o Argo CD ganhou, entre outras funcionalidades, a capacidade de fazer o **deploy** de uma aplicação obtendo o helm chart e os arquivos de values de **diferentes repositórios** **simultaneamente**. Essa era uma funcionalidade **muito aguardada** pela comunidade e **demorou alguns anos** para ser implementada. Algumas das novas funcionalidades estão explicadas neste tutorial: [https://blog.argoproj.io/draft-argo-cd-v2-6-release-candidate-ced1853bbfdb](https://blog.argoproj.io/draft-argo-cd-v2-6-release-candidate-ced1853bbfdb).
