---
title: "Conhecendo o Terraform"
slug: "conhecendo-o-terraform"
date: 2018-07-20T11:35:34-03:00
lastmod: 2026-10-03T20:15:40-03:00
draft: false
categories: ["tutoriais"]
tags: ["aws", "docker", "gcp", "terraform"]
description: "O Terraform é uma ferramenta para construir, alterar e configurar uma infraestrutura de rede de forma segura e eficiente. Com ele é possível gerenciar…"
wp_id: 1726
---

Ilustração do blog da HashiCorp: [ver a imagem na fonte](https://www.datocms-assets.com/2885/1506457071-blog-terraform-list.svg).

**Atualizado em**:**03 de outubro de 2026**

O [Terraform](https://www.terraform.io) é uma ferramenta para construir, alterar e configurar uma infraestrutura de rede de forma segura e eficiente. Com ele é possível gerenciar serviços de nuvem bem conhecidos, bem como soluções internas personalizadas. Veja a lista completa de serviços de infraestrutura de nuvem suportados em: [https://www.terraform.io/docs/providers/index.html](https://www.terraform.io/docs/providers/index.html).

Os arquivos de configuração do Terraform descrevem os componentes necessários para executar um único aplicativo ou todo o seu datacenter. Ele pode gerar um plano de execução descrevendo o que ele fará para atingir o estado desejado e, em seguida, ele pode executar as instruções para construir a infraestrutura descrita.Conforme a configuração muda, o Terraform é capaz de determinar o que mudou e criar planos de execução incrementais que podem ser aplicados.

O Terraform trata a infraestrutura como código e dessa forma você pode versioná-lo usando o Git, por exemplo, e ter um backup, fazer rollback em caso de problemas e fazer auditoria à medida que o tempo passa e as alterações vão sendo realizadas no seu ambiente.

O Terraform é desenvolvido e mantido pela empresa [Hashicorp](https://www.hashicorp.com/). Ele é gratuito com código fonte aberto e assim pode receber contribuições da comunidade no GitHub ([https://github.com/hashicorp/terraform](https://github.com/hashicorp/terraform)). Ele está disponível para download na página: [https://www.terraform.io/downloads.html](https://www.terraform.io/downloads.html)

No Github eu publiquei um material de estudo e alguns arquivos de exemplo de uso do Terraform, Terragrunt e OpenTofu voltado para criar recursos na AWS e GCP: [https://github.com/aeciopires/terraform](https://github.com/aeciopires/terraform)

Mais informações sobre o Terraform podem ser obtidas nos links abaixo:

- [https://www.terraform.io/docs](https://www.terraform.io/docs/)
- [https://www.slideshare.net/DevOpsWebinars/best-practices-of-infrastructure-as-code-with-terraform](https://www.slideshare.net/DevOpsWebinars/best-practices-of-infrastructure-as-code-with-terraform)
- [https://www.slideshare.net/leetrout/terraform-an-overview-introduction](https://www.slideshare.net/leetrout/terraform-an-overview-introduction)
- [https://www.oreilly.com/search/?q=terraform&rows=50](https://www.oreilly.com/search/?q=terraform&rows=50)
- [https://github.com/hashicorp/terraform-guides](https://github.com/hashicorp/terraform-guides)
- [https://github.com/GoogleCloudPlatform/terraformer](https://github.com/GoogleCloudPlatform/terraformer)
- [https://terragrunt.com/](https://terragrunt.com/)
- [https://docs.terragrunt.com](https://docs.terragrunt.com)
