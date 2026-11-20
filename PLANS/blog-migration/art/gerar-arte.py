"""Arte de fundo própria do T9: navy do esquema blowfish, brilhos suaves no topo, linhas de fluxo e constelação discreta."""
import math, random, os, sys
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
W, H = 2560, 1440
rnd = random.Random(20261120)

# linhas de fluxo: curvas suaves atravessando a parte de cima, quase paralelas
flows = []
for k in range(14):
    y0 = 120 + k * 46 + rnd.uniform(-10, 10)
    amp = 70 + k * 9
    ph = rnd.uniform(0, math.pi)
    pts = []
    for i in range(0, 41):
        x = -100 + i * (W + 200) / 40
        y = y0 + amp * math.sin(x / 520 + ph) * 0.55 + amp * 0.45 * math.sin(x / 260 + ph * 1.7) + (x / W) * 140
        pts.append((x, y))
    d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    op = 0.10 - k * 0.005
    flows.append(f'<path d="{d}" fill="none" stroke="url(#lineg)" stroke-width="{1.6 - k*0.05:.2f}" opacity="{op:.3f}"/>')

# constelação (nós e arestas) concentrada no canto superior direito, sumindo para baixo e para a esquerda
nodes = []
while len(nodes) < 70:
    x = rnd.uniform(W * 0.42, W * 1.0); y = rnd.uniform(40, H * 0.55)
    w = ((x - W * 0.42) / (W * 0.58)) * (1 - y / (H * 0.55))
    if rnd.random() < w * 1.3:
        nodes.append((x, y, w))
edges = []
for i, (x1, y1, w1) in enumerate(nodes):
    near = sorted(((math.hypot(x1 - x2, y1 - y2), j) for j, (x2, y2, _) in enumerate(nodes) if j != i))[:2]
    for dist, j in near:
        if dist < 260 and i < j:
            x2, y2, w2 = nodes[j]
            edges.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#8ac5fa" stroke-width="1" opacity="{0.05 + 0.10*min(w1,w2):.3f}"/>')
dots = []
for x, y, w in nodes:
    r = 1.6 + 2.6 * w
    col = '#ffb48e' if rnd.random() < 0.22 else '#8ac5fa'
    dots.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="{col}" opacity="{0.25 + 0.45*w:.2f}"/>')
    if w > 0.55 and rnd.random() < 0.5:
        dots.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r*4:.1f}" fill="{col}" opacity="0.06"/>')

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
 <linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#202868"/><stop offset=".45" stop-color="#151b4a"/><stop offset="1" stop-color="#0d1233"/></linearGradient>
 <radialGradient id="gBlue" cx="18%" cy="8%" r="48%"><stop offset="0" stop-color="#4a9ef0" stop-opacity=".42"/><stop offset="1" stop-color="#4a9ef0" stop-opacity="0"/></radialGradient>
 <radialGradient id="gViolet" cx="52%" cy="0%" r="40%"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".30"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>
 <radialGradient id="gCoral" cx="82%" cy="14%" r="38%"><stop offset="0" stop-color="#f0705a" stop-opacity=".34"/><stop offset="1" stop-color="#f0705a" stop-opacity="0"/></radialGradient>
 <linearGradient id="lineg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8ac5fa"/><stop offset=".6" stop-color="#c3c8e2"/><stop offset="1" stop-color="#ffb48e"/></linearGradient>
 <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#0d1233" stop-opacity="0"/><stop offset="1" stop-color="#0d1233" stop-opacity="1"/></linearGradient>
 <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .035 0"/></filter>
</defs>
<rect width="100%" height="100%" fill="url(#base)"/>
<rect width="100%" height="100%" fill="url(#gBlue)"/>
<rect width="100%" height="100%" fill="url(#gViolet)"/>
<rect width="100%" height="100%" fill="url(#gCoral)"/>
<g>{"".join(flows)}</g>
<g>{"".join(edges)}</g>
<g>{"".join(dots)}</g>
<rect width="100%" height="100%" fill="url(#fade)"/>
<rect width="100%" height="100%" filter="url(#grain)"/>
</svg>'''
open(os.path.join(OUT, 'background.svg'), 'w').write(svg)
open(os.path.join(OUT, 'background.html'), 'w').write(f'<!doctype html><html><body style="margin:0">{svg}</body></html>')
