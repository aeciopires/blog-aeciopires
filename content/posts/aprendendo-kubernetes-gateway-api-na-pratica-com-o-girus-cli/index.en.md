---
title: "Learning Kubernetes Gateway API hands-on with girus-cli"
slug: "aprendendo-kubernetes-gateway-api-na-pratica-com-o-girus-cli"
date: 2025-11-21T18:49:43-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "kubernetes", "tutoriais"]
tags: ["docker", "git", "helm", "kubernetes"]
description: "A few months ago, I started studying and published the first post of the series about the Kubernetes Gateway API."
sourceHash: "b5f152e14f7a2739"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** tested with girus-cli 0.6.1 (the latest release), including through the web interface: `repo add`, `repo list`, `lab list`, `create cluster`, `create lab -f`, running all the tasks of the `gateway-api-install` lab, and removal. The lab was updated in the [repository](https://github.com/aeciopires/mylabs-for-girus-cli) to NGINX Gateway Fabric 2.9.0 (Gateway API v1.7.0), gained automatic validation in each task, and the repository index now uses the format that `girus lab list` in this release recognizes.
{{< /alert >}}

A few months ago, I started studying and published the [first post of the series about the Kubernetes Gateway API](/en/conhecendo-o-kubernetes-gateway-api/).

Continuing the series, today I'm going to share the hands-on part using a fantastic tool called **[girus-cli](https://github.com/badtuxx/girus-cli)**, which lets you run interactive labs directly in the terminal. girus-cli will be used to run the labs I created about the Gateway API, from installation to monitoring with Datadog and Prometheus.

## **What is girus-cli?**

I took the definition straight from the source...

> [GIRUS](https://github.com/badtuxx/girus-cli) is an _open source_ interactive lab platform that enables the creation, management, and execution of hands-on learning environments for technologies such as [Linux](https://pt.wikipedia.org/wiki/Linux), [Docker](https://www.docker.com/), [Kubernetes](https://kubernetes.io/), [Terraform](https://developer.hashicorp.com/terraform), and other essential tools for DevOps, SRE, Dev, and Platform Engineering professionals.
>
> Developed by [LINUXtips](http://linuxtips.io), the GIRUS platform stands out because it runs locally on the user's machine, eliminating the need for cloud infrastructure or complex configurations. Through an intuitive CLI, users can quickly create isolated and secure environments where they can practice and improve their technical skills.
>
> **girus-cli** is a command-line tool that guides you through learning scenarios. It reads a configuration file ( `lab.yaml`), presents a task, and the coolest part: it validates whether you completed the task correctly in your Kubernetes cluster. It's like having an instructor by your side checking your commands.

More information about this tool can be found at the links below:

- [https://github.com/badtuxx/girus-cli](https://github.com/badtuxx/girus-cli)
- [https://linuxtips.io/girus-labs/](https://linuxtips.io/girus-labs/)
- [https://www.youtube.com/watch?v=kSQ7nM-QF1g](https://www.youtube.com/watch?v=kSQ7nM-QF1g)
- [https://www.linkedin.com/pulse/why-i-created-free-open-source-platform-practice-other-fernando-vuhge/](https://www.linkedin.com/pulse/why-i-created-free-open-source-platform-practice-other-fernando-vuhge/)
- [https://www.linkedin.com/pulse/por-que-criei-uma-plataforma-gratuita-e-open-source-para-fernando-ll6le/](https://www.linkedin.com/pulse/por-que-criei-uma-plataforma-gratuita-e-open-source-para-fernando-ll6le/)
- [https://www.dio.me/articles/girus-labs-ferramenta-para-aprender-na-pratica-linux-docker-e-kubernetes-61121101b694](https://www.dio.me/articles/girus-labs-ferramenta-para-aprender-na-pratica-linux-docker-e-kubernetes-61121101b694)
- [https://www.linkedin.com/feed/update/urn:li:activity:7387470252948762624/](https://www.linkedin.com/feed/update/urn:li:activity:7387470252948762624/)
- [https://www.youtube.com/watch?v=E92qKUp5giQ](https://www.youtube.com/watch?v=E92qKUp5giQ)

## **Prerequisites**

Before continuing, you will need:

- A GNU/Linux system, macOS, or [WSL](https://learn.microsoft.com/pt-br/windows/wsl/install) (on Windows).
- **Docker**. Follow the instructions for your operating system: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- **kubectl** and **kind**. Follow the instructions: [https://kubernetes.io/docs/tasks/tools/](https://kubernetes.io/docs/tasks/tools/)
- **Helm**. Follow the instructions: [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/)

## **Installing girus-cli**

The installation is very simple. Run the following command to download and install the binary:

```bash
curl -sSL girus.linuxtips.io | bash
```

Check that the installation worked:

```text
girus version
```

> This post uses girus-cli version 0.6.1.

## **Getting the Gateway API labs**

I created a git repository, [https://github.com/aeciopires/mylabs-for-girus-cli](https://github.com/aeciopires/mylabs-for-girus-cli), containing some hands-on labs on the following topics:

- Installation (NGINX Gateway Fabric) _**(Done)**_
- HTTPRoute _**(Done)**_
- TCPRoute _(ToDo)_
- UDPRoute _(ToDo)_
- Websocket _(ToDo)_
- TLSRoute (Passthrough) _(ToDo)_
- GRPCRoute _(ToDo)_
- GAMMA (Mesh) _**(Done)**_

> Attention!!! If you are not authenticated on GitHub, you may get an HTTP 429 error for hitting the API request limit (_rate limit_). More details on this topic are available at the links below.

- [https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28](https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28)
- [https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/)
- [https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28)
- [https://github.com/orgs/community/discussions/159123](https://github.com/orgs/community/discussions/159123)

To get these labs, run the following commands:

```text
girus repo add gateway-api https://raw.githubusercontent.com/aeciopires/mylabs-for-girus-cli/main
girus repo list
girus lab list
```

## **Running the labs**

Create a kind cluster to be used for running the labs with girus-cli.

```text
girus create cluster
```

In version 0.6.1, the `girus lab install` command only downloads the lab to the local cache, without applying it to the cluster. That's why you should clone the repository and create each lab with `girus create lab -f`, as in the example below.

```bash
cd /tmp
git clone https://github.com/aeciopires/mylabs-for-girus-cli
girus create lab -v -f /tmp/mylabs-for-girus-cli/labs/gateway-api-install/lab.yaml
```

Open Girus in the browser to use the new lab: [http://localhost:8000/labs](http://localhost:8000/labs)

Find and follow the instructions of the Gateway API labs and/or any others that are available.

In the web interface, each lab shows the tasks on one side and a terminal on the other. Read the instructions, run the requested commands in the terminal, and use the task validation so that Girus checks whether it was completed.

If everything is fine, move on to the next task!

## **Removing the labs**

Just run the following commands:

```text
girus delete cluster
rm $HOME/.girus/cache/gateway-api/index.yaml
girus repo remove gateway-api
```

## **Final thoughts**

I hope the knowledge shared in this post and in the others in this series can help you understand how to use the Gateway API.

My journey is only beginning, and this tool evolves very quickly. So this is just a "drop in the ocean." Publishing these posts is a way to learn better, look for information straight from the source, and help other beginners like me, giving back to the community what I learned and used for free from what other people created and shared.

Other labs may be published in the repository, so stay tuned. In addition, I'm open to suggestions for improvement and contributions with new labs.

See you next time!
