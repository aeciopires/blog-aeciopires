---
title: "Instalando o Locust no Kubernetes para testes de carga"
slug: "instalando-o-locust-no-kubernetes-para-testes-de-carga"
date: 2025-04-22T10:34:26-03:00
lastmod: 2026-11-21T13:11:14-03:00
draft: false
categories: ["cluster", "devops", "docker", "go", "kubernetes", "tutoriais"]
tags: ["docker", "git", "helm", "kubernetes", "linux"]
description: "Locust é uma ferramenta de código-fonte aberto usada para fazer testes de desempenho/carga no protocolo HTTP e outros."
wp_id: 3372
---

{{< alert icon="circle-info" >}}
**Atualizado em 21/11/2026:** corrigida a descrição do parâmetro `--headless` na tabela de parâmetros: ele desativa a interface web e inicia o teste imediatamente (conforme a documentação oficial do Locust). Em 20/11/2026: Locust 2.47.0 com o chart `deliveryhero/locust` 0.35.0, testado num cluster kind (Kubernetes 1.37); corrigida a opção `--csv` da execução por linha de comando, que gerava arquivos com nome diferente do usado no `kubectl cp`.
{{< /alert >}}

[Locust](https://locust.io/) é uma ferramenta de código-fonte aberto usada para fazer testes de desempenho/carga no protocolo HTTP e outros.

Os testes do Locust podem ser executados a partir da linha de comando ou usando sua interface web. A taxa de transferência, os tempos de resposta e os erros podem ser visualizados em tempo real e/ou exportados para análise posterior.

O Locust permite a escrita e execução de códigos e bibliotecas Python para a execução dos testes, simulando usuários interagindo com o site.

Um caso de uso no Kubernetes é usar o Locust para testar a carga de uma aplicação web (backend ou frontend) para estudar o comportamento e o scaling gerenciados pelo [Horizontal Pod Autoscaling (HPA)](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/), o [Keda](https://keda.sh/) ou [Knative](https://knative.dev/).

## Requisitos

1. Neste tutorial, usaremos o [Kind](https://kind.sigs.k8s.io/) para simular um cluster Kubernetes rodando localmente. Se você tiver acesso a um cluster on-premises ou gerenciado na cloud pelo EKS, GKE, AKS, DKS ou outro, pode ignorar o uso do kind.
1. Também será necessário o uso do [Docker](https://www.docker.com/), [`kubectl`](https://kubernetes.io/docs/reference/kubectl/introduction/), [git](https://git-scm.com/) e [`helm`](https://helm.sh/). Esses softwares podem ser instalados seguindo o tutorial disponível em: [https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md](https://github.com/aeciopires/adsoft/blob/master/REQUIREMENTS.md)

## Instalando uma aplicação de teste

Para este ambiente de testes, vamos instalar a aplicação [kube-pires](https://gitlab.com/aeciopires/kube-pires), uma simples aplicação web desenvolvida em [Golang](https://go.dev/), que exibe algumas informações do pod de acordo com o endpoint acessado:

- `/` =\> Exibe o nome do host, o nome da interface e os endereços IP;
- `/health` =\> Exibe o status da aplicação;
- `/metrics` =\> Exibe as métricas no formato suportado pelo Prometheus;
- `/env` =\> Exibe as variáveis de ambiente;
- `/css` =\> Exibe o modelo CSS;

Acesse o cluster Kubernetes.

Crie o namespace `test` com o seguinte comando:

```bash
kubectl create namespace test
```

Faça o deploy da aplicação `kube-pires` com os seguintes comandos.

```bash
cd /tmp

git clone https://gitlab.com/aeciopires/kube-pires.git

cd kube-pires/helm-chart/

helm upgrade --install kube-pires -f values.yaml . -n test --create-namespace
```

Referência: [https://gitlab.com/aeciopires/kube-pires/-/tree/master/helm-chart?ref\_type=heads](https://gitlab.com/aeciopires/kube-pires/-/tree/master/helm-chart?ref_type=heads)

Com o helm chart instalado dessa forma, a aplicação fica acessível dentro do cluster por meio do Service `kube-pires`, na porta 80, no endereço `http://kube-pires.test.svc.cluster.local` (formato `<service>.<namespace>.svc.cluster.local` do [DNS do Kubernetes](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)).

## Instalação do Locust via helm

Adicione o repositório helm e atualize a lista de helm charts disponíveis para instalação.

```bash
helm repo add deliveryhero https://raw.githubusercontent.com/deliveryhero/helm-charts/refs/heads/master/

helm repo update
```

Clone o seguinte repositório git.

```bash
cd /tmp

git clone https://github.com/deliveryhero/helm-charts.git
```

Edite o conteúdo do arquivo `main.py` com as informações do script apontando para a URL da integração que deseja usar nos testes, como mostra o exemplo abaixo.

```bash
nano /tmp/helm-charts/stable/locust/locustfiles/example/main.py
```

Conteúdo do `main.py` customizado para testes da aplicação `kube-pires`. O script usa caminhos relativos e o host alvo dos testes é definido pelo atributo `host` ou, na instalação via helm, pelo parâmetro `loadtest.locust_host` do helm chart (variável `LOCUST_HOST`).

```text
from locust import HttpUser, task, between
import random

class SiteUser(HttpUser):
    # Host padrão usado nos testes. Pode ser sobrescrito pelo parâmetro --host ou pela variável LOCUST_HOST.
    host = "http://kube-pires.test.svc.cluster.local"

    # Configura o intervalo de tempo entre as requisições que cada usuário simulado vai fazer.
    # Não é a taxa de "spawn" de usuários, que é definida pelo parâmetro -r (--spawn-rate).
    # O valor between(1, 5) significa que o Locust irá esperar entre 1 e 5 segundos entre as requisições feitas.
    wait_time = between(1, 5)

    # Define as páginas (caminhos relativos ao host) que serão acessadas durante o teste de carga.
    pages = [
        "/metrics",
        "/health",
        "/env",
    ]

    # Este método simula o acesso à página principal
    @task(1)
    def load_home_page(self):
        """Acessa a página inicial"""
        self.client.get("/")

    # Este método acessa páginas aleatórias dentro da lista pages para simular a navegação do usuário.
    @task(2)
    def browse_pages(self):
        """Acessa uma página aleatória"""
        page = random.choice(self.pages)
        self.client.get(page)
```

Acesse o cluster Kubernetes.

Execute o seguinte comando para criar um `configmap` contendo o conteúdo do script citado anteriormente.

> Altere o nome do namespace na variável `$MYNAMESPACE` de acordo com o ambiente.

```bash
export MYNAMESPACE="test"

kubectl -n $MYNAMESPACE create configmap my-loadtest-locustfile --from-file /tmp/helm-charts/stable/locust/locustfiles/example/main.py

```

No mesmo path do script `main.py`, existem as libs, que podem ser alteradas em caso de necessidade. No exemplo que temos, basta aplicar o seguinte comando para criar outro `configmap` referente às libs.

```bash
kubectl -n $MYNAMESPACE create configmap my-loadtest-lib --from-file /tmp/helm-charts/stable/locust/locustfiles/example/lib/
```

Serão criados os seguintes configmaps: `my-loadtest-lib` e `my-loadtest-locustfile`. Eles podem ser visualizados com o seguinte comando:

```bash
kubectl get configmap -n $MYNAMESPACE

```

Por padrão, o helm chart vem com o arquivo `/tmp/helm-charts/stable/locust/values.yaml` configurado para fazer uso da imagem Docker `locustio/locust` na versão `2.32.2`. Caso seja necessário alterar, é possível visualizar outras versões dessa imagem disponíveis em [https://hub.docker.com/r/locustio/locust/tags](https://hub.docker.com/r/locustio/locust/tags).

> Como neste caso, eu só preciso alterar alguns poucos valores, vou ignorar o uso do arquivo `values.yaml` e configurar algumas coisas usando o parâmetro `--set` do helm.
>
> O parâmetro `--set worker.replicas` determina quantos pods worker do Locust serão instanciados no teste. Neste caso, estarei usando 10. Isso afeta diretamente os resultados dos testes. Cada worker tende a usar 1 CPU inteira. Poucos workers podem dar a impressão que sua aplicação é lenta ou não aguenta uma carga alta de requisições, mas na verdade pode ser o Locust não conseguindo fazer mais requisições paralelas. Por isso é importante aumentar esse valor para descobrir o limite real de requisições simultâneas que a aplicação suporta.

Com os configmaps criados no cluster, execute o seguinte comando para instalar o Locust:

```text
LOCUST_VERSION="2.47.0"
CHART_VERSION="0.35.0"

helm -n $MYNAMESPACE upgrade --install locust deliveryhero/locust \
  --set image.tag=$LOCUST_VERSION \
  --set loadtest.name=my-loadtest \
  --set loadtest.locust_host=http://kube-pires.test.svc.cluster.local \
  --set loadtest.locust_locustfile_configmap=my-loadtest-locustfile \
  --set loadtest.locust_lib_configmap=my-loadtest-lib \
  --set worker.replicas=10 \
  --version $CHART_VERSION \
  --debug --timeout=900s

```

O acesso à interface web pode ser feito por meio do port-forward:

```bash
kubectl -n $MYNAMESPACE port-forward service/locust 8089:8089

```

E acessado no browser por meio da URL: [http://127.0.0.1:8089](http://127.0.0.1:8089)

Abaixo estão algumas imagens com o resultado dos testes com o Locust:

**Imagem 1 – Gráficos de desempenho no Locust**

{{< figure src="/wp-content/uploads/2025/04/image-3-1024x650.png" alt="image (3)" >}}

Audiodescrição: A imagem exibe três gráficos:

**Total Requests per Second (RPS)**:

- Um gráfico de linha mostrando o número de requisições por segundo em vermelho.
- A linha mostra crescimento constante até cerca de 8 requisições por segundo.
- O gráfico também mostra 100% de falhas (linha vermelha constante).

**Response Times (ms)**:

- Gráfico com duas linhas:
- Laranja: 50º percentil (tempo de resposta mediano).
- Roxo: 95º percentil (tempo de resposta dos piores 5%).
- Mostra aumento gradual dos tempos, com o 95º percentil chegando a cerca de 16 ms.

**Number of Users**:

- Linha azul representando o número de usuários virtuais.
- Começa em 0 e vai até 50 usuários em questão de segundos.

**Imagem 2 – Estatísticas detalhadas por rota**

{{< figure src="/wp-content/uploads/2025/04/image-2-1024x355.png" alt="image (2)" >}}

Audiodescrição: A imagem mostra uma tabela com dados estatísticos sobre as requisições feitas:

- Cada linha corresponde a uma rota HTTP testada: `/`, `/env`, `/health` e `/metrics`.
- Para cada rota, são mostradas as seguintes informações:
  - **\# Requests**: Total de requisições feitas.
  - **\# Fails**: Total de falhas (todas as requisições falharam, 100% de falhas).
  - **Median (ms)**: Mediana do tempo de resposta (3 ms para todas).
  - **95%ile / 99%ile**: Percentis 95 e 99 do tempo de resposta.
  - **Average / Min / Max (ms)**: Média, mínimo e máximo tempo de resposta.
  - **Current RPS**: Requisições por segundo por rota.
  - **Current Failures/s**: Falhas por segundo por rota.

No topo da tela aparecem os dados globais do teste:

- **FAILURES**: 100%
- **HOST**: http://kube-pires.test.svc.cluster.local
- **USERS**: 50
- **WORKERS**: 10
- **RPS**: 8.1

## Alterações no script do Locust

Se precisar fazer ajustes no script, após os ajustes remova o configmap `my-loadtest-locustfile`

```bash
kubectl -n $MYNAMESPACE delete configmap my-loadtest-locustfile

```

Crie o configmap com as novas configurações de payload

```bash
nano /tmp/helm-charts/stable/locust/locustfiles/example/main.py

kubectl -n $MYNAMESPACE create configmap my-loadtest-locustfile --from-file /tmp/helm-charts/stable/locust/locustfiles/example/main.py

```

Faça o rollout do deployment para atualizar o pod.

```bash
kubectl rollout restart deployment/locust-master -n $MYNAMESPACE

```

## Removendo os configmaps

Execute o seguinte comando:

```bash
kubectl -n $MYNAMESPACE delete configmap my-loadtest-lib my-loadtest-locustfile

```

## Removendo o Locust

Execute o seguinte comando:

```bash
helm -n $MYNAMESPACE uninstall locust

```

## Locust por linha de comando

Para executar o Locust pelo terminal, é necessário estar conectado ao cluster em que o Locust foi instalado, como descrito nos passos anteriores. Em seguida, acesse o pod locust-master executando os passos a seguir.

```bash
MYNAMESPACE="CHANGE HERE"

# Descobrir o nome do pod locust-master
kubectl get pod -n $MYNAMESPACE -l component=master

POD_NAME="CHANGE HERE"

# Acessar o pod do locust
kubectl exec -it pod/$POD_NAME -n $MYNAMESPACE -- bash

```

Dentro do pod, o Locust permite definir os seguintes parâmetros para execução:

| Parâmetros | Descrição |
|---|---|
| `-u` | Quantidade de usuários |
| `-r` | Quantidade de usuários que são iniciados por segundo (ramp up) |
| `-t` | Duração do teste |
| `--headless` | Desativa a interface web e inicia o teste imediatamente |
| `--html` | Gera um relatório em html |
| `--csv` | Exporta os dados em CSV |
| `--host` | Host alvo dos testes |

Exemplo:

```text
locust -f main.py --headless -u 800 -r 800 -t 5m --html report.html --csv dados --host http://kube-pires.test.svc.cluster.local

```

Para exportar os relatórios gerados pelo teste (`dados_stats.csv` e `report.html`), execute os comandos abaixo em outro terminal:

```text
POD_NAME="CHANGE HERE"
MYNAMESPACE="CHANGE HERE"
LOCAL_DIR="CHANGE HERE" # Local que deseja armazenar o relatório do teste executado

kubectl cp $POD_NAME:/home/locust/dados_stats.csv $LOCAL_DIR/dados_stats.csv -n $MYNAMESPACE
kubectl cp $POD_NAME:/home/locust/report.html $LOCAL_DIR/report.html -n $MYNAMESPACE

```

## Referências

- [https://locust.io/](https://locust.io/)
- [https://docs.locust.io/en/stable/what-is-locust.html](https://docs.locust.io/en/stable/what-is-locust.html)
- [https://github.com/deliveryhero/helm-charts/blob/master/stable/locust/README.md](https://github.com/deliveryhero/helm-charts/blob/master/stable/locust/README.md)
- [https://artifacthub.io/packages/helm/deliveryhero/locust](https://artifacthub.io/packages/helm/deliveryhero/locust)
