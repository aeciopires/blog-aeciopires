---
title: "Instalando o k0s (distribuição Kubernetes all-inclusive)"
slug: "instalando-o-k0s-distribuicao-kubernetes-all-inclusive"
date: 2021-03-24T06:08:40-03:00
lastmod: 2026-10-08T16:38:07-03:00
draft: false
categories: ["cluster", "devops", "kubernetes", "tutoriais"]
tags: ["containers", "docker", "k0s", "kubernetes", "linux"]
description: "k0s é uma distribuição do Kubernetes com todos os recursos necessários para funcionar em um único e pequeno binário desenvolvido em Go, que proporciona…"
wp_id: 2536
---

**Atualizado em: 7 de outubro de 2026**

[k0s](https://k0sproject.io/) é uma distribuição do [Kubernetes](https://kubernetes.io/) com todos os recursos necessários para funcionar em um único e pequeno binário desenvolvido em [Go](https://golang.org/), que proporciona uma simplicidade na instalação e manutenção do cluster. A pronúncia é correta é [_kay-zero-ess_](https://docs.k0sproject.io/v0.11.1/FAQ/) e tem por objetivo reduzir o esforço técnico e desgaste na instalação de um cluster Kubernetes, por isso o seu nome faz alusão a " **Zero** **Friction**".

Essa distribuição é recomendada para uso em produção em ambientes _on-premisse_, computação em nuvem pública, privada, híbrida, computação de borda (do inglês _edge computing_), servidores _bare-metal_ e/ou virtualizados.

O código fonte está disponível no Github ([https://github.com/k0sproject/k0s](https://github.com/k0sproject/k0s)) e o download é gratuito.

O k0s é mantido pelo time da [Mirantis](http://mirantis.com/), a mesma empresa que [comprou a parte enterprise do Docker](https://www.mirantis.com/company/press-center/company-news/mirantis-acquires-docker-enterprise/) e que também [comprou o Lens em 2020](https://techcrunch.com/2020/08/13/mirantis-acquires-lens-an-ide-for-kubernetes/). o [Lens](https://k8slens.dev) é uma IDE que facilita o gerenciamento do Kubernetes. Em janeiro de 2025, o k0s foi aceito como projeto Sandbox da CNCF: [https://www.cncf.io/projects/k0s/](https://www.cncf.io/projects/k0s/).

Segundo a [documentação oficial](https://docs.k0sproject.io/latest/), as principais característica são:

- Kubernetes certificado e 100% upstream ([Vanilla upstream Kubernetes](https://thenewstack.io/kubernetes-distribution-or-vanilla-kubernetes/));
- Disponível como um único binário, sem dependências externas além do kernel;
- Isolamento do Control Plane como padrão;
- Escalável desde um único node até clusters grandes e com alta disponibilidade;
- Variedade de backends de armazenamento: etcd (padrão para clusters com vários nodes), SQLite (padrão para clusters com um único node), MySQL e PostgreSQL;
- Utiliza como container runtime (https://kubernetes.io/docs/setup/production-environment/container-runtimes/) padrão o [containerd](https://containerd.io/), mas permite usar outros plugins CRI ( _Container Runtime Interface_);
- Suporte a diversos [Container Network Interface (CNI)](https://github.com/containernetworking/cni) (o padrão é o [Kube-Router](https://www.kube-router.io/) e o [Calico](https://www.tigera.io/project-calico/) é oferecido como alternativa pré-configurada);
- Inclui o Konnectivity, o CoreDNS e o Metrics Server;
- Suporta as arquiteturas de computadores x86-64, ARM64, ARMv7 e RISC-V.

## Requisitos de Hardware e Software

As informações de hardware e software mínimos para executar o k0s (sem contar com os requisitos dos pods, aplicações e serviços que serão adicionados) estão disponíveis na página a seguir.

[https://docs.k0sproject.io/latest/system-requirements/](https://docs.k0sproject.io/latest/system-requirements/)

## Portas Utilizadas

A lista de portas envolvidas na comunicação entre os nodes está disponível no final da página: [https://docs.k0sproject.io/latest/networking/](https://docs.k0sproject.io/latest/networking/)

## **Instalação e Configuração do k0s**

Na criação deste tutorial foram criadas duas máquinas virtuais utilizando o Ubuntu Server LTS 24.04 64 bits conforme a topologia mostrada na figura a seguir:

{{< figure src="/wp-content/uploads/2021/03/topologia_k0s.png" alt="topologia k0s" >}}

**Audiodescrição**: Na figura anterior é exibida a topologia de rede de um pequeno laboratório de teste. Essa rede é formada por duas máquinas virtuais (uma que atua como node master e outra que atua como node worker). Ambas as máquinas virtuais estão conectadas a um switch, que por sua vez está conectado a um firewall de borda da rede. Esse firewall está conectado a um roteador de borda da rede, que por sua vez faz a conexão com a Internet. Dessa forma, as máquinas virtuais tem acesso a Internet, seja para baixar pacotes ou expor aplicações a serem instaladas no cluster Kubernetes.

Os nomes e endereços IPs das máquinas virtuais usadas neste tutorial são os seguintes:

- **master/controller**: 192.168.56.80/24
- **worker**: 192.168.56.81/24

**OBS.:** Neste tutorial o _control plane (nodes master)_ e o _data plane_ ( _nodes worker_) do Kubernetes está sendo executado em uma única VM para fins de teste. Isso não é adequado para ambientes de produção por não oferecer alta disponibilidade, mas o k0s dá suporte a múltiplos nodes master e worker.

Mais informações estão disponíveis na página: [https://docs.k0sproject.io/latest/high-availability/](https://docs.k0sproject.io/latest/high-availability/)

### **Em ambas as VMS**

No **master** e no **worker** execute os seguintes comandos para instalar o k0s, verificar a localização do binário e obter a ajuda do comando:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://get.k0s.sh | sudo sh
whereis k0s
k0s version
k0s --help
```

#### **Apenas na VM master**

Execute o seguinte comando para exportar a configuração padrão de criação de um cluster k0s para um arquivo [YAML](https://en.wikipedia.org/wiki/YAML).

```bash
sudo mkdir -p /etc/k0s
sudo bash -c 'k0s config create > /etc/k0s/k0s.yaml'
```

**OBS.:** Para mais informações sobre as opções de configurações, acesse a página:

[https://docs.k0sproject.io/stable/configuration/](https://docs.k0sproject.io/stable/configuration/))

Valide o conteúdo e sintaxe do arquivo com o seguinte comando:

```bash
sudo k0s config validate -c /etc/k0s/k0s.yaml
```

Agora crie o nó master/controller do k0s com os seguintes comandos:

```bash
sudo k0s install controller -c /etc/k0s/k0s.yaml
sudo k0s start
sudo k0s status
```

Instale o [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/) com os seguintes comandos (se já tiver instalado, pode pular esta parte):

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

Configure o autocomplete do [kubectl](https://github.com/badtuxx/DescomplicandoKubernetes/blob/master/day-1/DescomplicandoKubernetes-Day1.md#kubectl-alias-e-autocomplete) conforme as instruções nessa doc do [badtuxx/Descomplicando o Kubernetes](https://github.com/badtuxx/DescomplicandoKubernetes/).

Obtenha as credenciais de acesso ao cluster para com o seguinte comando:

```bash
sudo cat /var/lib/k0s/pki/admin.conf > $HOME/admin.conf
```

No arquivo recém criado altere a seguinte linha:

**Antes:**

```text
server: https://localhost:6443
```

**Depois:**

```text
server: https://192.168.56.80:6443
```

Configure o kubectl para usar esse arquivo com o seguinte comando.

```bash
export KUBECONFIG=$HOME/admin.conf
```

> Atenção!!! Não concatene o conteúdo do `admin.conf` no final do arquivo `~/.kube/config` com o comando `cat >>`, pois o resultado não é um kubeconfig válido. Se você já tiver um arquivo `~/.kube/config` e quiser usar os dois, a documentação do Kubernetes ([https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable)) explica como informar vários arquivos na variável `KUBECONFIG`. Se não tiver, basta copiar o arquivo: `mkdir -p $HOME/.kube && cp $HOME/admin.conf $HOME/.kube/config`.

Agora você pode tentar acessar os nodes do cluster e os pod com os seguintes comandos:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

Ou:

```bash
sudo k0s kubectl get nodes
sudo k0s kubectl get pods --all-namespaces
```

**OBS.:** O node master/controller não será exibido na lista de nodes, isso é uma especificidade do k0s que por padrão só exibe os nodes workers, porque são os que realmente podem executar cargas de trabalho do usuário.

Para adicionar um node worker, criar um arquivo com o token e envie para a VM a ser adicionada ao cluster. Para isso utilize os seguintes comandos:

```bash
sudo k0s token create --role=worker > $HOME/token-file
scp $HOME/token-file NOME_USUARIO@192.168.56.81:
```

Visualize a lista de tokens com o seguinte comando:

```bash
sudo k0s token list --role=worker
```

#### **Apenas na VM worker**

Após ter instalado o k0s no node worker (instruções mostradas no início deste tutorial), execute o seguinte comando para instalar o k0s como worker nesta VM e adicioná-la ao cluster Kubernetes.

```bash
sudo k0s install worker --token-file $HOME/token-file
sudo k0s start
sudo k0s status
sudo systemctl status k0sworker
```

#### **De volta a VM master**

Agora que o node foi adicionado ao cluster, execute os seguintes comandos para listar os nodes.

```bash
kubectl get nodes -o wide
```

## Removendo o k0s (em caso de necessidade)

Execute os seguintes comandos de acordo com a VM para remover o k0s.

**Na VM master:**

```bash
sudo k0s stop
sudo k0s reset
```

**Na VM worker:**

```bash
sudo k0s stop
sudo k0s reset
```

A documentação do k0s ([https://docs.k0sproject.io/stable/reset/](https://docs.k0sproject.io/stable/reset/)) recomenda reiniciar o host depois do `k0s reset` para garantir que não fiquem resquícios das configurações de rede.

Mais informações podem ser encontradas no links a seguir:

[https://docs.k0sproject.io/](https://docs.k0sproject.io/)

[https://www.mirantis.com/blog/how-to-set-up-k0s-kubernetes-a-quick-and-dirty-guide/](https://www.mirantis.com/blog/how-to-set-up-k0s-kubernetes-a-quick-and-dirty-guide/)

[https://medium.com/@adamparco/announcing-k0s-the-smallest-simplest-kubernetes-distribution-3626c86575d5](https://medium.com/@adamparco/announcing-k0s-the-smallest-simplest-kubernetes-distribution-3626c86575d5)

[https://danilogo0001.medium.com/kubernetes-k0s-leve-simples-e-tudo-empacotado-com-multi-master-ha-e71b7c4a47da](https://danilogo0001.medium.com/kubernetes-k0s-leve-simples-e-tudo-empacotado-com-multi-master-ha-e71b7c4a47da)
