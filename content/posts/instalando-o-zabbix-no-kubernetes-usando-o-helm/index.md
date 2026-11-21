---
title: "Instalando o Zabbix no Kubernetes usando o Helm"
slug: "instalando-o-zabbix-no-kubernetes-usando-o-helm"
date: 2023-01-15T20:57:41-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
tags: ["zabbix", "helm", "kubernetes", "gitops"]
description: "Atualização: há um novo post sobre este helm chart aqui: /helm-chart-zabbix-7-0-0/"
wp_id: 2829
---

{{< alert icon="circle-info" >}}
**Atualizado em 20/11/2026:** há posts mais recentes sobre este helm chart: [versão 7.0.0](/helm-chart-zabbix-7-0-0/) e [versão 8.0.0](/helm-chart-zabbix-8-0-0/). O chart `zabbix-community/zabbix` 8.0.1 foi instalado num cluster kind (Kubernetes 1.37) com os valores padrão, e a interface web respondeu. O tutorial de instalação continua no [Artifact Hub](https://artifacthub.io/packages/helm/zabbix-community/zabbix).
{{< /alert >}}

**Introdução**

Confesso que demorei muito para publicar este post, porque o método de instalação do [Zabbix](https://www.zabbix.com/) no [Kubernetes](https://kubernetes.io/) usando o [Helm](https://helm.sh/) não é algo novo. Isso já é feito em alguns ambientes há alguns anos. Eu mesmo ajudo no desenvolvimento de um [helm chart há quase 3 anos](https://github.com/zabbix-community/helm-zabbix). Mas aqui estamos...

De 2013 para cá, ficou muito popular a ideia de instalar aplicações utilizando containers, principalmente usando o [Docker](https://www.docker.com/). E quando você tem um ambiente com dezenas ou centenas de containers, se faz necessário utilizar uma ferramenta de orquestração. Existem várias opções, mas a que se tornou popular foi o Kubernetes.

Quem está aprendendo ou já trabalha com Kubernetes sabe que não é algo fácil de manter. O Helm é uma das ferramentas disponíveis para se trabalhar com Kubernetes, cujo foco é ajudar na instalação de aplicações. O Helm funciona como um gerenciador de pacotes, que implementa a mesma ideia do [apt](https://en.wikipedia.org/wiki/APT_(software)), [yum](https://en.wikipedia.org/wiki/Yum_(software)), [apk](https://wiki.alpinelinux.org/wiki/Alpine_Package_Keeper), etc... Ele serve para instalar, atualizar, remover aplicações através de helm charts, que podem ser criados por você ou podem ser obtidos em vários repositórios de código ou em helm repositories. O [Artifact Hub](https://artifacthub.io/) é um site no qual você pode encontrar informações sobre milhares de helm charts.

Se você quiser aprender mais sobre Docker, Kubernetes ou Helm, sugiro ler os [links desta página](/primeiros-passos-com-docker/), ou fazer um **curso** comigo sobre [Docker](/curso-docker/) e/ou [Kubernetes](/curso-kubernetes-k8s/).

**Sobre o Helm Chart**

A Zabbix SIA desenvolveu um helm chart oficial [disponível aqui](https://git.zabbix.com/projects/ZT/repos/kubernetes-helm/browse), mas hoje (janeiro/2023) ele ainda não está preparado para instalar todos os componentes de software do Zabbix. Até cheguei a reportar sobre isso [nesta issue](https://support.zabbix.com/browse/ZBXNEXT-5787).

Devido a isso, em 2020, [Amen Ayadi](https://github.com/AyadiAmen) e [Alexandre Nuttinck](https://github.com/alexnuttinck), pesquisadores do [Cetic](https://www.cetic.be/), criaram o helm chart [cetic/zabbix](https://github.com/cetic/helm-zabbix) que instala a maioria dos componentes do Zabbix usando o banco de dados [PostgreSQL](https://www.postgresql.org/). Também em 2020, eu comecei a colaborar com o código-fonte do helm chart junto com Amen e Alexandre. O helm chart evoluiu bastante e recebeu contribuições de dezenas de pessoas ao redor do mundo. Em 2022, [Christian Anton](https://github.com/sa-ChristianAnton) deu contribuições técnicas muito significativas ao helm chart, tornando-se um dos mantenedores regulares do helm chart junto comigo.

Em outubro/2022, o repositório cetic/zabbix foi descontinuado e o código-fonte foi migrado para o repositório [zabbix-community/helm-zabbix](https://github.com/zabbix-community/helm-zabbix).

Christian chegou a apresentar o helm chart no Zabbix Summit 2022 e você pode [conferir nesta palestra](https://www.youtube.com/watch?v=IQQwTEtwl7M&t=18225s). Eu sei que você pode estar se perguntando sobre as vantagens e os motivos de instalar o Zabbix no Kubernetes, ou que mudanças de paradigma são necessárias para isso ocorrer. Essas e outras perguntas foram respondidas por [Robert Silva](https://github.com/robertsilvatech) [nesta palestra](https://www.youtube.com/watch?v=IQQwTEtwl7M&t=17078s), também no [Zabbix Summit 2022](https://www.zabbix.com/events/zabbix_summit_2022#agenda).

**Tutorial de instalação**

O helm chart possui várias opções de configuração e o tutorial de instalação pode ser encontrado no seguinte link.

[https://artifacthub.io/packages/helm/zabbix-community/zabbix](https://artifacthub.io/packages/helm/zabbix-community/zabbix)

Um exemplo de instalação do Zabbix no [kind](https://kind.sigs.k8s.io/) pode ser encontrado no link: [https://github.com/zabbix-community/helm-zabbix/tree/master/charts/zabbix/docs/example](https://github.com/zabbix-community/helm-zabbix/tree/master/charts/zabbix/docs/example)

Se você tiver interesse em contribuir com o helm chart ou sugerir melhorias, pode interagir através do repositório:

[https://github.com/zabbix-community/helm-zabbix](https://github.com/zabbix-community/helm-zabbix)

**Usando a abordagem GitOps**

Uma vez que você tenha entendido os motivos de instalar o Zabbix no Kubernetes e tenha a necessidade de gerenciar a configuração como código, você pode utilizar a abordagem GitOps e usar as ferramentas [ArgoCD](https://argo-cd.readthedocs.io/) ou [Flux](https://fluxcd.io/).  
Eu comentei sobre essas ferramentas nos seguintes posts:

- [Usando o Argo CD para implementar a abordagem GitOps nos clusters Kubernetes](/usando-o-argo-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/)
- [Usando o Flux CD para implementar a abordagem GitOps nos clusters Kubernetes](/usando-o-flux-cd-para-implementar-a-abordagem-gitops-nos-clusters-kubernetes/)
- [Deploy de aplicações no Kubernetes usando Argo CD com suporte a Helm, Sops e Multiple Sources](/deploy-no-kubernetes-usando-argo-cd-com-suporte-a-helm-sops-e-multiple-sources/)
