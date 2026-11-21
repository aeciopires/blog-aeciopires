---
title: "Event-driven autoscaling on Kubernetes using Keda"
slug: "autoscaling-de-aplicacoes-orientado-a-eventos-no-kubernetes-usando-o-keda"
date: 2025-04-28T11:04:14-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes", "prometheus", "tutoriais"]
tags: ["docker", "git", "helm", "kubernetes", "linux"]
description: "Keda is a Kubernetes-based Event Driven Autoscaler. With KEDA, you can drive the scaling of any pod in Kubernetes based on the…"
sourceHash: "11885b416a0c8f4e"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** KEDA 2.21.1 (supports Kubernetes 1.34 to 1.36), tested on a kind 1.36 cluster with metrics-server 0.9.0: the ScaledObject scaled from 2 to 30 replicas during the cron window. The permission error during installation no longer occurs in this version. Uninstallation follows the order recommended by the official documentation.
{{< /alert >}}

[Keda](https://keda.sh/) is a [Kubernetes](https://kubernetes.io/)-based _Event Driven Autoscaler_. With KEDA, you can drive the scaling of any pod in Kubernetes based on the number of events that need to be processed.

The details about how Keda works are in the documentation: [https://keda.sh/docs/concepts/](https://keda.sh/docs/concepts/)

> This tutorial uses Keda version 2.21, which is compatible with Kubernetes 1.36. You can use different versions according to the compatibility table [https://keda.sh/docs/operate/cluster/#kubernetes-compatibility](https://keda.sh/docs/operate/cluster/#kubernetes-compatibility)

## Points of attention

1. Keda supports several types of add-ons, also called _scalers_. They are used to scale the pods of a deployment/statefulset. This tutorial covers the [Cron](https://keda.sh/docs/2.21/scalers/cron/), [CPU](https://keda.sh/docs/2.21/scalers/cpu/), and [Memory](https://keda.sh/docs/2.21/scalers/memory/) scalers because they are the simplest to test. There are other scalers available, and you can choose the one that best fits your application architecture and business rules: [https://keda.sh/docs/scalers/](https://keda.sh/docs/scalers/)
1. Keda can only manage deployments and statefulsets that don't have an associated `Horizontal Pod Autoscaler (HPA)`. Therefore, you need to remove the native HPA from each application to be managed by Keda scalers. Keda itself will create an HPA with different settings for each application.

Example of an error message when applying a (Keda) scaledObject configuration to an application that has the native Kubernetes HPA.

`Error from server (Forbidden): error when creating "cronScaledObject.yaml": admission webhook "vscaledobject.kb.io" denied the request: the workload 'kube-pires' of type 'apps/v1.Deployment' is already managed by the hpa 'kube-pires'`

## Requirements

1. In this tutorial, we will use [Kind](https://kind.sigs.k8s.io/) to simulate a Kubernetes cluster running locally. If you have access to an on-premises cluster or a managed cloud cluster on EKS, GKE, AKS, DKS, or another provider, you can skip kind.
1. You will also need [Docker](https://www.docker.com/), [`kubectl`](https://kubernetes.io/docs/reference/kubectl/introduction/), [git](https://git-scm.com/), and [`helm`](https://helm.sh/). You can install them by following the tutorial available at: [https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md](https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md)
1. Install Locust and the [kube-pires](https://gitlab.com/aeciopires/kube-pires) application as shown in the tutorial: [/en/instalando-o-locust-no-kubernetes-para-testes-de-carga/](/en/instalando-o-locust-no-kubernetes-para-testes-de-carga/)

### Installing metrics-server (if it doesn't exist)

ATTENTION!!! The Kubernetes cluster must have `metrics-server` installed. If it isn't installed yet, follow one of the links below to install it:

- [https://gist.github.com/sanketsudake/a089e691286bf2189bfedf295222bd43?permalink\_comment\_id=4458547#gistcomment-4458547](https://gist.github.com/sanketsudake/a089e691286bf2189bfedf295222bd43?permalink_comment_id=4458547#gistcomment-4458547)
- [https://github.com/kubernetes-sigs/metrics-server](https://github.com/kubernetes-sigs/metrics-server)
- [https://artifacthub.io/packages/helm/metrics-server/metrics-server](https://artifacthub.io/packages/helm/metrics-server/metrics-server)

To install `metrics-server`, use the following commands:

```bash
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/

helm repo update

helm upgrade --install --set args={--kubelet-insecure-tls} metrics-server metrics-server/metrics-server --namespace kube-system

```

## Installing KEDA on the kind k8s 1.36 cluster

Add the Helm repository:

```bash
helm repo add kedacore https://kedacore.github.io/charts

```

Update all repositories to make sure Helm knows about the latest versions:

```bash
helm repo update

```

Search all versions of the KEDA Helm chart:

```bash
helm search repo kedacore/keda --versions

```

To install `keda`, use the following command:

```bash
# ATTENTION!!! See table compatibility with Kubernetes: <https://keda.sh/docs/operate/cluster/#kubernetes-compatibility>
export KEDA_VERSION=2.21.1

# Install Keda and CRDs
helm upgrade --install keda \
  kedacore/keda --version "$KEDA_VERSION" \
  --namespace keda --create-namespace --debug --timeout=900s
```

### Fixing installation problems

{{< alert icon="circle-info" >}}
This problem occurred in KEDA 2.17.0. In 2.21.1, the ClusterRole already includes `clustercloudeventsources` and the error doesn't appear; the fix below is only needed in older versions.
{{< /alert >}}

If you look at the `keda-operator` pod and find this message in the log:

```text
"Failed to watch *v1alpha1.ClusterCloudEventSource: failed to list *v1alpha1.ClusterCloudEventSource: clustercloudeventsources.eventing.keda.sh is forbidden: User \\"system:serviceaccount:keda:keda-operator\\" cannot list resource \\"clustercloudeventsources\\" in API group \\"eventing.keda.sh\\" at the cluster scope" logger="UnhandledError"

```

Apply the fix below, as described in the links:

- [https://github.com/kedacore/keda/issues/6493](https://github.com/kedacore/keda/issues/6493)
- [https://github.com/kedacore/charts/pull/714/files](https://github.com/kedacore/charts/pull/714/files)

> Attention!!! This was necessary because the newest Helm chart (at that time) was released in December 2024, but this problem was only fixed in January 2025.

Edit the KEDA `ClusterRole`:

```bash
kubectl edit clusterrole keda-operator-minimal-cluster-role

```

At the end of the file, add the following snippet:

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

Recreate the `keda-operator` pod:

```bash
kubectl get pod -n keda -l app=keda-operator
kubectl delete pod POD_NAME -n keda

```

## Create the ScaledObject for each application targeted by the test

As mentioned before, this tutorial uses the Cron, CPU, and Memory scalers. You can find more details about configuring these scalers in the docs:

- [https://keda.sh/docs/2.21/scalers/cron/](https://keda.sh/docs/2.21/scalers/cron/)
- [https://keda.sh/docs/2.21/scalers/cpu/](https://keda.sh/docs/2.21/scalers/cpu/)
- [https://keda.sh/docs/2.21/scalers/memory/](https://keda.sh/docs/2.21/scalers/memory/)

I created the `kube-pires-scaledobject.yaml` file with the following content (change the schedule period, the number of pods, and the CPU and memory usage percentage as needed). To help with the cron schedule syntax, you can use the website: [https://crontab.guru/](https://crontab.guru/)

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
  cooldownPeriod: 2 # só tem efeito com minReplicaCount: 0 ou idleReplicaCount definido
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

KEDA will evaluate when each of these events occurs: the schedule period and the CPU and memory consumption. For each type of occurrence, the pods will be scaled according to the configuration set for each event:

- 30 pods constantly throughout the schedule period;
- From 2 to 30 pods when CPU and/or memory usage reaches 50% outside the schedule period;

This content was applied with the following commands:

```bash
# test is the same namespace where the kube-pires application was deployed in the tutorial: https://blog.aeciopires.com/instalando-o-locust-no-kubernetes-para-testes-de-carga/

export MY_NAMESPACE=test

kubectl apply -f kube-pires-scaledobject.yaml -n $MY_NAMESPACE
```

As mentioned earlier, an error may occur when creating the scaledobject if the target application is managed by a native Kubernetes HPA. The solution is to remove the HPA first.

### Getting information about KEDA

List the KEDA resources:

```bash
kubectl get all -n keda

```

To get started, deploy the `ScaledObjects` to the cluster:

- Information about Scaled Objects: [https://keda.sh/docs/latest/concepts/](https://keda.sh/docs/latest/concepts/)
- Examples: [https://github.com/kedacore/samples](https://github.com/kedacore/samples)

Get information about the deployed `ScaledObjects`:

```bash
kubectl get scaledobject [--namespace <namespace>]

```

Details of a specific `ScaledObject`:

```bash
kubectl describe scaledobject <scaled-object-name> [--namespace <namespace>]

```

Get information about the deployed `TriggerAuthentications`:

```bash
kubectl get triggerauthentication [--namespace <namespace>]

```

Details of a specific `TriggerAuthentication`:

```bash
kubectl describe triggerauthentication <trigger-authentication-name> [--namespace <namespace>]

```

To view the `Horizontal Pod Autoscalers (HPA)` that KEDA is managing behind the scenes:

```bash
kubectl get hpa [--all-namespaces] [--namespace <namespace>]

```

## Test evidence

Keda scaling the application `kube-pires para 30 pods` (to 30 pods) constantly **throughout the schedule period.**

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-10-47-40-1024x67.png" alt="Screenshot from 2025-04-28 10-47-40" >}}

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-10-45-45.png" alt="Screenshot from 2025-04-28 10-45-45" >}}

Keda scaling the application `kube-pires para 2 pods` (to 2 pods, the minimum) **outside the schedule period.**

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-12-19-37-1024x64.png" alt="Screenshot from 2025-04-28 12-19-37" >}}

{{< figure src="/wp-content/uploads/2025/04/Screenshot-from-2025-04-28-12-19-56-1024x73.png" alt="Screenshot from 2025-04-28 12-19-56" >}}

Keda scaling the application `kube-pires para 16 pods` (to 16 pods) **outside the schedule period, but with high CPU demand on the microservice.**

{{< figure src="/wp-content/uploads/2025/04/1-1024x441.png" alt="1" >}}

Final result of the load test on the `kube-pires` application, generating **high CPU demand on the microservice.**

{{< figure src="/wp-content/uploads/2025/04/2-1024x337.png" alt="2" >}}

Keda scaled the pods properly, with no variation in the number of pods during the schedule period.

Outside the schedule period, Keda scaled the pods properly according to the CPU or memory metric for each application.

## Uninstallation

To uninstall/remove the KEDA Helm chart, first remove the ScaledObjects (and ScaledJobs), as recommended by the [official documentation](https://keda.sh/docs/2.21/deploy/#uninstalling):

```bash
kubectl delete -f kube-pires-scaledobject.yaml -n $MY_NAMESPACE

helm uninstall keda -n keda

kubectl delete namespace keda

```

## References

- [https://keda.sh/docs/operate/cluster/#kubernetes-compatibility](https://keda.sh/docs/operate/cluster/#kubernetes-compatibility)
- [https://keda.sh/docs/concepts/](https://keda.sh/docs/concepts/)
- [https://github.com/kedacore/keda/releases](https://github.com/kedacore/keda/releases)
- [https://github.com/kedacore/keda/](https://github.com/kedacore/keda/)
- [https://keda.sh/docs/concepts/scaling-deployments/](https://keda.sh/docs/concepts/scaling-deployments/)
- [https://keda.sh/docs/concepts/scaling-jobs/](https://keda.sh/docs/concepts/scaling-jobs/)
- [https://keda.sh/docs/concepts/authentication/](https://keda.sh/docs/concepts/authentication/)
- [https://keda.sh/docs/2.21/setupscaler/](https://keda.sh/docs/2.21/setupscaler/)
- [https://artifacthub.io/packages/helm/kedacore/keda](https://artifacthub.io/packages/helm/kedacore/keda)
- [https://keda.sh/docs/2.21/deploy/](https://keda.sh/docs/2.21/deploy/)
- [https://keda.sh/docs/2.21/scalers/cron/](https://keda.sh/docs/2.21/scalers/cron/)
- [https://keda.sh/docs/2.21/scalers/cpu/](https://keda.sh/docs/2.21/scalers/cpu/)
- [https://keda.sh/docs/2.21/scalers/memory/](https://keda.sh/docs/2.21/scalers/memory/)
- [https://keda.sh/docs/2.21/troubleshooting/](https://keda.sh/docs/2.21/troubleshooting/)
- [https://crontab.guru/](https://crontab.guru/)
