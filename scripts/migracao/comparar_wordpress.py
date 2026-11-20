#!/usr/bin/env python3
"""Auditoria: compara o conteúdo publicado no WordPress (WXR) com o site gerado pelo Hugo.

Relata, por post/página: arquivo ausente, título, data, categorias, trechos de texto
faltando, blocos de código alterados, links externos perdidos e negrito/itálico/código
inline que sumiram. Só lê; não altera nada. Há falsos positivos esperados (links
internos que viraram caminhos relativos, páginas reescritas de propósito): leia o relatório.

Uso:
  hugo --quiet -d /tmp/site && python3 -I scripts/migracao/comparar_wordpress.py <WXR.xml> /tmp/site
"""
import xml.etree.ElementTree as ET,re,html,sys,pathlib,collections,difflib,json
ns={'wp':'http://wordpress.org/export/1.2/','content':'http://purl.org/rss/1.0/modules/content/','excerpt':'http://wordpress.org/export/1.2/excerpt/'}
if len(sys.argv)<3:
    sys.exit('uso: comparar_wordpress.py <WXR.xml> <site gerado (hugo -d DIR)>')
WXR=sys.argv[1]; pub=pathlib.Path(sys.argv[2]); R=collections.defaultdict(list)
def md_file(s):
    for f in (f'content/posts/{s}/index.md',f'content/{s}/index.md'):
        if pathlib.Path(f).exists(): return pathlib.Path(f)
def fm(p):
    t=p.read_text(); f=t.split('\n---\n',1)[0]
    d={}
    for k in ('title','date','slug','categories','tags','description','draft'):
        m=re.search(rf'(?m)^{k}:\s*(.*)$',f); d[k]=m.group(1).strip() if m else None
    return d
def norm_text(h):
    h=re.sub(r'(?s)<(script|style)\b.*?</\1>',' ',h)
    h=re.sub(r'(?s)<(pre)\b.*?</\1>',' ',h)
    h=re.sub(r'<[^>]+>',' ',h); h=html.unescape(h).replace('\xa0',' ')
    return [w for w in re.findall(r'[\wÀ-ÿ]+',h.lower())]
def pres(h):
    out=[]
    for m in re.findall(r'(?s)<pre\b[^>]*>(.*?)</pre>',h):
        m=re.sub(r'<br\s*/?>','\n',m); m=re.sub(r'<[^>]+>','',m); m=html.unescape(m).replace('\xa0',' ')
        out.append(re.sub(r'\s+','',m))
    return out
def links(h):
    s=set()
    for u in re.findall(r'<a\s[^>]*href="([^"]+)"',h):
        u=html.unescape(u).strip()
        if u.startswith(('http://blog.aeciopires.com','https://blog.aeciopires.com','/','#','mailto:')): continue
        s.add(u.rstrip('/'))
    return s
def artigo(p):
    h=p.read_text(); i=h.find('article-content'); j=h.find('<footer',i)
    return h[i:j] if i>0 else h
cats_wp={}
total=0
for it in ET.parse(WXR).iter('item'):
    tipo=it.findtext('wp:post_type',namespaces=ns); st=it.findtext('wp:status',namespaces=ns)
    if tipo not in('post','page') or st!='publish': continue
    s=it.findtext('wp:post_name',namespaces=ns); total+=1
    c=it.findtext('content:encoded',namespaces=ns) or ''
    f=md_file(s)
    if not f:
        R['sem_arquivo'].append(s); continue
    d=fm(f)
    tw=html.unescape(it.findtext('title') or '').strip(); th=json.loads(d['title']) if d['title'] and d['title'].startswith('"') else d['title']
    if tw!=th: R['titulo'].append((s,tw,th))
    dw=it.findtext('wp:post_date',namespaces=ns)[:16].replace(' ','T')
    if d['date'] and not d['date'].startswith(dw): R['data'].append((s,dw,d['date']))
    if tipo=='post':
        cw=sorted(x.get('nicename') for x in it.findall('category') if x.get('domain')=='category')
        ch=sorted(json.loads(d['categories'] or '[]'))
        if cw!=ch and cw!=['uncategorized']: R['categorias'].append((s,cw,ch))
    hp=pub/s/'index.html'
    if not hp.exists(): R['sem_html'].append(s); continue
    a=artigo(hp)
    ww=norm_text(c); wh=norm_text(a)
    # palavras do WP que faltam no Hugo (multiconjunto)
    cw_=collections.Counter(ww); ch_=collections.Counter(wh)
    falta={k:v-ch_[k] for k,v in cw_.items() if v>ch_[k]}
    nfalta=sum(falta.values())
    if nfalta>3:
        # trechos contíguos faltantes
        sm=difflib.SequenceMatcher(None,ww,wh,autojunk=False)
        trechos=[' '.join(ww[i1:i2]) for op,i1,i2,j1,j2 in sm.get_opcodes() if op in('delete','replace') and i2-i1>=3]
        R['texto'].append((s,nfalta,trechos[:6]))
    pw,ph=pres(c),pres(a)
    phs=''.join(ph)
    for i,p in enumerate(pw):
        if p and p not in phs:
            # tolerar se 95% contido
            R['codigo'].append((s,i,p[:80]))
    lw,lh=links(c),links(a)
    lh2={x.replace('http://','https://') for x in lh}
    perd=[u for u in lw if u not in lh and u.replace('http://','https://') not in lh2]
    if perd: R['links'].append((s,perd[:8]))
    for tag,nm in (('strong|b','negrito'),('em|i','italico'),('code','codigo_inline')):
        n1=len(re.findall(rf'<(?:{tag})\b',re.sub(r'(?s)<pre.*?</pre>','',c))); n2=len(re.findall(rf'<(?:{tag})\b',re.sub(r'(?s)<pre.*?</pre>','',a)))
        if n2<n1*0.8 and n1-n2>=2: R['fmt_'+nm].append((s,n1,n2))
print('publicados no WXR:',total)
for k,v in R.items():
    print(f'\n### {k}: {len(v)}')
    for x in v: print('  ',x)
