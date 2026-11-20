---
title: "Usando o ArgoCD para gerenciar recursos na AWS"
slug: "usando-o-argocd-para-gerenciar-recursos-na-aws"
date: 2024-05-31T20:01:38-03:00
lastmod: 2024-11-17T22:04:36-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "tutoriais"]
tags: ["argocd", "aws", "gitops", "kubernetes", "helm"]
description: "O conteúdo deste tutorial é fruto de uma PoC realizada em conjunto com Isaac Mecchi e Guilherme Aguiar entre os dias 02/Abril e 07/Maio de 2024."
wp_id: 2909
---

**O conteúdo deste tutorial é fruto de uma PoC realizada em conjunto com [Isaac Mecchi](https://www.linkedin.com/in/isaacmecchi/) e [Guilherme Aguiar](https://www.linkedin.com/in/guilherme-aguiarr/) entre os dias 02/Abril e 07/Maio de 2024.**

## **Sobre Gitops** e ArgoCD

Em outro [tutorial](/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/), eu falei sobre a abordagem [GitOps](https://www.gitops.tech/) e uso do [Argo CD](https://argoproj.github.io/argo-cd/) para deploy de aplicações em clusters [Kubernetes](https://kubernetes.io/)… Recomendo a leitura para entender alguns conceitos antes de partir para o assunto que será explicado aqui.

### **Sobre o ACK**

**AWS Controllers for Kubernetes (ACK)** permite definir e usar recursos de serviço da AWS diretamente do Kubernetes. Com o ACK, você pode aproveitar os serviços gerenciados pela AWS para seus aplicativos Kubernetes sem precisar definir recursos fora do cluster ou executar serviços que fornecem recursos de suporte, como bancos de dados ou filas de mensagens dentro do cluster.

É uma outra forma de gerenciar recursos da AWS que serve de alternativa ao que já sabemos fazer com [Terraform](https://www.terraform.io/)/ [Terragrunt](https://terragrunt.gruntwork.io/), que permite usar o que há de melhor na abordagem GitOps e dar mais autonomia aos desenvolvedores.

Para saber mais informações sobre o ACK recomendo a leitura das páginas:

- [https://aws.amazon.com/blogs/containers/integrate-amazon-api-gateway-with-amazon-eks/](https://aws.amazon.com/blogs/containers/integrate-amazon-api-gateway-with-amazon-eks/)
- [https://aws-controllers-k8s.github.io/community/docs/community/overview/](https://aws-controllers-k8s.github.io/community/docs/community/overview/)
- [https://github.com/aws-controllers-k8s/community](https://github.com/aws-controllers-k8s/community)
- [https://aws.amazon.com/blogs/containers/aws-controllers-for-kubernetes-ack/](https://aws.amazon.com/blogs/containers/aws-controllers-for-kubernetes-ack/)

## **Requisitos**

Para executar os passos deste tutorial é necessário ter as seguintes ferramentas instaladas:

> O procedimento de instalação de cada uma delas não será abordado aqui para não ficar muito longo, mas você pode encontrar o procedimento de instalação na documentação oficial.

- **awscli**: [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **docker**: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- **kind**: [https://kind.sigs.k8s.io/docs/user/quick-start/](https://kind.sigs.k8s.io/docs/user/quick-start/) (O kind está sendo usado para criar um **cluster [Kubernetes](https://kubernetes.io/)** no ambiente local. Você pode usar outra ferramenta de sua preferência ou utilizar um cluster real criado no ambiente de cloud ou datacenter on-premisse)
- **kubectl**: [https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
- **helm**: [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/)

## **Instalando o ArgoCD no Kubernetes**

Instale o ArgoCD seguindo as instruções das seções abaixo contidas nesse tutorial: [/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/](/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/)

- **Instalando o Argo CD**
- **Instalando o Argo CD** **CLI** ( _Command Line Interface_)

## **Instalando o ACK de lambda**

Para cada tipo de recurso da AWS, existe um controller do ACK específico que irá gerenciar CRDs dentro do cluster Kubernetes.  
Neste tutorial será utilizado apenas o controller de lambda.

Referências:

- [https://aws-controllers-k8s.github.io/community/docs/tutorials/lambda-oci-example/](https://aws-controllers-k8s.github.io/community/docs/tutorials/lambda-oci-example/)
- [https://aws-controllers-k8s.github.io/community/docs/user-docs/install/#install-an-ack-service-controller-with-helm-recommended](https://aws-controllers-k8s.github.io/community/docs/user-docs/install/#install-an-ack-service-controller-with-helm-recommended)
- [https://github.com/aws-controllers-k8s/lambda-controller/blob/main/helm/values.yaml](https://github.com/aws-controllers-k8s/lambda-controller/blob/main/helm/values.yaml)

Execute os seguintes comandos:

> Lembre-se de alterar os trechos que possuem o termo `CHANGE_HERE`.

```text
export SERVICE=lambda

export RELEASE_VERSION=$(curl -sL https://api.github.com/repos/aws-controllers-k8s/${SERVICE}-controller/releases/latest | jq -r '.tag_name | ltrimstr("v")')

export ACK_SYSTEM_NAMESPACE=ack-system

export AWS_REGION=CHANGE_HERE

export AWS_PROFILE=CHANGE_HERE

kubectl create namespace $ACK_SYSTEM_NAMESPACE

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: aws-creds
  namespace: "$ACK_SYSTEM_NAMESPACE"
type: Opaque
stringData:
  credentials: |
    [default]
    aws_region=CHANGE_HERE
    aws_access_key_id=CHANGE_HERE
    aws_secret_access_key=CHANGE_HERE
EOF

cat <<EOF > $HOME/ack/lambda_values.yaml
aws:
  # If specified, use the AWS region for AWS API calls
  region: "us-east-1"
  endpoint_url: ""
  credentials:
    # If specified, Secret with shared credentials file to use.
    secretName: "aws-creds"
    # Secret stringData key that contains the credentials
    secretKey: "credentials"
    # Profile used for AWS credentials
    profile: "default"
EOF

aws ecr-public get-login-password --region $AWS_REGION --profile $AWS_PROFILE | helm registry login --username AWS --password-stdin public.ecr.aws

helm upgrade --install --create-namespace -n $ACK_SYSTEM_NAMESPACE ack-$SERVICE-controller \
  oci://public.ecr.aws/aws-controllers-k8s/$SERVICE-chart --version=$RELEASE_VERSION --set=aws.region=$AWS_REGION --values=$HOME/ack/lambda_values.yaml

```

## **Criando uma lambda via ACK (apenas para validar o funcionamento)**

A ideia é remover no final e criar a lambda usando o ArgoCD + ACK

Referências:

- [https://aws-controllers-k8s.github.io/community/docs/tutorials/lambda-oci-example/](https://aws-controllers-k8s.github.io/community/docs/tutorials/lambda-oci-example/)

Execute os seguintes comandos:

> Lembre-se de alterar os trechos que possuem o termo `CHANGE_HERE`.

```bash
# Compilando a imagem docker
export AWS_REGION=CHANGE_HERE

export AWS_PROFILE=CHANGE_HERE

export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text --profile $AWS_PROFILE --region $AWS_REGION)

export REMOTE_DOCKER_IMAGE='aecio-test-ack-lambda-hello-world'

aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

aws ecr create-repository --profile $AWS_PROFILE --region $AWS_REGION --repository-name $REMOTE_DOCKER_IMAGE --image-scanning-configuration scanOnPush=false --image-tag-mutability MUTABLE

docker tag  "hello-world:latest" "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/$REMOTE_DOCKER_IMAGE:latest"

docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/$REMOTE_DOCKER_IMAGE:latest"

```

### **Crie manualmente uma role para ser usada pela lambda**

Foi criada uma role relacionando o serviço de lambda e a policy gerenciada ' **Adminstrator\_Access**'.

### **Deploy da lambda com o ACK**

Referências:

- [https://aws-controllers-k8s.github.io/community/reference/lambda/v1alpha1/function/](https://aws-controllers-k8s.github.io/community/reference/lambda/v1alpha1/function/)

Execute os seguintes comandos:

> Lembre-se de alterar os trechos que possuem o termo `CHANGE_HERE`.

```text
export IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/$REMOTE_DOCKER_IMAGE:latest"

export FUNCTION_NAME="aecio-ack-lambda-hello-word"

# Role criada manualmente relacionando o serviço de lambda e a policy gerenciada 'Adminstrator_Access'
export LAMBDA_ROLE="arn:aws:iam::${AWS_ACCOUNT_ID}:role/$FUNCTION_NAME"

read -r -d '' LAMBDA_MANIFEST <<EOF
apiVersion: lambda.services.k8s.aws/v1alpha1
kind: Function
metadata:
 name: $FUNCTION_NAME
 namespace: default
 annotations:
   services.k8s.aws/region: $AWS_REGION
spec:
 name: $FUNCTION_NAME
 packageType: Image
 code:
     imageURI: $IMAGE_URI
 role: $LAMBDA_ROLE
 description: function created by ACK lambda-controller e2e tests
 environment:
  variables:
    NAME: "ISAAC"
    SURNAME: "GUI2024"
    CONFIA: "YES"
 tags:
    poc: "true"
EOF
echo "${LAMBDA_MANIFEST}" > $HOME/ack/function.yaml

kubectl apply -f $HOME/ack/function.yaml
```

Visualize o status das lambda criada via ACK:

```bash
kubectl get function -A

kubectl describe function $FUNCTION_NAME
```

Verifique se a lambda foi criada no console da AWS.

Remova a lambda via ACK

```bash
kubectl delete -f $HOME/ack/function.yaml
```

## **Crie uma lambda via ArgoCD + ACK**

Crie um git repo público com o código do Kustomize que gerenciará o código ACK para criar a lambda usando o ArgoCD

Exemplo: [https://github.com/aeciopires/poc-ack-argocd](https://github.com/aeciopires/poc-ack-argocd)

Crie o seguinte arquivo com o seguinte código:

```text
export GIT_APP_REPO="https://github.com/aeciopires/poc-ack-argocd"

read -r -d '' LAMBDA_ARGOCD_MANIFEST <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: aecio-ack-lambda-hello-word
spec:
  destination:
    namespace: default
    server: 'https://kubernetes.default.svc'
  source:
    path: kustomize/testing/lambda/aecio-ack-lambda-hello-word/
    repoURL: '$GIT_APP_REPO'
    targetRevision: HEAD
  project: default
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
EOF
echo "${LAMBDA_ARGOCD_MANIFEST}" > $HOME/ack/argocd_app_lambda.yaml
```

Acesse a interface web do ArgoCD em: [https://localhost:8443/applications](https://localhost:8443/applications).

Clique em **New App**. Clique em **Edit YAML** e cole o YAML do arquivo `$HOME/ack/argocd_app_lambda.yaml`.

Depois clique em **Sync**.

Verifique se a lambda foi criada no console da AWS.

## Considerações finais

A tecnologia, documentação, funcionalidades e exemplos estão em desenvolvimento e em status alpha. Para algumas coisas, você encontra instruções de forma fácil, mas para outras não e aí tem que escovar bits mesmo…

Isso tende a melhorar de acordo com o desenvolvimento e evolução da tecnologia.
