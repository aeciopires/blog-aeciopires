---
title: "Installing Zabbix on Kubernetes using Helm"
slug: "instalando-o-zabbix-no-kubernetes-usando-o-helm"
date: 2023-01-15T20:57:41-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
tags: ["zabbix", "helm", "kubernetes", "gitops"]
description: "Update: there is a new post about this helm chart here: /en/helm-chart-zabbix-7-0-0/"
sourceHash: "473c92624233496f"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** there are more recent posts about this helm chart: [version 7.0.0](/helm-chart-zabbix-7-0-0/) and [version 8.0.0](/helm-chart-zabbix-8-0-0/). The `zabbix-community/zabbix` 8.0.1 chart was installed on a kind cluster (Kubernetes 1.37) with the default values, and the web interface responded. The installation tutorial is still on [Artifact Hub](https://artifacthub.io/packages/helm/zabbix-community/zabbix).
{{< /alert >}}

**Introduction**

I confess it took me a long time to publish this post, because installing [Zabbix](https://www.zabbix.com/) on [Kubernetes](https://kubernetes.io/) using [Helm](https://helm.sh/) is nothing new. It has been done in some environments for a few years now. I myself have been helping develop a [helm chart for almost 3 years](https://github.com/zabbix-community/helm-zabbix). But here we are...

Since 2013, the idea of installing applications using containers has become very popular, especially using [Docker](https://www.docker.com/). And when you have an environment with dozens or hundreds of containers, you need an orchestration tool. There are several options, but the one that became popular was Kubernetes.

Anyone who is learning or already works with Kubernetes knows that it isn't easy to maintain. Helm is one of the tools available for working with Kubernetes, and its focus is to help install applications. Helm works as a package manager, implementing the same idea as [apt](https://en.wikipedia.org/wiki/APT_(software)), [yum](https://en.wikipedia.org/wiki/Yum_(software)), [apk](https://wiki.alpinelinux.org/wiki/Alpine_Package_Keeper), etc... It's used to install, upgrade and remove applications through helm charts, which can be created by you or obtained from various code repositories or helm repositories. [Artifact Hub](https://artifacthub.io/) is a website where you can find information about thousands of helm charts.

If you want to learn more about Docker, Kubernetes or Helm, I suggest reading the [links on this page](/en/primeiros-passos-com-docker/), or taking a **course** with me on [Docker](/en/curso-docker/) and/or [Kubernetes](/en/curso-kubernetes-k8s/).

**About the Helm Chart**

Zabbix SIA developed an official helm chart [available here](https://git.zabbix.com/projects/ZT/repos/kubernetes-helm/browse), but today (January 2023) it still isn't ready to install all of Zabbix's software components. I even reported this [in this issue](https://support.zabbix.com/browse/ZBXNEXT-5787).

Because of that, in 2020, [Amen Ayadi](https://github.com/AyadiAmen) and [Alexandre Nuttinck](https://github.com/alexnuttinck), researchers at [Cetic](https://www.cetic.be/), created the [cetic/zabbix](https://github.com/cetic/helm-zabbix) helm chart, which installs most of the Zabbix components using the [PostgreSQL](https://www.postgresql.org/) database. Also in 2020, I started contributing to the helm chart's source code together with Amen and Alexandre. The helm chart evolved a lot and received contributions from dozens of people around the world. In 2022, [Christian Anton](https://github.com/sa-ChristianAnton) made very significant technical contributions to the helm chart, becoming one of its regular maintainers along with me.

In October 2022, the cetic/zabbix repository was discontinued and the source code was migrated to the [zabbix-community/helm-zabbix](https://github.com/zabbix-community/helm-zabbix) repository.

Christian presented the helm chart at Zabbix Summit 2022, and you can [check it out in this talk](https://www.youtube.com/watch?v=IQQwTEtwl7M&t=18225s). I know you may be wondering about the advantages of and reasons for installing Zabbix on Kubernetes, or what paradigm shifts are needed for that to happen. These and other questions were answered by [Robert Silva](https://github.com/robertsilvatech) [in this talk](https://www.youtube.com/watch?v=IQQwTEtwl7M&t=17078s), also at [Zabbix Summit 2022](https://www.zabbix.com/events/zabbix_summit_2022#agenda).

**Installation tutorial**

The helm chart has several configuration options, and the installation tutorial can be found at the following link.

[https://artifacthub.io/packages/helm/zabbix-community/zabbix](https://artifacthub.io/packages/helm/zabbix-community/zabbix)

An example of installing Zabbix on [kind](https://kind.sigs.k8s.io/) can be found at: [https://github.com/zabbix-community/helm-zabbix/tree/master/charts/zabbix/docs/example](https://github.com/zabbix-community/helm-zabbix/tree/master/charts/zabbix/docs/example)

If you're interested in contributing to the helm chart or suggesting improvements, you can interact through the repository:

[https://github.com/zabbix-community/helm-zabbix](https://github.com/zabbix-community/helm-zabbix)

**Using the GitOps approach**

Once you understand the reasons for installing Zabbix on Kubernetes and need to manage the configuration as code, you can use the GitOps approach with tools such as [ArgoCD](https://argo-cd.readthedocs.io/) or [Flux](https://fluxcd.io/).  
I talked about these tools in the following posts:

- [Using Argo CD to implement the GitOps approach in Kubernetes clusters](/en/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/)
- [Using Flux CD to implement the GitOps approach in Kubernetes clusters](/en/usando-o-flux-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/)
- [Deploying applications on Kubernetes using Argo CD with support for Helm, Sops and Multiple Sources](/en/deploy-no-kubernetes-usando-argo-cd-com-suporte-a-helm-sops-e-multiple-sources/)
