---
title: "Aprendendo Amazon ECS com AWS CDK, Python e Floci"
slug: "aprendendo-amazon-ecs-com-aws-cdk-python-e-floci"
date: 2026-10-03T02:35:40-03:00
lastmod: 2026-10-03T02:35:41-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "tutoriais"]
tags: ["aws", "cdk", "ecs", "iac", "python"]
description: "Há poucos dias eu publiquei aqui no blog o post Aprendendo AWS CDK com Python e Floci. Logo depois, precisei me aprofundar no Amazon ECS (Elastic…"
wp_id: 3556
---

* * *

Há poucos dias eu publiquei aqui no blog o post [Aprendendo AWS CDK com Python e Floci](/aprendendo-aws-cdk-com-python-e-floci/). Logo depois, precisei me aprofundar no [Amazon ECS (Elastic Container Service)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) e segui a mesma metodologia para aprender: organizei o conteúdo, os exemplos de código e os testes neste repositório: [https://github.com/aeciopires/learning-ecs](https://github.com/aeciopires/learning-ecs). E, de novo, o material cresceu tanto que virou uma trilha de aprendizado, do zero ao avançado.

Minha intenção é também ajudar outras pessoas que estão estudando o ECS para usar no trabalho.

## O que é o Amazon ECS?

O Amazon ECS é um serviço totalmente gerenciado de orquestração de contêineres que ajuda a implantar, gerenciar e escalar aplicações em contêineres.

Na prática, você descreve a sua aplicação numa _task definition_ (imagem, CPU, memória, portas, variáveis, secrets…), cria um _service_ que mantém a quantidade desejada de tarefas rodando e escolhe onde elas vão executar: no [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) (sem servidores para administrar) ou em instâncias EC2 que você controla. O ECS cuida de substituir tarefas que falham, registrar tudo no load balancer e fazer os deploys de novas versões.

Se você já usa Kubernetes ([escrevi sobre ele em vários posts aqui no blog](/?s=kubernetes) e até tenho um [curso caso queira conhecer ou se aprofundar nesse tema](/curso-kubernetes-k8s/)), vai reconhecer muitas ideias: _task definition_ lembra um _Pod_, _service_ lembra um _Deployment_. A diferença é que o ECS é mais simples e muito integrado aos outros serviços da AWS, sem um _control plane_ para você administrar.

## E o Floci?

Assim como na trilha de CDK, toda a infraestrutura é escrita com o [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html) em Python e cada módulo é executado primeiro no [floci](https://floci.io), **um emulador local da AWS, gratuito e de código aberto**, que roda com um simples `docker compose up`.

E aqui vem a parte mais legal: o floci executa as tarefas do ECS como **contêineres de verdade** na sua máquina. Você faz o deploy de um serviço Fargate atrás de um ALB, roda um `curl` no `localhost` e recebe a resposta da aplicação. Tudo isso sem conta na AWS e sem custo nenhum.

Quando se sentir confiante, cada módulo também tem as instruções para fazer o deploy numa conta real da AWS, com os avisos de custo bem claros (NAT Gateway, load balancers e bancos de dados cobram por hora, então não esqueça de destruir tudo depois).

## O que tem na trilha?

São vários **módulos**, organizados em 6 fases:

- **Fundamentos:** rede multi-AZ (VPC, subnets, NAT, flow logs), o primeiro serviço no Fargate e capacidade com instâncias EC2.
- **Expondo serviços:** ALB e NLB (públicos e internos), API Gateway, CloudFront e Service Connect para a comunicação entre serviços.
- **Dados e mensageria:** RDS MySQL (com WordPress), RDS PostgreSQL (com PostgREST), Aurora, ElastiCache (Valkey), DocumentDB, SQS + SNS e S3.
- **Escalando e publicando versões:** Service Auto Scaling e estratégias de deploy (rolling update, blue/green, canary e linear, além de rollback).
- **Resiliência entre regiões:** a mesma aplicação em duas regiões, com failover pelo CloudFront.
- **Observabilidade:** CloudWatch, Prometheus e Grafana, e Datadog.

Cada módulo é uma stack do CDK que você pode implantar, testar e destruir, e tem um README com: a arquitetura, as variáveis de configuração, **todos os comandos do AWS CLI** para criar, inspecionar, alterar e remover o que o módulo ensina, as métricas para acompanhar, um guia de troubleshooting e uma tabela "floci vs AWS real" mostrando o que funciona localmente e o que só funciona na AWS.

As aplicações usadas são imagens públicas do Docker Hub (nginx, traefik/whoami, wordpress, postgrest, prom/prometheus, grafana, datadog/agent…), sem nenhuma imagem customizada.

## Algumas lições aprendidas no caminho

Ao construir o conteúdo desse repositório, aprendi bastante coisa que não está nos tutoriais "hello world":

- **Um emulador não é a AWS.** O floci executa muita coisa de verdade, mas algumas funcionalidades são apenas aceitas e não aplicadas (por exemplo, blue/green, canary e circuit breaker nos deploys, ou a origem de failover do CloudFront). Por isso cada módulo documenta de forma honesta o que funciona localmente e o que só funciona numa conta real.
- **O `cdk destroy` no floci deixa as VPCs para trás.** Todo o resto é removido, mas a VPC vazia fica, e cada ciclo de destroy + deploy acumula mais uma. Criei o script `scripts/floci_prune.py` para encontrar e apagar essas VPCs órfãs.
- **No floci, use sempre `cdk deploy --method=direct`.** Com o método padrão (change set), o floci recriava recursos sem nome fixo a cada deploy, mesmo sem mudanças. A explicação está na documentação.
- **Aprender a operar o ECS pelo AWS CLI é tão importante quanto escrever a infraestrutura.** No dia a dia, é com `aws ecs describe-services`, `list-tasks`, `update-service` e `execute-command` que você investiga um problema em produção.
- **Testes unitários de infraestrutura** continuam pegando muitos erros antes de qualquer recurso existir. Todas as stacks têm testes, com cobertura de cerca de 99%.

## E para encerrar…

Espero que esse repositório possa te ajudar a aprender e a usar o Amazon ECS com mais segurança e confiança. Publicar esse material é uma forma de aprender melhor e de dar um retorno à comunidade, compartilhando o que aprendi e usei de graça a partir do que outras pessoas criaram e compartilharam.

O projeto é de código aberto (GPLv3) e está aberto a sugestões de melhoria e contribuições, seja corrigindo algo, melhorando a documentação ou criando novos módulos. Se o conteúdo for útil para você, deixe uma estrela ⭐ no repositório e compartilhe com quem também precisa aprender ECS.

Até a próxima!

## Referências

- [https://github.com/aeciopires/learning-ecs](https://github.com/aeciopires/learning-ecs)
- [/aprendendo-aws-cdk-com-python-e-floci/](/aprendendo-aws-cdk-com-python-e-floci/)
- [https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)
- [https://docs.aws.amazon.com/cdk/v2/guide/home.html](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [https://docs.aws.amazon.com/cdk/api/v2/python/](https://docs.aws.amazon.com/cdk/api/v2/python/)
- [https://floci.io](https://floci.io)
- [https://github.com/floci-io/floci](https://github.com/floci-io/floci)
- [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)
- [https://mise.jdx.dev](https://mise.jdx.dev)

* * *
