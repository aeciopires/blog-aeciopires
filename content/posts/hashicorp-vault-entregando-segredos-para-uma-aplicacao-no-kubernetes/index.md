---
title: "HashiCorp Vault: Entregando segredos para uma aplicação no Kubernetes"
slug: "hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes"
date: 2024-11-10T15:40:50-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "kubernetes", "tutoriais", "vault"]
tags: ["vault", "kubernetes", "helm", "gcp"]
description: "Este é o quarto post da série sobre o Vault. Você pode ver os posts anteriores clicando nos links a seguir:"
wp_id: 2972
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** testado com Vault 2.2.2, chart 0.34.1 e kind (Kubernetes 1.37): as duas aplicações recebem os segredos pelo Vault Agent. Correções: os arquivos dos deployments agora são criados com `<<'EOF'` (sem aspas, o shell apagava `$k` e `$v` do template do Vault Agent); aviso para liberar o namespace da aplicação no injector; imagem `hello-kubernetes` 1.11.0, que inicia com `node server.js` (não traz mais o `npm`).
{{< /alert >}}

Este é o quarto post da série sobre o Vault. Você pode ver os posts anteriores clicando nos links a seguir:

- [Conhecendo o Hashicorp Vault](/conhecendo-o-hashicorp-vault/)
- [Instalando o Hashicorp Vault no Kubernetes (GKE) usando o Helm e configurando um bucket GCS para armazenamento](/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [Export/Import de dados entre 2 Vault utilizando o Medusa](/export-import-de-dados-entre-2-vault-utilizando-o-medusa/)

Obrigado [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/) e [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) pelo apoio no dia a dia e compartilhamento do conhecimento com o Vault.

## Introdução

Considerando que o Vault está instalado e configurado no Kubernetes (veja os tutoriais anteriores desta série), mostrarei como gerenciar os segredos no Vault e compartilhá-los com duas aplicações que serão executadas no mesmo cluster. Vou mostrar cada etapa, desde a criação de um path no Vault para armazenar segredos até a configuração de um sidecar do Vault Agent em um arquivo de deployment, para que ele injete automaticamente os segredos no container de cada aplicação.

## Etapa 1: Criando o path KV no Vault

Primeiro, vamos criar o path do tipo **kv** no Vault, que é o repositório onde nossos segredos serão armazenados. O tipo **kv** (Key-Value) permite armazenar dados de configuração e segredos como variáveis de ambiente que podem ser acessadas pelas aplicações.

Acesse o cluster Kubernetes (esse passo será omitido, pois pode ser feito de diferentes formas. Escolha a mesma que usou para acessar o cluster durante a execução do segundo tutorial dessa série).

**Crie um port-forward do pod** `vault-0` para acessar a interface web do Vault e inicializá-lo.

```bash
kubectl port-forward pod/vault-0 8200:8200 -n vault
```

**Abra outro terminal e acesse o Vault:**

```bash
export VAULT_ADDR=http://127.0.0.1:8200

# Faça o login no vault
vault login
```

Crie o path **kv** no Vault para agrupar o conjunto de secrets de diferentes aplicações/microsserviços que se relacionam entre si. É nesse path que serão criados subpaths, um para cada aplicação/microsserviço, para hospedar os segredos.

**Atenção!!! Mude o nome do path kv de acordo com a sua necessidade.** Se preferir, pode usar a interface web do Vault em vez da linha de comando.

```bash
PATH_KV_NAME="my-group-secrets"
vault secrets enable -path=$PATH_KV_NAME --version=2 kv
```

Crie alguns segredos para cada aplicação no path recém-criado.

**Atenção!!! Mude o nome das aplicações, kv, nome de variável e valores de acordo com a sua necessidade.** Se preferir, pode usar a interface web do Vault em vez da linha de comando.

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

Cada comando mostrado anteriormente cria os paths `my-group-secrets/my-app-1 e my-group-secrets/my-app-2` e armazena os valores das variáveis `DB_PASSWORD, DB_USER, DB_HOST, DB_PORT e DB_NAME` com os respectivos conteúdos que serão acessados por cada aplicação.

Com o path KV configurado, o próximo passo é adicionar permissões de acesso para que somente usuários ou aplicações autorizadas possam ler e escrever segredos nesse path.

```bash
vault policy write policy-my-group-secrets -<<EOF
path "my-group-secrets/*" {
  capabilities = ["read", "list"]
}
EOF
```

Com a configuração definida para a política `policy-my-group-secrets`, **qualquer usuário ou aplicação que futuramente for associado a ela terá permissão apenas de leitura** no path `my-group-secrets`.

## Etapa 2: Criando uma Service Account no Kubernetes para Acesso ao Vault

Para garantir que apenas aplicações específicas no Kubernetes possam acessar o Vault, precisamos criar uma Service Account (SA) para cada aplicação.

**Atenção!!! Mude o nome e o conteúdo de cada arquivo de acordo com a sua necessidade.**

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

**Atenção!!! Para fins de demonstração, estou usando manifests YAML de forma simples, mas esses arquivos podem ser incorporados no helm chart de cada aplicação com configurações mais complexas, se necessário.**

Execute o seguinte comando para criar as service accounts no Kubernetes.

```bash
MY_NAMESPACE=my-namespace
kubectl create namespace $MY_NAMESPACE
kubectl apply -f sa-my-app-1.yaml -f sa-my-app-2.yaml -n $MY_NAMESPACE
```

{{< alert >}}
**Atenção:** o Vault Agent Injector só injeta o sidecar nos namespaces liberados no `values.yaml` do [post anterior](/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/) (`injector.namespaceSelector`, valor de exemplo `change-app-namespace`). Inclua o namespace da aplicação (aqui, `my-namespace`) nessa lista e reaplique o chart com o mesmo `helm upgrade --install` usado na instalação. Sem isso, os pods sobem sem o sidecar e sem os segredos.
{{< /alert >}}

Agora crie duas roles (uma para cada aplicação) associando a service account com a política `policy-my-group-secrets` para conseguir ler os segredos no path específico.

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

### Etapa 3: Configurando o Sidecar do Vault Agent no Deployment

Para que cada aplicação obtenha os segredos diretamente do Vault, adicione o Vault Agent como um container sidecar no deployment. Os arquivos de deployment completos serão mostrados adiante.

Perceba que na seção de annotations é correlacionada a role criada anteriormente para cada aplicação para conseguir ler os segredos no path específico.

Crie os arquivos de deployment de cada aplicação com os seguintes comandos.

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

Crie os deployments com o seguinte comando:

```bash
kubectl apply -f deployment-my-app-1.yaml -f deployment-my-app-2.yaml  -n $MY_NAMESPACE
```

Inspecione os pods com os seguintes comandos:

```bash
kubectl get pods,deploy,service -n $MY_NAMESPACE
kubectl describe pod/NAME_POD1 -n $MY_NAMESPACE
kubectl describe pod/NAME_POD2 -n $MY_NAMESPACE
```

Se tudo estiver configurado corretamente, dentro de cada conteiner principal será criado o arquivo `/vault/secrets/config` contendo todos os segredos cadastrados no path **kv** de cada aplicação no Vault.

Apesar de não aparecer na lista de variáveis de ambiente do container principal, esses segredos são carregados automaticamente com o comando `source /vault/secrets/config` no conteiner principal. Dessa forma, a aplicação conseguirá acessar os segredos corretamente.

Atenção!!! O Vault precisa estar configurado para injetar os conteineres sidecar no namespace que você está fazendo o deploy das aplicações. Isso é definido no arquivo `values.yaml` da instalação do Vault usando helm chart, conforme mostrado no segundo tutorial desta série: [/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/](/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)

## Conclusão

O Vault Agent atua como intermediário, buscando e injetando segredos no container principal da aplicação. Com as etapas mostradas neste tutorial, você tem condições de configurar uma solução segura para gerenciar segredos no Kubernetes com o HashiCorp Vault, garantindo que cada aplicação receba apenas os segredos necessários.

## Referências

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
