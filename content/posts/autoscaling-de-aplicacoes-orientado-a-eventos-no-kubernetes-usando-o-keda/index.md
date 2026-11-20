---
title: "Autoscaling orientado a eventos no Kubernetes usando o Keda"
slug: "autoscaling-de-aplicacoes-orientado-a-eventos-no-kubernetes-usando-o-keda"
date: 2025-04-28T11:04:14-03:00
lastmod: 2026-10-11T01:58:54-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes", "prometheus", "tutoriais"]
tags: ["docker", "git", "helm", "kubernetes", "linux"]
description: "Keda é um Event Driven Autoscaler baseado em Kubernetes. Com o KEDA, você pode controlar o dimensionamento de qualquer pod no Kubernetes com base no…"
wp_id: 3395
---

[Keda](https://keda.sh/) é um _Event Driven Autoscaler_ baseado em [Kubernetes](https://kubernetes.io/). Com o KEDA, você pode controlar o dimensionamento de qualquer pod no Kubernetes com base no número de eventos que precisam ser processados.

Os detalhes sobre o funcionamento do Keda estão na doc: [https://keda.sh/docs/concepts/](https://keda.sh/docs/concepts/)

> Neste tutorial será utilizada a versão 2.17 do Keda compatível com o Kubernetes 1.32. Você pode usar versões diferentes de acordo com a tabela de compatibilidade [https://keda.sh/docs/operate/cluster/#kubernetes-compatibility](https://keda.sh/docs/operate/cluster/#kubernetes-compatibility)

## Pontos de atenção

1. O Keda tem suporte a vários tipos de addons, também chamados de _scalers_. Ele servem para escalar os pods do deployment/statefulset. Neste tutorial serão considerados: o [Cron](https://keda.sh/docs/2.17/scalers/cron/), [CPU](https://keda.sh/docs/2.17/scalers/cpu/) e [Memory](https://keda.sh/docs/2.17/scalers/memory/) por serem os mais simples de testar. Existem outros scalers disponíveis e você pode escolher o que mais se adequa à arquitetura da aplicação e regra de negócio: [https://keda.sh/docs/scalers/](https://keda.sh/docs/scalers/)
1. O Keda só consegue gerenciar deployments e statefulset que não contenham `Horizontal Pod Autoscalers (HPA)` associado. Logo, é necessário remover o HPA nativo de cada uma das aplicações a serem gerenciadas pelos scalers do Keda. O próprio Keda irá criar um HPA com configurações diferentes para cada aplicação.

Exemplo de mensagem de erro ao aplicar uma configuração de scaledObject (do Keda) para uma aplicação que tem o HPA nativo do Kubernetes.

`Error from server (Forbidden): error when creating "cronScaledObject.yaml": admission webhook "vscaledobject.kb.io" denied the request: the workload 'kube-pires' of type 'apps/v1.Deployment' is already managed by the hpa 'kube-pires`

## Requisitos

1. Neste tutorial, usaremos o [Kind](https://kind.sigs.k8s.io/) para simular um cluster Kubernetes rodando localmente. Se você tiver acesso a cluster on-premisse ou gerenciado na cloud pelo EKS, GKE, AKS, DKS ou outro, pode ignorar o uso do kind.
1. Também será necessário o uso do [Docker](https://www.docker.com/), [`kubectl`](https://kubernetes.io/docs/reference/kubectl/introduction/), [git](https://git-scm.com/) e [`helm`](https://helm.sh/). Esses softwares podem ser instalados seguindo o tutorial disponível em: [https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md](https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md)
1. Instale o Locust e a aplicação [kube-pires](https://gitlab.com/aeciopires/kube-pires) conforme mostrado no tutorial: [/instalando-o-locust-no-kubernetes-para-testes-de-carga/](/instalando-o-locust-no-kubernetes-para-testes-de-carga/)

### Instalando o metrics-server (caso não exista)

ATENÇÃO!!! O cluster Kubernetes deve ter o `metrics-server` instalado. Se ainda não estiver instalado, siga um dos links abaixo para instalar:

- [https://gist.github.com/sanketsudake/a089e691286bf2189bfedf295222bd43?permalink\_comment\_id=4458547#gistcomment-4458547](https://gist.github.com/sanketsudake/a089e691286bf2189bfedf295222bd43?permalink_comment_id=4458547#gistcomment-4458547)
- [https://github.com/kubernetes-sigs/metrics-server](https://github.com/kubernetes-sigs/metrics-server)
- [https://artifacthub.io/packages/helm/metrics-server/metrics-server](https://artifacthub.io/packages/helm/metrics-server/metrics-server)

Para instalar o `metrics-server`, use os seguintes comandos:

```bash
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/

helm repo update

helm upgrade --install --set args={--kubelet-insecure-tls} metrics-server metrics-server/metrics-server --namespace kube-system

```

## Instalando o KEDA no cluster kind k8s 1.32

Adicione o repositório Helm:

```bash
helm repo add kedacore https://kedacore.github.io/charts

```

Atualize todos os repositórios para garantir que o Helm conheça as versões mais recentes:

```bash
helm repo update

```

Pesquise todas as versões do Helm Chart do KEDA:

```bash
helm search repo kedacore/keda --versions

```

Para instalar o `keda`, use o seguinte comando:

```bash
# ATTENTION!!! See table compatibility with Kubernetes: <https://keda.sh/docs/operate/cluster/#kubernetes-compatibility>
export KEDA_VERSION=2.17.0

# Install Keda and CRDs
helm upgrade --install keda \
  kedacore/keda --version "$KEDA_VERSION" \
  --namespace keda --create-namespace --debug --timeout=900s
```

### Corrigindo problemas na instalação

Se olhar o pod do `keda-operator` e encontrar no log a mensagem:

```text
"Failed to watch *v1alpha1.ClusterCloudEventSource: failed to list *v1alpha1.ClusterCloudEventSource: clustercloudeventsources.eventing.keda.sh is forbidden: User \\"system:serviceaccount:keda:keda-operator\\" cannot list resource \\"clustercloudeventsources\\" in API group \\"eventing.keda.sh\\" at the cluster scope" logger="UnhandledError"

```

Aplique a correção abaixo conforme citados nos links:

- [https://github.com/kedacore/keda/issues/6493](https://github.com/kedacore/keda/issues/6493)
- [https://github.com/kedacore/charts/pull/714/files](https://github.com/kedacore/charts/pull/714/files)

> Atenção!!! Isso é necessário pois o helm chart mais novo (até esse momento) foi lançado em Dez/2024, mas esse problema só foi corrigido em Jan/2025.

Edite a `ClusterRole` do KEDA:

```bash
kubectl edit clusterrole keda-operator-minimal-cluster-role

```

No final do arquivo, adicione o seguinte trecho:

```yaml
  - apiGroups:
    - eventing.keda.sh
    resources:
    - cloudeventsources
    - cloudeventsources/status
    - clustercloudeventsources
    - clustercloudeventsources/status
    verbs:
    - get
    - list
    - patch
    - update
    - watch

```

Recrie o pod do `keda-operator`:

```bash
kubectl get pod -n keda -l app=keda-operator
kubectl delete pod POD_NAME -n keda

```

## Crie o cronScaleObject para cada aplicações alvo do teste

Como dito antes, neste tutorial será usado os scalers do tipo Cron, CPU e Memory. Mais detalhes sobre a configuração destes scalers podem ser encontrados nas docs:

- [https://keda.sh/docs/2.17/scalers/cron/](https://keda.sh/docs/2.17/scalers/cron/)
- [https://keda.sh/docs/2.17/scalers/cpu/](https://keda.sh/docs/2.17/scalers/cpu/)
- [https://keda.sh/docs/2.17/scalers/memory/](https://keda.sh/docs/2.17/scalers/memory/)

Foi criado o arquivo `kube-pires-scaledobject.yaml` com o seguinte conteúdo (altere o período de agendamento, número de pods e percentual de uso de CPU e memória de acordo com a necessidade). Para auxiliar na sintaxe de agendamento do cron, você pode usar o site: [https://crontab.guru/](https://crontab.guru/)

```yaml
---
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kube-pires
  namespace: test
spec:
  scaleTargetRef:
    name: kube-pires
  cooldownPeriod: 2
  minReplicaCount: 2
  maxReplicaCount: 30
  triggers:
  - type: cron
    metadata:
      timezone: America/Sao_Paulo
      start: 42 10 * * *
      end: 50 10 * * *
      desiredReplicas: "30"
  - type: cpu
    metricType: Utilization # Allowed types are 'Utilization' or 'AverageValue'
    metadata:
      value: "50"
  - type: memory
    metricType: Utilization # Allowed types are 'Utilization' or 'AverageValue'
    metadata:
      value: "50"
```

O keda irá avaliar quando cada um desses eventos ocorrer: o periodo de agendamento, o consumo de CPU e memória. Em cada tipo de ocorrência, os pods serão escalados de acordo com a configuração realizada para cada evento:

- 8 pods de forma constante durante todo o período de agendamento;
- De 2 até 30 pods quando o uso de CPU e/ou memória atingir 50% fora do período de agendamento;

Esse conteúdo foi aplicado com os seguintes comandos:

```bash
# test é o mesmo namespace em que foi feito o deploy da aplicação kube-pires no tutorial: https://blog.aeciopires.com/instalando-o-locust-no-kubernetes-para-testes-de-carga/

export MY_NAMESPACE=test

kubectl apply -f kube-pires-scaledobject.yaml -n $MY_NAMESPACE
```

Como dito anteriormente, pode haver um erro na hora de criar o scaledobject se a aplicação alvo for gerenciada por um HPA nativo do Kubernetes. A solução é remover o HPA antes.

### Obtendo informações sobre o KEDA

Liste os recursos do KEDA:

```bash
kubectl get all -n keda

```

Para começar a usar, implante os `ScaledObjects` no cluster:

- Informações sobre Scaled Objects: [https://keda.sh/docs/latest/concepts/](https://keda.sh/docs/latest/concepts/)
- Exemplos: [https://github.com/kedacore/samples](https://github.com/kedacore/samples)

Obtenha informações sobre os `ScaledObjects` implantados:

```bash
kubectl get scaledobject [--namespace <namespace>]

```

Detalhes de um `ScaledObject` específico:

```bash
kubectl describe scaledobject <scaled-object-name> [--namespace <namespace>]

```

Obtenha informações sobre `TriggerAuthentications` implantados:

```bash
kubectl get triggerauthentication [--namespace <namespace>]

```

Detalhes de um `TriggerAuthentication` específico:

```bash
kubectl describe triggerauthentication <trigger-authentication-name> [--namespace <namespace>]

```

Para visualizar os `Horizontal Pod Autoscalers (HPA)` que o KEDA está gerenciando nos bastidores:

```bash
kubectl get hpa [--all-namespaces] [--namespace <namespace>]

```

## Evidências dos testes

Keda escalando a aplicação `kube-pires para 30 pods` de forma constante **durante todo o período de agendamento.**

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-10-47-40-1024x67.png" alt="Screenshot from 2025-04-28 10-47-40" >}}

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-10-45-45.png" alt="Screenshot from 2025-04-28 10-45-45" >}}

Keda escalando a aplicação `kube-pires para 2 pods` (mínimo) **fora do período de agendamento.**

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-12-19-37-1024x64.png" alt="Screenshot from 2025-04-28 12-19-37" >}}

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-12-19-56-1024x73.png" alt="Screenshot from 2025-04-28 12-19-56" >}}

Keda escalando a aplicação `kube-pires para 16 pods` **fora do período de agendamento, mas com alta demanda de CPU no microsserviço.**

{{< figure src="/wp-content/uploads/2025/04/1-1024x441.png" alt="1" >}}

Resultado final do teste de carga na aplicação `kube-pires` gerando **alta demanda de CPU no microsserviço.**

{{< figure src="/wp-content/uploads/2025/04/2-1024x337.png" alt="2" >}}

O Keda escalou os pods adequadamente sem variação no número de pods durante o período de agendamento.

Fora do período de agendamento, o Keda escalou os pods adequadamente de acordo com a métrica de CPU ou memória para cada aplicação.

## Desinstalação

Para desinstalar/remover o Helm Chart do KEDA:

```bash
helm uninstall keda -n keda

```

## Referências

- [https://keda.sh/docs/operate/cluster/#kubernetes-compatibility](https://keda.sh/docs/operate/cluster/#kubernetes-compatibility)
- [https://keda.sh/docs/concepts/](https://keda.sh/docs/concepts/)
- [https://github.com/kedacore/keda/releases](https://github.com/kedacore/keda/releases)
- [https://github.com/kedacore/keda/](https://github.com/kedacore/keda/)
- [https://keda.sh/docs/concepts/scaling-deployments/](https://keda.sh/docs/concepts/scaling-deployments/)
- [https://keda.sh/docs/concepts/scaling-jobs/](https://keda.sh/docs/concepts/scaling-jobs/)
- [https://keda.sh/docs/concepts/authentication/](https://keda.sh/docs/concepts/authentication/)
- [https://keda.sh/docs/2.17/setupscaler/](https://keda.sh/docs/2.17/setupscaler/)
- [https://artifacthub.io/packages/helm/kedacore/keda](https://artifacthub.io/packages/helm/kedacore/keda)
- [https://keda.sh/docs/2.17/deploy/](https://keda.sh/docs/2.17/deploy/)
- [https://keda.sh/docs/2.17/scalers/cron/](https://keda.sh/docs/2.17/scalers/cron/)
- [https://keda.sh/docs/2.17/scalers/cpu/](https://keda.sh/docs/2.17/scalers/cpu/)
- [https://keda.sh/docs/2.17/scalers/memory/](https://keda.sh/docs/2.17/scalers/memory/)
- [https://keda.sh/docs/2.17/troubleshooting/](https://keda.sh/docs/2.17/troubleshooting/)
- [https://crontab.guru/](https://crontab.guru/)
