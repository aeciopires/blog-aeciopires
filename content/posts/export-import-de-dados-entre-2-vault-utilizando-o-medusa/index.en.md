---
title: "Exporting/importing data between two Vault instances using Medusa"
slug: "export-import-de-dados-entre-2-vault-utilizando-o-medusa"
date: 2024-09-28T03:46:51-03:00
lastmod: 2026-11-21T13:10:47-03:00
draft: false
categories: ["devops", "gitops", "kubernetes", "tutoriais", "vault"]
tags: ["docker", "kubernetes", "vault"]
description: "This is the third post in the Vault series. You can read the previous posts by clicking the links below:"
sourceHash: "1bfec7eb3c0713d8"
---

{{< alert icon="circle-info" >}}
**Updated on November 21, 2026:** the users' policy name (`CHANGE_USER`) now matches the one passed in `policies=` when creating the user. In the November 20, 2026 review: tested with Medusa 0.7.3 (Linux amd64) and Vault 2.2.2: export from a Vault on Kubernetes (kind) and import into a second Vault, plus the section on users and policies. Fixed the address in the Medusa commands (the `<` and `>` signs around the URL made the command fail), fixed the explanation of the KV version limit, and added the command-line equivalent for creating the path. Starting with Vault 2.1.2, prefer lowercase names for users and policies ([important changes](https://developer.hashicorp.com/vault/docs/updates/important-changes)).
{{< /alert >}}

This is the third post in the Vault series. You can read the previous posts by clicking the links below:

- [Getting to know HashiCorp Vault](/en/conhecendo-o-hashicorp-vault/)
- [Installing HashiCorp Vault on Kubernetes (GKE) using Helm and configuring a GCS bucket for storage](/en/instalando-o-hashicorp-vault-no-kubernetes-gke-usando-o-helm-e-configurando-um-bucket-gcs-para-armazenamento/)
- [HashiCorp Vault: Delivering secrets to an application on Kubernetes](/en/hashicorp-vault-entregando-segredos-para-uma-aplicacao-no-kubernetes/)

Thanks to [Filipe Maia](https://www.linkedin.com/in/filipebsmaia/), [André Luis Soares](https://www.linkedin.com/in/andreluys01/), and [Kleberson Sartori](https://www.linkedin.com/in/kleberson-sartori/) for their day-to-day support and for sharing their knowledge of Vault.

## About Medusa

**[Medusa](https://github.com/jonasvinther/medusa)** is a tool designed to help export and import Vault data. It can export and import all saved credentials to a single [JSON](https://www.json.org/json-pt.html) or [YAML](https://www.redhat.com/pt-br/topics/automation/what-is-yaml) file.

To install the `medusa` binary, go to the releases page [https://github.com/jonasvinther/medusa/releases](https://github.com/jonasvinther/medusa/releases) and download the compressed file (`.tar.gz`) for the operating system you are using.

> Attention! Version 0.7.2 on macOS (Darwin ARM64) was used while writing this document.

Extract the Medusa download and go to the extracted directory.

You can get more information about running it with the commands:

```bash
./medusa -h
./medusa export -h
./medusa import -h
```

More instructions and examples on running Medusa are on the tool's home page: [https://github.com/jonasvinther/medusa/blob/main/README.md](https://github.com/jonasvinther/medusa/blob/main/README.md)

### Export

Open two terminal tabs.

In the **first terminal tab**, access the Kubernetes cluster where the **source Vault** is installed.

Then create a port-forward to Vault with the following command:

```bash
 kubectl port-forward svc/vault 8200:8200 -n vault

```

In the second **terminal tab**, go to the directory where the `medusa` binary is and export the data with the following command:

```bash
./medusa export CHANGE_PATH_SECRET --address="http://127.0.0.1:8200" --token="CHANGE_HERE" --insecure --format=json > "$HOME/vault_export_$(date +%Y%m%d).json"
```

Open the generated file and validate/change the data as needed.

### Import

> Attention!!! Make sure the secret path was created beforehand in the **destination Vault**, where the secrets are being imported. It can be created following the instructions in the next section.

Open two terminal tabs.

In the **first terminal tab**, access the Kubernetes cluster where the **destination Vault** is installed.

Then create a port-forward to Vault with the following command:

```bash
kubectl port-forward svc/vault 8200:8200 -n vault

```

In the second **terminal tab**, go to the directory where the `medusa` binary is and import the data with the following command:

```bash
./medusa import CHANGE_PATH_SECRET "CHANGE_FILE_NAME.json" --address="http://127.0.0.1:8200" --token="CHANGE_HERE" --insecure

```

Open the Vault web UI at [http://localhost:8200](http://localhost:8200) and check that the data was created.

### Creating the secret path and ACL if they don't exist in Vault before the import

If the **destination Vault**, where you will import the secrets, is a fresh installation, the secret path probably won't exist. You can create it with the instructions below.

Open a terminal tab and access the Kubernetes cluster where the **destination Vault** is installed.

Then create a port-forward to Vault with the following command:

```bash
kubectl port-forward svc/vault 8200:8200 -n vault

```

In the web browser, go to [http://localhost:8200](http://localhost:8200) and log in with the root token.

Click **Secrets Engines.** Then click **Enable new engine**.

In the **Generic** section, click **KV**.

In the **Path** field, type the name of the secret path. In the **Maximum number of versions** field, enter 50. If you leave it at 0 or enter nothing, Vault will keep only the 10 most recent versions of each stored secret and will automatically delete the older ones ([documentation](https://developer.hashicorp.com/vault/api-docs/secret/kv/kv-v2#max_versions)).

If you prefer the command line (after the `vault login` shown below), the equivalent is:

```bash
vault secrets enable -path=CHANGE_PATH_SECRET -version=2 kv
vault write CHANGE_PATH_SECRET/config max_versions=50
```

Now create an ACL policy in Vault. This ACL must have the name you already use in the source Vault. It will define the access permission for each secret path stored in the destination Vault and will be used by the applications.

Log in to Vault with the following commands:

```bash
export VAULT_ADDR=http://127.0.0.1:8200

vault login

```

Create the ACL policy with the following commands:

```bash
cat <<EOF > vault_acl_policy.hcl
path "*" {
    capabilities = ["read"]
}
EOF

vault policy write CHANGE_PATH_SECRET vault_acl_policy.hcl
```

> Now you can go back to the **Import** section to continue importing the data.

## Managing users and policies in Vault

The commands below show how to create users and policies in Vault.

- [https://developer.hashicorp.com/vault/docs/auth/userpass](https://developer.hashicorp.com/vault/docs/auth/userpass)
- [https://stackoverflow.com/questions/51003019/how-do-i-set-up-username-password-authentication-with-hashicorp-vault](https://stackoverflow.com/questions/51003019/how-do-i-set-up-username-password-authentication-with-hashicorp-vault)
- [https://www.youtube.com/watch?v=gA2tBDKqH0s](https://www.youtube.com/watch?v=gA2tBDKqH0s)
- [https://discuss.hashicorp.com/t/export-running-config/7313](https://discuss.hashicorp.com/t/export-running-config/7313)
- [https://developer.hashicorp.com/vault/tutorials/policies/policies](https://developer.hashicorp.com/vault/tutorials/policies/policies)

First, enable the `userpass` auth method with the following command.

```bash
vault auth enable userpass
```

Create a new user with the following command:

```bash
vault write auth/userpass/users/CHANGE_USER password=CHANGE_PASSWORD policies=CHANGE_USER

```

> Attention!!! You can create a different policy for each user by entering the user's name in the policies field of the previous command, or you can enter a different, preexisting policy.

Create the ACL policy named after each user with the following commands:

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

> Attention!!! The policy above lets users read, create, and change secrets in the path created during the import, but does not let them delete secrets.

If you need to change the password of an existing user, use the command:

```bash
vault write auth/userpass/users/CHANGE_USER password=CHANGE_NEW_PASSWORD

```

To test logging in with the new user, use the following command.

```bash
vault login -method=userpass username=CHANGE_USER password=CHANGE_PASSWORD

```

In the web UI, remember to switch the authentication method from token to username.

## References

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
