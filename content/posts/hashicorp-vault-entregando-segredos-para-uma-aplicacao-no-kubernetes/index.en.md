---
title: "HashiCorp Vault: Delivering secrets to an application on Kubernetes"
slug: "hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes"
date: 2024-11-10T15:40:50-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "kubernetes", "tutoriais", "vault"]
tags: ["vault", "kubernetes", "helm", "gcp"]
description: "This is the fourth post in the Vault series. You can see the previous posts by clicking the links below:"
sourceHash: "2d4ec637ee4f8039"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** tested with Vault 2.2.2, chart 0.34.1, and kind (Kubernetes 1.37): both applications receive their secrets through the Vault Agent. Fixes: the deployment files are now created with `<<'EOF'` (without the quotes, the shell erased `$k` and `$v` from the Vault Agent template); a note about allowing the application's namespace in the injector; the `hello-kubernetes` 1.11.0 image, which starts with `node server.js` (it no longer ships `npm`).
{{< /alert >}}

This is the fourth post in the Vault series. You can see the previous posts by clicking the links below:

- [Getting to know HashiCorp Vault](/en/conhecendo-o-hashicorp-vault/)
- [Installing HashiCorp Vault on Kubernetes (GKE) using Helm and configuring a GCS bucket for storage](/en/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [Exporting/importing data between 2 Vaults using Medusa](/en/export-import-de-dados-entre-2-vault-utilizando-o-medusa/)

Thanks to [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/), and [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) for their day-to-day support and for sharing their knowledge of Vault.

## Introduction

Assuming Vault is installed and configured on Kubernetes (see the previous tutorials in this series), I will show how to manage secrets in Vault and share them with two applications that will run in the same cluster. I will walk through each step, from creating a path in Vault to store secrets to configuring a Vault Agent sidecar in a deployment file, so that it automatically injects the secrets into each application's container.

## Step 1: Creating the KV path in Vault

First, let's create a path of type **kv** in Vault, which is the repository where our secrets will be stored. The **kv** (Key-Value) type lets you store configuration data and secrets as environment variables that applications can access.

Access the Kubernetes cluster (this step is omitted because it can be done in different ways. Use the same method you used to access the cluster while following the second tutorial in this series).

**Create a port-forward to the pod** `vault-0` to access the Vault web interface and initialize it.

```bash
kubectl port-forward pod/vault-0 8200:8200 -n vault
```

**Open another terminal and access Vault:**

```bash
export VAULT_ADDR=http://127.0.0.1:8200

# Log in to vault
vault login
```

Create the **kv** path in Vault to group the set of secrets of different applications/microservices that are related to each other. Subpaths will be created under this path, one for each application/microservice, to hold the secrets.

**Attention!!! Change the kv path name according to your needs.** If you prefer, you can use the Vault web interface instead of the command line.

```bash
PATH_KV_NAME="my-group-secrets"
vault secrets enable -path=$PATH_KV_NAME --version=2 kv
```

Create some secrets for each application in the newly created path.

**Attention!!! Change the application names, kv, variable names, and values according to your needs.** If you prefer, you can use the Vault web interface instead of the command line.

```bash
vault kv put $PATH_KV_NAME/my-app-1 \
  DB_PASSWORD="password1" \
  DB_USER="user1" \
  DB_HOST="172.17.0.1" \
  DB_PORT="5432" \
  DB_NAME="db1"
```

```bash
vault kv put $PATH_KV_NAME/my-app-2 \
  DB_PASSWORD="password2" \
  DB_USER="user2" \
  DB_HOST="172.17.0.2" \
  DB_PORT="3306" \
  DB_NAME="db2"
```

The commands above create the paths `my-group-secrets/my-app-1 e my-group-secrets/my-app-2` and store the values of the variables `DB_PASSWORD, DB_USER, DB_HOST, DB_PORT e DB_NAME` with the respective contents that each application will access.

With the KV path configured, the next step is to add access permissions so that only authorized users or applications can read and write secrets in this path.

```bash
vault policy write policy-my-group-secrets -<<EOF
path "my-group-secrets/*" {
  capabilities = ["read", "list"]
}
EOF
```

With this configuration defined for the `policy-my-group-secrets` policy, **any user or application associated with it in the future will have read-only permission** on the `my-group-secrets` path.

## Step 2: Creating a service account in Kubernetes to access Vault

To ensure that only specific applications in Kubernetes can access Vault, we need to create a Service Account (SA) for each application.

**Attention!!! Change the name and content of each file according to your needs.**

```bash
cat <<EOF > sa-my-app-1.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sa-my-app-1
EOF
```

```bash
cat <<EOF > sa-my-app-2.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sa-my-app-2
EOF
```

**Attention!!! For demonstration purposes, I'm using simple YAML manifests, but these files can be incorporated into each application's helm chart with more complex configurations, if needed.**

Run the following command to create the service accounts in Kubernetes.

```bash
MY_NAMESPACE=my-namespace
kubectl create namespace $MY_NAMESPACE
kubectl apply -f sa-my-app-1.yaml -f sa-my-app-2.yaml -n $MY_NAMESPACE
```

{{< alert >}}
**Attention:** the Vault Agent Injector only injects the sidecar into the namespaces allowed in the `values.yaml` from the [previous post](/en/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/) (`injector.namespaceSelector`, example value `change-app-namespace`). Add the application's namespace (here, `my-namespace`) to that list and reapply the chart with the same `helm upgrade --install` used during installation. Without this, the pods start without the sidecar and without the secrets.
{{< /alert >}}

Now create two roles (one for each application) that bind the service account to the `policy-my-group-secrets` policy so it can read the secrets in the specific path.

```bash
# Role role-my-app-1
vault write "auth/kubernetes/role/role-my-app-1" \
  bound_service_account_names="sa-my-app-1" \
  bound_service_account_namespaces="$MY_NAMESPACE" \
  token_policies="policy-my-group-secrets"
```

```bash
# Role role-my-app-2
vault write "auth/kubernetes/role/role-my-app-2" \
  bound_service_account_names="sa-my-app-2" \
  bound_service_account_namespaces="$MY_NAMESPACE" \
  token_policies="policy-my-group-secrets"
```

## Step 3: Configuring the Vault Agent sidecar in the deployment

For each application to get its secrets directly from Vault, add the Vault Agent as a sidecar container in the deployment. The complete deployment files are shown below.

Note that the annotations section references the role created earlier for each application, so it can read the secrets in the specific path.

Create each application's deployment file with the following commands.

```bash
cat <<'EOF' > deployment-my-app-1.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-1
spec:
  type: ClusterIP
  ports:
    - port: 80
      protocol: TCP
      targetPort: 8080
  selector:
    app: my-app-1
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: my-app-1
  name: my-app-1
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: my-app-1
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: my-app-1
      annotations:
        vault.hashicorp.com/agent-init-first: "true"
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/agent-requests-cpu: "10m"
        vault.hashicorp.com/agent-requests-mem: "32Mi"
        vault.hashicorp.com/agent-limits-cpu: "20m"
        vault.hashicorp.com/agent-limits-mem: "64Mi"
        vault.hashicorp.com/role: "role-my-app-1"
        vault.hashicorp.com/agent-inject-secret-config: "my-group-secrets/my-app-1"
        vault.hashicorp.com/agent-inject-template-config: |
          {{- with secret "my-group-secrets/my-app-1" -}}
          {{ range $k, $v := .Data.data }}
          export {{ $k }}="{{ $v }}"
          {{ end }}
          {{- end }}
    spec:
      serviceAccountName: sa-my-app-1
      containers:
      - name: my-app-1
        image: paulbouwer/hello-kubernetes:1.11.0
        ports:
          - containerPort: 8080
        imagePullPolicy: IfNotPresent
        command: ["sh", "-c"]
        args: ["source /vault/secrets/config && node server.js"]
        resources:
          limits:
            memory: "128Mi"
            cpu: "200m"
          requests:
            memory: "64Mi"
            cpu: "50m"
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
EOF
```

```bash
cat <<'EOF' > deployment-my-app-2.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-2
spec:
  type: ClusterIP
  ports:
    - port: 80
      protocol: TCP
      targetPort: 8080
  selector:
    app: my-app-2
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: my-app-2
  name: my-app-2
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: my-app-2
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: my-app-2
      annotations:
        vault.hashicorp.com/agent-init-first: "true"
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/agent-requests-cpu: "10m"
        vault.hashicorp.com/agent-requests-mem: "32Mi"
        vault.hashicorp.com/agent-limits-cpu: "20m"
        vault.hashicorp.com/agent-limits-mem: "64Mi"
        vault.hashicorp.com/role: "role-my-app-2"
        vault.hashicorp.com/agent-inject-secret-config: "my-group-secrets/my-app-2"
        vault.hashicorp.com/agent-inject-template-config: |
          {{- with secret "my-group-secrets/my-app-2" -}}
          {{ range $k, $v := .Data.data }}
          export {{ $k }}="{{ $v }}"
          {{ end }}
          {{- end }}
    spec:
      serviceAccountName: sa-my-app-2
      containers:
      - name: my-app-2
        image: paulbouwer/hello-kubernetes:1.11.0
        ports:
          - containerPort: 8080
        imagePullPolicy: IfNotPresent
        command: ["sh", "-c"]
        args: ["source /vault/secrets/config && node server.js"]
        resources:
          limits:
            memory: "128Mi"
            cpu: "200m"
          requests:
            memory: "64Mi"
            cpu: "50m"
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
EOF
```

Create the deployments with the following command:

```bash
kubectl apply -f deployment-my-app-1.yaml -f deployment-my-app-2.yaml  -n $MY_NAMESPACE
```

Inspect the pods with the following commands:

```bash
kubectl get pods,deploy,service -n $MY_NAMESPACE
kubectl describe pod/NAME_POD1 -n $MY_NAMESPACE
kubectl describe pod/NAME_POD2 -n $MY_NAMESPACE
```

If everything is configured correctly, the file `/vault/secrets/config` will be created inside each main container, containing all the secrets registered in each application's **kv** path in Vault.

Although they don't show up in the main container's list of environment variables, these secrets are loaded automatically by the `source /vault/secrets/config` command in the main container. This way, the application can access the secrets correctly.

Attention!!! Vault must be configured to inject the sidecar containers into the namespace where you are deploying the applications. This is defined in the `values.yaml` file of the Vault installation using the helm chart, as shown in the second tutorial in this series: [/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/](/en/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)

## Conclusion

The Vault Agent acts as an intermediary, fetching secrets and injecting them into the application's main container. With the steps shown in this tutorial, you can set up a secure solution for managing secrets on Kubernetes with HashiCorp Vault, ensuring that each application receives only the secrets it needs.

## References

- [https://medium.com/@verove.clement/inject-secret-in-application-from-vault-agent-injector-60a3fe71628e](https://medium.com/@verove.clement/inject-secret-in-application-from-vault-agent-injector-60a3fe71628e)
- [https://developer.hashicorp.com/vault/docs/platform/k8s/injector/examples](https://developer.hashicorp.com/vault/docs/platform/k8s/injector/examples)
- [https://developer.hashicorp.com/vault/docs/commands/kv](https://developer.hashicorp.com/vault/docs/commands/kv)
- [https://developer.hashicorp.com/vault/docs/platform/k8s/injector/annotations](https://developer.hashicorp.com/vault/docs/platform/k8s/injector/annotations)
- [https://www.youtube.com/watch?v=BSAsUdLVivk](https://www.youtube.com/watch?v=BSAsUdLVivk)
- [https://medium.com/hashicorp-engineering/hashicorp-vault-delivering-secrets-with-kubernetes-1b358c03b2a3](https://medium.com/hashicorp-engineering/hashicorp-vault-delivering-secrets-with-kubernetes-1b358c03b2a3)
- [https://evoila.com/blog/inject-secrets-with-vault-agent-injector/](https://evoila.com/blog/inject-secrets-with-vault-agent-injector/)
- [https://github.com/tiwarisanjay/argocd-everything/blob/main/argocd-ha-vault-sso/README.md](https://github.com/tiwarisanjay/argocd-everything/blob/main/argocd-ha-vault-sso/README.md)
- [https://www.youtube.com/watch?v=MgHHejAIh50](https://www.youtube.com/watch?v=MgHHejAIh50)
- [https://www.youtube.com/watch?v=R3EYd9YnShU](https://www.youtube.com/watch?v=R3EYd9YnShU)
