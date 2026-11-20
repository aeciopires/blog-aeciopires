---
title: "Instalando o Hashicorp Vault no Kubernetes (GKE) usando o Helm e configurando um bucket GCS para armazenamento"
slug: "instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento"
date: 2024-09-28T03:30:19-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "kubernetes", "tutoriais", "vault"]
tags: ["gcp", "helm", "kubernetes", "vault"]
description: "Este é o segundo post da série sobre o Vault. Clique aqui para ver o primeiro post e conhecer um pouco sobre essa ferramenta."
wp_id: 2932
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** chart `hashicorp/vault` 0.34.1, Vault 2.2.2 e vault-k8s 1.7.7. Testado num cluster kind com 3 workers (Kubernetes 1.37): HA com 3 réplicas, armazenamento `gcs` (num emulador local da API do GCS), init, unseal, login e configuração do método de autenticação `kubernetes`. O auto-unseal pelo Cloud KMS não pôde ser testado localmente. A conferência do token da service account passou a usar `kubectl describe secret`, porque o kubectl atual não mostra mais o campo `Tokens`. Incluído um aviso sobre o `helm upgrade` com o Helm 4.
{{< /alert >}}

Este é o segundo post da série sobre o Vault. [Clique aqui para ver o primeiro post](/conhecendo-o-hashicorp-vault/) e conhecer um pouco sobre essa ferramenta.

Obrigado [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/) e [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) pelo apoio no dia a dia e compartilhamento do conhecimento com o Vault.

## **Requisitos**

- O cluster [Kubernetes](https://kubernetes.io/) já deve estar criado e você deve ter permissão para instalar aplicações. Neste caso, estou usando um cluster [Google Kubernetes Engine (GKE) Standard](https://cloud.google.com/kubernetes-engine/docs/concepts/kubernetes-engine-overview?hl=pt-br). Você pode adaptar o procedimento, comandos e configurações de acordo com a sua necessidade. Neste caso, estou usando o [Kuberentes na versão 1.30](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.30.md) **(este passo não será mostrado no tutorial)**.
- O kubectl também precisa estar instalado no seu computador e conectado ao cluster Kubernetes. Neste caso, estou usando o [kubectl na versão 1.30](https://v1-30.docs.kubernetes.io/pt-br/docs/tasks/tools/install-kubectl-linux/) **(este passo não será mostrado no tutorial)**.
- O binário do [helm](https://helm.sh/) também precisa estar instalado no seu computador. Neste caso, estou usando o [helm 3.16](https://helm.sh/docs/intro/install/) **(este passo não será mostrado no tutorial)**.
- Vai precisar ter o pacote [jq](https://jqlang.org/) instalado no sistema operacional ( **este passo não será mostrado no tutoriail**);
- Crie um [bucket GCS](https://cloud.google.com/storage?hl=en) para armazenar os dados do vault **(este passo não será mostrado no tutorial)**;
- Crie um [KMS (Key Management Service)](https://cloud.google.com/security/products/security-key-management?hl=pt-BR) e uma [chave simétrica](https://www.hostinger.com.br/tutoriais/o-que-e-criptografia) para uso o vault criptografar/descriptografar os segredos armazenados no bucket **(este passo não será mostrado no tutorial)**;
- Crie um role IAM customizada com as seguintes permissões **(este passo não será mostrado no tutorial)**.
  - cloudkms.cryptoKeyVersions.useToDecrypt
  - cloudkms.cryptoKeyVersions.useToEncrypt
  - cloudkms.cryptoKeys.get
  - storage.objects.create
  - storage.objects.delete
  - storage.objects.get
  - storage.objects.list
  - storage.objects.update
- Crie uma service account na GCP associando a role IAM customizada **(este passo não será mostrado no tutorial)**.
- Na service account, crie um chave JSON sem tempo de expiração (duração infinita) e salve o arquivo como credentials.json **(este passo não será mostrado no tutorial)**.

### **Instalando o Vault no Kubernetes usando Helm**

O [Helm](https://helm.sh/) facilita muito a instalação de aplicações no cluster Kubernetes. Execute os passos a seguir.

**Adicione o repositório Helm da HashiCorp.**

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
```

**Atualize todos os repositórios Helm para obter as versões mais recentes.**

```bash
helm repo update
```

**Verifique todas as versões disponíveis do helm chart do Vault**

```bash
helm search repo vault --versions
```

**Obtenha o helm values padrão para um arquivo e customize os valores de acordo com a necessidade.** Tem muita opção!!! Após as referências deste tutorial, tem um arquivo de exemplo para um ambiente de dev/test. Mas lembre-se de mudar os valores que começam com a palavra **change**.

```bash
VAULT_CHART_VERSION=0.34.1

helm show values hashicorp/vault --version "$VAULT_CHART_VERSION" > values.yaml
```

**Crie uma secret no Kubernetes associando o arquivo** **credentials.json** da service account a ser usada pelo Vault para acessar o bucket GCS e o KMS.

```bash
kubectl create namespace vault

kubectl create secret generic vault-gcp-creds --from-file=credentials.json -n vault
```

**Instale o Vault**.

```bash
helm upgrade --install vault \
  hashicorp/vault --version "$VAULT_CHART_VERSION" -f values.yaml \
  --namespace vault --create-namespace --debug --timeout=900s --wait
```

{{< alert >}}
**Helm 4:** a partir da segunda execução (`helm upgrade` de uma release já instalada), o comando pode falhar com `conflict ... clientConfig.caBundle`, porque o injector do Vault atualiza esse campo e o Helm 4 aplica os manifestos no modo _server-side_. Acrescente `--server-side=false` ao comando, como indicado no [repositório oficial do chart](https://github.com/hashicorp/vault-helm/pull/1223). O Helm 3 não tem esse problema.
{{< /alert >}}

**Visualize todos os objetos relacionados ao Vault.**

```bash
kubectl get all -n vault
```

Os pods `vault-0`, `vault-1` e `vault-2` implantados executam um servidor Vault e relatam que estão em execução, mas não estão prontos (0/1). Isso ocorre porque a verificação de status definida em um **readinessProbe** retorna um código de saída diferente de zero.

O pod `vault-agent-injector` implantado é um _Kubernetes Mutation Webhook Controller_. O controlador intercepta eventos de pod e aplica mutações ao pod se houver anotações específicas na solicitação.

**Recupere o status do Vault no pod** `vault-0`.

```bash
kubectl exec vault-0 --namespace vault -- vault status
```

O comando status relata que o Vault não foi inicializado e que está lacrado. Para que o Vault seja autenticado com o Kubernetes e gerencie segredos, é necessário que ele seja inicializado e deslacrado.

### Inicializando e unseal do Vault

**Crie um port-forward do pod** `vault-0` para acessar a interface web do Vault e inicializá-lo.

```bash
kubectl port-forward pod/vault-0 8200:8200 -n vault
```

**Abra outro terminal e inicialize o Vault:**

```bash
export VAULT_ADDR=http://127.0.0.1:8200

# O comando a seguir irá gerar o token root de acesso ao vault e 5 chaves de recuperação do Vault. Guarde em local seguro e vamos utilizar ao longo do tutorial e no dia a dia.

vault operator init

# Deslacre o vault
vault operator unseal

# Faça o login no vault
vault login

# Opcionalmente, se o token raiz inicial for perdido, você pode usar o comando a seguir para gerar um novo token raiz

# vault operator generate-root
```

**Atenção!!!** Caso o Vault continue com o status sealed após a execução do comando "vault operator unseal", acesse a interface web na URL [http://127.0.0.1:8200](http://127.0.0.1:8200) e informe os valores das 3 primeiras chaves unseal geradas pelo comando "vault operator init".

**Obtenha novamente o status do Vault no pod** `vault-0`.

```bash
kubectl exec vault-0 --namespace vault -- vault status
```

O servidor Vault é inicializado e deslacrado ( _unsealed_).

### Crie um token inicial k8s

Obtenha os detalhes da service account do Vault no cluster Kubernetes.

```bash
kubectl describe serviceaccount vault -n vault
```

Nas versões antigas do kubectl, o fim do resultado mostrava algo semelhante a:

```text
Tokens: <nenhum>
Eventos: <nenhum>
```

O kubectl atual (testado na versão 1.37) não exibe mais o campo `Tokens`.

ATENÇÃO!!! No Kubernetes 1.24+, o token não é criado automaticamente, e você deve criá-lo explicitamente.

Crie um arquivo de secret com os seguintes comandos.

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

Crie a secret com o seguinte comando.

```bash
kubectl apply -f vault-secret.yaml -n vault
```

Crie uma variável chamada VAULT\_HELM\_SECRET\_NAME que armazena o token gerado pela secret (isso será usado adiante).

```text
VAULT_HELM_SECRET_NAME=$(kubectl -n vault get secrets --output=json | jq -r '.items[].metadata | select(.name|startswith("vault-token-")).name')
```

Confira se o Kubernetes preencheu o token na secret (campos `token` e `ca.crt`), como mostra a [documentação oficial](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#manually-create-an-api-token-for-a-serviceaccount).

```bash
kubectl describe secret vault-token-g955r -n vault
```

## Configure o acesso do Kubernetes à API do Vault

O Vault fornece um método de autenticação do Kubernetes que permite que os microsserviços se autentiquem com um token da service account do Kubernetes.

Habilite o método de autenticação do Kubernetes.

```bash
export VAULT_ADDR=http://127.0.0.1:8200

vault login
vault auth enable kubernetes
```

O Vault aceita este token de serviço de qualquer pod dentro do cluster do Kubernetes. Durante a autenticação, o Vault verifica se o token da service account é válido. Para configurá-lo corretamente, é necessário capturar o token da web JSON (JWT) para a service account, o certificado da Autoridade Certificadora do cluster Kubernetes e a URL do host interno do GKE.

Obtenha o token da web JSON (JWT) do segredo.

```bash
export VAULT_ADDR=http://127.0.0.1:8200

vault login

TOKEN_REVIEW_JWT=$(kubectl -n vault get secret $VAULT_HELM_SECRET_NAME --output='go-template={{ .data.token }}' | base64 --decode)
```

Recupere o certificado da CA do Kubernetes.

```text
KUBE_CA_CERT=$(kubectl config view --raw --minify --flatten --output='jsonpath={.clusters[].cluster.certificate-authority-data}' | base64 --decode)
```

Recupere a URL interna do host do cluster GKE.

```text
CLUSTER_NAME="change-gke-name"
GKE_REGION="change-gcp-region"
GKE_PROJECT="change-gcp-project"

KUBE_HOST=$(gcloud container clusters describe $CLUSTER_NAME --region $GKE_REGION --project $GKE_PROJECT --format="value(privateClusterConfig.privateEndpoint)")
```

Você pode cadastrar no Vault o nome do emissor do cluster Kubernetes usando este método.

```bash
vault write auth/kubernetes/config \
     token_reviewer_jwt="$TOKEN_REVIEW_JWT" \
     kubernetes_host="https://${KUBE_HOST}" \
     kubernetes_ca_cert="$KUBE_CA_CERT" \
     issuer="https://kubernetes.default.svc.cluster.local"
```

### **Desistalando o Vault**

Se precisar remover o Vault, use o seguinte comando:

```bash
helm uninstall vault -n vault
```

### **Referências**

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

### **Values.yaml de exemplo**

```text
# Vault Helm Chart Value Overrides
global:
  enabled: true

injector:
  enabled: true
  replicas: 3
  affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app
              operator: In
              values:
                - vault
        topologyKey: "kubernetes.io/hostname"

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
