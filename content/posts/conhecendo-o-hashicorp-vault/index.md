---
title: "Conhecendo o Hashicorp Vault"
slug: "conhecendo-o-hashicorp-vault"
date: 2024-09-28T02:06:23-03:00
lastmod: 2026-10-08T14:40:47-03:00
draft: false
categories: ["devops", "kubernetes", "tutoriais", "vault"]
tags: ["docker", "helm", "kubernetes", "vault"]
description: "Este é o primeiro post de uma série sobre o Hashicorp Vault. Confira os próximos posts nos links abaixo."
wp_id: 2929
---

**Atualizado em: 8 de outubro de 2026**

Este é o primeiro post de uma série sobre o [Hashicorp Vault](https://www.hashicorp.com/products/vault). Confira os próximos posts nos links abaixo.

- [Instalando o Hashicorp Vault no Kubernetes (GKE) usando o Helm e configurando um bucket GCS para armazenamento](/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [Export/Import de dados entre 2 Vault utilizando o Medusa](/export-import-de-dados-entre-2-vault-utilizando-o-medusa/)
- [HashiCorp Vault: Entregando segredos para uma aplicação no Kubernetes](/hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes/)

Obrigado [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/) e [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) pelo apoio no dia a dia e compartilhamento do conhecimento com o Vault.

## **O que é o Hashicorp Vault?**

{{< figure src="/wp-content/uploads/2024/09/image.png" alt="image" >}}

O Vault é uma ferramenta de gerenciamento de segredos que permite armazenar, acessar e controlar informações confidenciais, como senhas, tokens de API, certificados e chaves criptográficas. Ele foi projetado para funcionar em ambientes dinâmicos, como nuvens públicas e privadas, e fornecer um nível elevado de segurança para todos os tipos de dados sensíveis.

Ao invés de armazenar segredos em arquivos de configuração ou em variáveis de ambiente, o Vault oferece um repositório centralizado e seguro, com controles rígidos de acesso e auditoria.

Não é uma solução nova e existem vários softwares alternativos, inclusive serviços gerenciados nas principais clouds públicas. Mas o Vault tem a vantagem de ter o código fonte disponível publicamente, ser muito popular (tem muitas pessoas e empresas que usam e pode ajudar com suporte nas comunidades), ter uma edição gratuita e poder ser instalado em ambientes on-premisse, na cloud e também no [Kubernetes](https://kubernetes.io/).

> Atenção!!! A partir da versão 1.15.0, o Vault passou a ser distribuído sob a licença Business Source License (BSL) 1.1([https://github.com/hashicorp/vault/blob/main/LICENSE](https://github.com/hashicorp/vault/blob/main/LICENSE)), e não mais sob uma licença de código aberto. Ela permite o uso em produção, exceto para oferecer o Vault a terceiros como um produto concorrente das versões pagas. Leia o arquivo de licença antes de adotar a ferramenta na sua empresa.

Links úteis sobre o Vault:

- [https://github.com/hashicorp/vault](https://github.com/hashicorp/vault)
- [https://www.hashicorp.com/products/vault](https://www.hashicorp.com/products/vault)
- [https://www.vaultproject.io/](https://www.vaultproject.io/)
- [https://developer.hashicorp.com/vault/docs](https://developer.hashicorp.com/vault/docs)
- [https://developer.hashicorp.com/certifications/security-automation](https://developer.hashicorp.com/certifications/security-automation)

## **Principais características**

1. **Armazenamento seguro de segredos**: permite que segredos sejam armazenados de forma segura, usando criptografia forte. Ele também suporta a rotação automática de segredos, eliminando o risco de uso de senhas estáticas.
1. **Controle de acesso baseado em políticas:** implementa um rigoroso sistema de controle de acesso baseado em políticas (RBAC – _Role-Based Access Control_), permitindo que os administradores definam exatamente quem pode acessar quais segredos, e em quais circunstâncias.
1. **Autenticação e autorização integradas**: suporta uma ampla variedade de mecanismos de autenticação, como LDAP, GitHub, tokens do AWS IAM, Kubernetes, entre outros, garantindo que somente usuários e sistemas autorizados tenham acesso aos segredos.
1. **Criptografia como serviço**: além de armazenar segredos, o Vault oferece **Criptografia como Serviço** (EaaS), permitindo que as aplicações utilizem suas APIs para criptografar e descriptografar dados sem jamais expor as chaves criptográficas.
1. **Auditoria centralizada**: todas as interações com o Vault são registradas em logs de auditoria. Isso permite a rastreabilidade de quem acessou quais segredos e quando, o que é crucial para compliance e investigação de incidentes.
1. **Escalabilidade**: é projetado para ambientes dinâmicos e complexos, como nuvens públicas e privadas, podendo ser integrado facilmente a qualquer arquitetura moderna.
1. **Automação e CI/CD**: em ambientes onde a automação é a chave, o Vault se integra aos pipelines de CI/CD, permitindo que as credenciais sejam gerenciadas e rotacionadas de forma segura durante a automação de processos.

## **Como funciona?**

O Vault opera em um modelo de cliente/servidor. O **servidor Vault** centraliza o armazenamento e o gerenciamento dos segredos, enquanto o **cliente Vault** interage com o servidor por meio de APIs, CLI ou integrando-se diretamente nas aplicações.

O fluxo básico de uso do Vault é:

1. O cliente se autentica com o Vault usando um dos métodos suportados (token, GitHub, LDAP, etc.).
1. Com a autenticação bem-sucedida, o cliente recebe um token temporário que permite o acesso aos segredos conforme as permissões definidas.
1. O cliente pode então solicitar, criar, atualizar ou deletar segredos no Vault, conforme suas permissões.

## **Conclusão**

O HashiCorp Vault é uma ferramenta com muitas funcionalidades, capaz de atender as necessidades de ambientes com diferentes níveis de complexidade no que se refere ao gerenciamento de configuração e segredos. Sua ampla gama de recursos, como controle de acesso, criptografia como serviço e auditoria centralizada, fazem dele uma solução essencial para quem busca melhorar a segurança no compartilhamento e armazenamento de informações sensíveis com microsserviços em pequena ou larga escala.

Este é o primeiro post de uma série sobre o [Hashicorp Vault](https://www.hashicorp.com/products/vault). Confira os próximos posts nos links abaixo.

- [Instalando o Hashicorp Vault no Kubernetes (GKE) usando o Helm e configurando um bucket GCS para armazenamento](/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [Export/Import de dados entre 2 Vault utilizando o Medusa](/export-import-de-dados-entre-2-vault-utilizando-o-medusa/)
- [HashiCorp Vault: Entregando segredos para uma aplicação no Kubernetes](/hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes/)

## **Referências**

**Vídeos**:

- [https://www.youtube.com/watch?v=R3EYd9YnShU](https://www.youtube.com/watch?v=R3EYd9YnShU)
- [https://www.youtube.com/watch?v=MgHHejAIh50](https://www.youtube.com/watch?v=MgHHejAIh50)
- [https://www.youtube.com/watch?v=BSAsUdLVivk](https://www.youtube.com/watch?v=BSAsUdLVivk)

**Tutoriais:**

- [https://8grams.medium.com/vault-install-the-most-advance-secret-manager-on-kubernetes-7196ad2cac0b](https://8grams.medium.com/vault-install-the-most-advance-secret-manager-on-kubernetes-7196ad2cac0b)
- [https://devopscube.com/vault-in-kubernetes/](https://devopscube.com/vault-in-kubernetes/)
- [https://deepsource.com/blog/setup-vault-kubernetes](https://deepsource.com/blog/setup-vault-kubernetes)
- [https://medium.com/@martin.hodges/adding-vault-to-your-development-kubernetes-cluster-using-kind-6a352eda2ab7](https://medium.com/@martin.hodges/adding-vault-to-your-development-kubernetes-cluster-using-kind-6a352eda2ab7)
- [https://github.com/tiwarisanjay/argocd-everything/blob/main/argocd-ha-vault-sso/README.md](https://github.com/tiwarisanjay/argocd-everything/blob/main/argocd-ha-vault-sso/README.md)
- [https://evoila.com/blog/inject-secrets-with-vault-agent-injector/](https://evoila.com/blog/inject-secrets-with-vault-agent-injector/)
- [https://medium.com/hashicorp-engineering/hashicorp-vault-delivering-secrets-with-kubernetes-1b358c03b2a3](https://medium.com/hashicorp-engineering/hashicorp-vault-delivering-secrets-with-kubernetes-1b358c03b2a3)
- [https://medium.com/@verove.clement/inject-secret-in-application-from-vault-agent-injector-60a3fe71628e](https://medium.com/@verove.clement/inject-secret-in-application-from-vault-agent-injector-60a3fe71628e)

**Slides:**

- [https://pt.slideshare.net/slideshow/hashicorp-webinar-vault-cloud-security-portuguese/176363144?from\_search=1#10](https://pt.slideshare.net/slideshow/hashicorp-webinar-vault-cloud-security-portuguese/176363144?from_search=1#10)
- [https://speakerdeck.com/nicksantamaria/hashicorp-vault-for-drupalers](https://speakerdeck.com/nicksantamaria/hashicorp-vault-for-drupalers)
- [https://speakerdeck.com/kesselborn/modern-secrets-management-with-hashicorps-vault](https://speakerdeck.com/kesselborn/modern-secrets-management-with-hashicorps-vault)
- [https://speakerdeck.com/stevenscg/using-hashicorp-vault-for-secrets-management](https://speakerdeck.com/stevenscg/using-hashicorp-vault-for-secrets-management)
- [https://github.com/hashicorp/field-workshops-vault](https://github.com/hashicorp/field-workshops-vault)
- [https://hashicorp.github.io/field-workshops-vault/slides/multi-cloud/vault-community/#1](https://hashicorp.github.io/field-workshops-vault/slides/multi-cloud/vault-community/#1)
- [https://mherman.org/presentations/vault/#1](https://mherman.org/presentations/vault/#1)

**Docs**

- [https://developer.hashicorp.com/vault/tutorials](https://developer.hashicorp.com/vault/tutorials)
- [https://developer.hashicorp.com/vault/docs/platform/k8s/injector/examples](https://developer.hashicorp.com/vault/docs/platform/k8s/injector/examples)
- [https://developer.hashicorp.com/vault/docs/platform/k8s/injector/annotations](https://developer.hashicorp.com/vault/docs/platform/k8s/injector/annotations)

**Hashicorp Talks:**

- 2025: [https://discuss.hashicorp.com/t/hashitalks-2025-speaker-slides/72752](https://discuss.hashicorp.com/t/hashitalks-2025-speaker-slides/72752)
- 2024: [https://discuss.hashicorp.com/t/hashitalks-2024-speaker-slides/62017](https://discuss.hashicorp.com/t/hashitalks-2024-speaker-slides/62017)
- 2023: [https://discuss.hashicorp.com/t/hashitalks-2023-speaker-slides/49019](https://discuss.hashicorp.com/t/hashitalks-2023-speaker-slides/49019)
- 2022: [https://discuss.hashicorp.com/t/hashitalks-2022-speaker-slides/35153/11](https://discuss.hashicorp.com/t/hashitalks-2022-speaker-slides/35153/11)
- 2021: [https://discuss.hashicorp.com/t/hashitalks-2021-speaker-slides/20732](https://discuss.hashicorp.com/t/hashitalks-2021-speaker-slides/20732?page=3)
- 2020: [https://discuss.hashicorp.com/t/hashitalks-2020-speaker-slides/6020/21](https://discuss.hashicorp.com/t/hashitalks-2020-speaker-slides/6020/21)
- 2019: [https://discuss.hashicorp.com/t/speaker-slides-at-hashiconf-2019/2609](https://discuss.hashicorp.com/t/speaker-slides-at-hashiconf-2019/2609)
