"""Proposta de limpeza das tags: mapa de consolidação aplicado às contagens reais."""
import json, os, sys
T = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tags')
MERGE = {  # origem -> destino
 'k8s': 'kubernetes', 'go': 'golang', 'argo-cd': 'argocd', 'infraascode': 'iac',
 'conteiner': 'containers', 'container': 'containers', 'elastic': 'elasticsearch',
 'flux': 'fluxcd', 'gke': 'gcp', 'google-cloud': 'gcp', 'salt': 'saltstack',
 'homelab-automation': 'homelab', 'homelab-setup': 'homelab', 'fail': 'failover', 'over': 'failover',
 'continua': 'ci-cd', 'integracao': 'ci-cd', 'mesh': 'service-mesh', 'monitoring': 'observability',
 'zabbix-br': 'zabbix', 'sonatype': 'nexus', 'shell': 'bash', 'script': 'bash', 'novatec': 'livro',
}
REMOVE_CATEGORY_DUP = ['devops', 'tutorial', 'tutoriais-2']        # já são categorias
REMOVE_GENERIC = ['agent', 'internet', 'json', 'links', 'server', 'router', 'proxy', 'network', 'cluster',
                  'deploy', 'certificado', 'outage', 'registry', 'nat', 'tools']
REVIEW = ['cidade-viva', 'codeac', 'medusa', 'worldcup', 'webapp', 'livro']   # pessoais/eventos: decidir na Fase 4
def load():
    t = json.load(open(os.path.join(T, 'tags.json')))
    return t
def apply(t):
    used = [x for x in t if x['count'] > 0]
    res = {}
    for x in used:
        s = x['slug']
        if s in REMOVE_CATEGORY_DUP or s in REMOVE_GENERIC: continue
        d = MERGE.get(s, s)
        res[d] = res.get(d, 0) + x['count']
    return res
if __name__ == '__main__':
    t = load(); r = apply(t)
    used = [x for x in t if x['count'] > 0]
    print('antes:', len(t), 'tags | sem posts:', len(t) - len(used), '| em uso:', len(used))
    print('depois:', len(r), 'tags')
    print(' '.join(f'{k}({v})' for k, v in sorted(r.items(), key=lambda kv: (-kv[1], kv[0]))))
    from collections import Counter
    print('1 post:', sum(1 for v in r.values() if v == 1))
    json.dump(r, open(os.path.join(T, 'tags-limpas.json'), 'w'), ensure_ascii=False)
