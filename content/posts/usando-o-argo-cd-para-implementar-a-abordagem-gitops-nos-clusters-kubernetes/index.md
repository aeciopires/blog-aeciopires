---
title: "Usando o Argo CD para implementar a abordagem GitOps nos clusters Kubernetes"
slug: "usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes"
date: 2021-09-04T21:42:42-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes", "tutoriais"]
tags: ["argocd", "docker", "git", "kubernetes", "linux"]
description: "GitOps é uma estrutura operacional que utiliza as melhores práticas da cultura DevOps durante o ciclo de vida das aplicações, tais como: controle de…"
wp_id: 2653
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** Argo CD 3.6.2 (manifesto `stable` e CLI), testado em dois clusters kind (Kubernetes 1.37 e 1.36): guestbook, sync, rollback, políticas de sync, deploy do chart Helm no outro cluster e self-heal. O repositório de exemplo do autor não existe mais; a guestbook agora vem do repositório oficial `argoproj/argocd-example-apps` e o chart kube-pires do GitLab (`gitlab.com/aeciopires/kube-pires`, diretório `helm-chart`). Incluída dica para registrar um cluster kind no Argo CD.
{{< /alert >}}

## **Sobre o GitOps**

**GitOps** é uma estrutura operacional que utiliza as melhores práticas da cultura DevOps durante o ciclo de vida das aplicações, tais como: controle de versão, colaboração, conformidade e ferramentas de integração, entrega e deploy contínuo (CI/CD), e as aplica à automação da infraestrutura. Fonte: [GitLab](https://about.gitlab.com/topics/gitops/).

Imagine o seguinte cenário: você tem várias alterações a serem aplicadas em diferentes aplicações sendo executadas em diferentes clusters [Kubernetes](https://kubernetes.io/), distribuídos em mais de um _cloud provider_ e/ou no ambiente _on-premises_. Para fazer isso, você pode executar de forma manual ou desenvolver um ou mais pipelines. De qualquer forma, neste cenário existe uma grande complexidade e o esforço técnico de um time de operação, além do risco envolvido quando for necessário fazer rollback. Outra preocupação é evitar as divergências entre o que está aplicado no cluster Kubernetes e o que está versionado no [git](https://git-scm.com/).

Para ajudar na execução de atividades semelhantes a essa, a abordagem GitOps trata a infraestrutura como código tendo as informações versionadas em um ou mais repositórios git, tratando-os como fonte da verdade e faz uso de ferramentas para aplicar continuamente as mudanças a partir de um ponto central.

Para saber informações sobre os benefícios, vantagens e desvantagens dessa abordagem, recomendo a leitura dos posts a seguir:

- [https://www.cloudbees.com/gitops/what-is-gitops](https://www.cloudbees.com/gitops/what-is-gitops)
- [https://about.gitlab.com/topics/gitops](https://about.gitlab.com/topics/gitops/)
- [https://www.weave.works/blog/what-is-gitops-really](https://www.weave.works/blog/what-is-gitops-really)
- [https://www.gitops.tech](https://www.gitops.tech/)
- [https://www.redhat.com/en/topics/devops/what-is-gitops](https://www.redhat.com/en/topics/devops/what-is-gitops)
- [https://searchitoperations.techtarget.com/definition/GitOps](https://searchitoperations.techtarget.com/definition/GitOps)
- [https://www.atlassian.com/git/tutorials/gitops](https://www.atlassian.com/git/tutorials/gitops)
- [https://www.infoworld.com/article/3566555/what-is-gitops-extending-devops-to-kubernetes-and-beyond.html](https://www.infoworld.com/article/3566555/what-is-gitops-extending-devops-to-kubernetes-and-beyond.html)
- [https://thenewstack.io/what-is-gitops-and-why-it-might-be-the-next-big-thing-for-devops](https://thenewstack.io/what-is-gitops-and-why-it-might-be-the-next-big-thing-for-devops/)

Existem várias ferramentas que implementam a abordagem GitOps, entre elas estão: [Flux CD](https://fluxcd.io/), [Argo CD](https://argoproj.github.io/argo-cd/), [Jenkins-X](https://jenkins-x.io/), [Tekton](https://tekton.dev/) e [AWS Code Deploy](https://aws.amazon.com/codedeploy/). Neste tutorial vamos conhecer o [Argo CD](https://argoproj.github.io/argo-cd/). Recomendo a leitura das seguintes páginas que falam um pouco mais sobre essas ferramentas:

- [https://cloudogu.com/en/blog/gitops-tools](https://cloudogu.com/en/blog/gitops-tools)
- [https://blog.container-solutions.com/fluxcd-argocd-jenkins-x-gitops-tools](https://blog.container-solutions.com/fluxcd-argocd-jenkins-x-gitops-tools)
- [https://luktom.net/en/e1683-argocd-vs-flux](https://luktom.net/en/e1683-argocd-vs-flux)
- [https://caylent.com/part-1-gitops-and-useful-gitops-tools](https://caylent.com/part-1-gitops-and-useful-gitops-tools)
- [https://caylent.com/part-2-getting-started-with-gitops-on-google-cloud-platform](https://caylent.com/part-2-getting-started-with-gitops-on-google-cloud-platform)
- [https://caylent.com/part-3-optimizing-the-caylent-gitops-accelerator-on-google-cloud-platform](https://caylent.com/part-3-optimizing-the-caylent-gitops-accelerator-on-google-cloud-platform)

Se você ainda não sabe o que é Docker, Kubernetes ou mesmo o Git, recomendo a leitura dos links a seguir.

- Git:
  - [https://www.vogella.com/tutorials/Git/article.html](https://www.vogella.com/tutorials/Git/article.html)
  - [https://gitexplorer.com](https://gitexplorer.com/)
  - [https://rogerdudler.github.io/git-guide/index.pt\_BR.html](https://rogerdudler.github.io/git-guide/index.pt_BR.html)
  - [http://marklodato.github.io/visual-git-guide/index-en.html](http://marklodato.github.io/visual-git-guide/index-en.html)
- Docker e Kubernetes:
  - [https://github.com/badtuxx/DescomplicandoKubernetes](https://github.com/badtuxx/DescomplicandoKubernetes)
  - [/primeiros-passos-com-docker](/primeiros-passos-com-docker/)
  - [/instalando-o-k0s-distribuicao-kubernetes-all-inclusive](/instalando-o-k0s-distribuicao-kubernetes-all-inclusive/)
  - [/curso-docker](/curso-docker/)
  - [/curso-kubernetes-k8s](/curso-kubernetes-k8s/)

## **Sobre o Argo CD**

[Argo CD](https://argoproj.github.io/argo-cd/) é uma ferramenta declarativa que usa a abordagem GitOps para implantar aplicações no Kubernetes.

Achei o Argo CD bem fácil de instalar e configurar. Além disso, ele pode ser usado para gerenciar várias aplicações em diferentes clusters Kubernetes a partir de um único ponto. Ele pode se conectar a repositórios git públicos e privados, é gratuito, tem o código-fonte aberto, é um projeto [incubado pela CNCF](https://landscape.cncf.io/?project=incubating&selected=argo), possui uma interface web de visualização e gerenciamento dos recursos, mas também pode ser configurado via linha de comando.

Para saber mais informações sobre o Argo CD, acesse os links que estão nas referências, no fim deste tutorial.

Neste tutorial você aprenderá a instalar o Argo CD no Kubernetes. Em seguida, você configurará o Argo CD para extrair arquivos de configuração das aplicações a partir de um repositório público no GitHub e verá o Argo CD aplicando as mudanças no Kubernetes.

## **Requisitos**

Para a execução deste tutorial, partirei da premissa que você está usando alguma distribuição GNU/Linux e já tem instaladas as seguintes ferramentas:

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [helm](https://helm.sh/docs/intro/install/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

Além disso, você precisa ter acesso a 1 ou 2 clusters Kubernetes (sejam eles no ambiente on-premises, cloud ([EKS](https://aws.amazon.com/eks/), [GKE](https://cloud.google.com/kubernetes-engine) ou [AKS](https://azure.microsoft.com/en-us/services/kubernetes-service/) ou ainda, usando [minikube](https://minikube.sigs.k8s.io/docs/start/), [kind](https://kind.sigs.k8s.io/docs/user/quick-start/), [k0s](https://k0sproject.io/), [microk8s](https://microk8s.io/) ou [k3s](https://k3s.io/)).

## **Instalando o Argo CD**

Estando conectado em um cluster Kubernetes, execute os seguintes comandos para instalar o Argo CD:

```bash
kubectl create namespace argocd

kubectl apply -n argocd --server-side --force-conflicts \
-f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

> **Atenção:**
>
> Segundo a [documentação oficial](https://argo-cd.readthedocs.io/en/stable/getting_started/), as opções `--server-side --force-conflicts` são necessárias porque alguns CRDs do Argo CD (como o ApplicationSet) excedem o limite de 262KB da anotação usada pelo `kubectl apply` no modo client-side. A documentação também recomenda usar uma versão fixa (exemplo: `v3.6.2`) em vez da branch `stable` em ambientes de produção.
>
> Os manifestos de instalação incluem recursos ClusterRoleBinding que fazem referência ao namespace **argocd**. Se você estiver instalando o Argo CD em um namespace diferente, certifique-se de atualizar a referência do namespace.

_Se preferir, você pode instalar o ArgoCD usando o Helm, seguindo as instruções da página:_ [https://artifacthub.io/packages/helm/argo/argo-cd](https://artifacthub.io/packages/helm/argo/argo-cd)

Existem várias formas de acessar a interface web do Argo CD citadas [nesta página](https://argoproj.github.io/argo-cd/getting_started/). A mais simples é a seguinte:

Port-Forward:

```bash
kubectl -n argocd port-forward svc/argocd-server -n argocd 8443:443
```

Isso criará um encaminhamento da aplicação que executa no cluster Kubernetes na porta 443/TCP para a porta 8443/TCP do host local. Dessa forma, você pode abrir um navegador no endereço: [https://localhost:8443](https://localhost:8443). Se você fechar o terminal ou der CTRL+C, o port-forward será encerrado e você perderá o acesso.

> **Atenção**:
>
> **Mantenha o port-forward em execução durante todo o tutorial.**

O login padrão é **admin** e uma senha aleatória será gerada. Para obtê-la, execute o seguinte comando em outro terminal:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Após fazer o login no Argo CD, altere a senha no seguinte endereço: [https://localhost:8443/user-info?changePassword=true](https://localhost:8443/user-info?changePassword=true)

Após mudar a senha na interface web, você pode remover a secret **argocd-initial-admin-secret**, que contém a senha inicial, com o seguinte comando:

```bash
kubectl -n argocd delete secret argocd-initial-admin-secret
```

## **Instalando o Argo CD** **CLI** ( _Command Line Interface_)

O Argo CD também pode ser gerenciado pela linha de comando. Para isso, execute os seguintes comandos para instalar o binário:

> Na página [https://argo-cd.readthedocs.io/en/stable/cli\_installation/](https://argo-cd.readthedocs.io/en/stable/cli_installation/) existem diferentes formas de instalar a CLI do Argo CD, mas neste tutorial optarei por instalar usando o [mise](https://mise.jdx.dev/) como gerenciador de pacotes.
>
> **Instalando o mise**
>
> ```bash
> curl -fsSL https://mise.run | sh
> ```
>
> _Fonte:_ [https://mise.jdx.dev/installing-mise.html](https://mise.jdx.dev/installing-mise.html)

**Instalando o ArgoCD usando o mise**

```bash
mise use -g argocd@3.6.2 # Instala o argocd e define a versão global do argocd-cli a ser utilizada, se não for especificada uma versão diferente no diretório corrente

argocd version --client
```

Visualize as opções da linha de comando do **argocd**:

```bash
argocd --help

argocd subcommand --help
```

Realize a autenticação entre o binário e o servidor com o seguinte comando:

```bash
argocd login localhost:8443
```

> **Atenção:**
>
> As configurações do Argo CD também podem ser declaradas em arquivos YAML e versionadas no Git conforme apresentado neste tutorial: [https://medium.com/devopsturkiye/self-managed-argo-cd-app-of-everything-a226eb100cf0](https://medium.com/devopsturkiye/self-managed-argo-cd-app-of-everything-a226eb100cf0) e nesta página da documentação: [https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup)

## Implantando uma aplicação ( _deploy_)

O repositório [https://github.com/argoproj/argocd-example-apps](https://github.com/argoproj/argocd-example-apps) possui vários exemplos de aplicações que podem ser implantadas usando o Argo CD. Para acompanhar as alterações via GitOps mais adiante, faça um _fork_ dos repositórios usados neste tutorial na sua conta e use a URL do seu _fork_ nos comandos.

Implante a aplicação **guestbook** no mesmo cluster do Argo CD, no namespace **myapp** a partir do código que está em [https://github.com/argoproj/argocd-example-apps](https://github.com/argoproj/argocd-example-apps), mais precisamente no diretório **guestbook**:

```bash
kubectl create namespace myapp

argocd app create guestbook \
--repo https://github.com/argoproj/argocd-example-apps.git \
--path guestbook \
--dest-server https://kubernetes.default.svc \
--dest-namespace myapp
```

> **Atenção:**
>
> O endereço **https://kubernetes.default.svc** corresponde à identificação padrão do cluster Kubernetes no qual está implantado o Argo CD. Esse nome sempre é atribuído durante a instalação e você pode obtê-lo na interface web do Argo CD em: [https://localhost:8443/settings/clusters](https://localhost:8443/settings/clusters)  

Na interface web, você pode visualizar as aplicações criadas no Argo CD a partir do seguinte endereço [https://localhost:8443/applications](https://localhost:8443/applications). No caso da aplicação **guestbook**, o status e outras configurações estarão disponíveis a partir do endereço: [https://localhost:8443/applications/guestbook](https://localhost:8443/applications/guestbook).

Mas vamos continuar utilizando a linha de comando...

Obtenha o status da aplicação usando o seguinte comando:

```bash
argocd app get guestbook
```

Sincronize o código da aplicação no Git com o cluster Kubernetes:

```bash
argocd app sync guestbook
```

Visualize os recursos implantados da aplicação:

```bash
kubectl get all -n myapp
```

Visualize os logs do pod da aplicação:

```bash
argocd app logs guestbook
```

Agora mude alguma informação em um manifest existente no diretório da aplicação **guestbook** no git ou adicione algum arquivo. Dê commit e faça o push das alterações na branch principal (master ou main).

Visualize as diferenças entre o que está no git e o que está no cluster Kubernetes:

```bash
argocd app diff guestbook
```

Sincronize novamente a aplicação.

```bash
argocd app sync guestbook
```

Observe o histórico de mudanças da aplicação:

```bash
argocd app history guestbook
```

Faça um rollback das alterações para o ID de histórico referente ao commit desejado:

```bash
argocd app rollback guestbook HISTORY_ID
```

O que achou?

Observe que foi necessário sincronizar manualmente as alterações no Argo CD para ele pegar do Git e aplicar no Kubernetes. Para deixar esse processo automático para essa aplicação, execute o seguinte comando:

```bash
argocd app set guestbook --sync-policy automated
```

Se precisar desabilitar a sincronização automática, execute o seguinte comando:

```bash
argocd app set guestbook --sync-policy none
```

Curiosidade: obtendo os manifestos [YAML](https://yaml.org/) da aplicação:

```bash
argocd app manifests guestbook
```

Liste os recursos da aplicação:

```bash
argocd app resources guestbook
```

## **Implantando uma aplicação helm em outro cluster**

> **Atenção:**
>
> O Argo CD não tem opinião sobre como os segredos devem ser gerenciados, por exemplo usando helm secrets + sops. Há muitas maneiras de fazer isso e não há uma solução única para todos os casos. Alguns tutoriais dão algumas alternativas e estes são citados nas Referências na seção **Argo CD + Sops + Helm Secrets**.
>
> Eu criei uma imagem Docker customizada do Argo CD para dar suporte ao sops + helm secrets + helm plugin e adicionei instruções sobre como usar o AWS KMS junto com o sops e criar uma secret no Kubernetes relacionada ao arquivo de credenciais de acesso da AWS. Se tiver interesse, acesse este repositório: [https://github.com/aeciopires/custom-argocd](https://github.com/aeciopires/custom-argocd)

Como falei, o Argo CD pode gerenciar muitos clusters a partir de um único ponto. Para testar isso, adicione outro cluster com o seguinte comando:

```bash
kubectl config get-contexts -o name

argocd cluster add CONTEXT_NAME
```

{{< alert icon="circle-info" >}}
**Se o outro cluster for do kind:** o kubeconfig padrão do kind aponta para `127.0.0.1`, que o Argo CD (rodando dentro do primeiro cluster) não alcança. Gere um kubeconfig com o IP do control-plane na rede Docker do kind e use-o no `cluster add`:

```bash
IP=$(docker inspect -f '{{(index .NetworkSettings.Networks "kind").IPAddress}}' NOME-DO-CLUSTER-control-plane)
kind get kubeconfig --internal --name NOME-DO-CLUSTER | sed "s#https://NOME-DO-CLUSTER-control-plane:6443#https://$IP:6443#" > kubeconfig-kind
argocd cluster add kind-NOME-DO-CLUSTER --kubeconfig kubeconfig-kind
```

{{< /alert >}}

> **Atenção**:
>
> Altere CONTEXT\_NAME pelo nome do cluster ao qual você já tem acesso.

Visualize a lista de clusters cadastrados no Argo CD no seguinte endereço: [https://localhost:8443/settings/clusters](https://localhost:8443/settings/clusters)

Implante a aplicação **aecio** no outro cluster, no namespace **aecions** a partir do código que está em [https://gitlab.com/aeciopires/kube-pires](https://gitlab.com/aeciopires/kube-pires), mais precisamente no diretório **helm-chart**:

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

> **Atenção:**
>
> Com o uso da opção **--sync-option CreateNamespace=true**, o namespace **aecions** será criado automaticamente se não existir no cluster. Caso contrário, o Argo CD faria 5 tentativas (por padrão) para tentar implantar a aplicação sem obter sucesso.
>
> A opção **--sync-policy auto** faz com que a cada alteração enviada ao Git, as mudanças sejam aplicadas imediatamente.
>
> **kube-pires** é um helm chart de teste usado para implantar a aplicação **aecioapp** usando os valores definidos no arquivo **helm-chart/values.yaml**.
>
> **CLUSTER\_URL** é o endereço interno do cluster que você pode obtê-lo na interface web do Argo CD em: [https://localhost:8443/settings/clusters](https://localhost:8443/settings/clusters)
>
> As aplicações **aecioapp** e **aecio** são diferentes. A primeira se refere a uma aplicação helm. A segunda é uma aplicação no Argo CD.  
Neste caso, a sincronização entre os arquivos do git e o Kubernetes está habilitada para ocorrer de forma automática. Para saber mais sobre os conceitos do Argo CD, acesse a página: [https://argo-cd.readthedocs.io/en/stable/core\_concepts](https://argo-cd.readthedocs.io/en/stable/core_concepts)

Visualize a aplicação na interface web: [https://localhost:8443/applications/aecio](https://localhost:8443/applications/aecio):

Agora visualize o status da aplicação utilizando a linha de comando:

```bash
argocd app get aecio
```

Visualize os recursos implantados da aplicação:

```bash
argocd app resources aecio
```

Visualize as possíveis diferenças entre o que está no git e o que está no Kubernetes:

```bash
argocd app diff aecio
```

Mude o número de réplicas no arquivo **helm-chart/values.yaml**. Faça commit e push das alterações no repositório git.

Visualize as mudanças na interface web do Argo CD.

> **Atenção:**
>
> Por padrão, o Argo CD não impede que alterações manuais sejam realizadas nos recursos e objetos do Kubernetes, para corrigir um incidente por exemplo. Se isso ocorrer, ele não vai substituir as configurações manuais automaticamente.
>
> Você pode visualizar as diferenças e ajustar o arquivo no git para manter as alterações como código ou substituir as alterações manuais sincronizando sob demanda o código do Git com a aplicação implantada no Kubernetes.

Se você deseja garantir que o Kubernetes execute apenas o que estiver versionado no Git, substituindo imediatamente qualquer alteração manual, então você pode remover a aplicação e criá-la novamente com os seguintes comandos:

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

Ou melhor ainda, você pode alterar as configurações de uma aplicação existente da seguinte forma:

```bash
argocd app set aecio --self-heal
```

Agora qualquer alteração manual nos recursos dessa aplicação no cluster será imediatamente substituída pelo que está definido no Git.

Há muitas opções de sincronização que podem ser consultadas nos links que estão nas referências ao fim do tutorial.

Mude o **readinessProbe.path** e **livenessProbe.path** no arquivo **helm-chart/values.yaml**. Faça commit e push das alterações no repositório git.

Visualize as mudanças na interface web do Argo CD.

{{< figure src="/wp-content/uploads/2021/09/argocd.png" alt="argocd" >}}

> **Atenção:**
>
> O Argo CD passou a dar suporte a múltiplas fontes ( _multiple sources_) em uma mesma aplicação, o que permite usar um helm chart de um repositório e os arquivos de values de outro repositório git. Veja a documentação em _https://argo-cd.readthedocs.io/en/stable/user-guide/multiple\_sources/_ e o meu tutorial [Deploy de aplicações no Kubernetes usando Argo CD com suporte a Helm, Sops e Multiple Sources](/deploy-no-kubernetes-usando-argo-cd-com-suporte-a-helm-sops-e-multiple-sources/).

Remova as aplicações do Argo CD e dos clusters Kubernetes ( _undeploy_):

```bash
argocd app delete guestbook

argocd app delete aecio
```

Remova um cluster do Argo CD com o seguinte comando:

```bash
argocd cluster rm CLUSTER_URL
```

Remova o Argo CD do cluster Kubernetes ( _undeploy_):

```bash
kubectl delete -n argocd \
-f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

kubectl delete namespace argocd
```

O que achou?

Mais informações podem ser obtidas nos links das referências.

Este tutorial mostrou apenas o básico e a parte simples do que pode ser feito com o Argo CD. Há muitas funcionalidades e possibilidades que podem ser exploradas e por isso incentivo você a ler e praticar o conhecimento que está publicado nos links das referências. Bons testes e estudos!

## **Referências**

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

> **Atenção:**
>
> O Argo CD não tem opinião sobre como os segredos devem ser gerenciados, por exemplo usando helm secrets + sops. Há muitas maneiras de fazer isso e não há uma solução única para todos os casos. Os tutoriais a seguir dão algumas alternativas.
>
> Eu criei uma imagem Docker customizada do Argo CD para dar suporte ao sops + helm secrets + helm plugin e adicionei instruções sobre como usar o AWS KMS junto com o sops e criar uma secret no Kubernetes relacionada ao arquivo de credenciais de acesso da AWS. Se tiver interesse, acesse este repositório: [https://github.com/aeciopires/custom-argocd](https://github.com/aeciopires/custom-argocd)

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
