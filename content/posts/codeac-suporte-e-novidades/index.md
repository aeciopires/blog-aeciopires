---
title: "Codeac: Suporte e novidades"
slug: "codeac-suporte-e-novidades"
date: 2020-12-10T17:20:45-03:00
lastmod: 2024-11-19T01:50:55-03:00
draft: false
tags: ["iac", "terraform", "puppet", "saltstack", "bash"]
description: "Ano passado eu tinha compartilhado minhas primeiras impressões ao utilizar o Codeac (esse nome é inspirado em um urso que vive no Alasca e se chama…"
wp_id: 2456
---

Oi, pessoal!

Ano passado eu tinha compartilhado minhas primeiras impressões ao utilizar o [Codeac](https://www.codeac.io/?utm_campaign=aecio) (esse nome é inspirado em um urso que vive no Alasca e se chama **[Kodiak](https://en.wikipedia.org/wiki/Kodiak_bear)**). Então Codeac é um trocadilho ou brincadeira com a pronúncia ao incluir a palavra **_code_** (código em inglês). Veja o [_post_ anterior aqui](/codeac-ferramenta-para-analisar-a-qualidade-do-codigo-que-gerencia-a-infraestrutura-e-aplicacao/).

Há poucos dias eu habilitei a versão PRO para analisar alguns repositórios privados que estou utilizando em uma pesquisa de [mestrado no IFPB](https://estudante.ifpb.edu.br/cursos/195/), sob orientação de [Paulo Ditarso](https://www.linkedin.com/in/paulo-ditarso-maciel-jr-3902028/) e [Diego Pessoa](https://www.linkedin.com/in/diegorosapessoa/).

O destaque deste _post_ é para o suporte e as novidades sobre o **Codeac**.

**Sobre o suporte:** quando precisei de ajuda precisei apenas enviar um email com detalhes sobre o problema para **support@codeac.io.** Em cerca de 20 minutos eu já tinha recebido uma resposta sobre a análise do problema e tratativa da solução e a mensagem tinha sido enviada pelo desenvolvedor principal e CEO ( _Chief Executive Officer_) do Codeac, [Michal Simon](https://www.linkedin.com/in/michal-simon/).

**Sobre as novidades**:  [Jiri Tichy](https://www.linkedin.com/in/jirkatichy/) ( _Business Developer_) compartilhou comigo a possibilidade de testar algumas novidades que ainda serão lançadas oficialmente:

- **Velocity Report**, ele exibe detalhes sobre a qualidade e evolução do código à medida em que vários _Pull Requests_ são enviados ao repositório;
- [_Lint_](https://en.wikipedia.org/wiki/Lint_(software)) de sintaxe do código para arquivos **shell/bash (.sh)**;
- _Lint_ de sintaxe do código para arquivos **SaltStack (.sls)**;
- _Lint_ de sintaxe do código para arquivos **Puppet (.pp)**.

Esses novos _lints_ foram muito úteis e atenderam a necessidade que eu tinha.

Eu confesso que testei outros serviços de análise de código como [Codacy](https://www.codacy.com/) e [Sonarqube](https://www.sonarqube.org/), mas apenas no Codacy achei _lint_ para arquivos bash, mas não havia suporte oficial para Salt Stack ou Puppet.

Embora esses serviços sejam bem populares entre os desenvolvedores de software, os [lints](https://en.wikipedia.org/wiki/Lint_(software)) do Codacy e Sonarqube são mais voltados para código que gerencia a aplicação. Já o Codeac é mais voltado para arquivos e extensões utilizados em IaC ( _infrastructure as code_), embora também dê suporte aos _lints_ de linguagens de programação voltados para as aplicações.

Ah! O suporte do Codeac a arquivos [Helm](https://helm.sh/) está no RoadMap. Estou ansioso para testar em breve!
