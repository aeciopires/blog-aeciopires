---
title: "Resumo da causa raiz do incidente global ocorrido em 12/06/2025 na GCP"
slug: "resumo-da-causa-raiz-do-incidente-global-ocorrido-em-12-06-2025-na-gcp"
date: 2025-06-13T13:34:34-03:00
lastmod: 2025-06-13T13:34:34-03:00
draft: false
categories: ["cluster", "devops", "docker", "git", "gitops", "kubernetes"]
tags: ["docker", "kubernetes", "linux"]
description: "🇧🇷 pt-BR Resumo da causa raiz do incidente global ocorrido em 12/06/2025 na GCP"
wp_id: 3427
bilingue: true
---

🇧🇷 pt-BR Resumo da causa raiz do incidente global ocorrido em 12/06/2025 na **GCP**

Em nossa análise inicial, o problema ocorreu devido a uma atualização de cota automatizada inválida em nosso sistema de gerenciamento de APIs, que foi distribuída globalmente, causando a rejeição de solicitações externas de API. Para a recuperação, ignoramos a verificação de cota problemática, o que permitiu a recuperação na maioria das regiões em até 2 horas. No entanto, o banco de dados de políticas de cotas em us-central1 ficou sobrecarregado, resultando em uma recuperação muito mais demorada naquela região. Vários produtos tiveram impacto residual moderado (por exemplo, backlogs) por até uma hora após a resolução do problema principal, e um pequeno número se recuperou depois disso.

Fonte: [https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW](https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW)

🇺🇸 en-US Root cause summary of the global incident that occurred on 12/6/2025 at **GCP**

From our initial analysis, the issue occurred due to an invalid automated quota update to our API management system which was distributed globally, causing external API requests to be rejected. To recover we bypassed the offending quota check, which allowed recovery in most regions within 2 hours. However, the quota policy database in us-central1 became overloaded, resulting in much longer recovery in that region. Several products had moderate residual impact (e.g. backlogs) for up to an hour after the primary issue was mitigated and a small number recovering after that.

Reference: [https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW](https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW)
