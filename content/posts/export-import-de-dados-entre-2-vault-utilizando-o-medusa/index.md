---
title: "Export/Import de dados entre 2 Vault utilizando o Medusa"
slug: "export-import-de-dados-entre-2-vault-utilizando-o-medusa"
date: 2024-09-28T03:46:51-03:00
lastmod: 2026-11-21T13:10:47-03:00
draft: false
categories: ["devops", "gitops", "kubernetes", "tutoriais", "vault"]
tags: ["docker", "kubernetes", "vault"]
description: "Este é o terceiro post da série sobre o Vault. Você pode ver os posts anteriores clicando nos links a seguir:"
wp_id: 2934
---

{{< alert icon="circle-info" >}}
**Atualizado em 21/11/2026:** o nome da policy dos usuários (`CHANGE_USER`) agora é o mesmo informado em `policies=` ao criar o usuário. Na revisão de 20/11/2026: testado com Medusa 0.7.3 (Linux amd64) e Vault 2.2.2: export de um Vault no Kubernetes (kind) e import num segundo Vault, além da seção de usuários e policies. Corrigido o endereço nos comandos do Medusa (os sinais `<` e `>` em volta da URL faziam o comando falhar), corrigida a explicação do limite de versões do KV e incluído o equivalente em linha de comando para criar o path. A partir do Vault 2.1.2, prefira nomes de usuários e policies em minúsculas ([mudanças importantes](https://developer.hashicorp.com/vault/docs/updates/important-changes)).
{{< /alert >}}

Este é o terceiro post da série sobre o Vault. Você pode ver os posts anteriores clicando nos links a seguir:

- [Conhecendo o Hashicorp Vault](/conhecendo-o-hashicorp-vault/)
- [Instalando o Hashicorp Vault no Kubernetes (GKE) usando o Helm e configurando um bucket GCS para armazenamento](/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [HashiCorp Vault: Entregando segredos para uma aplicação no Kubernetes](/hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes/)

Obrigado [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/) e [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) pelo apoio no dia a dia e compartilhamento do conhecimento com o Vault.

## Sobre o Medusa

O **[Medusa](https://github.com/jonasvinther/medusa)** é uma ferramenta projetada para auxiliar na exportação e importação dos dados do Vault. Ela tem a capacidade de exportar e importar todas as credenciais salvas para um único arquivo [JSON](https://www.json.org/json-pt.html) ou [YAML](https://www.redhat.com/pt-br/topics/automation/what-is-yaml).

Para instalar o binário `medusa`, acesse a página de releases [https://github.com/jonasvinther/medusa/releases](https://github.com/jonasvinther/medusa/releases) e baixe o arquivo compactado (`.tar.gz`) referente ao sistema operacional que está utilizando.

> Atenção! Durante a elaboração deste documento foi utilizada a versão 0.7.2 e o sistema operacional macOS (Darwin ARM64).

Descompacte o arquivo de download do Medusa e acesse o diretório descompactado.

Mais informações sobre a execução podem ser obtidas com os comandos:

```bash
./medusa -h
./medusa export -h
./medusa import -h
```

Mais instruções e exemplos sobre a execução do Medusa estão na página inicial da ferramenta: [https://github.com/jonasvinther/medusa/blob/main/README.md](https://github.com/jonasvinther/medusa/blob/main/README.md)

### Export

Abra 2 abas do terminal.

Na **primeira aba do terminal**, acesse o cluster Kubernetes que tem o **Vault de origem** instalado.

Em seguida, crie um port-forward para o Vault com o seguinte comando:

```bash
 kubectl port-forward svc/vault 8200:8200 -n vault

```

Na segunda **aba do terminal**, acesse o diretório em que está o binário `medusa` e exporte os dados usando o seguinte comando:

```bash
./medusa export CHANGE_PATH_SECRET --address="http://127.0.0.1:8200" --token="CHANGE_HERE" --insecure --format=json > "$HOME/vault_export_$(date +%Y%m%d).json"
```

Acesse o arquivo gerado e valide/altere os dados de acordo com a necessidade.

### Import

> Atenção!!! Certifique-se de que o path de secret foi criado previamente no **Vault de destino**, no qual está sendo feita a importação das secrets. Ele pode ser criado conforme as instruções da seção a seguir.

Abra 2 abas do terminal.

Na **primeira aba do terminal**, acesse o cluster Kubernetes que tem o **Vault de destino** instalado.

Em seguida, crie um port-forward para o Vault com o seguinte comando:

```bash
kubectl port-forward svc/vault 8200:8200 -n vault

```

Na segunda **aba do terminal**, acesse o diretório em que está o binário `medusa` e importe os dados usando o seguinte comando:

```bash
./medusa import CHANGE_PATH_SECRET "CHANGE_FILE_NAME.json" --address="http://127.0.0.1:8200" --token="CHANGE_HERE" --insecure

```

Acesse a interface web do Vault na URL: [http://localhost:8200](http://localhost:8200) e valide a criação dos dados.

### Criando o path de secret e ACL, caso não exista no Vault antes da importação

Caso o **Vault de destino**, no qual você irá importar as secrets, seja uma instalação do zero, provavelmente o path de secret não existirá. Ele pode ser criado com as instruções abaixo.

Abra 1 aba do terminal e acesse o cluster Kubernetes que tem o **Vault de destino** instalado.

Em seguida, crie um port-forward para o Vault com o seguinte comando:

```bash
kubectl port-forward svc/vault 8200:8200 -n vault

```

No navegador web, acesse a URL [http://localhost:8200](http://localhost:8200) e faça o login com o token root.

Clique em **Secrets Engines.** Em seguida, clique em **Enable new engine**.

Na seção **Generic**, clique em **KV**.

No campo **Path**, digite o nome do path de secret. No campo **Maximum number of versions**, informe 50. Se deixar o valor 0 ou não informar nada, o Vault manterá apenas as 10 versões mais recentes de cada secret cadastrada e apagará automaticamente as mais antigas ([documentação](https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#max_versions)).

Se preferir a linha de comando (depois do `vault login` mostrado abaixo), o equivalente é:

```bash
vault secrets enable -path=CHANGE_PATH_SECRET -version=2 kv
vault write CHANGE_PATH_SECRET/config max_versions=50
```

Agora crie uma ACL Policy no Vault. Essa ACL deverá ter o nome que você já tem no Vault de origem e será usada para definir a permissão de acesso a cada path de secret cadastrado no Vault de destino e que será usada pelas aplicações.

Faça login no Vault com os seguintes comandos:

```bash
export VAULT_ADDR=http://127.0.0.1:8200

vault login

```

Crie a ACL Policy com os seguintes comandos:

```bash
cat <<EOF > vault_acl_policy.hcl
path "*" {
    capabilities = ["read"]
}
EOF

vault policy write CHANGE_PATH_SECRET vault_acl_policy.hcl
```

> Agora você pode voltar à seção **Import** para continuar com a importação dos dados.

## Gerenciando usuários e policies no Vault

Os comandos abaixo mostram como cadastrar usuários e policies no Vault.

- [https://developer.hashicorp.com/vault/docs/auth/userpass](https://developer.hashicorp.com/vault/docs/auth/userpass)
- [https://stackoverflow.com/questions/51003019/how-do-i-set-up-username-password-authentication-with-hashicorp-vault](https://stackoverflow.com/questions/51003019/how-do-i-set-up-username-password-authentication-with-hashicorp-vault)
- [https://www.youtube.com/watch?v=gA2tBDKqH0s](https://www.youtube.com/watch?v=gA2tBDKqH0s)
- [https://discuss.hashicorp.com/t/export-running-config/7313](https://discuss.hashicorp.com/t/export-running-config/7313)
- [https://developer.hashicorp.com/vault/tutorials/policies/policies](https://developer.hashicorp.com/vault/tutorials/policies/policies)

Primeiro habilite o método de autenticação `userpass` com o seguinte comando.

```bash
vault auth enable userpass
```

Crie um novo usuário com o seguinte comando:

```bash
vault write auth/userpass/users/CHANGE_USER password=CHANGE_PASSWORD policies=CHANGE_USER

```

> Atenção!!! Você pode criar uma policy diferente para cada usuário informando o nome do mesmo no campo policies do comando anterior ou informar uma policy diferente preexistente.

Crie a ACL Policy com o nome de cada usuário com os seguintes comandos:

```bash
cat <<EOF > vault_users_acl_policy.hcl
path "CHANGE_PATH_SECRET/metadata/+" {
  capabilities = ["list"]
}
path "CHANGE_PATH_SECRET/data/*" {
  capabilities = ["list", "create", "update", "patch", "read"]
}
EOF

vault policy write CHANGE_USER vault_users_acl_policy.hcl

```

> Atenção!!! A policy acima permite que os usuários leiam, criem e alterem secrets no path criado durante a importação, mas não permite removê-las.

Se precisar trocar a senha de um usuário existente, use o comando:

```bash
vault write auth/userpass/users/CHANGE_USER password=CHANGE_NEW_PASSWORD

```

Para testar o login com o novo usuário, use o seguinte comando.

```bash
vault login -method=userpass username=CHANGE_USER password=CHANGE_PASSWORD

```

Na interface web lembre-se de trocar a opção de autenticação de token para username.

## Referências

- [https://stackoverflow.com/questions/49214127/can-you-share-google-cloud-kms-keys-across-projects-with-service-roles](https://stackoverflow.com/questions/49214127/can-you-share-google-cloud-kms-keys-across-projects-with-service-roles)
- [https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-google-cloud-gke](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-google-cloud-gke)
- [https://developer.hashicorp.com/vault/docs/concepts/seal](https://developer.hashicorp.com/vault/docs/concepts/seal)
- [https://developer.hashicorp.com/vault/docs/configuration/seal/seal-ha](https://developer.hashicorp.com/vault/docs/configuration/seal/seal-ha)
- [https://medium.com/adessoturkey/hashicorp-vault-authentication-options-465b5b8eb560](https://medium.com/adessoturkey/hashicorp-vault-authentication-options-465b5b8eb560)
- [https://support.hashicorp.com/hc/en-us/articles/4404389946387-Kubernetes-auth-method-Permission-Denied-error](https://support.hashicorp.com/hc/en-us/articles/4404389946387-Kubernetes-auth-method-Permission-Denied-error)
- [https://support.hashicorp.com/hc/en-us/articles/13772047777811-Getting-the-error-route-entry-is-tainted-when-performing-read-or-write-actions-on-a-custom-plugin](https://support.hashicorp.com/hc/en-us/articles/13772047777811-Getting-the-error-route-entry-is-tainted-when-performing-read-or-write-actions-on-a-custom-plugin)
- [https://medium.com/@lingxiankong/vault-integration-with-kubernetes-unified-identity-management-service-36d9c8edddf0](https://medium.com/@lingxiankong/vault-integration-with-kubernetes-unified-identity-management-service-36d9c8edddf0)
- [https://discuss.hashicorp.com/t/info-agent-auth-handler-authenticating-url-put-http-x-x-svc-8200-v1-auth-kubernetes-login-code-403-permission-denied/61437](https://discuss.hashicorp.com/t/info-agent-auth-handler-authenticating-url-put-http-x-x-svc-8200-v1-auth-kubernetes-login-code-403-permission-denied/61437)
- [https://support.hashicorp.com/hc/en-us/articles/4417287569555-Vault-Agent-injector-ERROR-auth-handler-error-authenticating-error-context-deadline-exceeded](https://support.hashicorp.com/hc/en-us/articles/4417287569555-Vault-Agent-injector-ERROR-auth-handler-error-authenticating-error-context-deadline-exceeded)
- [https://stackoverflow.com/questions/76533818/vault-init-container-cannot-authenticate-to-vault](https://stackoverflow.com/questions/76533818/vault-init-container-cannot-authenticate-to-vault)
- [https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-sidecar](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-sidecar)
- [https://developer.hashicorp.com/vault/tutorials/vault-agent/agent-env-vars](https://developer.hashicorp.com/vault/tutorials/vault-agent/agent-env-vars)
- [https://www.hashicorp.com/blog/refresh-secrets-for-kubernetes-applications-with-vault-agent](https://www.hashicorp.com/blog/refresh-secrets-for-kubernetes-applications-with-vault-agent)
- [https://irezyigit.medium.com/vault-part2-introduction-to-secrets-and-secrets-engines-7d2a7880a3bd](https://irezyigit.medium.com/vault-part2-introduction-to-secrets-and-secrets-engines-7d2a7880a3bd)
- [https://stackoverflow.com/questions/78366601/vault-kv-patch-with-multiple-key-value-pairs](https://stackoverflow.com/questions/78366601/vault-kv-patch-with-multiple-key-value-pairs)
- [https://stackoverflow.com/questions/54312213/hashicorp-vault-cli-return-403-when-trying-to-use-kv](https://stackoverflow.com/questions/54312213/hashicorp-vault-cli-return-403-when-trying-to-use-kv)
- [https://developer.hashicorp.com/vault/docs/commands/kv](https://developer.hashicorp.com/vault/docs/commands/kv)
- [https://stackoverflow.com/questions/56025297/updating-a-single-value-in-hashicorp-vault](https://stackoverflow.com/questions/56025297/updating-a-single-value-in-hashicorp-vault)
- [https://gist.github.com/xuwang/2f0c0d58dd16d8f79e5cd3e1ffada421](https://gist.github.com/xuwang/2f0c0d58dd16d8f79e5cd3e1ffada421)
- [https://stackoverflow.com/questions/54744351/how-to-export-vault-secrets-as-zip-file](https://stackoverflow.com/questions/54744351/how-to-export-vault-secrets-as-zip-file)
- [https://github.com/jonasvinther/medusa](https://github.com/jonasvinther/medusa)
- [https://www.reddit.com/r/hashicorp/comments/10gcpzt/importing\_and\_exporting\_kv\_secrets\_in\_vault/](https://www.reddit.com/r/hashicorp/comments/10gcpzt/importing_and_exporting_kv_secrets_in_vault/)
- [https://stackoverflow.com/questions/2500436/how-does-cat-eof-work-in-bash](https://stackoverflow.com/questions/2500436/how-does-cat-eof-work-in-bash)
- [https://developer.hashicorp.com/vault/docs/concepts/policies](https://developer.hashicorp.com/vault/docs/concepts/policies)
- [https://developer.hashicorp.com/vault/tutorials/policies/policies](https://developer.hashicorp.com/vault/tutorials/policies/policies)
- [https://discuss.hashicorp.com/t/export-running-config/7313](https://discuss.hashicorp.com/t/export-running-config/7313)
