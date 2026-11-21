---
title: "Getting to know HashiCorp Vault"
slug: "conhecendo-o-hashicorp-vault"
date: 2024-09-28T02:06:23-03:00
lastmod: 2026-10-08T14:40:47-03:00
draft: false
categories: ["devops", "kubernetes", "tutoriais", "vault"]
tags: ["docker", "helm", "kubernetes", "vault"]
description: "This is the first post in a series about HashiCorp Vault. Check out the next posts at the links below."
sourceHash: "2532dbeaaac25321"
---

{{< alert icon="circle-info" >}}
**Updated on October 8, 2026:** added the note about the Vault license, which since version 1.15.0 has been the Business Source License (BSL) 1.1 instead of an open source license.
{{< /alert >}}

This is the first post in a series about [HashiCorp Vault](https://www.hashicorp.com/products/vault). Check out the next posts at the links below.

- [Installing HashiCorp Vault on Kubernetes (GKE) using Helm and configuring a GCS bucket for storage](/en/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [Exporting/importing data between 2 Vaults using Medusa](/en/export-import-de-dados-entre-2-vault-utilizando-o-medusa/)
- [HashiCorp Vault: Delivering secrets to an application on Kubernetes](/en/hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes/)

Thanks to [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/), and [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) for their day-to-day support and for sharing their knowledge of Vault.

## **What is HashiCorp Vault?**

{{< figure src="/wp-content/uploads/2024/09/image.png" alt="image" >}}

Vault is a secrets management tool that lets you store, access, and control sensitive information such as passwords, API tokens, certificates, and cryptographic keys. It was designed to work in dynamic environments, such as public and private clouds, and to provide a high level of security for all kinds of sensitive data.

Instead of storing secrets in configuration files or environment variables, Vault offers a centralized and secure repository, with strict access controls and auditing.

It is not a new solution, and there are several alternatives, including managed services on the major public clouds. But Vault has the advantage of having publicly available source code, being very popular (many people and companies use it and can help with support in the communities), having a free edition, and being installable on-premises, in the cloud, and also on [Kubernetes](https://kubernetes.io/).

> Attention!!! Starting with version 1.15.0, Vault is distributed under the Business Source License (BSL) 1.1([https://github.com/hashicorp/vault/blob/main/LICENSE](https://github.com/hashicorp/vault/blob/main/LICENSE)), and no longer under an open-source license. It allows production use, except for offering Vault to third parties as a product that competes with the paid versions. Read the license file before adopting the tool at your company.

Useful links about Vault:

- [https://github.com/hashicorp/vault](https://github.com/hashicorp/vault)
- [https://www.hashicorp.com/products/vault](https://www.hashicorp.com/products/vault)
- [https://www.vaultproject.io/](https://www.vaultproject.io/)
- [https://developer.hashicorp.com/vault/docs](https://developer.hashicorp.com/vault/docs)
- [https://developer.hashicorp.com/certifications/security-automation](https://developer.hashicorp.com/certifications/security-automation)

## **Main features**

1. **Secure secret storage**: lets you store secrets securely, using strong encryption. It also supports automatic secret rotation, eliminating the risk of using static passwords.
1. **Policy-based access control:** implements a strict policy-based access control system (RBAC – _Role-Based Access Control_), allowing administrators to define exactly who can access which secrets, and under which circumstances.
1. **Built-in authentication and authorization**: supports a wide variety of authentication mechanisms, such as LDAP, GitHub, AWS IAM tokens, Kubernetes, among others, ensuring that only authorized users and systems have access to the secrets.
1. **Encryption as a service**: in addition to storing secrets, Vault offers **Encryption as a Service** (EaaS), allowing applications to use its APIs to encrypt and decrypt data without ever exposing the cryptographic keys.
1. **Centralized auditing**: every interaction with Vault is recorded in audit logs. This makes it possible to trace who accessed which secrets and when, which is crucial for compliance and incident investigation.
1. **Scalability**: it is designed for dynamic and complex environments, such as public and private clouds, and can be easily integrated into any modern architecture.
1. **Automation and CI/CD**: in environments where automation is key, Vault integrates with CI/CD pipelines, allowing credentials to be securely managed and rotated during process automation.

## **How does it work?**

Vault operates on a client/server model. The **Vault server** centralizes the storage and management of secrets, while the **Vault client** interacts with the server through APIs, the CLI, or by integrating directly into applications.

The basic Vault usage flow is:

1. The client authenticates with Vault using one of the supported methods (token, GitHub, LDAP, etc.).
1. After successful authentication, the client receives a temporary token that grants access to secrets according to the defined permissions.
1. The client can then request, create, update, or delete secrets in Vault, according to its permissions.

## **Conclusion**

HashiCorp Vault is a feature-rich tool, capable of meeting the needs of environments with different levels of complexity when it comes to configuration and secrets management. Its wide range of features, such as access control, encryption as a service, and centralized auditing, make it an essential solution for anyone looking to improve security when sharing and storing sensitive information with microservices at small or large scale.

This is the first post in a series about [HashiCorp Vault](https://www.hashicorp.com/products/vault). Check out the next posts at the links below.

- [Installing HashiCorp Vault on Kubernetes (GKE) using Helm and configuring a GCS bucket for storage](/en/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [Exporting/importing data between 2 Vaults using Medusa](/en/export-import-de-dados-entre-2-vault-utilizando-o-medusa/)
- [HashiCorp Vault: Delivering secrets to an application on Kubernetes](/en/hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes/)

## **References**

**Videos**:

- [https://www.youtube.com/watch?v=R3EYd9YnShU](https://www.youtube.com/watch?v=R3EYd9YnShU)
- [https://www.youtube.com/watch?v=MgHHejAIh50](https://www.youtube.com/watch?v=MgHHejAIh50)
- [https://www.youtube.com/watch?v=BSAsUdLVivk](https://www.youtube.com/watch?v=BSAsUdLVivk)

**Tutorials:**

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

**HashiCorp Talks:**

- 2025: [https://discuss.hashicorp.com/t/hashitalks-2025-speaker-slides/72752](https://discuss.hashicorp.com/t/hashitalks-2025-speaker-slides/72752)
- 2024: [https://discuss.hashicorp.com/t/hashitalks-2024-speaker-slides/62017](https://discuss.hashicorp.com/t/hashitalks-2024-speaker-slides/62017)
- 2023: [https://discuss.hashicorp.com/t/hashitalks-2023-speaker-slides/49019](https://discuss.hashicorp.com/t/hashitalks-2023-speaker-slides/49019)
- 2022: [https://discuss.hashicorp.com/t/hashitalks-2022-speaker-slides/35153/11](https://discuss.hashicorp.com/t/hashitalks-2022-speaker-slides/35153/11)
- 2021: [https://discuss.hashicorp.com/t/hashitalks-2021-speaker-slides/20732](https://discuss.hashicorp.com/t/hashitalks-2021-speaker-slides/20732?page=3)
- 2020: [https://discuss.hashicorp.com/t/hashitalks-2020-speaker-slides/6020/21](https://discuss.hashicorp.com/t/hashitalks-2020-speaker-slides/6020/21)
- 2019: [https://discuss.hashicorp.com/t/speaker-slides-at-hashiconf-2019/2609](https://discuss.hashicorp.com/t/speaker-slides-at-hashiconf-2019/2609)
