---
title: "Conhecendo o Kubernetes Gateway API"
slug: "conhecendo-o-kubernetes-gateway-api"
date: 2025-11-21T02:24:01-03:00
lastmod: 2026-10-11T01:55:12-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes"]
tags: ["docker", "helm", "kubernetes", "linux"]
description: "Este é o primeiro post de uma série sobre o Kubernetes Gateway API."
wp_id: 3456
---

**Atualizado em: 10 de outubro de 2026**

Este é o primeiro post de uma série sobre o [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io).

Antes de continuar, se você não sabe o que é Docker e/ou Kubernetes recomendo fazer os cursos abaixo comigo ou ler e praticar o conteúdo desses links.

- [/primeiros-passos-com-docker-e-kubernetes/](/primeiros-passos-com-docker/)
- [/?s=docker](/?s=docker)
- [/?s=kubernetes](/?s=kubernetes)  

- [Curso Docker](/curso-docker/)
- [Curso Kubernetes (k8s)](/curso-kubernetes-k8s/)

## **Introdução**

O gerenciamento de tráfego no [Kubernetes](https://kubernetes.io/) não é simples e, na maioria dos casos, envolve a exposição de aplicações compostas por múltiplos serviços, tais como: [frontends](https://aws.amazon.com/pt/compare/the-difference-between-frontend-and-backend/), [APIs](https://aws.amazon.com/pt/what-is/api/) e [backends](https://aws.amazon.com/pt/compare/the-difference-between-frontend-and-backend/), que podem ser desenvolvidos em diferentes [linguagens de aplicação](https://pt.wikipedia.org/wiki/Linguagem_de_programa%C3%A7%C3%A3o).

Tradicionalmente, essas aplicações podem ser expostas usando uma combinação de objetos do Kubernetes, tais como: [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/), [Services](https://kubernetes.io/docs/concepts/services-networking/service/), [load balancers](https://spacelift.io/blog/kubernetes-load-balancer), e [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/). O uso dessa combinação em larga escala gera uma grande configuração fragmentada que cria desafios operacionais e complexos, que podem atrasar novos _deploys_ e dificultar a adaptação às novas demandas de microsserviços, onde: escalabilidade, confiabilidade e custos são requisitos cruciais para o negócio.

O objeto _**Ingress**_ utiliza regras para o roteamento do tráfego [HTTP](https://pt.wikipedia.org/wiki/HTTP) e [HTTPS](https://pt.wikipedia.org/wiki/HTTPS) com base em [paths](https://swagger.io/docs/specification/v3_0/paths-and-operations/) e [nomes DNS](https://aws.amazon.com/pt/route53/what-is-dns/) para direcionar as requests vindas de fora do cluster para as aplicações implantadas no Kubernetes, e isso é mais eficiente do que o uso direto do objeto _**Service**_, do tipo _[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)_ ou _[NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)_. O Ingress atua em conjunto com um [_Ingress Controller_](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/), que pode ser implementado por diferentes softwares. Um desses softwares é o o famoso [ingress-nginx,](https://github.com/kubernetes/ingress-nginx) que teve [anunciado o fim do desenvolvimento de novas versões](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/) a partir de Março de 2026. O _Ingress_ atua apenas na camada 7 do [modelo OSI](https://pt.wikipedia.org/wiki/Modelo_OSI) (Layer 7 ou apenas L7).

> _Obrigado a [Ricardo Katz](https://www.linkedin.com/in/katzricardo/) e demais contribuidores de código do ingress-nginx_ e também no Gateway API.

A figura abaixo foi extraída desse [artigo do blog da AWS](https://aws.amazon.com/blogs/containers/exposing-kubernetes-applications-part-3-nginx-ingress-controller/). Ela descreve em linhas gerais o fluxo de uma _request_ vinda de um cliente (que pode ser uma pessoa ou uma aplicação) até chegar no [Pod](https://kubernetes-io.translate.goog/docs/concepts/workloads/pods) da aplicação destino implantada no Kubernetes.

{{< figure src="/wp-content/uploads/2025/11/image.png" alt="image" >}}

A figura acima mostra que o _Ingress Controller_ implanta, configura e gerencia os Pods que contêm o [Nginx](https://nginx.org/), um [servidor web HTTP](https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server) e proxy reverso de código aberto e muito popular. Os Pods do Nginx são expostos por meio do objeto _Service_ do _Ingress Controller_, e eles recebem todo o tráfego externo ao Kubernetes. O _Ingress Controller_ observa os objetos de _Ingress_ configurados para cada [Namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) de cada aplicação (via API do Kubernetes) e configura os pods do Nginx com base nas definições de IngressClass/Ingress, para que o tráfego seja roteado para os serviços apropriados. Aqui é verificado o path e nome DNS que o cliente deseja acessar. Uma vez que o controlador roteia o tráfego, a _request_ é encaminhada ao objeto _Service_ da aplicação destino. O _Service_, por sua vez, faz o descovery dos Pods da aplicação e repassa a _request_. Dentro do Pod, um conteiner da aplicação receberá a _request_ e processará a solicitação do cliente. Depois da aplicação processar a _request_, a resposta segue o caminho inverso até o cliente.

### **O que é o Kubernetes Gateway API?**

O **Kubernetes Gateway API** é uma especificação que padroniza a forma como o roteamento de tráfego é gerenciado no Kubernetes. Ele foi criado pelo Kubernetes [SIG-NETWORK group](https://github.com/kubernetes/community/tree/master/sig-network) como uma alternativa mais flexível e robusta às limitações _Ingress_, possibilitando uma abordagem modular, configuração mais granular e declarativa, melhor compatibilidade entre diferentes _controllers_, separação clara de responsabilidades e suporte nativo a diversos protocolos, tais como: [HTTP](https://pt.wikipedia.org/wiki/HTTP), [TCP](https://pt.wikipedia.org/wiki/Protocolo_de_Controle_de_Transmiss%C3%A3o), [UDP](https://pt.wikipedia.org/wiki/Protocolo_de_datagrama_do_usu%C3%A1rio), [TLS](https://pt.wikipedia.org/wiki/Transport_Layer_Security), [gRPC](https://grpc.io/) e [WebSocket](https://pt.wikipedia.org/wiki/WebSocket). [Nesse post](https://www.cncf.io/blog/2025/05/02/understanding-kubernetes-gateway-api-a-modern-approach-to-traffic-management/), você poderá ver mais detalhes sobre o Kubernetes Gateway API e o Ingress, bem como casos de uso e que limitações do Ingress o Gateway API promete resolver.

O principal ganho do uso Kubernetes Gateway API é a simplificação do gerenciamento de tráfego, permitindo que as equipes escalem as aplicações com menos esforço que usando o Ingress, mantendo a eficiência operacional e a segurança. Embora o Kubernetes não ofereça uma implementação padrão, existem diversas ferramentas populares de código aberto e comerciais, que suportam o Gateway API. A lista completa pode ser vista em: [https://gateway-api.sigs.k8s.io/implementations/](https://gateway-api.sigs.k8s.io/implementations/).

> É importante dizer que o Gateway API não substitui o Ingress. É uma evolução a partir dele, que traz soluções para demandas mais complexas e necessidades não eram atendidas pelo Ingress. O Gateway API atua nas camadas 4 e 7 do [modelo OSI](https://pt.wikipedia.org/wiki/Modelo_OSI) (Layer 4 e7 ou apenas L4 e L7).

### **Componentes do Gateway API**

A especificação do Gateway API introduz vários novos **[CRDs (Custom Resource Definition)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)** e consiste nos seguintes componentes:

- **[GatewayController](https://gateway-api.sigs.k8s.io/docs/implementations)**: é um recurso a nível de cluster que corresponde a implementação dos tipos de gateway que fará o balanceamento de carga do tráfego no Kubernetes. Existem diferentes softwares que implementam o GatewayController, e a lista pode ser encontrada em: [https://gateway-api.sigs.k8s.io/docs/implementations/list/](https://gateway-api.sigs.k8s.io/docs/implementations/list/)
- **[GatewayClass](https://gateway-api.sigs.k8s.io/reference/api-types/gatewayclass/)**: é um recurso também a nível de cluster que gerencia todos os recursos do Gateway. Ele torna fácil e explícito para os administradores do cluster entenderem quais recursos estão disponíveis a determinado grupo de gateways, que compartilham a mesma configuração e que são gerenciados pelo GatewayController seguindo as especificações da classe.
- **[Gateway](https://gateway-api.sigs.k8s.io/reference/api-types/gateway/)**: é aqui que o tráfego é gerenciado. Um gateway funciona como um ponto de entrada para o cluster Kubernetes, que direciona o tráfego de entrada para os destinos apropriados com base na configuração do GatewayClass. Pode existir um gateway por cluster e/ou por namespace. O Gateway define as portas ( **_listeners_**), protocolo (HTTP, TCP, TLS…), nomes, hostname, etc para encaminhar as requests às aplicações de destino.
- **RouteTyped**: essas rotas descrevem regras de roteamento e usam **_parentRefs_** para referenciar quais Gateways (e quais _**listeners**_ dentro deles) devem receber essa rota. Há também um modelo de confiança ( **_trust model_**), onde o Gateway pode filtrar quais rotas são permitidas em cada listener ( **_allowedRoutes_**), garantindo que apenas rotas autorizadas sejam vinculadas. Na versão 1.6 do Gateway API existem os seguintes tipos:
  - **[HTTPRoute](https://gateway-api.sigs.k8s.io/reference/api-types/httproute)**: é aqui que são definidas as regras de roteamento do tráfego [HTTP](https://pt.wikipedia.org/wiki/HTTP).
  - **[TCPRoute](https://gateway-api.sigs.k8s.io/reference/api-types/tcproute/)**: é aqui que são definidas as regras de roteamento do tráfego [TCP](https://pt.wikipedia.org/wiki/Protocolo_de_Controle_de_Transmiss%C3%A3o) e [Websocket](https://pt.wikipedia.org/wiki/WebSocket).
  - **[UDPRoute](https://gateway-api.sigs.k8s.io/reference/api-types/udproute/)**: é aqui que são definidas as regras de roteamento do tráfego [UDP](https://pt.wikipedia.org/wiki/Protocolo_de_datagrama_do_usu%C3%A1rio).
  - **[TLSRoute:](https://gateway-api.sigs.k8s.io/reference/api-types/tlsroute/)** é aqui que são definidas as regras de roteamento do tráfego criptografado com o [TLS](https://pt.wikipedia.org/wiki/Transport_Layer_Security).
  - **[GRPCRoute](https://gateway-api.sigs.k8s.io/reference/api-types/grpcroute/)**: é aqui que são definidas as regras de roteamento do tráfego [gRPC](https://grpc.io/).
  - **[HTTPRoute for Mesh](https://gateway-api.sigs.k8s.io/docs/mesh/)**: é aqui que são definidas as regras de roteamento do tráfego [HTTP](https://pt.wikipedia.org/wiki/HTTP) quando as aplicações estão usando [Service Mesh](https://speakerdeck.com/aeciopires/introducao-a-service-mesh-usando-o-istio).

Mais detalhes dos CRDs podem ser obtidos em:

- [https://gateway-api.sigs.k8s.io/guides/crd-management/](https://gateway-api.sigs.k8s.io/guides/crd-management/)
- [https://gateway-api.sigs.k8s.io/reference/api-spec/1.6/spec/](https://gateway-api.sigs.k8s.io/reference/api-spec/1.6/spec/)

### **Como funciona o Gateway API?**

A figura abaixo foi [extraída deste post](https://www.cncf.io/blog/2025/05/02/understanding-kubernetes-gateway-api-a-modern-approach-to-traffic-management/) e descreve o fluxo da _request_ em cada um de seus componentes e de como ele funciona:

{{< figure src="https://www.cncf.io/wp-content/uploads/2025/05/AD_4nXdmJx9LoMTwpEcsmuf49DRi5H5RjaoCq6nQgJ7lL8hQcFp2Fzbb5pu6hoL08i6KlI9N_qvmw-2nEtQfCoQzzB5G7bTGVQVyAPYhg2VCXWeeKYvox1HOAh3lvehGK1sbkfNc22694w.png" alt="Fluxograma da API do Gateway" caption="Fluxograma da API do Gateway" >}}

O **GatewayController** é o controlador que implementa a lógica para os objetos **_GatewayClass,_** **_Gateway e Route_**. Ele monitora as alterações nesses objetos e, em seguida, atualiza a configuração de rede para lidar com o tráfego de entrada conforme definido. Isso permite que o cluster Kubernetes reaja às mudanças nas configurações de roteamento e gerencie o tráfego com eficiência. O **_Route_** conecta o tráfego a um backend específico e assim a _request_ pode chegar na aplicação de destino.

Cada Gateway precisa referenciar uma GatewayClass, mas existem algumas maneiras de vincular uma Rota a um Gateway. Aqui estão alguns padrões de configuração comuns:

- **Rota única para um único Gateway**: Um único recurso de Rota é associado a um único Gateway. Isso é ideal para casos de uso com escopo bem definido, onde o Gateway atende a um aplicativo ou serviço específico.
- **Múltiplas Rotas em um único Gateway**: Um único Gateway pode atender a múltiplos recursos de Rota em diferentes namespaces. Este é um padrão comum para ambientes multi-tenant, onde equipes ou aplicativos compartilham um Gateway, mas possuem Rotas gerenciadas independentemente.
- **Rota única em múltiplos Gateways**: Uma única Rota pode ser vinculada a múltiplos Gateways. Isso é particularmente útil para cenários onde um aplicativo precisa ser exposto em diferentes ambientes (por exemplo, redes públicas e privadas) ou através de diferentes IPs ou balanceadores de carga.

### **Divisão de responsabilidades do Gateway API**

A figura abaixo foi extraída da [doc oficial do Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/).  

{{< figure src="/wp-content/uploads/2025/11/image-1.png" alt="image" >}}

A figura acima mostra três tipos de papéis (“personas”) organizacionais, cada um responsável por diferentes recursos no Kubernetes Gateway API:

- **Infrastructure Provider**: define a classe de gateway. Por exemplo, pode haver uma classe para o controlador Nginx, outra para Istio, etc.
- **Cluster Operator**: cria instâncias de Gateways, configurando pontos de entrada de rede.
- **Application Developer**: define as rotas (HTTPRoute, etc), portas, protocolo (HTTP, TCP, TLS…), nomes, “hostname”, etc.; que vinculam tráfego do Gateway para as aplicações a serem expostas.

As principais vantagens desse modelo são:

- **Separação de responsabilidades**: como cada persona tem seus recursos, infraestrutura, operação e desenvolvimento ficam desacoplados, o que melhora governança e segurança.
- **Expressividade**: você pode definir rotas mais complexas (cabeçalhos HTTP, pesos, tempo limite, etc) porque não está limitado aos recursos simples de _Ingress_.
- **Extensibilidade:** pela estrutura modular (GatewayClass → Gateway → Route), é possível adicionar tipos novos (novos protocolos, filtros customizados, políticas) de forma mais limpa.
- **Multi-namespace / Multi-equipe**: rotas podem vir de namespaces diferentes e se ligar ao mesmo Gateway, permitindo que equipes diferentes compartilhem a infraestrutura de entrada de tráfego sob políticas controladas.

### **RBAC**

O design do Gateway API está naturalmente alinhado com o Role-based access control ([RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)) do Kubernetes. Um modelo simples de 3 níveis de permissões de escrita por função pode parecer algo assim (onde um Papel é criado para cada persona):

|  | GatewayClass | Gateway | Route |
|---|---|---|---|
| Provedor de infraestrutura | ✅ | ✅ | ✅ |
| Operador de cluster | ❌ | ✅ | ✅ |
| Desenvolvedor de aplicativos | ❌ | ❌ | ✅ |

Dado que o RBAC foi configurado como neste exemplo, você saberá que protegeu sua configuração de infraestrutura de alterações indesejadas por atores não autorizados. Esse alinhamento impõe fluxos de trabalho seguros e eficientes, permitindo que as equipes se concentrem em suas responsabilidades sem ultrapassar quaisquer limites.

## **Diferenças entre o Gateway API e Ingress**

A tabela abaixo mostra as principais diferenças entre o Gateway API e o Ingress e quando utilizar cada um deles.

| Características | Gateway API | Ingress |
|---|---|---|
| **Suporte de protocolo** | Suporta mais protocolos como gRPC, HTTP/2 e WebSockets, permitindo um gerenciamento de tráfego complexo. | Suporta principalmente tráfego HTTP e HTTPS. |
| **Camada OSI suportada** | L4 e L7 | L7 |
| **Complexidade de roteamento** | Permite roteamento complexo, incluindo divisão de tráfego ponderada e regras avançadas para diferentes serviços e protocolos. | Suporta regras básicas de roteamento para tráfego HTTP/HTTPS. |
| **Facilidade de gerenciamento** | Facilita aos operadores de cluster a criação e o gerenciamento de várias classes de gateway, a implantação de novos gateways e o teste de configurações antes da implantação em produção. | O Ingress é mais simples, mas carece de recursos avançados para gerenciar múltiplos gateways ou configurações complexas. |
| **Extensibilidade** | Mais extensível, com a capacidade de definir novos protocolos e regras de roteamento, tornando-o adequado para cenários de rede complexos. | Extensibilidade limitada, focada principalmente em casos de uso baseados em HTTP. |
| **Gestão Colaborativa** | Permite delegar controle a diferentes equipes, com gerenciamento de rotas e políticas por namespaces diferentes | Limitada |
| **Suporte a Políticas** | Suporte a autenticação, rate limiting e outras políticas de rede diretamente nas rotas | Depende do controlador |
| **Balanceamento de Carga** | Balanceamento mais flexível, controle via políticas diretamente no Gateway | Balanceamento simples entre pods via Serviço |
| **RBAC** | Suporte granular a Role-based access control ([RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)) e controle de acesso | Não é suportado nativamente |
| **Caso de uso** | Ideal para gerenciar cenários de rede complexos e múltiplos serviços com requisitos diversos. | Mais adequado para aplicações mais simples com necessidades básicas de roteamento HTTP/HTTPS. |

### **Migrando do Ingress para o Gateway API**

Em linhas gerais, a estratégia de migração do Ingress para o Gateway API, envolve:

- Escolha uma aplicação menos crítica ao negócio
- Mapeie todas necessidades do tráfego dessa aplicação
- Mantenha o Ingress rodando e configurado.
- Configure o Gateway API de acordo com a necessidade.
- Crie um loadbalancer externo para direcionar para o novo gateway sem alterar o loadbalancer usado pelo Ingress.
- Crie um janela de manutenção para essa atividade
- Altere o DNS para apontar para o novo loadbalancer.
- Monitore o tráfego por alguns dias. Em caso de problema, faça o rollback da mudança no DNS.
- Remova o loadbalancer antigo e o ingress controller antigo apenas quando tiver migrado todas as aplicações para o Gateway API

## **Conclusão**

Em resumo, o Gateway API oferece uma maneira mais flexível e escalável de gerenciar o tráfego no Kubernetes em comparação com o Ingress tradicional. Com novos recursos como GatewayClass, Gateway e Route, ele proporciona às equipes maior controle sobre roteamento, segurança e infraestrutura. Seu design orientado a funções permite a colaboração entre diferentes equipes, oferecendo maior flexibilidade na definição de políticas de rede e no tratamento de cenários de tráfego complexos. Além disso, com suporte a múltiplos protocolos e recursos avançados como roteamento ponderado, o Gateway API é uma ferramenta robusta para o gerenciamento de tráfego em ambientes Kubernetes modernos.

Nos próximos posts serão abordadas a instalação e exemplos de configuração para diferentes tipos de aplicação.

### **Referências**

- [https://gateway-api.sigs.k8s.io/](https://gateway-api.sigs.k8s.io/)
- [https://github.com/kubernetes-sigs/gateway-api](https://github.com/kubernetes-sigs/gateway-api)
- [https://kubernetes.github.io/ingress-nginx/](https://kubernetes.github.io/ingress-nginx/)
- [https://github.com/kubernetes/ingress-nginx](https://github.com/kubernetes/ingress-nginx)
- [https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/)
- [https://kubernetes.io/docs/concepts/services-networking/](https://kubernetes.io/docs/concepts/services-networking/)
- [https://kubernetes.io/docs/concepts/services-networking/service/](https://kubernetes.io/docs/concepts/services-networking/service/)
- [https://kubernetes.io/docs/concepts/services-networking/ingress/](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [https://spacelift.io/blog/kubernetes-load-balancer](https://spacelift.io/blog/kubernetes-load-balancer)
- [https://docs.google.com/presentation/d/1T9utAUisS99sVDt2S3WCwnkZFmYBp1hdRXai3iv5RpY/edit?slide=id.g39ce639f994\_0\_6#slide=id.g39ce639f994\_0\_6](https://docs.google.com/presentation/d/1T9utAUisS99sVDt2S3WCwnkZFmYBp1hdRXai3iv5RpY/edit?slide=id.g39ce639f994_0_6#slide=id.g39ce639f994_0_6)
- [https://aws.amazon.com/blogs/containers/exposing-kubernetes-applications-part-3-nginx-ingress-controller/](https://aws.amazon.com/blogs/containers/exposing-kubernetes-applications-part-3-nginx-ingress-controller/)
- [https://linuxtips.io/descomplicando-gateway-api-no-kubernetes/](https://linuxtips.io/descomplicando-gateway-api-no-kubernetes/)
- [https://www.digitalocean.com/community/tutorials/kubernetes-gateway-api-tutorial-cilium-ingress-alternative](https://www.digitalocean.com/community/tutorials/kubernetes-gateway-api-tutorial-cilium-ingress-alternative)
- [https://aws.amazon.com/blogs/containers/kubernetes-gateway-api-in-action/](https://aws.amazon.com/blogs/containers/kubernetes-gateway-api-in-action/)
- [https://blog.4linux.com.br/kubernetes-gateway-api-um-adeus-e-obrigado-ao-ingress-controller/](https://blog.4linux.com.br/kubernetes-gateway-api-um-adeus-e-obrigado-ao-ingress-controller/)
- [https://medium.com/@nonickedgr/understanding-kubernetes-gateway-api-0165fe22df66](https://medium.com/@nonickedgr/understanding-kubernetes-gateway-api-0165fe22df66)
- [https://medium.com/@tolghn/from-nginx-ingress-to-alb-gateway-api-on-amazon-eks-11a0e4128f66](https://medium.com/@tolghn/from-nginx-ingress-to-alb-gateway-api-on-amazon-eks-11a0e4128f66)
- [https://medium.com/@suleyman.kutukoglu/how-to-migrate-from-ingress-nginx-to-gateway-api-step-by-step-guide-79fec518afbf?sk=3b9ae872f9fc83a71df9a0dad4045a58](https://medium.com/@suleyman.kutukoglu/how-to-migrate-from-ingress-nginx-to-gateway-api-step-by-step-guide-79fec518afbf?sk=3b9ae872f9fc83a71df9a0dad4045a58)
- [https://www.cncf.io/blog/2025/05/02/understanding-kubernetes-gateway-api-a-modern-approach-to-traffic-management/](https://www.cncf.io/blog/2025/05/02/understanding-kubernetes-gateway-api-a-modern-approach-to-traffic-management/)
- [https://ngrok.com/blog/introduction-kubernetes-gateway-api/](https://ngrok.com/blog/introduction-kubernetes-gateway-api/)
- [https://www.spectrocloud.com/blog/practical-guide-to-kubernetes-gateway-api](https://www.spectrocloud.com/blog/practical-guide-to-kubernetes-gateway-api)
- [https://devopscube.com/kubernetes-gateway-api/](https://devopscube.com/kubernetes-gateway-api/)
- [https://youtu.be/i0fLIcij42I](https://youtu.be/i0fLIcij42I)
- [https://www.youtube.com/watch?v=QqPWnR0dnV8](https://www.youtube.com/watch?v=QqPWnR0dnV8)
- [https://www.youtube.com/watch?v=2lcx74HUz1U](https://www.youtube.com/watch?v=2lcx74HUz1U)
- [https://www.youtube.com/watch?v=xaZ87iSvMAI](https://www.youtube.com/watch?v=xaZ87iSvMAI)
- [https://www.youtube.com/watch?v=MPUJcPAxtvM](https://www.youtube.com/watch?v=MPUJcPAxtvM)
