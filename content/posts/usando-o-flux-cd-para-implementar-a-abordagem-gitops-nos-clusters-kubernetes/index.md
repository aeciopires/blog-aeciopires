---
title: "Usando o Flux CD para implementar a abordagem GitOps nos clusters Kubernetes"
slug: "usando-o-flux-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes"
date: 2022-03-12T11:24:33-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "tutoriais"]
tags: ["docker", "fluxcd", "git", "kubernetes", "linux"]
description: "Em outro tutorial, eu falei sobre a abordagem GitOps e uso do ArgoCD... Recomendo a leitura para entender alguns conceitos antes de partir para o uso…"
wp_id: 2740
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** testado com Flux 2.10.1 num cluster kind (Kubernetes 1.37), com o repositório de exemplo oficial: cert-manager 1.21.3, Envoy Gateway e podinfo 6.17.0 instalados, e o `curl` pelo Gateway respondendo. O bootstrap no GitHub não foi testado porque exige token e repositório reais. Atualizado o requisito de versão do Kubernetes (o Flux 2.10 suporta 1.35 a 1.37), os links passaram a apontar para o repositório oficial de exemplo (o fork do autor não existe mais) e a remoção agora apaga o Gateway antes dos namespaces.
{{< /alert >}}

Em outro [tutorial](/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/), eu falei sobre a abordagem [GitOps](https://www.gitops.tech/) e uso do [ArgoCD](https://argoproj.github.io/argo-cd/)... Recomendo a leitura para entender alguns conceitos antes de partir para o uso da ferramenta que será explicada aqui.

Neste tutorial você aprenderá a instalar o [Flux](https://fluxcd.io/), que é um conjunto de soluções de entrega contínua e progressiva para Kubernetes. Fonte: [https://fluxcd.io](https://fluxcd.io/).

O Flux pode se conectar a repositórios git públicos e privados, é gratuito, tem o código-fonte aberto e é um projeto [incubado pela CNCF](https://landscape.cncf.io/?project=incubating&selected=flux) (foi aceito em julho de 2019, passou para o nível _Incubating_ em março de 2021 e para o nível _Graduated_ em novembro de 2022). Quando este tutorial foi escrito (março/2022), o Flux não possuía uma interface web e era configurado via linha de comando.

## **Requisitos**

Para a execução deste tutorial, partirei da premissa que você está usando alguma distribuição GNU/Linux e já tem instaladas as seguintes ferramentas:

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [helm](https://helm.sh/docs/intro/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

Além disso, você precisa ter acesso a 1 ou 2 clusters Kubernetes (sejam eles no ambiente on-premises, cloud ([EKS](https://aws.amazon.com/eks/), [GKE](https://cloud.google.com/kubernetes-engine) ou [AKS](https://azure.microsoft.com/en-us/services/kubernetes-service/) ou ainda, usando [minikube](https://minikube.sigs.k8s.io/docs/start/), [kind](https://kind.sigs.k8s.io/docs/user/quick-start/), [k0s](https://k0sproject.io/), [microk8s](https://microk8s.io/) ou [k3s](https://k3s.io/)).

> Atenção!!! O repositório de exemplo usado neste tutorial ([https://github.com/fluxcd/flux2-kustomize-helm-example](https://github.com/fluxcd/flux2-kustomize-helm-example)) pede um cluster Kubernetes na versão 1.33 ou mais recente, mas o Flux 2.10 só suporta Kubernetes 1.35, 1.36 e 1.37 ([notas da versão](https://github.com/fluxcd/flux2/releases/tag/v2.10.0)). O comando `flux check --pre` mostra se o seu cluster atende.

## Instalando o Flux

Execute os seguintes comandos para instalar o binário do Flux no GNU/Linux e habilitar o autocomplete no bash:

```bash
curl -s https://fluxcd.io/install.sh | sudo bash
flux --version
. <(flux completion bash)
```

Visualize as opções da linha de comando do **flux**:

```bash
flux --help

flux subcommand --help
```

Neste tutorial, eu estou integrando o uso do Flux ao [GitHub](https://github.com/) e para isso foi necessário criar um _Personal Access Token_ (PAT), seguindo as instruções deste tutorial: [https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

Se você utiliza o repositório Git em outros serviços, tais como: [GitLab](https://gitlab.com/), [Bitbucket](https://bitbucket.org/), [AWS Code Commit](https://aws.amazon.com/codecommit/), sugiro ler as instruções de configuração disponíveis em: [https://fluxcd.io/docs/installation/#bootstrap](https://fluxcd.io/docs/installation/#bootstrap)

O repositório [https://github.com/fluxcd/flux2-kustomize-helm-example](https://github.com/fluxcd/flux2-kustomize-helm-example) possui exemplos de aplicações e componentes de infraestrutura que podem ser implantados usando o Flux. Faça um **fork** desse repositório na sua conta pessoal do GitHub.

Exporte o seu PAT, o seu usuário e o nome do repositório (o nome do **fork**, não a URL) com os seguintes comandos:

**PS.: Lembre-se de alterar os valores nas seguintes variáveis de acordo com o seu ambiente.**

```bash
export GITHUB_TOKEN=<your-token>
export GITHUB_USER=<your-username>
export GITHUB_REPO=<repository-url>
```

Estando conectado em um cluster Kubernetes, verifique se ele atende aos pré-requisitos do Flux:

```bash
flux check --pre
```

Execute o seguinte comando para instalar o Flux no cluster Kubernetes e configurar a integração com um repositório no GitHub:

```bash
flux bootstrap github \
  --components-extra=source-watcher \
  --owner=${GITHUB_USER} \
  --repository=${GITHUB_REPO} \
  --branch=main \
  --personal \
  --path=clusters/production
```

Se você tiver mais de um cluster configurado no kubeconfig, adicione a opção `--context=NOME_DO_CONTEXTO` para escolher o cluster. O README do repositório de exemplo mostra como fazer o bootstrap de um cluster de staging (`--path=clusters/staging`) e outro de production (`--path=clusters/production`).

Esse comando, além de instalar os componentes de software do Flux no namespace **flux-system**, instalará também algumas aplicações que estão sendo definidas nos seguintes arquivos e diretórios:

- [https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/infrastructure.yaml](https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/infrastructure.yaml)
- [https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/apps.yaml](https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/clusters/production/apps.yaml)
- [https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/apps/production](https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/apps/production)
- [https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/infrastructure](https://github.com/fluxcd/flux2-kustomize-helm-example/tree/main/infrastructure)

O arquivo [README.md](https://github.com/fluxcd/flux2-kustomize-helm-example/blob/main/README.md) explica em detalhes o conteúdo de cada arquivo e diretório. Na revisão de outubro de 2026, o exemplo instala o [https://cert-manager.io](https://cert-manager.io), o [https://gateway.envoyproxy.io](https://gateway.envoyproxy.io) e a aplicação de demonstração [https://github.com/stefanprodan/podinfo](https://github.com/stefanprodan/podinfo).

O resultado dessa instalação pode ser visto com os seguintes comandos (destaque para os namespaces: **flux-system**, **cert-manager**, **podinfo** e **envoy-gateway-system**):

```bash
flux get kustomizations --watch

flux get helmreleases --all-namespaces

helm list -A

kubectl get all -A
```

Verifique se o aplicativo de demonstração pode ser acessado por meio do Envoy Gateway (comandos extraídos do README do repositório de exemplo):

```bash
kubectl -n envoy-gateway-system port-forward \
  $(kubectl -n envoy-gateway-system get svc -l gateway.envoyproxy.io/owning-gateway-name=envoy -o name) 8080:80 &

curl -H "Host: podinfo.production" http://localhost:8080
```

A página [https://fluxcd.io/docs/guides/repository-structure/](https://fluxcd.io/docs/guides/repository-structure/) apresenta sugestões e instruções de como pode ser organizado o conteúdo do repositório git para armazenar as configurações do cluster, ambiente e apps.

## Removendo o Flux do cluster Kubernetes

Você pode desinstalar o Flux com o seguinte comando:

```bash
flux uninstall --namespace=flux-system
```

Para remover as aplicações instaladas pelo Flux, apague primeiro o `Gateway` e o `GatewayClass` enquanto o Envoy Gateway ainda está rodando (como recomenda a [documentação do Envoy Gateway](https://gateway.envoyproxy.io/docs/tasks/quickstart/#clean-up)). Se os namespaces forem apagados de uma vez, o `envoy-gateway-system` fica preso em _Terminating_.

```bash
kubectl delete namespace podinfo
kubectl delete gateway --all -n envoy-gateway-system
kubectl delete gatewayclass envoy
kubectl delete namespace envoy-gateway-system cert-manager
```

Para saber mais informações sobre o uso do Flux, acesse os links que estão na seção **Referências** deste tutorial.

## Referências

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
