---
title: "Getting to know the Kubernetes Gateway API"
slug: "conhecendo-o-kubernetes-gateway-api"
date: 2025-11-21T02:24:01-03:00
lastmod: 2026-11-20T12:00:00-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes"]
tags: ["docker", "helm", "kubernetes", "linux"]
description: "This is the first post in a series about the Kubernetes Gateway API."
sourceHash: "a979a5c622df9271"
---

{{< alert icon="circle-info" >}}
**Updated on November 20, 2026:** the specification reference was updated to Gateway API v1.7.0 (released on October 29, 2026). The concepts described here are still valid; what's new is in the [release notes](https://github.com/kubernetes-sigs/gateway-api/releases/tag/v1.7.0).
{{< /alert >}}

This is the first post in a series about the [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io).

Before moving on, if you don't know what Docker and/or Kubernetes are, I recommend taking the courses below with me or reading and practicing the content at these links.

- [Getting started with Docker, Kubernetes, Helm and Istio](/en/primeiros-passos-com-docker/)
- [/?s=docker](/en/?s=docker)
- [/?s=kubernetes](/en/?s=kubernetes)  

- [Docker course](/en/curso-docker/)
- [Kubernetes (k8s) course](/en/curso-kubernetes-k8s/)

## **Introduction**

Traffic management in [Kubernetes](https://kubernetes.io/) is not simple and, in most cases, involves exposing applications made up of multiple services, such as [frontends](https://aws.amazon.com/pt/compare/the-difference-between-frontend-and-backend/), [APIs](https://aws.amazon.com/pt/what-is/api/), and [backends](https://aws.amazon.com/pt/compare/the-difference-between-frontend-and-backend/), which may be developed in different [programming languages](https://pt.wikipedia.org/wiki/Linguagem_de_programa%C3%A7%C3%A3o).

Traditionally, these applications can be exposed using a combination of Kubernetes objects, such as [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/), [Services](https://kubernetes.io/docs/concepts/services-networking/service/), [load balancers](https://spacelift.io/blog/kubernetes-load-balancer), and [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/). Using this combination at scale produces a large, fragmented configuration that creates complex operational challenges, which can delay new _deployments_ and make it harder to adapt to the new demands of microservices, where scalability, reliability, and cost are crucial business requirements.

The _**Ingress**_ object uses rules to route [HTTP](https://pt.wikipedia.org/wiki/HTTP) and [HTTPS](https://pt.wikipedia.org/wiki/HTTPS) traffic based on [paths](https://swagger.io/docs/specification/v3_0/paths-and-operations/) and [DNS names](https://aws.amazon.com/pt/route53/what-is-dns/) to direct requests coming from outside the cluster to the applications deployed in Kubernetes, and this is more efficient than directly using a _**Service**_ object of type _[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)_ or _[NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)_. Ingress works together with an [_Ingress Controller_](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/), which can be implemented by different software. One of them is the famous [ingress-nginx](https://github.com/kubernetes/ingress-nginx), whose [end of development of new versions was announced](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/) starting in March 2026. _Ingress_ works only at layer 7 of the [OSI model](https://pt.wikipedia.org/wiki/Modelo_OSI) (Layer 7 or just L7).

> _Thanks to [Ricardo Katz](https://www.linkedin.com/in/katzricardo/) and the other code contributors to ingress-nginx_ and also to the Gateway API.

The figure below was taken from this [AWS blog article](https://aws.amazon.com/blogs/containers/exposing-kubernetes-applications-part-3-nginx-ingress-controller/). It broadly describes the flow of a _request_ coming from a client (which can be a person or an application) until it reaches the [Pod](https://kubernetes-io.translate.goog/docs/concepts/workloads/pods) of the target application deployed in Kubernetes.

{{< figure src="/wp-content/uploads/2025/11/image.png" alt="image" >}}

The figure above shows that the _Ingress Controller_ deploys, configures, and manages the Pods that contain [Nginx](https://nginx.org/), a very popular open source [HTTP web server](https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server) and reverse proxy. The Nginx Pods are exposed through the _Ingress Controller_'s _Service_ object, and they receive all the traffic coming from outside Kubernetes. The _Ingress Controller_ watches the _Ingress_ objects configured for each application's [Namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) (via the Kubernetes API) and configures the Nginx pods based on the IngressClass/Ingress definitions, so that traffic is routed to the appropriate services. This is where the path and DNS name the client wants to access are checked. Once the controller routes the traffic, the _request_ is forwarded to the target application's _Service_ object. The _Service_, in turn, discovers the application's Pods and passes the _request_ on. Inside the Pod, an application container receives the _request_ and processes the client's request. After the application processes the _request_, the response travels the reverse path back to the client.

### **What is the Kubernetes Gateway API?**

The **Kubernetes Gateway API** is a specification that standardizes how traffic routing is managed in Kubernetes. It was created by the Kubernetes [SIG-NETWORK group](https://github.com/kubernetes/community/tree/master/sig-network) as a more flexible and robust alternative to the limitations of _Ingress_, enabling a modular approach, more granular and declarative configuration, better compatibility between different _controllers_, a clear separation of responsibilities, and native support for several protocols, such as [HTTP](https://pt.wikipedia.org/wiki/HTTP), [TCP](https://pt.wikipedia.org/wiki/Protocolo_de_Controle_de_Transmiss%C3%A3o), [UDP](https://pt.wikipedia.org/wiki/Protocolo_de_datagrama_do_usu%C3%A1rio), [TLS](https://pt.wikipedia.org/wiki/Transport_Layer_Security), [gRPC](https://grpc.io/), and [WebSocket](https://pt.wikipedia.org/wiki/WebSocket). In [this post](https://www.cncf.io/blog/2025/05/02/understanding-kubernetes-gateway-api-a-modern-approach-to-traffic-management/), you can see more details about the Kubernetes Gateway API and Ingress, as well as use cases and which Ingress limitations the Gateway API promises to solve.

The main gain from using the Kubernetes Gateway API is simpler traffic management, allowing teams to scale applications with less effort than with Ingress while keeping operational efficiency and security. Although Kubernetes doesn't provide a default implementation, there are several popular open source and commercial tools that support the Gateway API. The full list can be found at: [https://gateway-api.sigs.k8s.io/implementations/](https://gateway-api.sigs.k8s.io/implementations/).

> It's important to say that the Gateway API doesn't replace Ingress. It's an evolution of it that brings solutions for more complex demands and needs that Ingress didn't meet. The Gateway API works at layers 4 and 7 of the [OSI model](https://pt.wikipedia.org/wiki/Modelo_OSI) (Layer 4 and 7 or just L4 and L7).

### **Gateway API components**

The Gateway API specification introduces several new **[CRDs (Custom Resource Definition)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)** and consists of the following components:

- **[GatewayController](https://gateway-api.sigs.k8s.io/docs/implementations)**: a cluster-level resource that corresponds to the implementation of the gateway types that will load balance traffic in Kubernetes. Different software implements the GatewayController, and the list can be found at: [https://gateway-api.sigs.k8s.io/docs/implementations/list/](https://gateway-api.sigs.k8s.io/docs/implementations/list/)
- **[GatewayClass](https://gateway-api.sigs.k8s.io/reference/api-types/gatewayclass/)**: also a cluster-level resource, which manages all the Gateway resources. It makes it easy and explicit for cluster administrators to understand which resources are available to a given group of gateways that share the same configuration and are managed by the GatewayController following the class specifications.
- **[Gateway](https://gateway-api.sigs.k8s.io/reference/api-types/gateway/)**: this is where traffic is managed. A gateway works as an entry point to the Kubernetes cluster, directing incoming traffic to the appropriate destinations based on the GatewayClass configuration. There can be one gateway per cluster and/or per namespace. The Gateway defines the ports ( **_listeners_**), protocol (HTTP, TCP, TLS…), names, hostname, etc. to forward requests to the target applications.
- **RouteTyped**: these routes describe routing rules and use **_parentRefs_** to reference which Gateways (and which _**listeners**_ within them) should receive the route. There is also a trust model ( **_trust model_**), where the Gateway can filter which routes are allowed on each listener ( **_allowedRoutes_**), ensuring that only authorized routes are attached. Gateway API version 1.7 has the following types:
  - **[HTTPRoute](https://gateway-api.sigs.k8s.io/reference/api-types/httproute)**: this is where the routing rules for [HTTP](https://pt.wikipedia.org/wiki/HTTP) traffic are defined.
  - **[TCPRoute](https://gateway-api.sigs.k8s.io/reference/api-types/tcproute/)**: this is where the routing rules for [TCP](https://pt.wikipedia.org/wiki/Protocolo_de_Controle_de_Transmiss%C3%A3o) and [Websocket](https://pt.wikipedia.org/wiki/WebSocket) traffic are defined.
  - **[UDPRoute](https://gateway-api.sigs.k8s.io/reference/api-types/udproute/)**: this is where the routing rules for [UDP](https://pt.wikipedia.org/wiki/Protocolo_de_datagrama_do_usu%C3%A1rio) traffic are defined.
  - **[TLSRoute](https://gateway-api.sigs.k8s.io/reference/api-types/tlsroute/):** this is where the routing rules for traffic encrypted with [TLS](https://pt.wikipedia.org/wiki/Transport_Layer_Security) are defined.
  - **[GRPCRoute](https://gateway-api.sigs.k8s.io/reference/api-types/grpcroute/)**: this is where the routing rules for [gRPC](https://grpc.io/) traffic are defined.
  - **[HTTPRoute for Mesh](https://gateway-api.sigs.k8s.io/docs/mesh/)**: this is where the routing rules for [HTTP](https://pt.wikipedia.org/wiki/HTTP) traffic are defined when the applications use a [Service Mesh](https://speakerdeck.com/aeciopires/introducao-a-service-mesh-usando-o-istio).

More details about the CRDs can be found at:

- [https://gateway-api.sigs.k8s.io/guides/crd-management/](https://gateway-api.sigs.k8s.io/guides/crd-management/)
- [https://gateway-api.sigs.k8s.io/reference/api-spec/1.7/spec/](https://gateway-api.sigs.k8s.io/reference/api-spec/1.7/spec/)

### **How does the Gateway API work?**

The figure mentioned below was [taken from this post](https://www.cncf.io/blog/2025/05/02/understanding-kubernetes-gateway-api-a-modern-approach-to-traffic-management/) and describes the flow of the _request_ through each of its components and how it works:

Gateway API flowchart: [see the image at the source](https://www.cncf.io/wp-content/uploads/2025/05/AD_4nXdmJx9LoMTwpEcsmuf49DRi5H5RjaoCq6nQgJ7lL8hQcFp2Fzbb5pu6hoL08i6KlI9N_qvmw-2nEtQfCoQzzB5G7bTGVQVyAPYhg2VCXWeeKYvox1HOAh3lvehGK1sbkfNc22694w.png) (CNCF blog).

The **GatewayController** is the controller that implements the logic for the **_GatewayClass,_** **_Gateway, and Route_** objects. It watches for changes to these objects and then updates the network configuration to handle incoming traffic as defined. This allows the Kubernetes cluster to react to changes in routing configuration and manage traffic efficiently. The **_Route_** connects traffic to a specific backend, so the _request_ can reach the target application.

Each Gateway needs to reference a GatewayClass, but there are a few ways to attach a Route to a Gateway. Here are some common configuration patterns:

- **Single Route to a single Gateway**: a single Route resource is associated with a single Gateway. This is ideal for use cases with a well-defined scope, where the Gateway serves a specific application or service.
- **Multiple Routes on a single Gateway**: a single Gateway can serve multiple Route resources in different namespaces. This is a common pattern for multi-tenant environments, where teams or applications share a Gateway but have independently managed Routes.
- **Single Route on multiple Gateways**: a single Route can be attached to multiple Gateways. This is particularly useful for scenarios where an application needs to be exposed in different environments (for example, public and private networks) or through different IPs or load balancers.

### **Division of responsibilities in the Gateway API**

The figure below was taken from the [official Kubernetes Gateway API docs](https://gateway-api.sigs.k8s.io/).  

{{< figure src="/wp-content/uploads/2025/11/image-1.png" alt="image" >}}

The figure above shows three types of organizational roles ("personas"), each responsible for different resources in the Kubernetes Gateway API:

- **Infrastructure Provider**: defines the gateway class. For example, there can be one class for the Nginx controller, another for Istio, etc.
- **Cluster Operator**: creates Gateway instances, configuring network entry points.
- **Application Developer**: defines the routes (HTTPRoute, etc.), ports, protocol (HTTP, TCP, TLS…), names, "hostname", etc., which bind traffic from the Gateway to the applications to be exposed.

The main advantages of this model are:

- **Separation of responsibilities**: since each persona has its own resources, infrastructure, operations, and development are decoupled, which improves governance and security.
- **Expressiveness**: you can define more complex routes (HTTP headers, weights, timeouts, etc.) because you aren't limited to the simple _Ingress_ features.
- **Extensibility:** thanks to the modular structure (GatewayClass → Gateway → Route), new types (new protocols, custom filters, policies) can be added more cleanly.
- **Multi-namespace / Multi-team**: routes can come from different namespaces and attach to the same Gateway, allowing different teams to share the ingress traffic infrastructure under controlled policies.

### **RBAC**

The Gateway API design is naturally aligned with Kubernetes Role-based access control ([RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)). A simple 3-tier model of write permissions per role might look like this (where a Role is created for each persona):

|  | GatewayClass | Gateway | Route |
|---|---|---|---|
| Infrastructure provider | ✅ | ✅ | ✅ |
| Cluster operator | ❌ | ✅ | ✅ |
| Application developer | ❌ | ❌ | ✅ |

Given that RBAC was configured as in this example, you'll know you've protected your infrastructure configuration from unwanted changes by unauthorized actors. This alignment enforces safe and efficient workflows, allowing teams to focus on their responsibilities without overstepping any boundaries.

## **Differences between the Gateway API and Ingress**

The table below shows the main differences between the Gateway API and Ingress and when to use each of them.

| Features | Gateway API | Ingress |
|---|---|---|
| **Protocol support** | Supports more protocols such as gRPC, HTTP/2, and WebSockets, enabling complex traffic management. | Mainly supports HTTP and HTTPS traffic. |
| **Supported OSI layer** | L4 and L7 | L7 |
| **Routing complexity** | Allows complex routing, including weighted traffic splitting and advanced rules for different services and protocols. | Supports basic routing rules for HTTP/HTTPS traffic. |
| **Ease of management** | Makes it easier for cluster operators to create and manage multiple gateway classes, deploy new gateways, and test configurations before deploying to production. | Ingress is simpler, but lacks advanced features to manage multiple gateways or complex configurations. |
| **Extensibility** | More extensible, with the ability to define new protocols and routing rules, making it suitable for complex networking scenarios. | Limited extensibility, focused mainly on HTTP-based use cases. |
| **Collaborative management** | Allows delegating control to different teams, with routes and policies managed by different namespaces | Limited |
| **Policy support** | Support for authentication, rate limiting, and other network policies directly on routes | Depends on the controller |
| **Load balancing** | More flexible balancing, controlled via policies directly on the Gateway | Simple balancing between pods via Service |
| **RBAC** | Granular support for Role-based access control ([RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)) and access control | Not natively supported |
| **Use case** | Ideal for managing complex networking scenarios and multiple services with diverse requirements. | Better suited for simpler applications with basic HTTP/HTTPS routing needs. |

### **Migrating from Ingress to the Gateway API**

Broadly speaking, the strategy for migrating from Ingress to the Gateway API involves:

- Choose a less business-critical application
- Map all the traffic needs of that application
- Keep Ingress running and configured.
- Configure the Gateway API as needed.
- Create an external load balancer pointing to the new gateway without changing the load balancer used by Ingress.
- Schedule a maintenance window for this activity
- Change the DNS to point to the new load balancer.
- Monitor the traffic for a few days. If there's a problem, roll back the DNS change.
- Remove the old load balancer and the old ingress controller only after you have migrated all applications to the Gateway API

## **Conclusion**

In short, the Gateway API offers a more flexible and scalable way to manage traffic in Kubernetes compared to traditional Ingress. With new resources such as GatewayClass, Gateway, and Route, it gives teams greater control over routing, security, and infrastructure. Its role-oriented design enables collaboration between different teams, offering more flexibility in defining network policies and handling complex traffic scenarios. In addition, with support for multiple protocols and advanced features such as weighted routing, the Gateway API is a robust tool for traffic management in modern Kubernetes environments.

The next posts will cover installation and configuration examples for different types of applications.

### **References**

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
- [https://linuxtips.io/descomplicando-gateway-api-no-kubernetes/](https://linuxtips.io/descomplicando-gateway-api-no-kubernetes/) (in Portuguese)
- [https://www.digitalocean.com/community/tutorials/kubernetes-gateway-api-tutorial-cilium-ingress-alternative](https://www.digitalocean.com/community/tutorials/kubernetes-gateway-api-tutorial-cilium-ingress-alternative)
- [https://aws.amazon.com/blogs/containers/kubernetes-gateway-api-in-action/](https://aws.amazon.com/blogs/containers/kubernetes-gateway-api-in-action/)
- [https://blog.4linux.com.br/kubernetes-gateway-api-um-adeus-e-obrigado-ao-ingress-controller/](https://blog.4linux.com.br/kubernetes-gateway-api-um-adeus-e-obrigado-ao-ingress-controller/) (in Portuguese)
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
