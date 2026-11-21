---
title: "Aprendendo Kubernetes Gateway API na prática com o girus-cli"
slug: "aprendendo-kubernetes-gateway-api-na-pratica-com-o-girus-cli"
date: 2025-11-21T18:49:43-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "kubernetes", "tutoriais"]
tags: ["docker", "git", "helm", "kubernetes"]
description: "Há alguns meses eu comecei a estudar e publiquei o primeiro post da série sobre o Kubernetes Gateway API."
wp_id: 3468
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** testado com o girus-cli 0.6.1 (a versão mais recente), inclusive pela interface web: `repo add`, `repo list`, `lab list`, `create cluster`, `create lab -f`, execução de todas as tarefas do laboratório `gateway-api-install` e remoção. O laboratório foi atualizado no [repositório](https://github.com/aeciopires/mylabs-for-girus-cli) para o NGINX Gateway Fabric 2.9.0 (Gateway API v1.7.0), ganhou validação automática em cada tarefa, e o índice do repositório passou a usar o formato que o `girus lab list` desta versão reconhece.
{{< /alert >}}

Há alguns meses eu comecei a estudar e publiquei o [primeiro post da série sobre o Kubernetes Gateway API](/conhecendo-o-kubernetes-gateway-api/).

Dando continuidade à série, hoje vou compartilhar a parte prática utilizando uma ferramenta fantástica chamada **[girus-cli](https://github.com/badtuxx/girus-cli)**, que permite rodar laboratórios interativos diretamente no terminal. O girus-cli será utilizado para executar os laboratórios que fiz sobre o Gateway API, desde a instalação até o monitoramento com Datadog e Prometheus.

## **O que é o girus-cli?**

Extraí a definição direto da fonte...

> O [GIRUS](https://github.com/badtuxx/girus-cli) é uma plataforma _open source_ de laboratórios interativos que permite a criação, gerenciamento e execução de ambientes de aprendizado prático para tecnologias como [Linux](https://pt.wikipedia.org/wiki/Linux), [Docker](https://www.docker.com/), [Kubernetes](https://kubernetes.io/), [Terraform](https://developer.hashicorp.com/terraform) e outras ferramentas essenciais para profissionais de DevOps, SRE, Dev e Platform Engineering.
>
> Desenvolvida pela [LINUXtips](http://linuxtips.io), a plataforma GIRUS se diferencia por ser executada localmente na máquina do usuário, eliminando a necessidade de infraestrutura na nuvem ou configurações complexas. Através de um CLI intuitivo, os usuários podem criar rapidamente ambientes isolados e seguros onde podem praticar e aperfeiçoar suas habilidades técnicas.
>
> O **girus-cli** é uma ferramenta de linha de comando que guia você através de cenários de aprendizado. Ele lê um arquivo de configuração ( `lab.yaml`), apresenta uma tarefa, e o mais legal: ele valida se você executou a tarefa corretamente no seu cluster Kubernetes. É como ter um instrutor do seu lado verificando seus comandos.

Mais informações sobre essa ferramenta podem ser encontradas nos links abaixo:

- [https://github.com/badtuxx/girus-cli](https://github.com/badtuxx/girus-cli)
- [https://linuxtips.io/girus-labs/](https://linuxtips.io/girus-labs/)
- [https://www.youtube.com/watch?v=kSQ7nM-QF1g](https://www.youtube.com/watch?v=kSQ7nM-QF1g)
- [https://www.linkedin.com/pulse/why-i-created-free-open-source-platform-practice-other-fernando-vuhge/](https://www.linkedin.com/pulse/why-i-created-free-open-source-platform-practice-other-fernando-vuhge/)
- [https://www.linkedin.com/pulse/por-que-criei-uma-plataforma-gratuita-e-open-source-para-fernando-ll6le/](https://www.linkedin.com/pulse/por-que-criei-uma-plataforma-gratuita-e-open-source-para-fernando-ll6le/)
- [https://www.dio.me/articles/girus-labs-ferramenta-para-aprender-na-pratica-linux-docker-e-kubernetes-61121101b694](https://www.dio.me/articles/girus-labs-ferramenta-para-aprender-na-pratica-linux-docker-e-kubernetes-61121101b694)
- [https://www.linkedin.com/feed/update/urn:li:activity:7387470252948762624/](https://www.linkedin.com/feed/update/urn:li:activity:7387470252948762624/)
- [https://www.youtube.com/watch?v=E92qKUp5giQ](https://www.youtube.com/watch?v=E92qKUp5giQ)

## **Pré-requisitos**

Antes de continuar, você vai precisar de:

- Um sistema GNU/Linux, macOS ou [WSL](https://learn.microsoft.com/pt-br/windows/wsl/install) (no Windows).
- **Docker**. Siga as instruções de acordo com o sistema operacional: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- **kubectl** e **kind**. Siga as instruções: [https://kubernetes.io/docs/tasks/tools/](https://kubernetes.io/docs/tasks/tools/)
- **Helm**. Siga as instruções: [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/)

## **Instalando o girus-cli**

A instalação é bem simples. Execute o seguinte comando para baixar e instalar o binário:

```bash
curl -sSL girus.linuxtips.io | bash
```

Verifique se a instalação funcionou:

```text
girus version
```

> Neste post está sendo utilizada a versão 0.6.1 do girus-cli.

## **Obtendo os Laboratórios de Gateway API**

Criei um repositório git [https://github.com/aeciopires/mylabs-for-girus-cli](https://github.com/aeciopires/mylabs-for-girus-cli) contendo alguns laboratórios práticos sobre os seguintes tópicos:

- Instalação (NGINX Gateway Fabric) _**(Done)**_
- HTTPRoute _**(Done)**_
- TCPRoute _(ToDo)_
- UDPRoute _(ToDo)_
- Websocket _(ToDo)_
- TLSRoute (Passthrough) _(ToDo)_
- GRPCRoute _(ToDo)_
- GAMMA (Mesh) _**(Done)**_

> Atenção!!! Se você não estiver autenticado no GitHub, pode receber um erro HTTP 429 por atingir o limite de requisições (_rate limit_) da API. Mais detalhes sobre este tema estão disponíveis nos links abaixo.

- [https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28](https://docs.github.com/en/rest/rate-limit/rate-limit?apiVersion=2022-11-28)
- [https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/)
- [https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28)
- [https://github.com/orgs/community/discussions/159123](https://github.com/orgs/community/discussions/159123)

Para obter esses laboratórios, execute os seguintes comandos:

```text
girus repo add gateway-api https://raw.githubusercontent.com/aeciopires/mylabs-for-girus-cli/main
girus repo list
girus lab list
```

## **Executando os laboratórios**

Crie um cluster kind para ser utilizado para execução dos labs com o girus-cli.

```text
girus create cluster
```

O comando `girus lab install` da versão 0.6.1 apenas baixa o laboratório para o cache local, sem aplicá-lo no cluster. Por isso, clone o repositório e crie cada laboratório com o `girus create lab -f`, como no exemplo abaixo.

```bash
cd /tmp
git clone https://github.com/aeciopires/mylabs-for-girus-cli
girus create lab -v -f /tmp/mylabs-for-girus-cli/labs/gateway-api-install/lab.yaml
```

Acesse o Girus no navegador para usar o novo laboratório: [http://localhost:8000/labs](http://localhost:8000/labs)

Localize e execute as instruções dos laboratórios do Gateway API e/ou quaisquer outros que estiverem disponíveis.

Na interface web, cada laboratório mostra as tarefas de um lado e um terminal do outro. Leia as instruções, execute os comandos solicitados no terminal e use a validação da tarefa para que o Girus confira se ela foi concluída.

Se estiver tudo certo, siga para a próxima tarefa!

## **Removendo os laboratórios**

Basta executar os seguintes comandos:

```text
girus delete cluster
rm $HOME/.girus/cache/gateway-api/index.yaml
girus repo remove gateway-api
```

## **Considerações Finais**

Espero que o conhecimento compartilhado neste post e nos demais desta série possa ajudar você a entender como usar o Gateway API.

Minha jornada está só no início e essa ferramenta evolui muito rápido. Então, isso é apenas uma "gota no oceano". Publicar esses posts é uma forma de aprender melhor, procurar a informação direto na fonte e ajudar outros iniciantes como eu, dando um retorno à comunidade sobre o que aprendi e usei de graça a partir do que outras pessoas criaram e compartilharam.

Outros laboratórios podem ser publicados no repositório, então fique de olho. Além disso, estou aberto a sugestões de melhoria e contribuições com novos laboratórios.

Até a próxima!
