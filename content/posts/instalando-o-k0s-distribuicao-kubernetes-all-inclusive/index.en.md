---
title: "Installing k0s (an all-inclusive Kubernetes distribution)"
slug: "instalando-o-k0s-distribuicao-kubernetes-all-inclusive"
date: 2021-03-24T06:08:40-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "kubernetes", "tutoriais"]
tags: ["containers", "docker", "k0s", "kubernetes", "linux"]
description: "k0s is a Kubernetes distribution with all the features it needs to work in a single, small binary written in Go, which provides…"
sourceHash: "3894ab68c2598cd2"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** commands tested with k0s v1.37.2+k0s.1 (installed via `get.k0s.sh`) on two Ubuntu 24.04 machines with systemd, simulated in containers with the IPs used in this post: controller, kubectl, `admin.conf`, token, worker join, a test pod running on the worker, and `stop`/`reset`. No changes were needed.
{{< /alert >}}

[k0s](https://k0sproject.io/) is a [Kubernetes](https://kubernetes.io/) distribution with all the features it needs to work in a single, small binary written in the [Go language](https://golang.org/), which makes installing and maintaining the cluster simple. The correct pronunciation is [_kay-zero-ess_](https://docs.k0sproject.io/v0.11.1/FAQ/), and it aims to reduce the technical effort and hassle of installing a Kubernetes cluster, which is why its name alludes to " **Zero** **Friction**".

This distribution is recommended for production use in _on-premises_ environments, public, private, and hybrid cloud computing, edge computing, and _bare-metal_ and/or virtualized servers.

The source code is available on GitHub ([https://github.com/k0sproject/k0s](https://github.com/k0sproject/k0s)) and the download is free.

k0s is maintained by the [Mirantis](http://mirantis.com/) team, the same company that [bought Docker's enterprise business](https://www.mirantis.com/company/press-center/company-news/mirantis-acquires-docker-enterprise/) and also [bought Lens in 2020](https://techcrunch.com/2020/08/13/mirantis-acquires-lens-an-ide-for-kubernetes/). [Lens](https://k8slens.dev) is an IDE that makes managing Kubernetes easier. In January 2025, k0s was accepted as a CNCF Sandbox project: [https://www.cncf.io/projects/k0s/](https://www.cncf.io/projects/k0s/).

According to the [official documentation](https://docs.k0sproject.io/latest/), its main features are:

- Certified and 100% upstream Kubernetes ([Vanilla upstream Kubernetes](https://thenewstack.io/kubernetes-distribution-or-vanilla-kubernetes/));
- Available as a single binary, with no external dependencies other than the kernel;
- Control Plane isolation by default;
- Scalable from a single node to large, highly available clusters;
- A variety of storage backends: etcd (default for multi-node clusters), SQLite (default for single-node clusters), MySQL, and PostgreSQL;
- Uses [containerd](https://containerd.io/) as the default [container runtime](https://kubernetes.io/docs/setup/production-environment/container-runtimes/), but allows other CRI ( _Container Runtime Interface_) plugins;
- Support for several [Container Network Interface (CNI)](https://github.com/containernetworking/cni) plugins (the default is [Kube-Router](https://www.kube-router.io/), and [Calico](https://www.tigera.io/project-calico/) is offered as a preconfigured alternative);
- Includes Konnectivity, CoreDNS, and Metrics Server;
- Supports the x86-64, ARM64, ARMv7, and RISC-V computer architectures.

## Hardware and software requirements

Information about the minimum hardware and software requirements to run k0s (not counting the requirements of the pods, applications, and services that will be added) is available on the following page.

[https://docs.k0sproject.io/latest/system-requirements/](https://docs.k0sproject.io/latest/system-requirements/)

## Ports used

The list of ports involved in communication between the nodes is available at the end of the page: [https://docs.k0sproject.io/latest/networking/](https://docs.k0sproject.io/latest/networking/)

## **Installing and configuring k0s**

To create this tutorial, I created two virtual machines running Ubuntu Server LTS 24.04 64-bit, following the topology shown in the figure below:

{{< figure src="/wp-content/uploads/2021/03/topologia_k0s.png" alt="k0s topology" >}}

**Audio description**: The previous figure shows the network topology of a small test lab. This network consists of two virtual machines (one acting as the master node and the other acting as the worker node). Both virtual machines are connected to a switch, which in turn is connected to the network's edge firewall. This firewall is connected to the network's edge router, which in turn provides the connection to the Internet. This way, the virtual machines have Internet access, whether to download packages or to expose applications that will be installed on the Kubernetes cluster.

The names and IP addresses of the virtual machines used in this tutorial are the following:

- **master/controller**: 192.168.56.80/24
- **worker**: 192.168.56.81/24

**NOTE:** In this tutorial, the Kubernetes _control plane (master nodes)_ and _data plane_ ( _worker nodes_) each run on a single VM for testing purposes. This is not suitable for production environments because it doesn't provide high availability, but k0s supports multiple master and worker nodes.

More information is available at: [https://docs.k0sproject.io/latest/high-availability/](https://docs.k0sproject.io/latest/high-availability/)

### **On both VMs**

On both the **master** and the **worker**, run the following commands to install k0s, check the location of the binary, and get the command's help:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://get.k0s.sh | sudo sh
whereis k0s
k0s version
k0s --help
```

#### **On the master VM only**

Run the following command to export the default configuration for creating a k0s cluster to a [YAML](https://en.wikipedia.org/wiki/YAML) file.

```bash
sudo mkdir -p /etc/k0s
sudo bash -c 'k0s config create > /etc/k0s/k0s.yaml'
```

**NOTE:** For more information about the configuration options, see the page:

[https://docs.k0sproject.io/stable/configuration/](https://docs.k0sproject.io/stable/configuration/)

Validate the file's content and syntax with the following command:

```bash
sudo k0s config validate -c /etc/k0s/k0s.yaml
```

Now create the k0s master/controller node with the following commands:

```bash
sudo k0s install controller -c /etc/k0s/k0s.yaml
sudo k0s start
sudo k0s status
```

Install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/) with the following commands (if you already have it installed, you can skip this part):

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

Set up [kubectl](https://github.com/badtuxx/DescomplicandoKubernetes/blob/master/day-1/DescomplicandoKubernetes-Day1.md#kubectl-alias-e-autocomplete) autocompletion following the instructions in this doc from [badtuxx/Descomplicando o Kubernetes](https://github.com/badtuxx/DescomplicandoKubernetes/) (in Portuguese).

Get the cluster access credentials with the following command:

```bash
sudo cat /var/lib/k0s/pki/admin.conf > $HOME/admin.conf
```

In the newly created file, change the following line:

**Before:**

```text
server: https://localhost:6443
```

**After:**

```text
server: https://192.168.56.80:6443
```

Configure kubectl to use this file with the following command.

```bash
export KUBECONFIG=$HOME/admin.conf
```

> Warning!!! Don't append the contents of `admin.conf` to the end of the `~/.kube/config` file with the `cat >>` command, because the result is not a valid kubeconfig. If you already have a `~/.kube/config` file and want to use both, the Kubernetes documentation ([https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable)) explains how to pass multiple files in the `KUBECONFIG` variable. If you don't, just copy the file: `mkdir -p $HOME/.kube && cp $HOME/admin.conf $HOME/.kube/config`.

Now you can try to access the cluster's nodes and pods with the following commands:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

Or:

```bash
sudo k0s kubectl get nodes
sudo k0s kubectl get pods --all-namespaces
```

**NOTE:** The master/controller node won't be shown in the list of nodes; this is a k0s particularity, which by default only shows the worker nodes, because they are the ones that can actually run user workloads.

To add a worker node, create a file with the token and send it to the VM that will be added to the cluster. To do this, use the following commands:

```bash
sudo k0s token create --role=worker > $HOME/token-file
scp $HOME/token-file NOME_USUARIO@192.168.56.81:
```

View the list of tokens with the following command:

```bash
sudo k0s token list --role=worker
```

#### **On the worker VM only**

After installing k0s on the worker node (instructions shown at the beginning of this tutorial), run the following command to install k0s as a worker on this VM and add it to the Kubernetes cluster.

```bash
sudo k0s install worker --token-file $HOME/token-file
sudo k0s start
sudo k0s status
sudo systemctl status k0sworker
```

#### **Back on the master VM**

Now that the node has been added to the cluster, run the following commands to list the nodes.

```bash
kubectl get nodes -o wide
```

## Removing k0s (if needed)

Run the following commands, depending on the VM, to remove k0s.

**On the master VM:**

```bash
sudo k0s stop
sudo k0s reset
```

**On the worker VM:**

```bash
sudo k0s stop
sudo k0s reset
```

The k0s documentation ([https://docs.k0sproject.io/stable/reset/](https://docs.k0sproject.io/stable/reset/)) recommends rebooting the host after `k0s reset` to make sure no leftovers of the network configuration remain.

More information can be found at the following links:

[https://docs.k0sproject.io/](https://docs.k0sproject.io/)

[https://www.mirantis.com/blog/how-to-set-up-k0s-kubernetes-a-quick-and-dirty-guide/](https://www.mirantis.com/blog/how-to-set-up-k0s-kubernetes-a-quick-and-dirty-guide/)

[https://medium.com/@adamparco/announcing-k0s-the-smallest-simplest-kubernetes-distribution-3626c86575d5](https://medium.com/@adamparco/announcing-k0s-the-smallest-simplest-kubernetes-distribution-3626c86575d5)

[https://danilogo0001.medium.com/kubernetes-k0s-leve-simples-e-tudo-empacotado-com-multi-master-ha-e71b7c4a47da](https://danilogo0001.medium.com/kubernetes-k0s-leve-simples-e-tudo-empacotado-com-multi-master-ha-e71b7c4a47da) (in Portuguese)
