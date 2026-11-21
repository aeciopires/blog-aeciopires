---
title: "Installing Locust on Kubernetes for load testing"
slug: "instalando-o-locust-no-kubernetes-para-testes-de-carga"
date: 2025-04-22T10:34:26-03:00
lastmod: 2026-11-21T13:11:14-03:00
draft: false
categories: ["cluster", "devops", "docker", "go", "kubernetes", "tutoriais"]
tags: ["docker", "git", "helm", "kubernetes", "linux"]
description: "Locust is an open source tool used for performance/load testing over HTTP and other protocols."
sourceHash: "70247f579db63bda"
---

{{< alert icon="circle-info" >}}
**Updated on November 21, 2026:** fixed the description of the `--headless` parameter in the parameters table: it disables the web interface and starts the test immediately (according to the official Locust documentation). On November 20, 2026: Locust 2.47.0 with the `deliveryhero/locust` 0.35.0 chart, tested on a kind cluster (Kubernetes 1.37); fixed the `--csv` option of the command-line run, which generated files with a different name from the one used in `kubectl cp`.
{{< /alert >}}

[Locust](https://locust.io/) is an open source tool used for performance/load testing over HTTP and other protocols.

Locust tests can be run from the command line or through its web interface. Throughput, response times, and errors can be viewed in real time and/or exported for later analysis.

Locust lets you write and run Python code and libraries to execute the tests, simulating users interacting with the site.

One use case on Kubernetes is using Locust to load test a web application (backend or frontend) to study the behavior and scaling managed by [Horizontal Pod Autoscaling (HPA)](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/), [Keda](https://keda.sh/), or [Knative](https://knative.dev/).

## Requirements

1. In this tutorial, we will use [Kind](https://kind.sigs.k8s.io/) to simulate a Kubernetes cluster running locally. If you have access to an on-premises cluster or a cloud-managed one on EKS, GKE, AKS, DKS, or another provider, you can skip kind.
1. You will also need [Docker](https://www.docker.com/), [`kubectl`](https://kubernetes.io/docs/reference/kubectl/introduction/), [git](https://git-scm.com/), and [`helm`](https://helm.sh/). These tools can be installed by following the tutorial available at: [https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md](https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md)

## Installing a test application

For this test environment, we will install the [kube-pires](https://gitlab.com/aeciopires/kube-pires) application, a simple web application developed in [Golang](https://go.dev/) that shows some information about the pod depending on the endpoint accessed:

- `/` =\> Shows the hostname, the interface name, and the IP addresses;
- `/health` =\> Shows the application status;
- `/metrics` =\> Shows the metrics in the format supported by Prometheus;
- `/env` =\> Shows the environment variables;
- `/css` =\> Shows the CSS template;

Access the Kubernetes cluster.

Create the `test` namespace with the following command:

```bash
kubectl create namespace test
```

Deploy the `kube-pires` application with the following commands.

```bash
cd /tmp

git clone https://gitlab.com/aeciopires/kube-pires.git

cd kube-pires/helm-chart/

helm upgrade --install kube-pires -f values.yaml . -n test --create-namespace
```

Reference: [https://gitlab.com/aeciopires/kube-pires/-/tree/master/helm-chart?ref\_type=heads](https://gitlab.com/aeciopires/kube-pires/-/tree/master/helm-chart?ref_type=heads)

With the helm chart installed this way, the application is reachable inside the cluster through the `kube-pires` Service, on port 80, at `http://kube-pires.test.svc.cluster.local` (the `<service>.<namespace>.svc.cluster.local` format of [Kubernetes DNS](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)).

## Installing Locust with helm

Add the helm repository and update the list of helm charts available for installation.

```bash
helm repo add deliveryhero https://raw.githubusercontent.com/deliveryhero/helm-charts/refs/heads/master/

helm repo update
```

Clone the following git repository.

```bash
cd /tmp

git clone https://github.com/deliveryhero/helm-charts.git
```

Edit the contents of the `main.py` file with the script information pointing to the URL of the integration you want to use in the tests, as shown in the example below.

```bash
nano /tmp/helm-charts/stable/locust/locustfiles/example/main.py
```

Contents of `main.py` customized for testing the `kube-pires` application. The script uses relative paths, and the target host of the tests is defined by the `host` attribute or, when installing with helm, by the helm chart's `loadtest.locust_host` parameter (the `LOCUST_HOST` variable).

```text
from locust import HttpUser, task, between
import random

class SiteUser(HttpUser):
    # Default host used in the tests. It can be overridden by the --host parameter or by the LOCUST_HOST variable.
    host = "http://kube-pires.test.svc.cluster.local"

    # Sets the time interval between the requests that each simulated user will make.
    # This is not the user "spawn" rate, which is defined by the -r (--spawn-rate) parameter.
    # The value between(1, 5) means that Locust will wait between 1 and 5 seconds between the requests.
    wait_time = between(1, 5)

    # Defines the pages (paths relative to the host) that will be accessed during the load test.
    pages = [
        "/metrics",
        "/health",
        "/env",
    ]

    # This method simulates access to the main page
    @task(1)
    def load_home_page(self):
        """Acessa a página inicial"""
        self.client.get("/")

    # This method accesses random pages from the pages list to simulate user navigation.
    @task(2)
    def browse_pages(self):
        """Acessa uma página aleatória"""
        page = random.choice(self.pages)
        self.client.get(page)
```

Access the Kubernetes cluster.

Run the following command to create a `configmap` with the contents of the script mentioned above.

> Change the namespace name in the `$MYNAMESPACE` variable according to your environment.

```bash
export MYNAMESPACE="test"

kubectl -n $MYNAMESPACE create configmap my-loadtest-locustfile --from-file /tmp/helm-charts/stable/locust/locustfiles/example/main.py

```

In the same path as the `main.py` script, there are the libs, which can be changed if needed. In our example, just run the following command to create another `configmap` for the libs.

```bash
kubectl -n $MYNAMESPACE create configmap my-loadtest-lib --from-file /tmp/helm-charts/stable/locust/locustfiles/example/lib/
```

The following configmaps will be created: `my-loadtest-lib` and `my-loadtest-locustfile`. You can view them with the following command:

```bash
kubectl get configmap -n $MYNAMESPACE

```

By default, the helm chart comes with the `/tmp/helm-charts/stable/locust/values.yaml` file configured to use the `locustio/locust` Docker image at version `2.32.2`. If you need to change it, you can see other available versions of this image at [https://hub.docker.com/r/locustio/locust/tags](https://hub.docker.com/r/locustio/locust/tags).

> Since in this case I only need to change a few values, I will skip the `values.yaml` file and configure a few things using helm's `--set` parameter.
>
> The `--set worker.replicas` parameter determines how many Locust worker pods will be created in the test. In this case, I will use 10. This directly affects the test results. Each worker tends to use 1 full CPU. Too few workers can give the impression that your application is slow or cannot handle a high load of requests, when in fact it may be Locust that cannot make more parallel requests. That is why it is important to increase this value to find the real limit of simultaneous requests the application supports.

With the configmaps created in the cluster, run the following command to install Locust:

```text
LOCUST_VERSION="2.47.0"
CHART_VERSION="0.35.0"

helm -n $MYNAMESPACE upgrade --install locust deliveryhero/locust \
  --set image.tag=$LOCUST_VERSION \
  --set loadtest.name=my-loadtest \
  --set loadtest.locust_host=http://kube-pires.test.svc.cluster.local \
  --set loadtest.locust_locustfile_configmap=my-loadtest-locustfile \
  --set loadtest.locust_lib_configmap=my-loadtest-lib \
  --set worker.replicas=10 \
  --version $CHART_VERSION \
  --debug --timeout=900s

```

The web interface can be accessed through port-forward:

```bash
kubectl -n $MYNAMESPACE port-forward service/locust 8089:8089

```

And opened in the browser at the URL: [http://127.0.0.1:8089](http://127.0.0.1:8089)

Below are some images with the results of the Locust tests:

**Image 1 – Performance charts in Locust**

{{< figure src="/wp-content/uploads/2025/04/image-3-1024x650.png" alt="image (3)" >}}

Audio description: The image shows three charts:

**Total Requests per Second (RPS)**:

- A line chart showing the number of requests per second in red.
- The line shows steady growth up to about 8 requests per second.
- The chart also shows 100% failures (constant red line).

**Response Times (ms)**:

- Chart with two lines:
- Orange: 50th percentile (median response time).
- Purple: 95th percentile (response time of the worst 5%).
- Shows a gradual increase in times, with the 95th percentile reaching about 16 ms.

**Number of Users**:

- Blue line representing the number of virtual users.
- It starts at 0 and goes up to 50 users within seconds.

**Image 2 – Detailed statistics per route**

{{< figure src="/wp-content/uploads/2025/04/image-2-1024x355.png" alt="image (2)" >}}

Audio description: The image shows a table with statistical data about the requests made:

- Each row corresponds to a tested HTTP route: `/`, `/env`, `/health`, and `/metrics`.
- For each route, the following information is shown:
  - **\# Requests**: Total number of requests made.
  - **\# Fails**: Total number of failures (all requests failed, 100% failures).
  - **Median (ms)**: Median response time (3 ms for all of them).
  - **95%ile / 99%ile**: 95th and 99th percentiles of the response time.
  - **Average / Min / Max (ms)**: Average, minimum, and maximum response time.
  - **Current RPS**: Requests per second per route.
  - **Current Failures/s**: Failures per second per route.

The global test data appears at the top of the screen:

- **FAILURES**: 100%
- **HOST**: http://kube-pires.test.svc.cluster.local
- **USERS**: 50
- **WORKERS**: 10
- **RPS**: 8.1

## Changes to the Locust script

If you need to adjust the script, after making the changes, remove the `my-loadtest-locustfile` configmap

```bash
kubectl -n $MYNAMESPACE delete configmap my-loadtest-locustfile

```

Create the configmap with the new payload settings

```bash
nano /tmp/helm-charts/stable/locust/locustfiles/example/main.py

kubectl -n $MYNAMESPACE create configmap my-loadtest-locustfile --from-file /tmp/helm-charts/stable/locust/locustfiles/example/main.py

```

Roll out the deployment to update the pod.

```bash
kubectl rollout restart deployment/locust-master -n $MYNAMESPACE

```

## Removing the configmaps

Run the following command:

```bash
kubectl -n $MYNAMESPACE delete configmap my-loadtest-lib my-loadtest-locustfile

```

## Removing Locust

Run the following command:

```bash
helm -n $MYNAMESPACE uninstall locust

```

## Locust from the command line

To run Locust from the terminal, you need to be connected to the cluster where Locust was installed, as described in the previous steps. Then, access the locust-master pod by following the steps below.

```bash
MYNAMESPACE="CHANGE HERE"

# Find the name of the locust-master pod
kubectl get pod -n $MYNAMESPACE -l component=master

POD_NAME="CHANGE HERE"

# Access the locust pod
kubectl exec -it pod/$POD_NAME -n $MYNAMESPACE -- bash

```

Inside the pod, Locust lets you set the following parameters for the run:

| Parameters | Description |
|---|---|
| `-u` | Number of users |
| `-r` | Number of users started per second (ramp up) |
| `-t` | Test duration |
| `--headless` | Disables the web interface and starts the test immediately |
| `--html` | Generates an HTML report |
| `--csv` | Exports the data as CSV |
| `--host` | Target host of the tests |

Example:

```text
locust -f main.py --headless -u 800 -r 800 -t 5m --html report.html --csv dados --host http://kube-pires.test.svc.cluster.local

```

To export the reports generated by the test (`dados_stats.csv` and `report.html`), run the commands below in another terminal:

```text
POD_NAME="CHANGE HERE"
MYNAMESPACE="CHANGE HERE"
LOCAL_DIR="CHANGE HERE" # Local que deseja armazenar o relatório do teste executado

kubectl cp $POD_NAME:/home/locust/dados_stats.csv $LOCAL_DIR/dados_stats.csv -n $MYNAMESPACE
kubectl cp $POD_NAME:/home/locust/report.html $LOCAL_DIR/report.html -n $MYNAMESPACE

```

## References

- [https://locust.io/](https://locust.io/)
- [https://docs.locust.io/en/stable/what-is-locust.html](https://docs.locust.io/en/stable/what-is-locust.html)
- [https://github.com/deliveryhero/helm-charts/blob/master/stable/locust/README.md](https://github.com/deliveryhero/helm-charts/blob/master/stable/locust/README.md)
- [https://artifacthub.io/packages/helm/deliveryhero/locust](https://artifacthub.io/packages/helm/deliveryhero/locust)
