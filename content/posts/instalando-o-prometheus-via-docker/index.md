---
title: "Instalando o Prometheus via Docker"
slug: "instalando-o-prometheus-via-docker"
date: 2019-11-17T13:17:45-03:00
lastmod: 2026-10-07T10:28:54-03:00
draft: false
categories: ["docker", "tutoriais"]
tags: ["docker", "prometheus"]
description: "O Prometheus é um kit de ferramentas de monitoramento e alerta de sistemas de código aberto inspirado no BorgMon (o sistema de monitoramento do Borg,…"
wp_id: 2198
---

**Atualizado em: 7 de outubro de 2026**

O [Prometheus](https://prometheus.io) é um kit de ferramentas de monitoramento e alerta de sistemas de código aberto inspirado no [BorgMon](https://landing.google.com/sre/sre-book/chapters/practical-alerting/) (o sistema de monitoramento do [Borg](https://ai.google/research/pubs/pub43438), plataforma de gerenciamento de conteiners do Google que inspirou o desenvolvimento do [Kubernetes](https://kubernetes.io/)).

Foi criado originalmente por ex-funcionários do Google que trabalharam na [SoundCloud](https://soundcloud.com) (uma empresa na área de música). Desde a sua criação em 2012, muitas empresas e organizações adotaram o uso do Prometheus, e o projeto possui uma comunidade de desenvolvedores e usuários muito ativa. [[1]](https://prometheus.io/docs/introduction/overview) [[2]](https://www.slideshare.net/brianbrazil/prometheus-and-docker-docker-galway-november-2015)

O Prometheus é um projeto de código aberto independente e mantido independentemente de qualquer empresa. Para enfatizar isso e esclarecer a estrutura de governança do projeto, o Prometheus ingressou na [Cloud Native Computing Foundation](https://www.cncf.io) em 2016 como o segundo projeto hospedado, depois do Kubernetes.

O código fonte do Prometheus está disponível em: [https://github.com/prometheus/prometheus](https://github.com/prometheus/prometheus)

O Prometheus é formado por vários componentes descritos [aqui](https://prometheus.io/docs/introduction/overview/). E o código fonte desses componentes está disponível em: [https://github.com/prometheus](https://github.com/prometheus)

A instalação usando o Docker é bem mais simples e rápida.

Se você não sabe o que é Docker, recomendo começar lendo os links abaixo. É um longo caminho, mas vale a pena conhecer essa tecnologia.

 [/primeiros-passos-com-docker/](/primeiros-passos-com-docker/)

Também ministro curso de Docker: [/curso-docker](/curso-docker)

1) Crie o diretório abaixo para persistir os dados fora do conteiner.

```bash
sudo mkdir -p /docker/prometheus
```

2) Crie o arquivo de configuração **/docker/prometheus/prometheus.yml** com o seguinte conteúdo. Pode ser que esse conteúdo mude com o tempo e mais informações sobre configuração pode ser obtida em: [https://prometheus.io/docs/prometheus/latest/getting\_started/](https://prometheus.io/docs/prometheus/latest/getting_started/)

```yaml
global:
  # Intervalo de raspagem de métricas. O padrão é a cada 60s
  scrape_interval:  10s
  # Intervalo para avaliação de regras. O padrão é a cada 60s
  evaluation_interval: 10s
  # scrape_timeout é definido como o padrão global (10s).

alerting:
  alertmanagers:
  - static_configs:
    - targets:
    # - alertmanager:9093

rule_files:
   # - "first_rules.yml"
   # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
  # metrics_path defaults to '/metrics'
  #    scheme defaults to 'http'.
    static_configs:
    - targets: ['172.17.0.1:9090']
```

3) Inicie o Prometheus usando o Docker com o seguinte comando.

```bash
docker run -d -p 9090:9090 \
 --name prometheus \
 -v /docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
 prom/prometheus
```

O Prometheus está acessível na URL: **http://IP-Servidor:9090**

Fonte: [https://prometheus.io/docs/prometheus/latest/installation/](https://prometheus.io/docs/prometheus/latest/installation/)

4) Se quiser parar o conteiner, é só executar o comando abaixo.

```bash
docker stop prometheus
```

5) Para iniciá-lo novamente, execute o comando abaixo.

```bash
docker start prometheus
```

6) Para visualizar os logs, execute o comando abaixo.

```bash
docker logs -f prometheus
```

Para obter a documentação sobre o uso do Prometheus acesse: [https://prometheus.io/docs/introduction/overview/](https://prometheus.io/docs/introduction/overview/)
