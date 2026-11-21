---
title: "Using Flux CD to implement the GitOps approach in Kubernetes clusters"
slug: "usando-o-flux-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes"
date: 2022-03-12T11:24:33-03:00
lastmod: 2026-11-21T13:11:13-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "tutoriais"]
tags: ["docker", "fluxcd", "git", "kubernetes", "linux"]
description: "In another tutorial, I talked about the GitOps approach and using ArgoCD... I recommend reading it to understand some concepts before moving on to using…"
sourceHash: "1d0966671aadafb7"
---

{{< alert icon="circle-info" >}}
**Updated on November 21, 2026:** fixed the `GITHUB_REPO` variable example (`flux bootstrap github --repository` takes the repository name, not the URL), and Flux is now described as a CNCF graduated project (since November 2022).
{{< /alert >}}

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** tested with Flux 2.10.1 on a kind cluster (Kubernetes 1.37), using the official example repository: cert-manager 1.21.3, Envoy Gateway and podinfo 6.17.0 installed, and `curl` through the Gateway responding. The GitHub bootstrap was not tested because it requires a real token and repository. Updated the Kubernetes version requirement (Flux 2.10 supports 1.35 to 1.37), the links now point to the official example repository (the author's fork no longer exists), and the removal now deletes the Gateway before the namespaces.
{{< /alert >}}

In another [tutorial](/en/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/), I talked about the [GitOps](https://www.gitops.tech/) approach and using [ArgoCD](https://argoproj.github.io/argo-cd/)... I recommend reading it to understand some concepts before moving on to the tool that will be explained here.

In this tutorial you will learn how to install [Flux](https://fluxcd.io/), which is a set of continuous and progressive delivery solutions for Kubernetes. Source: [https://fluxcd.io](https://fluxcd.io/).

Flux can connect to public and private git repositories, is free and open source, and is a [CNCF graduated](https://landscape.cncf.io/?project=incubating&selected=flux) project (it was accepted in July 2019, moved to the _Incubating_ level in March 2021 and to the _Graduated_ level in November 2022). When this tutorial was written (March 2022), Flux didn't have a web interface and was configured through the command line.

## **Requirements**

To follow this tutorial, I'll assume you're using some GNU/Linux distribution and already have the following tools installed:

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [helm](https://helm.sh/docs/intro/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

In addition, you need access to 1 or 2 Kubernetes clusters (whether on-premises, in the cloud ([EKS](https://aws.amazon.com/eks/), [GKE](https://cloud.google.com/kubernetes-engine) or [AKS](https://azure.microsoft.com/en-us/services/kubernetes-service/)), or using [minikube](https://minikube.sigs.k8s.io/docs/start/), [kind](https://kind.sigs.k8s.io/docs/user/quick-start/), [k0s](https://k0sproject.io/), [microk8s](https://microk8s.io/) or [k3s](https://k3s.io/)).

> Attention!!! The example repository used in this tutorial ([https://github.com/fluxcd/flux2-kustomize-helm-example](https://github.com/fluxcd/flux2-kustomize-helm-example)) asks for a Kubernetes cluster at version 1.33 or later, but Flux 2.10 only supports Kubernetes 1.35, 1.36 and 1.37 ([release notes](https://github.com/fluxcd/flux2/releases/tag/v2.10.0)). The `flux check --pre` command shows whether your cluster meets the requirements.

## Installing Flux

Run the following commands to install the Flux binary on GNU/Linux and enable autocompletion in bash:

```bash
curl -s https://fluxcd.io/install.sh | sudo bash
flux --version
. <(flux completion bash)
```

View the **flux** command-line options:

```bash
flux --help

flux subcommand --help
```

In this tutorial, I'm integrating Flux with [GitHub](https://github.com/), and for that I had to create a _Personal Access Token_ (PAT), following the instructions in this tutorial: [https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

If you host your Git repository on other services, such as [GitLab](https://gitlab.com/), [Bitbucket](https://bitbucket.org/) or [AWS Code Commit](https://aws.amazon.com/codecommit/), I suggest reading the configuration instructions available at: [https://fluxcd.io/docs/installation/#bootstrap](https://fluxcd.io/docs/installation/#bootstrap)

The repository [https://github.com/fluxcd/flux2-kustomize-helm-example](https://github.com/fluxcd/flux2-kustomize-helm-example) has examples of applications and infrastructure components that can be deployed using Flux. **Fork** this repository into your personal GitHub account.

Export your PAT, your username and the repository name (the name of the **fork**, not the URL) with the following commands:

**PS: Remember to change the values of the following variables according to your environment.**

```bash
export GITHUB_TOKEN=<your-token>
export GITHUB_USER=<your-username>
export GITHUB_REPO=<repository-name>
```

While connected to a Kubernetes cluster, check whether it meets the Flux prerequisites:

```bash
flux check --pre
```

Run the following command to install Flux on the Kubernetes cluster and configure the integration with a GitHub repository:

```bash
flux bootstrap github \
  --components-extra=source-watcher \
  --owner=${GITHUB_USER} \
  --repository=${GITHUB_REPO} \
  --branch=main \
  --personal \
  --path=clusters/production
```

If you have more than one cluster configured in your kubeconfig, add the `--context=NOME_DO_CONTEXTO` option to choose the cluster. The example repository's README shows how to bootstrap a staging cluster (`--path=clusters/staging`) and a production one (`--path=clusters/production`).

Besides installing the Flux software components in the **flux-system** namespace, this command will also install some applications defined in the following files and directories:

- [https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/infrastructure.yaml](https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/infrastructure.yaml)
- [https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/apps.yaml](https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/apps.yaml)
- [https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/apps/production](https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/apps/production)
- [https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/infrastructure](https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/infrastructure)

The [README.md](https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/README.md) file explains the contents of each file and directory in detail. As of the October 2026 review, the example installs [https://cert-manager.io](https://cert-manager.io), [https://gateway.envoyproxy.io](https://gateway.envoyproxy.io) and the demo application [https://github.com/stefanprodan/podinfo](https://github.com/stefanprodan/podinfo).

You can see the result of this installation with the following commands (note the namespaces: **flux-system**, **cert-manager**, **podinfo** and **envoy-gateway-system**):

```bash
flux get kustomizations --watch

flux get helmreleases --all-namespaces

helm list -A

kubectl get all -A
```

Check whether the demo application can be accessed through Envoy Gateway (commands taken from the example repository's README):

```bash
kubectl -n envoy-gateway-system port-forward \
  $(kubectl -n envoy-gateway-system get svc -l gateway.envoyproxy.io/owning-gateway-name=envoy -o name) 8080:80 &

curl -H "Host: podinfo.production" http://localhost:8080
```

The page [https://fluxcd.io/docs/guides/repository-structure/](https://fluxcd.io/docs/guides/repository-structure/) offers suggestions and instructions on how to organize the contents of the git repository that stores the cluster, environment and app configurations.

## Removing Flux from the Kubernetes cluster

You can uninstall Flux with the following command:

```bash
flux uninstall --namespace=flux-system
```

To remove the applications installed by Flux, first delete the `Gateway` and the `GatewayClass` while Envoy Gateway is still running (as recommended by the [Envoy Gateway documentation](https://gateway.envoyproxy.io/docs/tasks/quickstart/#clean-up)). If the namespaces are deleted all at once, `envoy-gateway-system` gets stuck in _Terminating_.

```bash
kubectl delete namespace podinfo
kubectl delete gateway --all -n envoy-gateway-system
kubectl delete gatewayclass envoy
kubectl delete namespace envoy-gateway-system cert-manager
```

For more information about using Flux, see the links in the **References** section of this tutorial.

## References

- [https://fluxcd.io/docs/](https://fluxcd.io/docs/)
- [https://fluxcd.io/docs/concepts/](https://fluxcd.io/docs/concepts/)
- [https://fluxcd.io/docs/get-started/](https://fluxcd.io/docs/get-started/)
- [https://fluxcd.io/docs/installation/](https://fluxcd.io/docs/installation/#install-the-flux-cli)
- [https://fluxcd.io/flux/installation/bootstrap/](https://fluxcd.io/flux/installation/bootstrap/)
- [https://fluxcd.io/flux/guides/](https://fluxcd.io/flux/guides/)
- [https://fluxcd.io/flux/cmd/](https://fluxcd.io/flux/cmd/)
- [https://fluxcd.io/flux/faq/](https://fluxcd.io/flux/faq/)
- [https://fluxcd.io/flux/guides/mozilla-sops/](https://fluxcd.io/flux/guides/mozilla-sops/)
- [https://github.com/fluxcd/flux2-kustomize-helm-example](https://github.com/fluxcd/flux2-kustomize-helm-example)
