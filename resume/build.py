"""Generate a complete static resume; JavaScript only enhances ordering/filtering."""
from pathlib import Path
from html import escape as esc
import json

ROOT = Path(__file__).parent
d = json.loads((ROOT / 'content.json').read_text(encoding='utf-8'))
def e(s): return esc(str(s), quote=True)
def ul(items): return '<ul>' + ''.join(f'<li>{e(x)}</li>' for x in items) + '</ul>'
def source(x): return f'data-source="Master final PDF / {e(x["source"])}"'
lane_buttons = ''.join(f'<button type="button" data-lane="{k}" aria-pressed="{str(k == "ai").lower()}" aria-controls="lane-view"><span class="lane-index">0{i}</span>{e(l["label"])}</button>' for i,(k,l) in enumerate(d['lanes'].items(),1))
proof = ''
for p in sorted(d['proof'],key=lambda p:d['lanes']['ai']['proof'].index(p['id'])):
    steps = '<ol class="journey">' + ''.join(f'<li><strong>{e(a)}</strong><p>{e(b)}</p></li>' for a,b in p.get('steps',[])) + '</ol>' if p.get('steps') else ''
    proof += f'<details class="glass proof-card" {"open" if p["id"] in d["lanes"]["ai"]["proof"][:2] else ""} data-id="{p["id"]}" {source(p)}><summary><span class="eyebrow">{e(p["owner"])}</span><h3>{e(p["title"])}</h3><p>{e(p["summary"])}</p><span class="disclosure"><span class="closed-label">Explore the work</span><span class="open-label">Close details</span><span class="plus" aria-hidden="true">+</span></span></summary><div class="detail-body">{steps}{ul(p["bullets"])}</div></details>'
roles = ''.join(f'<details class="role glass" {"open" if r["id"] == "bauer" else ""} data-id="{r["id"]}" {source(r)}><summary><span class="role-date">{e(r["dates"])}</span><span class="role-heading"><h3>{e(r["title"])}</h3><span>{e(r["company"])}</span><p class="role-preview">{e(r["bullets"][0])}</p></span><span class="plus" aria-hidden="true">+</span></summary><div class="detail-body">{ul(r["bullets"][1:])}</div></details>' for r in d['roles'])
systems = ''.join(f'<article class="system glass" {source(s)}><div class="system-copy"><p class="eyebrow">{e(s["owner"])}</p><h3>{e(s["title"])}</h3><p>{e(s["text"])}</p></div></article>' for s in d['systems'])
skills = ''.join(f'<article class="skill-group glass" data-id="{s["id"]}" {source(s)}><h3>{e(s["title"])}</h3><ul class="chips">'+''.join(f'<li>{e(x)}</li>' for x in s['items'])+'</ul></article>' for s in d['skills'])
skill_filters = '<button type="button" data-filter="all" aria-pressed="true">All skills</button>' + ''.join(f'<button type="button" data-filter="{s["id"]}" aria-pressed="false">{e(s["title"])}</button>' for s in d['skills'])
schema = {'@context':'https://schema.org','@graph':[{'@type':'ProfilePage','@id':'https://wrdmedia.com/resume/#profile','url':'https://wrdmedia.com/resume/','name':'Howard Kan | Interactive Resume','description':d['positioning'],'mainEntity':{'@id':'https://wrdmedia.com/resume/#howard-kan'}},{'@type':'Person','@id':'https://wrdmedia.com/resume/#howard-kan','name':'Howard Kan','description':d['positioning'],'email':'mailto:hwrdkan@gmail.com','telephone':'+1-469-213-0162','homeLocation':{'@type':'Place','name':'Frisco, TX'},'sameAs':['https://www.linkedin.com/in/howardkan/'],'knowsLanguage':['English','Mandarin'],'knowsAbout':['AI enablement','AI tool direction','GoHighLevel','Lifecycle marketing','Organic lead generation','SEO','AEO','GEO','Media production'],'alumniOf':{'@type':'CollegeOrUniversity','name':'California State University Dominguez Hills'}}]}
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Howard Kan | AI Systems, Growth & Interactive Resume</title>
<meta name="description" content="{e(d['positioning'])} Howard Kan builds by directing AI tools, including Claude Code and GPT/Codex.">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#070809">
<link rel="canonical" href="https://wrdmedia.com/resume/">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="preload" href="/fonts/archivo-wdth.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/resume/resume.css">
<script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script>
<script src="/resume/resume.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to resume</a>
<header class="topbar"><a class="brand" href="/" aria-label="WRD Media home"><img src="/assets/wrd-mark.png" alt="WRD Media" width="1291" height="380"></a><nav aria-label="Resume navigation"><a href="#work">Work</a><a href="#experience">Experience</a><a href="#skills">Skills</a></nav><a class="button small" href="#contact">Let’s connect <span aria-hidden="true">↗</span></a></header>
<main id="main" tabindex="-1">
<section class="hero wrap" aria-labelledby="name">
 <div class="hero-copy"><p class="eyebrow">Howard Kan / Interactive resume</p><h1 id="name">Howard <span>Kan.</span></h1><p class="hero-title">AI systems. Revenue operations.<br> Organic growth.</p><p class="positioning">{e(d['positioning'])}</p><p class="method">I build by directing AI tools, including Claude Code and GPT/Codex.</p><p class="location">Frisco, TX <span aria-hidden="true">/</span> Remote or Dallas–Fort Worth</p></div>
 <aside class="hero-aside"><div class="portrait glass"><img src="/assets/howard-kan-900.webp" srcset="/assets/howard-kan-480.webp 480w, /assets/howard-kan-900.webp 900w" sizes="(max-width: 760px) 80vw, 360px" width="900" height="900" alt="Howard Kan" fetchpriority="high"><div class="portrait-caption"><span>Operator. Builder. Enabler.</span><span>Since 2008</span></div></div><div class="portrait-note"><span>Media & marketing</span><span>Systems & operations</span><span>AI enablement</span></div></aside>
</section>
<section id="lens" class="lens-section wrap" aria-labelledby="lens-title"><div class="section-heading"><div><p class="eyebrow">One career. Four perspectives.</p><h2 id="lens-title">Explore what I specialize in.</h2></div><p>Pick a specialty. See how I work, what I have built, and the experience behind it.</p></div><noscript><p class="nojs">Interactive ordering requires JavaScript. All specialties, work, and experience are available on this page.</p></noscript></section>
<div id="lane-view"><div class="sticky-lanes wrap"><div class="lane-buttons" role="group" aria-label="Resume focus">{lane_buttons}</div></div>
 <div class="focus-banner wrap"><div class="glass focus-inner"><div><p class="eyebrow" id="focus-label">AI Enablement focus</p><h2 id="focus-headline">{e(d['lanes']['ai']['headline'])}</h2><p id="focus-copy">{e(d['lanes']['ai']['focus'])}</p></div><div class="focus-strengths" id="focus-strengths" aria-label="Featured capabilities"><span>Claude Code & GPT/Codex direction</span><span>AI assistants & agentic workflows</span><span>Prompt engineering</span><span>Knowledge-base design</span><span>Source-grounded assistants</span><span>Voice AI, SMS & website chat agents</span></div></div></div>
 <p id="lane-status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
 <section id="work" class="section wrap" aria-labelledby="work-title"><div class="section-heading"><div><p class="eyebrow">Proof through work</p><h2 id="work-title">Systems with a purpose.</h2></div><p>Real projects and programs. The most relevant work opens first.</p></div><div class="proof-grid" id="proof-list">{proof}</div></section>
 <section id="experience" class="section wrap" aria-labelledby="experience-title"><div class="section-heading"><div><p class="eyebrow">Career arc / 2008 to present</p><h2 id="experience-title">The operator foundation.</h2></div><p>Media, marketing, and operations came first. AI is the current layer.</p></div><div class="section-tools"><p id="order-label">Ordered for AI Enablement. All roles shown.</p><div class="controls"><button type="button" id="chronological" aria-pressed="false">Date order</button><button type="button" id="expand-all" aria-expanded="false" aria-controls="role-list">Expand all roles</button></div></div><div class="role-list" id="role-list">{roles}</div></section>
 <section id="systems" class="section wrap" aria-labelledby="systems-title"><div class="section-heading"><div><p class="eyebrow">Built by directing AI tools</p><h2 id="systems-title">From idea to working system.</h2></div><p>Portals, applications, and visual quote tools built around everyday business needs.</p></div><div class="system-grid">{systems}</div></section>
 <section id="skills" class="section wrap" aria-labelledby="skills-title"><div class="section-heading"><div><p class="eyebrow">Skills explorer</p><h2 id="skills-title">A connected skill set.</h2></div><p>From content and organic growth to CRM, AI systems, and team adoption.</p></div><div class="skill-controls"><label class="search-label" for="skill-search">Find a skill<input id="skill-search" type="search" placeholder="Try GoHighLevel, training, or video" autocomplete="off"></label><div class="filters" role="group" aria-label="Skill category">{skill_filters}</div></div><p id="skill-count" class="skill-count" role="status" aria-live="polite"></p><div class="skill-grid" id="skill-list">{skills}</div><p id="no-skills" class="glass empty" hidden>No matching skills. Try a different term or choose All skills.</p></section>
</div>
<section class="credentials wrap" aria-label="Education and languages"><div data-source="Master final PDF / EDUCATION"><p class="eyebrow">Education</p><h2>California State University<br>Dominguez Hills</h2><p>Bachelor of Arts in Digital Media Arts · 2012</p><p>Television Emphasis · Minor in Digital Graphics</p></div><div data-source="Master final PDF / LANGUAGES"><p class="eyebrow">Languages</p><h2>English<br>Mandarin</h2></div></section>
<footer id="contact" class="contact wrap"><p class="eyebrow">Let’s connect</p><h2>Howard Kan.</h2><a class="contact-email" href="mailto:hwrdkan@gmail.com">hwrdkan@gmail.com <span aria-hidden="true">↗</span></a><div class="contact-links"><a href="tel:+14692130162">(469) 213-0162</a><a href="https://www.linkedin.com/in/howardkan/">linkedin.com/in/howardkan <span aria-hidden="true">↗</span></a><span>Frisco, TX</span></div><div class="footer-line"><a href="/">WRD Media</a><span>Resume / Howard Kan</span><a href="#lens">Back to specialties ↑</a></div></footer>
</main>
</body></html>'''
(ROOT/'index.html').write_text(html,encoding='utf-8')
(ROOT/'lanes.json').write_text(json.dumps(d['lanes'],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'resume.js').write_text((ROOT/'resume.template.js').read_text(encoding='utf-8').replace('__LANES__',json.dumps(d['lanes'],ensure_ascii=False)).replace('__STRENGTHS__',json.dumps({x['id']:x['items'][:6] for x in d['skills']},ensure_ascii=False)),encoding='utf-8')
print('Generated static resume and lane configuration.')
