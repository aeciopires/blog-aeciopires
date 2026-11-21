---
title: "Codeac: Support and news"
slug: "codeac-suporte-e-novidades"
date: 2020-12-10T17:20:45-03:00
lastmod: 2024-11-19T01:50:55-03:00
draft: false
tags: ["iac", "terraform", "puppet", "saltstack", "bash"]
description: "Last year I shared my first impressions of using Codeac (the name is inspired by a bear that lives in Alaska called…"
sourceHash: "4e6e36c9caad6bcb"
---

Hi, everyone!

Last year I shared my first impressions of using [Codeac](https://www.codeac.io/?utm_campaign=aecio) (the name is inspired by a bear that lives in Alaska called the **[Kodiak](https://en.wikipedia.org/wiki/Kodiak_bear)**). So Codeac is a pun, or a play on the pronunciation, that includes the word **_code_**. See the [previous _post_ here](/en/codeac-ferramenta-para-analisar-a-qualidade-do-codigo-que-gerencia-a-infraestrutura-e-aplicacao/).

A few days ago I enabled the PRO version to analyze some private repositories I'm using in a [master's degree research at IFPB](https://estudante.ifpb.edu.br/cursos/195/), advised by [Paulo Ditarso](https://www.linkedin.com/in/paulo-ditarso-maciel-jr-3902028/) and [Diego Pessoa](https://www.linkedin.com/in/diegorosapessoa/).

The highlight of this _post_ is the support and the news about **Codeac**.

**About the support:** when I needed help, all I had to do was send an email with details about the problem to **support@codeac.io.** In about 20 minutes I had already received a reply about the analysis of the problem and how it would be solved, and the message had been sent by Codeac's lead developer and CEO ( _Chief Executive Officer_), [Michal Simon](https://www.linkedin.com/in/michal-simon/).

**About the news**:  [Jiri Tichy](https://www.linkedin.com/in/jirkatichy/) ( _Business Developer_) gave me the chance to test some new features that have not been officially released yet:

- **Velocity Report**, which shows details about the quality and evolution of the code as several _Pull Requests_ are sent to the repository;
- Code syntax [_lint_](https://en.wikipedia.org/wiki/Lint_(software)) for **shell/bash (.sh)** files;
- Code syntax _lint_ for **SaltStack (.sls)** files;
- Code syntax _lint_ for **Puppet (.pp)** files.

These new _lints_ were very useful and met the needs I had.

I confess that I tested other code analysis services such as [Codacy](https://www.codacy.com/) and [Sonarqube](https://www.sonarqube.org/), but only in Codacy did I find a _lint_ for bash files, and there was no official support for Salt Stack or Puppet.

Although these services are very popular among software developers, the [lints](https://en.wikipedia.org/wiki/Lint_(software)) of Codacy and Sonarqube are more focused on application code. Codeac, on the other hand, is more focused on files and extensions used in IaC ( _infrastructure as code_), although it also supports _lints_ for application programming languages.

Oh! Codeac's support for [Helm](https://helm.sh/) files is on the roadmap. I'm looking forward to testing it soon!
