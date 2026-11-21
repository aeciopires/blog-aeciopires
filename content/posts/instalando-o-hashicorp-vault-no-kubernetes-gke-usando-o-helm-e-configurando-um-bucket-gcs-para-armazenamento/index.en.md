---
title: "Installing HashiCorp Vault on Kubernetes (GKE) using Helm and configuring a GCS bucket for storage"
slug: "instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento"
date: 2024-09-28T03:30:19-03:00
lastmod: 2026-11-21T13:11:21-03:00
draft: false
categories: ["cluster", "devops", "docker", "kubernetes", "tutoriais", "vault"]
tags: ["gcp", "helm", "kubernetes", "vault"]
description: "This is the second post in the series about Vault. Click here to see the first post and learn a bit about this tool."
sourceHash: "62fd28841a23e705"
---

{{< alert icon="circle-info" >}}
**Updated on November 21, 2026:** in the example values.yaml, the injector anti-affinity rule was outside `injector.affinity` and was ignored by the chart; it now uses the default value from the official values.yaml of chart 0.34.1. On November 20, 2026: `hashicorp/vault` chart 0.34.1, Vault 2.2.2, and vault-k8s 1.7.7. Tested on a kind cluster with 3 workers (Kubernetes 1.37): HA with 3 replicas, `gcs` storage (on a local GCS API emulator), init, unseal, login, and configuration of the `kubernetes` auth method. Auto-unseal through Cloud KMS could not be tested locally. Checking the service account token now uses `kubectl describe secret`, because the current kubectl no longer shows the `Tokens` field. Added a note about `helm upgrade` with Helm 4.
{{< /alert >}}

This is the second post in the series about Vault. [Click here to see the first post](/en/conhecendo-o-hashicorp-vault/) and learn a bit about this tool.

Thanks to [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/), and [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) for their day-to-day support and for sharing their knowledge of Vault.

## **Requirements**

- The [Kubernetes](https://kubernetes.io/) cluster must already be created, and you must have permission to install applications. In this case, I am using a [Google Kubernetes Engine (GKE) Standard](https://cloud.google.com/kubernetes-engine/docs/concepts/kubernetes-engine-overview?hl=pt-br) cluster. You can adapt the procedure, commands, and settings to your needs. In this case, I am using [Kubernetes version 1.30](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.30.md) **(this step will not be shown in the tutorial)**.
- kubectl also needs to be installed on your computer and connected to the Kubernetes cluster. In this case, I am using [kubectl version 1.30](https://v1-30.docs.kubernetes.io/pt-br/docs/tasks/tools/install-kubectl-linux/) **(this step will not be shown in the tutorial)**.
- The [helm](https://helm.sh/) binary also needs to be installed on your computer. In this case, I am using [helm 3.16](https://helm.sh/docs/intro/install/) **(this step will not be shown in the tutorial)**.
- You will need the [jq](https://jqlang.org/) package installed on the operating system ( **this step will not be shown in the tutorial**);
- Create a [GCS bucket](https://cloud.google.com/storage?hl=en) to store the Vault data **(this step will not be shown in the tutorial)**;
- Create a [KMS (Key Management Service)](https://cloud.google.com/security/products/security-key-management?hl=pt-BR) and a [symmetric key](https://www.hostinger.com.br/tutoriais/o-que-e-criptografia) (in Portuguese) for Vault to encrypt/decrypt the secrets stored in the bucket **(this step will not be shown in the tutorial)**;
- Create a custom IAM role with the following permissions **(this step will not be shown in the tutorial)**.
  - cloudkms.cryptoKeyVersions.useToDecrypt
  - cloudkms.cryptoKeyVersions.useToEncrypt
  - cloudkms.cryptoKeys.get
  - storage.objects.create
  - storage.objects.delete
  - storage.objects.get
  - storage.objects.list
  - storage.objects.update
- Create a service account in GCP bound to the custom IAM role **(this step will not be shown in the tutorial)**.
- In the service account, create a JSON key with no expiration time (infinite duration) and save the file as credentials.json **(this step will not be shown in the tutorial)**.

### **Installing Vault on Kubernetes using Helm**

[Helm](https://helm.sh/) makes it much easier to install applications on the Kubernetes cluster. Follow the steps below.

**Add the HashiCorp Helm repository.**

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
```

**Update all Helm repositories to get the latest versions.**

```bash
helm repo update
```

**Check all available versions of the Vault Helm chart**

```bash
helm search repo vault --versions
```

**Save the default Helm values to a file and customize them as needed.** There are a lot of options!!! After the references in this tutorial, there is an example file for a dev/test environment. But remember to change the values that start with the word **change**.

```bash
VAULT_CHART_VERSION=0.34.1

helm show values hashicorp/vault --version "$VAULT_CHART_VERSION" > values.yaml
```

**Create a secret in Kubernetes containing the** **credentials.json** file of the service account that Vault will use to access the GCS bucket and KMS.

```bash
kubectl create namespace vault

kubectl create secret generic vault-gcp-creds --from-file=credentials.json -n vault
```

**Install Vault**.

```bash
helm upgrade --install vault \
  hashicorp/vault --version "$VAULT_CHART_VERSION" -f values.yaml \
  --namespace vault --create-namespace --debug --timeout=900s --wait
```

{{< alert >}}
**Helm 4:** starting with the second run (`helm upgrade` of an already installed release), the command may fail with `conflict ... clientConfig.caBundle`, because the Vault injector updates this field and Helm 4 applies manifests in _server-side_ mode. Add `--server-side=false` to the command, as indicated in the [official chart repository](https://github.com/hashicorp/vault-helm/pull/1223). Helm 3 does not have this problem.
{{< /alert >}}

**View all Vault-related objects.**

```bash
kubectl get all -n vault
```

The deployed `vault-0`, `vault-1`, and `vault-2` pods run a Vault server and report that they are running but not ready (0/1). This happens because the status check defined in a **readinessProbe** returns a non-zero exit code.

The deployed `vault-agent-injector` pod is a _Kubernetes Mutation Webhook Controller_. The controller intercepts pod events and applies mutations to the pod if specific annotations exist on the request.

**Get the Vault status on the** `vault-0` **pod**.

```bash
kubectl exec vault-0 --namespace vault -- vault status
```

The status command reports that Vault is not initialized and that it is sealed. For Vault to authenticate with Kubernetes and manage secrets, it must be initialized and unsealed.

### Initializing and unsealing Vault

**Create a port-forward to the** `vault-0` **pod** to access the Vault web UI and initialize it.

```bash
kubectl port-forward pod/vault-0 8200:8200 -n vault
```

**Open another terminal and initialize Vault:**

```bash
export VAULT_ADDR=http://127.0.0.1:8200

# The following command will generate the root token to access Vault and 5 Vault recovery keys. Keep them in a safe place; we will use them throughout the tutorial and day to day.

vault operator init

# Unseal Vault
vault operator unseal

# Log in to Vault
vault login

# Optionally, if the initial root token is lost, you can use the following command to generate a new root token

# vault operator generate-root
```

**Attention!!!** If Vault remains sealed after running the "vault operator unseal" command, open the web UI at [http://127.0.0.1:8200](http://127.0.0.1:8200) and enter the values of the first 3 unseal keys generated by the "vault operator init" command.

**Get the Vault status on the** `vault-0` **pod again**.

```bash
kubectl exec vault-0 --namespace vault -- vault status
```

The Vault server is now initialized and unsealed.

### Create an initial k8s token

Get the details of the Vault service account in the Kubernetes cluster.

```bash
kubectl describe serviceaccount vault -n vault
```

In older kubectl versions, the end of the output showed something similar to:

```text
Tokens: <nenhum>
Eventos: <nenhum>
```

The current kubectl (tested with version 1.37) no longer displays the `Tokens` field.

ATTENTION!!! On Kubernetes 1.24+, the token is not created automatically, and you must create it explicitly.

Create a secret file with the following commands.

```bash
cat > vault-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: vault-token-g955r
  annotations:
    kubernetes.io/service-account.name: vault
type: kubernetes.io/service-account-token
EOF
```

Create the secret with the following command.

```bash
kubectl apply -f vault-secret.yaml -n vault
```

Create a variable called VAULT\_HELM\_SECRET\_NAME that stores the token generated by the secret (this will be used later).

```text
VAULT_HELM_SECRET_NAME=$(kubectl -n vault get secrets --output=json | jq -r '.items[].metadata | select(.name|startswith("vault-token-")).name')
```

Check that Kubernetes populated the token in the secret (the `token` and `ca.crt` fields), as shown in the [official documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#manually-create-an-api-token-for-a-serviceaccount).

```bash
kubectl describe secret vault-token-g955r -n vault
```

## Configure Kubernetes access to the Vault API

Vault provides a Kubernetes auth method that allows microservices to authenticate with a Kubernetes service account token.

Enable the Kubernetes auth method.

```bash
export VAULT_ADDR=http://127.0.0.1:8200

vault login
vault auth enable kubernetes
```

Vault accepts this service token from any pod within the Kubernetes cluster. During authentication, Vault checks whether the service account token is valid. To configure it correctly, you need to capture the JSON Web Token (JWT) for the service account, the Kubernetes cluster's Certificate Authority certificate, and the internal GKE host URL.

Get the JSON Web Token (JWT) from the secret.

```bash
export VAULT_ADDR=http://127.0.0.1:8200

vault login

TOKEN_REVIEW_JWT=$(kubectl -n vault get secret $VAULT_HELM_SECRET_NAME --output='go-template={{ .data.token }}' | base64 --decode)
```

Retrieve the Kubernetes CA certificate.

```text
KUBE_CA_CERT=$(kubectl config view --raw --minify --flatten --output='jsonpath={.clusters[].cluster.certificate-authority-data}' | base64 --decode)
```

Retrieve the internal host URL of the GKE cluster.

```text
CLUSTER_NAME="change-gke-name"
GKE_REGION="change-gcp-region"
GKE_PROJECT="change-gcp-project"

KUBE_HOST=$(gcloud container clusters describe $CLUSTER_NAME --region $GKE_REGION --project $GKE_PROJECT --format="value(privateClusterConfig.privateEndpoint)")
```

You can register the Kubernetes cluster issuer name in Vault using this method.

```bash
vault write auth/kubernetes/config \
     token_reviewer_jwt="$TOKEN_REVIEW_JWT" \
     kubernetes_host="https://${KUBE_HOST}" \
     kubernetes_ca_cert="$KUBE_CA_CERT" \
     issuer="https://kubernetes.default.svc.cluster.local"
```

### **Uninstalling Vault**

If you need to remove Vault, use the following command:

```bash
helm uninstall vault -n vault
```

### **References**

- [https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-google-cloud-gke](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-google-cloud-gke)
- [https://developer.hashicorp.com/vault/docs](https://developer.hashicorp.com/vault/docs)
- [https://developer.hashicorp.com/vault/docs/concepts/seal](https://developer.hashicorp.com/vault/docs/concepts/seal)
- [https://medium.com/@lingxiankong/vault-integration-with-kubernetes-unified-identity-management-service-36d9c8edddf0](https://medium.com/@lingxiankong/vault-integration-with-kubernetes-unified-identity-management-service-36d9c8edddf0)
- [https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-external-vault?in=vault%2Fkubernetes#configure-kubernetes-authentication](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-external-vault?in=vault%2Fkubernetes#configure-kubernetes-authentication)
- [https://stackoverflow.com/questions/76533818/vault-init-container-cannot-authenticate-to-vault](https://stackoverflow.com/questions/76533818/vault-init-container-cannot-authenticate-to-vault)
- [https://medium.com/adessoturkey/hashicorp-vault-authentication-options-465b5b8eb560](https://medium.com/adessoturkey/hashicorp-vault-authentication-options-465b5b8eb560)
- [https://support.hashicorp.com/hc/en-us/articles/4404389946387-Kubernetes-auth-method-Permission-Denied-error](https://support.hashicorp.com/hc/en-us/articles/4404389946387-Kubernetes-auth-method-Permission-Denied-error)
- [https://support.hashicorp.com/hc/en-us/articles/13772047777811-Getting-the-error-route-entry-is-tainted-when-performing-read-or-write-actions-on-a-custom-plugin](https://support.hashicorp.com/hc/en-us/articles/13772047777811-Getting-the-error-route-entry-is-tainted-when-performing-read-or-write-actions-on-a-custom-plugin)
- [https://discuss.hashicorp.com/t/info-agent-auth-handler-authenticating-url-put-http-x-x-svc-8200-v1-auth-kubernetes-login-code-403-permission-denied/61437](https://discuss.hashicorp.com/t/info-agent-auth-handler-authenticating-url-put-http-x-x-svc-8200-v1-auth-kubernetes-login-code-403-permission-denied/61437)
- [https://support.hashicorp.com/hc/en-us/articles/4417287569555-Vault-Agent-injector-ERROR-auth-handler-error-authenticating-error-context-deadline-exceeded](https://support.hashicorp.com/hc/en-us/articles/4417287569555-Vault-Agent-injector-ERROR-auth-handler-error-authenticating-error-context-deadline-exceeded)

### **Example values.yaml**

```text
# Vault Helm Chart Value Overrides
global:
  enabled: true

injector:
  enabled: true
  replicas: 3
  affinity: |
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app.kubernetes.io/name: {{ template "vault.name" . }}-agent-injector
              app.kubernetes.io/instance: "{{ .Release.Name }}"
              component: webhook
          topologyKey: kubernetes.io/hostname

  # image sets the repo and tag of the vault-k8s image to use for the injector.
  image:
    repository: "hashicorp/vault-k8s"
    tag: "1.7.7"
    pullPolicy: IfNotPresent

  # agentImage sets the repo and tag of the Vault image to use for the Vault Agent
  # containers.  This should be set to the official Vault image.  Vault 1.3.1+ is
  # required.
  agentImage:
    repository: "hashicorp/vault"
    tag: "2.2.2"

  # The default values for the injected Vault Agent containers.
  agentDefaults:
    # For more information on configuring resources, see the K8s documentation:
    # https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
    cpuLimit: "500m"
    cpuRequest: "250m"
    memLimit: "128Mi"
    memRequest: "64Mi"

  # Configures the log verbosity of the injector.
  # Supported log levels include: trace, debug, info, warn, error
  logLevel: "error"

  # Configures the log format of the injector. Supported log formats: "standard", "json".
  logFormat: "standard"

  # Security context for the pod template and the injector container
  # The default pod securityContext is:
  #   runAsNonRoot: true
  #   runAsGroup: {{ .Values.injector.gid | default 1000 }}
  #   runAsUser: {{ .Values.injector.uid | default 100 }}
  #   fsGroup: {{ .Values.injector.gid | default 1000 }}
  # and for container is
  #    allowPrivilegeEscalation: false
  #    capabilities:
  #      drop:
  #        - ALL
  securityContext:
    pod: {}
    container: {}

  resources: {}
  #resources:
  #  requests:
  #    memory: 256Mi
  #    cpu: 250m
  #  limits:
  #    memory: 256Mi
  #    cpu: 250m

  # A disruption budget limits the number of pods of a replicated application
  # that are down simultaneously from voluntary disruptions
  # Disable in dev to cost optimization
  podDisruptionBudget: {}
  #podDisruptionBudget:
  #  podDisruptionBudget:
  #    maxUnavailable: 1

  webhook:
    # Fix race condition vault-injector-sidecar:
    # https://discuss.hashicorp.com/t/vault-agent-injector-racing-condition-when-application-pods-utilizing-vault-sidecar-come-up-faster-then-vault/31297/7
    # https://github.com/hashicorp/vault-k8s/issues/415
    #
    # Configures failurePolicy of the webhook. The "unspecified" default behaviour depends on the
    # API Version of the WebHook.
    # To block pod creation while the webhook is unavailable, set the policy to `Fail` below.
    # See https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#failure-policy
    #
    failurePolicy: Fail

    # namespaceSelector is the selector for restricting the webhook to only
    # specific namespaces.
    # See https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#matching-requests-namespaceselector
    # for more details.
    # Example:
    # namespaceSelector:
    #    matchLabels:
    #      sidecar-injector: enabled
    namespaceSelector:
      matchExpressions:
        - key: kubernetes.io/metadata.name
          operator: In
          values: ["change-app-namespace"]

    # objectSelector is the selector for restricting the webhook to only
    # specific labels.
    # See https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#matching-requests-objectselector
    # for more details.
    # Example:
    # objectSelector:
    #    matchLabels:
    #      vault-sidecar-injector: enabled
    objectSelector: |
      matchExpressions:
      - key: app.kubernetes.io/name
        operator: NotIn
        values:
        - {{ template "vault.name" . }}-agent-injector

server:
  enabled: true

  image:
    repository: "hashicorp/vault"
    tag: "2.2.2"
    # Overrides the default Image Pull Policy
    pullPolicy: IfNotPresent

  # Configure the Update Strategy Type for the StatefulSet
  # See https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies
  updateStrategyType: "OnDelete"

  # Configure the logging verbosity for the Vault server.
  # Supported log levels include: trace, debug, info, warn, error
  logLevel: "error"

  # Configure the logging format for the Vault server.
  # Supported log formats include: standard, json
  logFormat: ""

  resources: {}
  #resources:
  #  requests:
  #    memory: 256Mi
  #    cpu: 250m
  #  limits:
  #    memory: 256Mi
  #    cpu: 250m

  # OpenShift only - create a route to expose the service
  # By default the created route will be of type passthrough
  route:
    enabled: false

    # When HA mode is enabled and K8s service registration is being used,
    # configure the route to point to the Vault active service.
    activeService: true

    labels: {}
    annotations: {}
    host: chart-example.local
    # tls will be passed directly to the route's TLS config, which
    # can be used to configure other termination methods that terminate
    # TLS at the router
    tls:
      termination: passthrough

  # extraEnvironmentVars is a list of extra environment variables to set with the stateful set. These could be
  # used to include variables required for auto-unseal.
  extraEnvironmentVars:
    #GOOGLE_REGION: change-gcp-region
    #GOOGLE_PROJECT: change-gcp-project
    GOOGLE_APPLICATION_CREDENTIALS: /vault/userconfig/gcp-creds/credentials.json

  # Deprecated: please use 'volumes' instead.
  # extraVolumes is a list of extra volumes to mount. These will be exposed
  # to Vault in the path `/vault/userconfig/<name>/`. The value below is
  # an array of objects, examples are shown below.
  extraVolumes: []
    # - type: secret (or "configMap")
    #   name: my-secret
    #   path: null # default is `/vault/userconfig`

  # volumes is a list of volumes made available to all containers. These are rendered
  # via toYaml rather than pre-processed like the extraVolumes value.
  # The purpose is to make it easy to share volumes between containers.
  volumes:
    - name: gcp-creds
      secret:
        secretName: vault-gcp-creds

  # volumeMounts is a list of volumeMounts for the main server container. These are rendered
  # via toYaml rather than pre-processed like the extraVolumes value.
  # The purpose is to make it easy to share volumes between containers.
  volumeMounts:
    - mountPath: /vault/userconfig/gcp-creds/
      name: gcp-creds
      readOnly: true

  standalone:
    enabled: false

  # Run Vault in "HA" mode. There are no storage requirements unless the audit log
  # persistence is required.  In HA mode Vault will configure itself to use Consul
  # for its storage backend.  The default configuration provided will work the Consul
  # Helm project by default.  It is possible to manually configure Vault to use a
  # different HA backend.
  ha:
    enabled: true
    replicas: 3

    raft:
      # Enables Raft integrated storage
      enabled: false

    # config is a raw string of default configuration when using a Stateful
    # deployment. Default is to use a Consul for its HA storage backend.
    # This should be HCL.

    # Note: Configuration files are stored in ConfigMaps so sensitive data
    # such as passwords should be either mounted through extraSecretEnvironmentVars
    # or through a Kube secret.  For more information see:
    # https://developer.hashicorp.com/vault/docs/platform/k8s/helm/run#protecting-sensitive-vault-configurations
    config: |
      ui = true

      listener "tcp" {
        tls_disable = "true"
        address = "[::]:8200"
        cluster_address = "[::]:8201"
      }

      seal "gcpckms" {
        project = "change-gcp-project"
        region = "change-gcp-region"
        key_ring = "change-gcp-kms-ring"
        crypto_key = "change-gcp-kms-key"
      }

      storage "gcs" {
        bucket = "change-gcp-bucket"
        ha_enabled = "true"
      }

      service_registration "kubernetes" {}

    # A disruption budget limits the number of pods of a replicated application
    # that are down simultaneously from voluntary disruptions
    # Disable in dev to cost optimization
    disruptionBudget:
      enabled: false

  securityContext:
    runAsNonRoot: true
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
        - ALL
      add: ["SYS_TIME"]

  # Affinity Settings
  # Commenting out or setting as empty the affinity variable, will allow
  # deployment to single node services such as Minikube
  # This should be either a multi-line string or YAML matching the PodSpec's affinity field.
  affinity: |
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app.kubernetes.io/name: {{ template "vault.name" . }}
              app.kubernetes.io/instance: "{{ .Release.Name }}"
              component: server
          topologyKey: kubernetes.io/hostname

# Vault UI
ui:
  # True if you want to create a Service entry for the Vault UI.
  #
  # serviceType can be used to control the type of service created. For
  # example, setting this to "LoadBalancer" will create an external load
  # balancer (for supported K8S installations) to access the UI.
  enabled: false
```
