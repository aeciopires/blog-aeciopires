---
title: "Aprendendo AWS CDK com Python e Floci"
slug: "aprendendo-aws-cdk-com-python-e-floci"
date: 2026-10-01T20:42:30-03:00
lastmod: 2026-10-01T20:42:31-03:00
draft: false
categories: ["devops", "docker", "git", "tutoriais"]
tags: ["aws", "cdk", "iac", "python", "docker"]
description: "Há poucos dias, eu precisei a estudar o AWS CDK (Cloud Development Kit) e organizei o conteúdo, exemplos de código e testes neste repositório:…"
wp_id: 3550
---

Há poucos dias, eu precisei a estudar o [AWS CDK (Cloud Development Kit)](https://docs.aws.amazon.com/cdk/v2/guide/home.html) e organizei o conteúdo, exemplos de código e testes neste repositório: [https://github.com/aeciopires/learning-cdk-python](https://github.com/aeciopires/learning-cdk-python). O material cresceu tanto que virou uma trilha de aprendizado.

Minha intenção é também ajudar outras pessoas que está estudando o CDK para utilizar no trabalho,

## O que é o AWS CDK?

{{< figure src="/wp-content/uploads/2026/10/cdk.png" alt="cdk" >}}

> O AWS Cloud Development Kit (AWS CDK) é um framework de desenvolvimento de software de código aberto para definir infraestrutura de nuvem em código e provisioná-la por meio do [AWS CloudFormation](https://aws.amazon.com/pt/cloudformation/).

Na prática, em vez de clicar no console da AWS ou escrever centenas de linhas de JSON/YAML do CloudFormation, você escreve uma classe Python (uma `*Stack*`) descrevendo uma fila, um bucket, um banco de dados... O CDK transforma esse código num template do CloudFormation ( `cdk synth`), mostra o que vai mudar ( `cdk diff`) e cria os recursos ( `cdk deploy`).

Se você já usa [Terraform](https://developer.hashicorp.com/terraform) (escrevi sobre ele [aqui](/conhecendo-o-terraform/)), vai se sentir em casa com a ideia de infraestrutura como código. A diferença é que, com o CDK, você usa uma linguagem de programação de verdade: laços, funções, classes, testes unitários, tudo aquilo que já conhecemos do desenvolvimento de software.

## E o Floci?

{{< figure src="/wp-content/uploads/2026/10/floci.png" alt="floci" >}}

O grande obstáculo para quem está aprendendo AWS é o medo da fatura no fim do mês. Um NAT Gateway, um banco RDS ou um cluster EKS esquecidos ligados podem gerar uma surpresa bem desagradável.

Para resolver isso, os códigos do repositório são executados no [floci](https://floci.io), **um emulador local da AWS, gratuito e de código aberto**, que roda com um simples `docker compose up`. Os comandos do AWS CLI, do SDK (boto3) e do próprio CDK funcionam da mesmo forma que se estivesse usando a AWS, só que apontando para um conteiner executando no ambiente local.

Assim, você pode errar, apagar, recriar e quebrar tudo à vontade, sem custo nenhum. Quando se sentir confiante, cada módulo também tem as instruções para fazer o deploy numa conta real da AWS (com os avisos de custo bem claros, para ninguém ser pego de surpresa).

## Algumas lições aprendidas no caminho

Ao construir o conteúdo desse repositório, aprendi bastante coisa que não está nos tutoriais "hello world":

- **Nem tudo que o emulador diz que criou, ele criou de verdade.** Alguns serviços (DocumentDB, MSK, OpenSearch, entre outros) são apenas registrados pelo CloudFormation do floci, mas não são criados. Por isso cada README traz os comandos do AWS CLI para conferir recurso por recurso, e as limitações estão documentadas de forma honesta.
- **Rodar o `cdk deploy` duas vezes não deveria duplicar nada**, mas no floci isso acontecia com alguns recursos. A explicação (e a solução) estão na documentação.
- **Rodar `cdk diff` antes de todo `cdk deploy`** é um hábito que vale ouro, principalmente em produção.
- **Testes unitários de infraestrutura** pegam muitos erros antes de qualquer recurso existir.

## E para encerrar...

Espero que esse repositório possa te ajudar a aprender e a usar o AWS CDK com mais segurança e confiança. Publicar esse material é uma forma de aprender melhor e de dar um retorno à comunidade, compartilhando o que aprendi e usei de graça a partir do que outras pessoas criaram e compartilharam.

O projeto é de código aberto (GPLv3) e está aberto a sugestões de melhoria e contribuições, seja corrigindo algo, melhorando a documentação ou criando novos módulos. Se o conteúdo for útil para você, deixe uma estrela ⭐ no repositório e compartilhe com quem também precisa aprender CDK.

Até a próxima!

## Referências

- https://github.com/aeciopires/learning-cdk-python
- https://docs.aws.amazon.com/cdk/v2/guide/home.html
- https://docs.aws.amazon.com/cdk/api/v2/python/
- https://floci.io
- https://github.com/floci-io/floci
- https://docs.astral.sh/uv/
- https://mise.jdx.dev
