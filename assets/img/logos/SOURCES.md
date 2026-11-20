# Origem dos logos do banner de tecnologias

Regras (PLAN.md 3.7.1): só arquivos **oficiais**, sem alterar cor, proporção, recorte ou elementos.
Sem o arquivo oficial, a placa mostra o **nome em texto** (comportamento automático do shortcode).
Ao adicionar um logo: baixar da fonte oficial, conferir que o SVG não tem `<script>`/eventos,
salvar com o nome usado em `data/tecnologias.yaml` e registrar abaixo. Revisão anual das diretrizes.

## Presentes

| Arquivo | Fonte oficial (URL) | Licença / diretriz | Baixado em |
|---|---|---|---|
| kubernetes.svg | <https://github.com/cncf/artwork> `projects/kubernetes/icon/color/kubernetes-icon-color.svg` | CNCF artwork guidelines (<https://www.cncf.io/brand-guidelines/>) | 2026-11-20 |
| helm.svg | <https://github.com/cncf/artwork> `projects/helm/icon/color/helm-icon-color.svg` | CNCF artwork guidelines | 2026-11-20 |
| prometheus.svg | <https://github.com/cncf/artwork> `projects/prometheus/icon/color/prometheus-icon-color.svg` | CNCF artwork guidelines | 2026-11-20 |
| argo.svg | <https://github.com/cncf/artwork> `projects/argo/icon/color/argo-icon-color.svg` | CNCF artwork guidelines | 2026-11-20 |
| istio.svg | <https://github.com/cncf/artwork> `projects/istio/icon/color/istio-icon-color.svg` | CNCF artwork guidelines | 2026-11-20 |
| git.svg | <https://git-scm.com/downloads/logos> (`Git-Icon-1788C.svg`) | CC BY 3.0, Jason Long (atribuição em /creditos/) | 2026-11-20 |
| go.svg | <https://go.dev/blog/go-brand> (`go.dev/images/go-logo-blue.svg`) | Go brand guidelines | 2026-11-20 |
| terragrunt.svg | <https://github.com/gruntwork-io/terragrunt> `docs/src/assets/logo-light.svg` | Marca da Gruntwork | 2026-11-20 |
| python.svg | <https://www.python.org/community/logos/> (`python-logo-generic.svg`) | PSF Trademark Usage Policy | 2026-11-20 |
| kustomize.png | <https://github.com/kubernetes-sigs/kustomize> `site/static/favicons/favicon-1024.png` (ícone do site oficial kustomize.io) | Kubernetes SIGs / CNCF; otimizado sem perda (oxipng) | 2026-11-20 |
| victoriametrics.svg | <https://github.com/VictoriaMetrics/VictoriaMetrics> `app/vmui/packages/vmui/assets/favicon.svg` (ícone da vmui) | Marca da VictoriaMetrics | 2026-11-20 |
| grafana.svg | <https://github.com/grafana/grafana> `packages/grafana-ui/src/components/PageLoader/grafana_icon.svg` | Marca da Grafana Labs | 2026-11-20 |
| zabbix.svg | <https://github.com/zabbix/zabbix> `misc/images/docs/zabbix_logo.svg` | Marca da Zabbix | 2026-11-20 |
| datadog.png | <https://github.com/DataDog/documentation> `hugo/static/images/dd-logo.png` | Marca da Datadog; otimizado sem perda (oxipng) | 2026-11-20 |
| github-copilot.svg | <https://github.com/primer/octicons> `icons/copilot-48.svg` (Octicons, ícones oficiais do GitHub) | MIT; GitHub Logos and Usage | 2026-11-20 |
| linux.svg | <https://commons.wikimedia.org/wiki/File:Tux.svg> (a página original do autor, isc.tamu.edu/~lewing/linux, saiu do ar) | Uso livre com atribuição a Larry Ewing e The GIMP (em /creditos/) | 2026-11-20 |
| bash.png | <https://github.com/odb/official-bash-logo> `assets/Logos/Icons/PNG/128x128.png` (o SVG oficial tem ~800 KB) | MIT (em /creditos/); otimizado sem perda (oxipng) | 2026-11-20 |
| terraform.svg | <https://github.com/hashicorp/design-system> `packages/flight-icons/svg/terraform-color-24.svg` (Flight, design system oficial da HashiCorp; a página de marca bloqueia acesso automatizado) | HashiCorp Trademark Policy (<https://www.hashicorp.com/en/trademark-policy>): uso para identificar o produto, sem modificar, com nota de marca (em /creditos/) | 2026-11-20 |
| vault.svg | idem, `vault-color-24.svg` | idem | 2026-11-20 |
| cursor.svg | Kit oficial de marca <https://cursor.com/brand> (`cursor-brand-assets.zip` → `General Logos/Cube/SVG/CUBE_2D_LIGHT.svg`, variante para fundo claro) | Diretrizes da página de marca da Cursor | 2026-11-20 |
| claude.svg | Kit de imprensa oficial <https://www.anthropic.com/press-kit> (`Claude logos/3 Claude Spark/SVG/Claude Spark - Clay.svg`) | Kit público para uso editorial; sem diretriz explícita no kit. Uso nominativo (indica experiência). Se a Anthropic publicar restrição, voltar ao nome em texto | 2026-11-20 |

## Sem logo (aparecem como nome em texto)

Verificado em 20/11/2026 nas diretrizes oficiais de cada marca. O aceite do autor não basta nestes casos: o uso do logo exige autorização ou licença da empresa.

| Marca | Diretriz | Por que fica em texto |
|---|---|---|
| Docker | <https://www.docker.com/legal/trademark-guidelines/> | Só as marcas **nominativas** podem ser usadas em contexto informativo ("word Marks (but not logo marks…)"); o logo exige autorização prévia por escrito |
| AWS | <https://aws.amazon.com/trademark-guidelines/> | A licença de uso dos logos vale só para clientes/parceiros dentro de acordos específicos (e para o logo "Powered by AWS") |
| Google Cloud, Gemini | <https://about.google/brand-resource-center/guidance/> | Referência a produtos Google em contexto informativo deve ser "in plain text"; logo não pode sugerir afiliação |
| ChatGPT | <https://openai.com/brand/> | Diretrizes restritivas (decisão do plano); a página não permite leitura automatizada para reconferir |
| macOS | — | A Apple não autoriza o uso da maçã |

Para usar algum destes logos no futuro: pedir autorização por escrito à empresa e guardar a resposta.
