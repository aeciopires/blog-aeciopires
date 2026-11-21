---
title: "Using Argo CD to implement the GitOps approach in Kubernetes clusters"
slug: "usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes"
date: 2021-09-04T21:42:42-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes", "tutoriais"]
tags: ["argocd", "docker", "git", "kubernetes", "linux"]
description: "GitOps is an operational framework that takes DevOps best practices used throughout the application lifecycle, such as version control…"
sourceHash: "603efb92b82772c6"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** Argo CD 3.6.2 (`stable` manifest and CLI), tested on two kind clusters (Kubernetes 1.37 and 1.36): guestbook, sync, rollback, sync policies, deploying the Helm chart to the other cluster, and self-heal. The author's sample repository no longer exists; the guestbook app now comes from the official `argoproj/argocd-example-apps` repository and the kube-pires chart from GitLab (`gitlab.com/aeciopires/kube-pires`, `helm-chart` directory). Added a tip on registering a kind cluster in Argo CD.
{{< /alert >}}

## **About GitOps**

**GitOps** is an operational framework that takes DevOps best practices used throughout the application lifecycle, such as version control, collaboration, compliance, and continuous integration, delivery, and deployment (CI/CD) tools, and applies them to infrastructure automation. Source: [GitLab](https://about.gitlab.com/topics/gitops/).

Picture the following scenario: you have several changes to apply to different applications running on different [Kubernetes](https://kubernetes.io/) clusters, spread across more than one _cloud provider_ and/or an _on-premises_ environment. To do this, you can work manually or build one or more pipelines. Either way, this scenario involves a lot of complexity and technical effort from an operations team, plus the risk involved whenever a rollback is needed. Another concern is avoiding drift between what is applied to the Kubernetes cluster and what is versioned in [git](https://git-scm.com/).

To help with tasks like this, the GitOps approach treats infrastructure as code, keeping the information versioned in one or more git repositories, treating them as the source of truth, and using tools to continuously apply changes from a central point.

To learn about the benefits, advantages, and disadvantages of this approach, I recommend reading the following posts:

- [https://www.cloudbees.com/gitops/what-is-gitops](https://www.cloudbees.com/gitops/what-is-gitops)
- [https://about.gitlab.com/topics/gitops](https://about.gitlab.com/topics/gitops/)
- [https://www.weave.works/blog/what-is-gitops-really](https://www.weave.works/blog/what-is-gitops-really)
- [https://www.gitops.tech](https://www.gitops.tech/)
- [https://www.redhat.com/en/topics/devops/what-is-gitops](https://www.redhat.com/en/topics/devops/what-is-gitops)
- [https://searchitoperations.techtarget.com/definition/GitOps](https://searchitoperations.techtarget.com/definition/GitOps)
- [https://www.atlassian.com/git/tutorials/gitops](https://www.atlassian.com/git/tutorials/gitops)
- [https://www.infoworld.com/article/3566555/what-is-gitops-extending-devops-to-kubernetes-and-beyond.html](https://www.infoworld.com/article/3566555/what-is-gitops-extending-devops-to-kubernetes-and-beyond.html)
- [https://thenewstack.io/what-is-gitops-and-why-it-might-be-the-next-big-thing-for-devops](https://thenewstack.io/what-is-gitops-and-why-it-might-be-the-next-big-thing-for-devops/)

Several tools implement the GitOps approach, including [Flux CD](https://fluxcd.io/), [Argo CD](https://argoproj.github.io/argo-cd/), [Jenkins-X](https://jenkins-x.io/), [Tekton](https://tekton.dev/), and [AWS Code Deploy](https://aws.amazon.com/codedeploy/). In this tutorial, we will get to know [Argo CD](https://argoproj.github.io/argo-cd/). I recommend reading the following pages, which talk a bit more about these tools:

- [https://cloudogu.com/en/blog/gitops-tools](https://cloudogu.com/en/blog/gitops-tools)
- [https://blog.container-solutions.com/fluxcd-argocd-jenkins-x-gitops-tools](https://blog.container-solutions.com/fluxcd-argocd-jenkins-x-gitops-tools)
- [https://luktom.net/en/e1683-argocd-vs-flux](https://luktom.net/en/e1683-argocd-vs-flux)
- [https://caylent.com/part-1-gitops-and-useful-gitops-tools](https://caylent.com/part-1-gitops-and-useful-gitops-tools)
- [https://caylent.com/part-2-getting-started-with-gitops-on-google-cloud-platform](https://caylent.com/part-2-getting-started-with-gitops-on-google-cloud-platform)
- [https://caylent.com/part-3-optimizing-the-caylent-gitops-accelerator-on-google-cloud-platform](https://caylent.com/part-3-optimizing-the-caylent-gitops-accelerator-on-google-cloud-platform)

If you don't know what Docker, Kubernetes, or even Git is yet, I recommend checking out the following links.

- Git:
  - [https://www.vogella.com/tutorials/Git/article.html](https://www.vogella.com/tutorials/Git/article.html)
  - [https://gitexplorer.com](https://gitexplorer.com/)
  - [https://rogerdudler.github.io/git-guide/index.pt\_BR.html](https://rogerdudler.github.io/git-guide/index.pt_BR.html) (in Portuguese)
  - [http://marklodato.github.io/visual-git-guide/index-en.html](http://marklodato.github.io/visual-git-guide/index-en.html)
- Docker and Kubernetes:
  - [https://github.com/badtuxx/DescomplicandoKubernetes](https://github.com/badtuxx/DescomplicandoKubernetes) (in Portuguese)
  - [/en/primeiros-passos-com-docker](/en/primeiros-passos-com-docker/)
  - [/en/instalando-o-k0s-distribuicao-kubernetes-all-inclusive](/en/instalando-o-k0s-distribuicao-kubernetes-all-inclusive/)
  - [/en/curso-docker](/en/curso-docker/)
  - [/en/curso-kubernetes-k8s](/en/curso-kubernetes-k8s/)

## **About Argo CD**

[Argo CD](https://argoproj.github.io/argo-cd/) is a declarative tool that uses the GitOps approach to deploy applications to Kubernetes.

I found Argo CD quite easy to install and configure. Besides that, it can manage multiple applications on different Kubernetes clusters from a single point. It can connect to public and private git repositories, it is free and open source, it is a [CNCF incubating project](https://landscape.cncf.io/?project=incubating&selected=argo), and it has a web interface for viewing and managing resources, but it can also be configured from the command line.

To learn more about Argo CD, check out the links in the references at the end of this tutorial.

In this tutorial, you will learn how to install Argo CD on Kubernetes. Then you will configure Argo CD to pull the applications' configuration files from a public GitHub repository and watch Argo CD apply the changes to Kubernetes.

## **Requirements**

For this tutorial, I will assume that you are using a GNU/Linux distribution and already have the following tools installed:

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [helm](https://helm.sh/docs/intro/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

You also need access to 1 or 2 Kubernetes clusters (whether on-premises, in the cloud ([EKS](https://aws.amazon.com/eks/), [GKE](https://cloud.google.com/kubernetes-engine), or [AKS](https://azure.microsoft.com/en-us/services/kubernetes-service/)), or using [minikube](https://minikube.sigs.k8s.io/docs/start/), [kind](https://kind.sigs.k8s.io/docs/user/quick-start/), [k0s](https://k0sproject.io/), [microk8s](https://microk8s.io/), or [k3s](https://k3s.io/)).

## **Installing Argo CD**

Once connected to a Kubernetes cluster, run the following commands to install Argo CD:

```bash
kubectl create namespace argocd

kubectl apply -n argocd --server-side --force-conflicts \
-f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

> **Note:**
>
> According to the [official documentation](https://argo-cd.readthedocs.io/en/stable/getting_started/), the `--server-side --force-conflicts` options are required because some Argo CD CRDs (such as ApplicationSet) exceed the 262KB limit of the annotation used by `kubectl apply` in client-side mode. The documentation also recommends using a pinned version (for example: `v3.6.2`) instead of the `stable` branch in production environments.
>
> The installation manifests include ClusterRoleBinding resources that reference the **argocd** namespace. If you are installing Argo CD in a different namespace, make sure to update the namespace reference.

_If you prefer, you can install ArgoCD using Helm by following the instructions on this page:_ [https://artifacthub.io/packages/helm/argo/argo-cd](https://artifacthub.io/packages/helm/argo/argo-cd)

There are several ways to access the Argo CD web interface, described [on this page](https://argoproj.github.io/argo-cd/getting_started/). The simplest one is the following:

Port-Forward:

```bash
kubectl -n argocd port-forward svc/argocd-server -n argocd 8443:443
```

This forwards the application running on the Kubernetes cluster on port 443/TCP to port 8443/TCP on the local host. That way, you can open a browser at: [https://localhost:8443](https://localhost:8443). If you close the terminal or press CTRL+C, the port-forward stops and you lose access.

> **Note**:
>
> **Keep the port-forward running throughout the tutorial.**

The default login is **admin**, and a random password is generated. To get it, run the following command in another terminal:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

After logging in to Argo CD, change the password at the following address: [https://localhost:8443/user-info?changePassword=true](https://localhost:8443/user-info?changePassword=true)

After changing the password in the web interface, you can remove the **argocd-initial-admin-secret** secret, which holds the initial password, with the following command:

```bash
kubectl -n argocd delete secret argocd-initial-admin-secret
```

## **Installing the Argo CD** **CLI** ( _Command Line Interface_)

Argo CD can also be managed from the command line. To do this, run the following commands to install the binary:

> The page [https://argo-cd.readthedocs.io/en/stable/cli\_installation/](https://argo-cd.readthedocs.io/en/stable/cli_installation/) lists different ways to install the Argo CD CLI, but in this tutorial I will install it using [mise](https://mise.jdx.dev/) as the package manager.
>
> **Installing mise**
>
> ```bash
> curl -fsSL https://mise.run | sh
> ```
>
> _Source:_ [https://mise.jdx.dev/installing-mise.html](https://mise.jdx.dev/installing-mise.html)

**Installing ArgoCD using mise**

```bash
mise use -g argocd@3.6.2 # Instala o argocd e define a versão global do argocd-cli a ser utilizada, se não for especificada uma versão diferente no diretório corrente

argocd version --client
```

View the **argocd** command-line options:

```bash
argocd --help

argocd subcommand --help
```

Authenticate the binary against the server with the following command:

```bash
argocd login localhost:8443
```

> **Note:**
>
> Argo CD settings can also be declared in YAML files and versioned in Git, as shown in this tutorial: [https://medium.com/devopsturkiye/self-managed-argo-cd-app-of-everything-a226eb100cf0](https://medium.com/devopsturkiye/self-managed-argo-cd-app-of-everything-a226eb100cf0) and on this documentation page: [https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup)

## Deploying an application ( _deploy_)

The [https://github.com/argoproj/argocd-example-apps](https://github.com/argoproj/argocd-example-apps) repository has several sample applications that can be deployed with Argo CD. To follow the GitOps changes later on, _fork_ the repositories used in this tutorial into your account and use your _fork_ URL in the commands.

Deploy the **guestbook** application to the same cluster as Argo CD, in the **myapp** namespace, from the code at [https://github.com/argoproj/argocd-example-apps](https://github.com/argoproj/argocd-example-apps), specifically from the **guestbook** directory:

```bash
kubectl create namespace myapp

argocd app create guestbook \
--repo https://github.com/argoproj/argocd-example-apps.git \
--path guestbook \
--dest-server https://kubernetes.default.svc \
--dest-namespace myapp
```

> **Note:**
>
> The address **https://kubernetes.default.svc** is the default identifier of the Kubernetes cluster where Argo CD is deployed. This name is always assigned during installation, and you can find it in the Argo CD web interface at: [https://localhost:8443/settings/clusters](https://localhost:8443/settings/clusters)  

In the web interface, you can view the applications created in Argo CD at the following address: [https://localhost:8443/applications](https://localhost:8443/applications). For the **guestbook** application, the status and other settings are available at: [https://localhost:8443/applications/guestbook](https://localhost:8443/applications/guestbook).

But let's keep using the command line...

Get the application status with the following command:

```bash
argocd app get guestbook
```

Sync the application code in Git with the Kubernetes cluster:

```bash
argocd app sync guestbook
```

View the application's deployed resources:

```bash
kubectl get all -n myapp
```

View the application pod logs:

```bash
argocd app logs guestbook
```

Now change something in an existing manifest in the **guestbook** application directory in git, or add a file. Commit and push the changes to the main branch (master or main).

View the differences between what is in git and what is in the Kubernetes cluster:

```bash
argocd app diff guestbook
```

Sync the application again.

```bash
argocd app sync guestbook
```

Look at the application's change history:

```bash
argocd app history guestbook
```

Roll back the changes to the history ID of the desired commit:

```bash
argocd app rollback guestbook HISTORY_ID
```

What did you think?

Notice that you had to sync the changes in Argo CD manually for it to pull them from Git and apply them to Kubernetes. To make this process automatic for this application, run the following command:

```bash
argocd app set guestbook --sync-policy automated
```

If you need to disable automatic sync, run the following command:

```bash
argocd app set guestbook --sync-policy none
```

Fun fact: getting the application's [YAML](https://yaml.org/) manifests:

```bash
argocd app manifests guestbook
```

List the application resources:

```bash
argocd app resources guestbook
```

## **Deploying a helm application to another cluster**

> **Note:**
>
> Argo CD is unopinionated about how secrets should be managed, for example with helm secrets + sops. There are many ways to do it, and there is no one-size-fits-all solution. Some tutorials offer a few alternatives, and they are listed in the References under **Argo CD + Sops + Helm Secrets**.
>
> I created a custom Argo CD Docker image that supports sops + helm secrets + helm plugin, and I added instructions on how to use AWS KMS with sops and create a Kubernetes secret for the AWS credentials file. If you are interested, check out this repository: [https://github.com/aeciopires/custom-argocd](https://github.com/aeciopires/custom-argocd)

As I mentioned, Argo CD can manage many clusters from a single point. To test this, add another cluster with the following command:

```bash
kubectl config get-contexts -o name

argocd cluster add CONTEXT_NAME
```

{{< alert icon="circle-info" >}}
**If the other cluster is a kind cluster:** kind's default kubeconfig points to `127.0.0.1`, which Argo CD (running inside the first cluster) cannot reach. Generate a kubeconfig with the control-plane IP on kind's Docker network and use it in `cluster add`:

```bash
IP=$(docker inspect -f '{{(index .NetworkSettings.Networks "kind").IPAddress}}' NOME-DO-CLUSTER-control-plane)
kind get kubeconfig --internal --name NOME-DO-CLUSTER | sed "s#https://NOME-DO-CLUSTER-control-plane:6443#https://$IP:6443#" > kubeconfig-kind
argocd cluster add kind-NOME-DO-CLUSTER --kubeconfig kubeconfig-kind
```

{{< /alert >}}

> **Note**:
>
> Replace CONTEXT\_NAME with the name of the cluster you already have access to.

View the list of clusters registered in Argo CD at the following address: [https://localhost:8443/settings/clusters](https://localhost:8443/settings/clusters)

Deploy the **aecio** application to the other cluster, in the **aecions** namespace, from the code at [https://gitlab.com/aeciopires/kube-pires](https://gitlab.com/aeciopires/kube-pires), specifically from the **helm-chart** directory:

```bash
CLUSTER_URL=CHANGE_HERE

argocd app create aecio \
--repo https://gitlab.com/aeciopires/kube-pires.git \
--path helm-chart \
--release-name aecioapp \
--values values.yaml \
--dest-server $CLUSTER_URL \
--dest-namespace aecions \
--sync-policy auto \
--sync-option CreateNamespace=true
```

> **Note:**
>
> With the **--sync-option CreateNamespace=true** option, the **aecions** namespace is created automatically if it doesn't exist in the cluster. Otherwise, Argo CD would make 5 attempts (by default) to deploy the application without success.
>
> The **--sync-policy auto** option makes every change pushed to Git get applied immediately.
>
> **kube-pires** is a test helm chart used to deploy the **aecioapp** application with the values defined in the **helm-chart/values.yaml** file.
>
> **CLUSTER\_URL** is the internal address of the cluster, which you can find in the Argo CD web interface at: [https://localhost:8443/settings/clusters](https://localhost:8443/settings/clusters)
>
> The **aecioapp** and **aecio** applications are different. The first one is a helm application. The second one is an Argo CD application.  
In this case, sync between the files in git and Kubernetes is set to happen automatically. To learn more about Argo CD concepts, check out this page: [https://argo-cd.readthedocs.io/en/stable/core\_concepts](https://argo-cd.readthedocs.io/en/stable/core_concepts)

View the application in the web interface: [https://localhost:8443/applications/aecio](https://localhost:8443/applications/aecio):

Now view the application status from the command line:

```bash
argocd app get aecio
```

View the application's deployed resources:

```bash
argocd app resources aecio
```

View any differences between what is in git and what is in Kubernetes:

```bash
argocd app diff aecio
```

Change the number of replicas in the **helm-chart/values.yaml** file. Commit and push the changes to the git repository.

View the changes in the Argo CD web interface.

> **Note:**
>
> By default, Argo CD does not prevent manual changes to Kubernetes resources and objects, for example to fix an incident. If that happens, it will not overwrite the manual settings automatically.
>
> You can view the differences and update the file in git to keep the changes as code, or overwrite the manual changes by syncing the Git code with the application deployed to Kubernetes on demand.

If you want to make sure Kubernetes runs only what is versioned in Git, immediately overwriting any manual change, you can delete the application and create it again with the following commands:

```bash
argocd app delete aecio

argocd app create aecio \
--repo https://gitlab.com/aeciopires/kube-pires.git \
--path helm-chart \
--release-name aecioapp \
--values values.yaml \
--dest-server CLUSTER_URL \
--dest-namespace aecions \
--sync-policy auto \
--sync-option CreateNamespace=true \
--self-heal
```

Or, even better, you can change the settings of an existing application like this:

```bash
argocd app set aecio --self-heal
```

Now any manual change to this application's resources in the cluster will be immediately overwritten by what is defined in Git.

There are many sync options, which you can look up in the links in the references at the end of the tutorial.

Change **readinessProbe.path** and **livenessProbe.path** in the **helm-chart/values.yaml** file. Commit and push the changes to the git repository.

View the changes in the Argo CD web interface.

{{< figure src="/wp-content/uploads/2021/09/argocd.png" alt="argocd" >}}

> **Note:**
>
> Argo CD now supports multiple sources ( _multiple sources_) in a single application, which lets you use a helm chart from one repository and the values files from another git repository. See the documentation at _https://argo-cd.readthedocs.io/en/stable/user-guide/multiple\_sources/_ and my tutorial [Deploying applications to Kubernetes using Argo CD with support for Helm, Sops, and Multiple Sources](/en/deploy-no-kubernetes-usando-argo-cd-com-suporte-a-helm-sops-e-multiple-sources/).

Remove the applications from Argo CD and from the Kubernetes clusters ( _undeploy_):

```bash
argocd app delete guestbook

argocd app delete aecio
```

Remove a cluster from Argo CD with the following command:

```bash
argocd cluster rm CLUSTER_URL
```

Remove Argo CD from the Kubernetes cluster ( _undeploy_):

```bash
kubectl delete -n argocd \
-f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

kubectl delete namespace argocd
```

What did you think?

You can find more information in the links in the references.

This tutorial showed only the basics and the simple part of what can be done with Argo CD. There are many features and possibilities to explore, so I encourage you to read and practice the knowledge published in the links in the references. Happy testing and studying!

## **References**

**Argo CD:**

- [https://argoproj.github.io/argo-cd](https://argoproj.github.io/argo-cd)
- [https://argoproj.github.io/argo-rollouts/FAQ](https://argoproj.github.io/argo-rollouts/FAQ)
- [https://argo-cd.readthedocs.io/en/stable/understand\_the\_basics](https://argo-cd.readthedocs.io/en/stable/understand_the_basics)
- [https://argo-cd.readthedocs.io/en/stable/operator-manual/architecture](https://argo-cd.readthedocs.io/en/stable/operator-manual/architecture)
- [https://argoproj.github.io/argo-cd/getting\_started](https://argoproj.github.io/argo-cd/getting_started)
- [https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup)
- [https://github.com/argoproj/argo-cd/releases](https://github.com/argoproj/argo-cd/releases)
- [https://argo-cd.readthedocs.io/en/stable/user-guide/helm](https://argo-cd.readthedocs.io/en/stable/user-guide/helm/)
- [https://argoproj.github.io/argo-cd/user-guide/private-repositories](https://argoproj.github.io/argo-cd/user-guide/private-repositories/)
- [https://argoproj.github.io/argo-cd/user-guide/commands/argocd\_app\_create](https://argoproj.github.io/argo-cd/user-guide/commands/argocd_app_create/)
- [https://opensource.com/article/21/7/automating-argo-cd](https://opensource.com/article/21/7/automating-argo-cd)
- [https://medium.com/devopsturkiye/self-managed-argo-cd-app-of-everything-a226eb100cf0](https://medium.com/devopsturkiye/self-managed-argo-cd-app-of-everything-a226eb100cf0)

**Argo CD + Sops + Helm Secrets:**

> **Note:**
>
> Argo CD is unopinionated about how secrets should be managed, for example with helm secrets + sops. There are many ways to do it, and there is no one-size-fits-all solution. The following tutorials offer a few alternatives.
>
> I created a custom Argo CD Docker image that supports sops + helm secrets + helm plugin, and I added instructions on how to use AWS KMS with sops and create a Kubernetes secret for the AWS credentials file. If you are interested, check out this repository: [https://github.com/aeciopires/custom-argocd](https://github.com/aeciopires/custom-argocd)

- [https://argoproj.github.io/argo-cd/operator-manual/secret-management/](https://argoproj.github.io/argo-cd/operator-manual/secret-management/)
- [https://faun.pub/handling-kubernetes-secrets-with-argocd-and-sops-650df91de173](https://faun.pub/handling-kubernetes-secrets-with-argocd-and-sops-650df91de173)
- [https://rtfm.co.ua/en/argocd-a-helm-chart-deployment-and-working-with-helm-secrets-via-aws-kms/](https://rtfm.co.ua/en/argocd-a-helm-chart-deployment-and-working-with-helm-secrets-via-aws-kms/)
- [https://argoproj.github.io/argo-cd/user-guide/private-repositories/](https://argoproj.github.io/argo-cd/user-guide/private-repositories/)
- [https://github.com/argoproj/argo-cd/issues/1364](https://github.com/argoproj/argo-cd/issues/1364)
- [https://github.com/argoproj/argo-cd/issues/2789](https://github.com/argoproj/argo-cd/issues/2789)
- [https://github.com/argoproj/argo-cd/pull/6280](https://github.com/argoproj/argo-cd/pull/6280)

**Sync Policy:**

- [https://argoproj.github.io/argo-cd/user-guide/auto\_sync](https://argoproj.github.io/argo-cd/user-guide/auto_sync)
- [https://argoproj.github.io/argo-cd/user-guide/sync-options](https://argoproj.github.io/argo-cd/user-guide/sync-options)
- [https://github.com/argoproj/argo-cd/issues/4438](https://github.com/argoproj/argo-cd/issues/4438)
- [https://argoproj.github.io/argo-cd/user-guide/diffing](https://argoproj.github.io/argo-cd/user-guide/diffing)
- [https://argoproj.github.io/argo-cd/user-guide/compare-options](https://argoproj.github.io/argo-cd/user-guide/compare-options)

**Tracking and Deployment Strategies**:

- [https://argoproj.github.io/argo-cd/user-guide/tracking\_strategies](https://argoproj.github.io/argo-cd/user-guide/tracking_strategies)
- [https://argoproj.github.io/argo-cd/user-guide/best\_practices](https://argoproj.github.io/argo-cd/user-guide/best_practices)
- [https://argoproj.github.io/argo-cd/user-guide/parameters](https://argoproj.github.io/argo-cd/user-guide/parameters)
- [https://argoproj.github.io/argo-rollouts](https://argoproj.github.io/argo-rollouts)
- [https://argoproj.github.io/argo-rollouts/concepts](https://argoproj.github.io/argo-rollouts/concepts)
- [https://argoproj.github.io/argo-rollouts/installation](https://argoproj.github.io/argo-rollouts/installation)
- [https://argoproj.github.io/argo-rollouts/features/bluegreen](https://argoproj.github.io/argo-rollouts/features/bluegreen)
- [https://argoproj.github.io/argo-rollouts/features/canary](https://argoproj.github.io/argo-rollouts/features/canary)
- [https://argoproj.github.io/argo-rollouts/features/specification](https://argoproj.github.io/argo-rollouts/features/specification)
- [https://argoproj.github.io/argo-rollouts/features/hpa-support](https://argoproj.github.io/argo-rollouts/features/hpa-support)
- [https://argoproj.github.io/argo-rollouts/features/anti-affinity/anti-affinity](https://argoproj.github.io/argo-rollouts/features/anti-affinity/anti-affinity)
- [https://argoproj.github.io/argo-rollouts/features/restart](https://argoproj.github.io/argo-rollouts/features/restart)
- [https://argoproj.github.io/argo-rollouts/migrating](https://argoproj.github.io/argo-rollouts/migrating)
- [https://argoproj.github.io/argo-rollouts/analysis/prometheus](https://argoproj.github.io/argo-rollouts/analysis/prometheus)
- [https://argoproj.github.io/argo-rollouts/features/helm](https://argoproj.github.io/argo-rollouts/features/helm)
- [https://argoproj.github.io/argo-rollouts/best-practices](https://argoproj.github.io/argo-rollouts/best-practices)
- [https://www.youtube.com/watch?v=hIL0E2gLkf8](https://www.youtube.com/watch?v=hIL0E2gLkf8)

**Security:**

- [https://argo-cd.readthedocs.io/en/stable/operator-manual/user-management](https://argo-cd.readthedocs.io/en/stable/operator-manual/user-management)
- [https://argo-cd.readthedocs.io/en/stable/security\_considerations](https://argo-cd.readthedocs.io/en/stable/security_considerations)
- [https://argo-cd.readthedocs.io/en/stable/operator-manual/security](https://argo-cd.readthedocs.io/en/stable/operator-manual/security)
- [https://argo-cd.readthedocs.io/en/stable/operator-manual/tls](https://argo-cd.readthedocs.io/en/stable/operator-manual/tls)
- [https://argo-cd.readthedocs.io/en/stable/operator-manual/disaster\_recovery](https://argo-cd.readthedocs.io/en/stable/operator-manual/disaster_recovery)
- [https://argo-cd.readthedocs.io/en/stable/operator-manual/high\_availability](https://argo-cd.readthedocs.io/en/stable/operator-manual/high_availability)
