---
title: "Codeac: ferramenta para analisar a qualidade do código que gerencia a infraestrutura e aplicação"
slug: "codeac-ferramenta-para-analisar-a-qualidade-do-codigo-que-gerencia-a-infraestrutura-e-aplicacao"
date: 2019-12-30T12:00:07-03:00
lastmod: 2024-11-19T01:51:08-03:00
draft: false
categories: ["devops", "docker", "git", "tutoriais"]
tags: ["cloud", "git", "iac", "terraform"]
description: "Após uma postagem no Twitter de Rafael Gomes (Gomex) e Amaury Souza no Slack infraascode citando o Codeac.io, resolvi dedicar um tempo a estudar e testar…"
wp_id: 2225
---

Após uma postagem no Twitter de [Rafael Gomes (Gomex)](https://twitter.com/gomex/status/1210174746555506693) e Amaury Souza no [Slack infraascode](https://infraascode.slack.com) citando o [Codeac.io](https://www.codeac.io/infrastructure-as-code.html?utm_campaign=aecio), resolvi dedicar um tempo a estudar e testar a ferramenta.

**[Codeac](https://www.codeac.io/infrastructure-as-code.html?utm_campaign=aecio)** faz a análise da qualidade, olhando não apenas o código da aplicação, mas também do código que gerencia a infraestrutura a ser usada pela aplicação (Exemplo: Dockerfile, Ansible, CloudFormation, Terraform, Shell Script, etc). Há suporte a várias linguagens de programação: [https://www.codeac.io/documentation/supported-languages.html](https://www.codeac.io/documentation/supported-languages.html?utm_campaign=aecio).

Nos planos [Free ou Pro](https://www.codeac.io/pricing.html?utm_campaign=aecio), a ferramenta não requer a instalação (fica na nuvem) e a integração no pipeline é muito simples: basta configurar a integração com o [GitHub](https://github.com), [GitLab](https://gitlab.com) ou [BitBucket](https://bitbucket.com). Ele consegue listar todos os repositórios de código associados a conta e analisar apenas o código de repositórios públicos ou privados que você definir. Mais informações podem ser encontradas neste link: [https://www.codeac.io/documentation/getting-started.html](https://www.codeac.io/documentation/getting-started.html?utm_campaign=aecio). A [documentação](https://www.codeac.io/documentation/index.html?utm_campaign=aecio) é bem elaborada, clara e simples.

No plano [Enterprise](https://www.codeac.io/enterprise.html?utm_campaign=aecio), o Codeac pode ser instalado num servidor da rede local da sua empresa ou instituição e pode ser usado para acessar um repositório Git que esteja na rede local.

Configurei a integração do Codeac com esse repositório que mantenho no GitHub: [https://github.com/aeciopires/terraform](https://github.com/aeciopires/terraform)

Os resultados da análise podem ser vistos nas imagens a seguir. Como você pode ver, a interface é simples, intuitiva e mostra as sugestões de melhoria de forma clara.

{{< figure src="/wp-content/uploads/2019/12/codeac1.png" alt="codeac1" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac2.png" alt="codeac2" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac3.png" alt="codeac3" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac4.png" alt="codeac4" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac5.png" alt="codeac5" >}}

Após os testes iniciais, tive uma ótima surpresa... [Jiri Tichy](https://www.linkedin.com/in/jirkatichy/) (membro do time do [Codeac.io](https://www.codeac.io/infrastructure-as-code.html?utm_campaign=aecio)) entrou em contato via LinkedIn. Conversamos sobre as primeiras impressões sobre a ferramenta e pude entender um pouco mais sobre os objetivos da mesma. Durante a conversa recebi um pull request de [Michal Simon](https://www.linkedin.com/in/michal-simon/) (criador da ferramenta). Além da contribuição no código, as palavras de motivação para continuar ajudando com o código **open source** foram muito bem-vindas.

Espero que o post tenha sido útil e que de alguma forma possa ajudar você e seu time a escrever códigos ainda melhores para manter a infraestrutura, seja ela na nuvem ou em ambiente local.
