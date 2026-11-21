---
title: "Getting to know Terraform"
slug: "conhecendo-o-terraform"
date: 2018-07-20T11:35:34-03:00
lastmod: 2026-10-03T20:15:40-03:00
draft: false
categories: ["tutoriais"]
tags: ["aws", "docker", "gcp", "terraform"]
description: "Terraform is a tool for building, changing, and configuring network infrastructure safely and efficiently. With it, you can manage…"
sourceHash: "96e4df8358ad167e"
---

Illustration from the HashiCorp blog: [see the image at the source](https://www.datocms-assets.com/2885/1506457071-blog-terraform-list.svg).

**Updated on**: **October 3, 2026**

[Terraform](https://www.terraform.io) is a tool for building, changing, and configuring network infrastructure safely and efficiently. With it, you can manage well-known cloud services as well as custom in-house solutions. See the full list of supported cloud infrastructure services at: [https://www.terraform.io/docs/providers/index.html](https://www.terraform.io/docs/providers/index.html).

Terraform configuration files describe the components needed to run a single application or your entire datacenter. Terraform can generate an execution plan describing what it will do to reach the desired state and then carry out the instructions to build the described infrastructure. As the configuration changes, Terraform can determine what changed and create incremental execution plans that can be applied.

Terraform treats infrastructure as code, so you can version it with Git, for example, and have a backup, roll back in case of problems, and audit changes as time goes by and your environment evolves.

Terraform is developed and maintained by [Hashicorp](https://www.hashicorp.com/). It is free and open source, so it can receive contributions from the community on GitHub ([https://github.com/hashicorp/terraform](https://github.com/hashicorp/terraform)). It is available for download at: [https://www.terraform.io/downloads.html](https://www.terraform.io/downloads.html)

On GitHub, I published study material and some sample files using Terraform, Terragrunt, and OpenTofu to create resources on AWS and GCP: [https://github.com/aeciopires/terraform](https://github.com/aeciopires/terraform)

You can find more information about Terraform at the links below:

- [https://www.terraform.io/docs](https://www.terraform.io/docs/)
- [https://www.slideshare.net/DevOpsWebinars/best-practices-of-infrastructure-as-code-with-terraform](https://www.slideshare.net/DevOpsWebinars/best-practices-of-infrastructure-as-code-with-terraform)
- [https://www.slideshare.net/leetrout/terraform-an-overview-introduction](https://www.slideshare.net/leetrout/terraform-an-overview-introduction)
- [https://www.oreilly.com/search/?q=terraform&rows=50](https://www.oreilly.com/search/?q=terraform&rows=50)
- [https://github.com/hashicorp/terraform-guides](https://github.com/hashicorp/terraform-guides)
- [https://github.com/GoogleCloudPlatform/terraformer](https://github.com/GoogleCloudPlatform/terraformer)
- [https://terragrunt.com/](https://terragrunt.com/)
- [https://docs.terragrunt.com](https://docs.terragrunt.com)
