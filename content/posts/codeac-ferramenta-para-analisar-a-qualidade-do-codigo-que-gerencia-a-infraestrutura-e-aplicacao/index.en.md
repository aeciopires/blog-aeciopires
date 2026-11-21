---
title: "Codeac: a tool to analyze the quality of the code that manages infrastructure and applications"
slug: "codeac-ferramenta-para-analisar-a-qualidade-do-codigo-que-gerencia-a-infraestrutura-e-aplicacao"
date: 2019-12-30T12:00:07-03:00
lastmod: 2024-11-19T01:51:08-03:00
draft: false
categories: ["devops", "docker", "git", "tutoriais"]
tags: ["cloud", "git", "iac", "terraform"]
description: "After a Twitter post by Rafael Gomes (Gomex) and a message from Amaury Souza on the infraascode Slack mentioning Codeac.io, I decided to spend some time studying and testing…"
sourceHash: "8a39418e9e7e6b77"
---

After a Twitter post by [Rafael Gomes (Gomex)](https://twitter.com/gomex/status/1210174746555506693) and a message from Amaury Souza on the [infraascode Slack](https://infraascode.slack.com) mentioning [Codeac.io](https://www.codeac.io/infrastructure-as-code.html?utm_campaign=aecio), I decided to spend some time studying and testing the tool.

**[Codeac](https://www.codeac.io/infrastructure-as-code.html?utm_campaign=aecio)** analyzes code quality, looking not only at the application code but also at the code that manages the infrastructure used by the application (for example: Dockerfile, Ansible, CloudFormation, Terraform, Shell Script, etc.). Several programming languages are supported: [https://www.codeac.io/documentation/supported-languages.html](https://www.codeac.io/documentation/supported-languages.html?utm_campaign=aecio).

On the [Free or Pro](https://www.codeac.io/pricing.html?utm_campaign=aecio) plans, the tool doesn't require installation (it runs in the cloud), and integrating it into the pipeline is very simple: just set up the integration with [GitHub](https://github.com), [GitLab](https://gitlab.com), or [BitBucket](https://bitbucket.com). It can list all the code repositories associated with the account and analyze only the code of the public or private repositories you choose. More information can be found at this link: [https://www.codeac.io/documentation/getting-started.html](https://www.codeac.io/documentation/getting-started.html?utm_campaign=aecio). The [documentation](https://www.codeac.io/documentation/index.html?utm_campaign=aecio) is well written, clear, and simple.

On the [Enterprise](https://www.codeac.io/enterprise.html?utm_campaign=aecio) plan, Codeac can be installed on a server in your company's or institution's local network and can be used to access a Git repository on the local network.

I set up the Codeac integration with this repository I maintain on GitHub: [https://github.com/aeciopires/terraform](https://github.com/aeciopires/terraform)

The analysis results can be seen in the images below. As you can see, the interface is simple and intuitive, and it shows the improvement suggestions clearly.

{{< figure src="/wp-content/uploads/2019/12/codeac1.png" alt="codeac1" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac2.png" alt="codeac2" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac3.png" alt="codeac3" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac4.png" alt="codeac4" >}}

{{< figure src="/wp-content/uploads/2019/12/codeac5.png" alt="codeac5" >}}

After the initial tests, I got a great surprise... [Jiri Tichy](https://www.linkedin.com/in/jirkatichy/) (a member of the [Codeac.io](https://www.codeac.io/infrastructure-as-code.html?utm_campaign=aecio) team) reached out to me on LinkedIn. We talked about my first impressions of the tool, and I was able to understand a bit more about its goals. During the conversation, I received a pull request from [Michal Simon](https://www.linkedin.com/in/michal-simon/) (the tool's creator). Besides the code contribution, his words of encouragement to keep helping with **open source** code were very welcome.

I hope this post was useful and that it can somehow help you and your team write even better code to maintain your infrastructure, whether in the cloud or on-premises.
