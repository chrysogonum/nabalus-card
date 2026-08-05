#!/usr/bin/env python3
"""Build magnolia/print.html from magnolia/index.html.

The verse is never retyped: every line is lifted from the live page so the
printed edition cannot drift from it.  What changes is the dress —
light paper, margin glosses instead of hover tooltips, and the two
timelines set as facing strips with their glosses moved to endnotes.
"""
import re, os, html
from bs4 import BeautifulSoup, NavigableString

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "print.html")
SVG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "bloom-line.svg")

soup = BeautifulSoup(open(SRC, encoding="utf-8").read(), "html.parser")

# ---------------------------------------------------------------- helpers
def inner(tag):
    """Serialise a tag's children, keeping inline markup."""
    return "".join(str(c) for c in tag.children)

def rewrite_terms(frag_tag):
    """Strip the hover machinery; return (html, [(word, note, is_literary)])."""
    t = BeautifulSoup(str(frag_tag), "html.parser")
    notes = []
    for sp in t.select("span.term"):
        word = sp.get_text()
        note = sp.get("data-note", "").strip()
        lit = "lit" in (sp.get("class") or [])
        notes.append((word, note, lit))
        new = t.new_tag("span")
        new["class"] = "t lit" if lit else "t"
        new.string = ""
        # keep any inline markup inside the term
        for c in list(sp.children):
            new.append(c.extract() if not isinstance(c, NavigableString) else NavigableString(str(c)))
        sp.replace_with(new)
    body = t.find(["p", "div"]) or t
    return "".join(str(c) for c in body.children), notes

# ---------------------------------------------------------------- content
movements = []
for sec in soup.select("section.movement"):
    no = sec.select_one(".mv-no").get_text(strip=True)
    title = inner(sec.select_one(".mv-title"))
    stanzas = []
    for st in sec.select(".stanza"):
        frag, notes = rewrite_terms(st.select_one("p"))
        stanzas.append((frag, notes))
    movements.append((no, title, stanzas))

coda = inner(soup.select_one("p.coda"))
eyebrow = soup.select_one("p.eyebrow").get_text()
title_txt = soup.select_one("h1.title").get_text()
sub_txt = soup.select_one("p.sub").get_text()
dt_sub = inner(soup.select_one(".dt-sub"))
exp_lead = soup.select_one(".exp-lead").get_text()

def rows(selector):
    out = []
    for li in soup.select(selector):
        out.append({
            "cls": " ".join(li.get("class") or []),
            "ma": li.get("data-ma"),
            "when": inner(li.select_one(".dt-when")),
            "what": inner(li.select_one(".dt-what")),
            "note": inner(li.select_one(".dt-note")),
        })
    return out

deep = rows(".deep-time:not(.exp-time) .dt-item")
expo = rows(".exp-time .dt-item")

botnote_paras = [(inner(p), "cite" in (p.get("class") or [])) for p in soup.select("aside.botnote p")]
botnote_lab = soup.select_one(".botnote .lab").get_text()
copyr = inner(soup.select_one("p.copyr"))

# ------------------------------------------------- timeline strip geometry
H = 516.0          # pt: height of both strips, so the two slopes face each other
MINGAP, MAXGAP = 24.0, 74.0

def fit_linear(vals, H, ming, maxg):
    """Clamped-proportional gaps, scaled so the column fills exactly H."""
    raw = [vals[i - 1] - vals[i] for i in range(1, len(vals))]
    def total(s):
        return sum(min(maxg, max(ming, r * s)) for r in raw)
    lo, hi = 1e-9, 1e6
    for _ in range(200):
        mid = (lo + hi) / 2
        if total(mid) < H: lo = mid
        else: hi = mid
    s = (lo + hi) / 2
    pos, y = [0.0], 0.0
    for r in raw:
        y += min(maxg, max(ming, r * s)); pos.append(y)
    return pos

def fit_geometric(n, H, ming, ratio=0.75):
    """Accelerating collapse, scaled so the column fills exactly H."""
    def gaps(g0):
        return [max(ming, g0 * ratio ** i) for i in range(n - 1)]
    lo, hi = 1e-9, 1e6
    for _ in range(200):
        mid = (lo + hi) / 2
        if sum(gaps(mid)) < H: lo = mid
        else: hi = mid
    pos, y = [0.0], 0.0
    for g in gaps((lo + hi) / 2):
        y += g; pos.append(y)
    return pos

deep_pos = fit_linear([float(r["ma"]) for r in deep], H, MINGAP, MAXGAP)
expo_pos = fit_geometric(len(expo), H, MINGAP)

# continuous endnote numbering across both strips
for i, r in enumerate(deep): r["n"] = i + 1
for i, r in enumerate(expo): r["n"] = len(deep) + i + 1

def strip(items, pos, cap, sub=""):
    subline = f'<p class="strip-sub">{sub or "&nbsp;"}</p>'
    out = [f'<div class="strip"><p class="strip-cap">{cap}</p>{subline}',
           f'<div class="rail" style="height:{H + 14:.1f}pt">',
           '<span class="rule"></span>']
    for r, y in zip(items, pos):
        cls = " ".join(c for c in r["cls"].split() if c in ("key", "now", "future", "end"))
        out.append(
            f'<div class="tick {cls}" style="top:{y:.1f}pt">'
            f'<span class="dot"></span>'
            f'<span class="tw">{r["when"]}</span>'
            f'<span class="tt">{r["what"]}<sup>{r["n"]}</sup></span>'
            f'</div>')
    out.append('</div></div>')
    return "\n".join(out)

def endnotes(items):
    return "\n".join(
        f'<li id="n{r["n"]}"><span class="en-n">{r["n"]}</span>'
        f'<span class="en-h">{r["what"]}</span> <span class="en-w">{r["when"]}</span>'
        f'<span class="en-b">{r["note"]}</span></li>' for r in items)

# ---------------------------------------------------------------- movements
mv_html = []
for no, title, stanzas in movements:
    body = []
    for frag, notes in stanzas:
        aside = "".join(
            f'<p class="gl{" lit" if lit else ""}"><b>{html.escape(w)}</b>{n}</p>'
            for w, n, lit in notes)
        body.append(f'<div class="stz"><p class="verse">{frag}</p>'
                    f'<aside class="notes">{aside}</aside></div>')
    mv_html.append(
        f'<section class="movement">\n'
        f'  <header class="mv-head"><p class="mv-no">{no}</p><h2 class="mv-title">{title}</h2></header>\n'
        + "\n".join(body) + "\n</section>")

svg = open(SVG, encoding="utf-8").read()

# ---------------------------------------------------------------- template
doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Cantharophily — printable edition</title>
<meta name="description" content="Cantharophily: an epic in deep time, for a magnolia in a jar of tap water. The printable edition — light paper, margin glosses, and the two timelines set as facing strips." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Cormorant+SC:wght@500;600&display=swap" rel="stylesheet" />
<style>
  @page{{ size:letter; margin:0.85in 0.9in 0.8in; }}

  :root{{
    --ink:#231f1a;          /* warm near-black, easier on the eye than #000 */
    --ink-soft:#5d574c;
    --ink-faint:#8b8474;
    --accent:#8a6529;       /* the gold, brought down to something that prints */
    --sage:#41654c;
    --rule:#cfc7b4;
    --measure:4.55in;
    --gutter:0.40in;
    --sidebar:1.65in;
  }}
  *{{ box-sizing:border-box; }}
  html{{ font-size:10.5pt; }}
  body{{
    margin:0; background:#fff; color:var(--ink);
    font-family:"EB Garamond", Garamond, "Hoefler Text", Georgia, serif;
    font-size:1rem; line-height:1.62;
    -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
  }}
  i,em{{ font-style:italic; }}
  sup{{ font-size:.62em; line-height:0; vertical-align:.55em; color:var(--accent); padding-left:.12em; }}

  /* ---------------------------------------------------- title page */
  .plate{{ height:9.0in; display:flex; flex-direction:column; align-items:center;
           justify-content:center; text-align:center; break-after:page; }}
  .plate .fig{{ width:3.9in; height:5.1in; color:var(--ink); margin:0 0 .5in; }}
  .plate .fig svg{{ display:block; width:100%; height:100%; }}
  .eyebrow{{ font-family:"Cormorant SC","Cormorant Garamond",serif; letter-spacing:.34em;
             text-transform:uppercase; font-size:.62rem; color:var(--accent); margin:0 0 .9em; padding-left:.34em; }}
  h1.title{{ font-family:"Cormorant Garamond",serif; font-weight:300; font-style:italic;
             font-size:3.1rem; line-height:1; margin:0; color:var(--ink); }}
  .sub{{ font-family:"Cormorant Garamond",serif; font-style:italic; color:var(--ink-soft);
         font-size:1.12rem; margin:1em 0 0; }}

  /* ---------------------------------------------------- movements */
  .movement{{ break-before:page; }}
  .mv-head{{ text-align:center; margin:0 0 2.1em; width:var(--measure); break-after:avoid; }}
  .mv-no{{ font-family:"Cormorant Garamond",serif; font-style:italic; color:var(--accent);
           font-size:1rem; letter-spacing:.16em; margin:0; padding-left:.16em; }}
  .mv-title{{ font-family:"Cormorant Garamond",serif; font-weight:300; font-style:italic;
              font-size:1.72rem; line-height:1.15; margin:.1em 0 0; color:var(--ink); }}

  .stz{{ display:grid; grid-template-columns:var(--measure) var(--sidebar);
         column-gap:var(--gutter); align-items:start; margin:0 0 1.5em; break-inside:avoid; }}
  .verse{{ margin:0; color:var(--ink); }}
  .vl{{ display:block; padding-left:1.15em; text-indent:-1.15em; }}
  .movement:first-of-type .stz:first-of-type .vl:first-child::first-letter{{
    font-family:"Cormorant Garamond",serif; font-size:1.35em; color:var(--accent); }}
  .ship{{ font-variant:small-caps; letter-spacing:.05em; }}

  /* glossed terms: a hairline dotted rule survives a greyscale printer */
  .t{{ border-bottom:1px dotted var(--ink-faint); }}
  .t.lit{{ border-bottom-style:dotted; }}

  .notes{{ margin:0; font-size:.72rem; line-height:1.44; color:var(--ink-soft); }}
  .gl{{ margin:0 0 .85em; }}
  .gl b{{ display:block; font-weight:400; font-style:italic; color:var(--accent); }}
  .gl.lit b{{ color:var(--sage); }}

  .coda{{ width:var(--measure); text-align:center; font-family:"Cormorant Garamond",serif;
          font-style:italic; font-size:1.32rem; line-height:1.42; color:var(--ink-soft);
          margin:2.6em 0 0; break-inside:avoid; }}

  /* ---------------------------------------------------- the facing strips */
  .timeline{{ break-before:page; }}
  .tl-head{{ text-align:center; margin:0 0 .2in; }}
  .tl-cap{{ font-family:"Cormorant SC","Cormorant Garamond",serif; letter-spacing:.24em;
            text-transform:uppercase; font-size:.72rem; color:var(--accent); margin:0 0 .5em; }}
  .tl-sub{{ font-style:italic; color:var(--ink-faint); font-size:.74rem; line-height:1.4;
            margin:0 auto; max-width:4.6in; }}
  .strips{{ display:grid; grid-template-columns:1fr 1fr; column-gap:.42in; }}
  .strip-cap{{ font-family:"Cormorant SC","Cormorant Garamond",serif; letter-spacing:.2em;
               text-transform:uppercase; font-size:.66rem; color:var(--ink); margin:0 0 .3em;
               padding-left:1.15em; }}
  .strip-sub{{ font-family:"Cormorant Garamond",serif; font-style:italic; color:var(--ink-faint);
               font-size:.7rem; margin:0 0 .8em; padding-left:1.15em; }}
  .strip .strip-cap + .rail{{ margin-top:.8em; }}
  .rail{{ position:relative; }}
  .rule{{ position:absolute; left:3px; top:4pt; bottom:6pt; width:.75pt;
          background:linear-gradient(180deg,var(--accent),var(--rule)); }}
  .exp .rule{{ background:linear-gradient(180deg,var(--rule) 0%,var(--accent) 52%,rgba(138,101,41,.25) 100%); }}
  .tick{{ position:absolute; left:0; padding-left:1.15em; width:100%; }}
  .dot{{ position:absolute; left:0; top:.34em; width:6.5px; height:6.5px; border-radius:50%;
         border:.75pt solid var(--accent); background:#fff; }}
  .tick.key .dot{{ background:var(--accent); }}
  .tick.now .dot{{ background:var(--ink); border-color:var(--ink); }}
  .tw{{ display:block; font-family:"Cormorant Garamond",serif; font-style:italic;
        color:var(--accent); font-size:.76rem; line-height:1.25; letter-spacing:.02em; }}
  .tt{{ display:block; font-size:.8rem; line-height:1.22; color:var(--ink); }}
  .tick.key .tt{{ font-weight:600; }}
  .tick.now .tw{{ font-style:normal; text-transform:uppercase; letter-spacing:.16em;
                  font-size:.66rem; color:var(--ink); }}
  .tick.future .tw, .tick.future .tt{{ color:var(--ink-soft); }}
  .tick.end{{ opacity:.72; }}
  .exp-lead{{ text-align:center; font-family:"Cormorant Garamond",serif; font-style:italic;
              color:var(--ink-faint); font-size:.74rem; margin:0 0 .7em; }}

  /* ---------------------------------------------------- endnotes */
  .en-wrap{{ break-before:page; }}
  .en-lab{{ font-family:"Cormorant SC","Cormorant Garamond",serif; letter-spacing:.22em;
            text-transform:uppercase; font-size:.64rem; color:var(--accent);
            margin:0 0 1em; text-align:center; }}
  .en-lab.mid{{ margin-top:1.6em; break-before:auto; }}
  .ens{{ list-style:none; margin:0; padding:0; columns:2; column-gap:.4in; font-size:.72rem;
         line-height:1.42; color:var(--ink-soft); }}
  .ens li{{ margin:0 0 .85em; break-inside:avoid; padding-left:1.5em; text-indent:-1.5em; }}
  .en-n{{ color:var(--accent); font-size:.86em; vertical-align:.28em; padding-right:.45em; }}
  .en-h{{ color:var(--ink); }}
  .en-w{{ font-style:italic; color:var(--accent); }}
  .en-b{{ display:block; text-indent:0; padding-left:0; margin-top:.1em; }}

  /* ---------------------------------------------------- back matter */
  .botnote{{ max-width:5.0in; margin:2.2em auto 0; color:var(--ink-soft); font-size:.74rem;
             line-height:1.55; break-inside:avoid; }}
  .botnote .rule2{{ width:42px; height:1px; background:var(--ink-faint); opacity:.5; margin:0 auto 1.4em; }}
  .botnote .lab{{ font-family:"Cormorant SC","Cormorant Garamond",serif; letter-spacing:.2em;
                  text-transform:uppercase; font-size:.62rem; color:var(--accent);
                  display:block; text-align:center; margin-bottom:1em; }}
  .botnote .cite{{ margin-top:1.1em; font-size:.68rem; opacity:.85; }}
  .copyr{{ text-align:center; color:var(--ink-faint); font-size:.66rem; letter-spacing:.05em; margin:2.4em 0 0; }}

  /* on screen, sit the sheet on a desk so it reads as a proof */
  @media screen{{
    body{{ background:#e8e4da; padding:24px 0; }}
    main{{ width:8.5in; min-height:11in; margin:0 auto; background:#fff;
           padding:0.85in 0.9in 0.8in; box-shadow:0 10px 40px -12px rgba(0,0,0,.35); }}
  }}
  @media print{{
    main{{ width:auto; padding:0; box-shadow:none; }}
    a{{ color:inherit; text-decoration:none; }}
  }}
</style>
</head>
<body>
<main>

  <section class="plate">
    <div class="fig">{svg}</div>
    <p class="eyebrow">{eyebrow}</p>
    <h1 class="title">{title_txt}</h1>
    <p class="sub">{sub_txt}</p>
  </section>

{chr(10).join(mv_html)}

  <p class="coda">{coda}</p>

  <section class="timeline">
    <div class="tl-head">
      <p class="tl-cap">The two slopes</p>
      <p class="tl-sub">{dt_sub} The right-hand column is the last dot of the left one, unfolded. Spacing is indicative of order and rhythm, not drawn to scale; the numbers lead to the notes overleaf.</p>
    </div>
    <div class="strips">
      {strip(deep, deep_pos, "The order of deep time")}
      <div class="exp">{strip(expo, expo_pos, "The Exponential", exp_lead)}</div>
    </div>
  </section>

  <section class="en-wrap">
    <p class="en-lab">Notes to the chronology &mdash; the order of deep time</p>
    <ol class="ens">
{endnotes(deep)}
    </ol>
    <p class="en-lab mid">Notes to the chronology &mdash; the exponential</p>
    <ol class="ens">
{endnotes(expo)}
    </ol>

    <aside class="botnote">
      <div class="rule2"></div>
      <span class="lab">{botnote_lab}</span>
      {chr(10).join(f'<p{" class=cite" if is_cite else ""}>{txt}</p>' for txt, is_cite in botnote_paras)}
    </aside>
    <p class="copyr">{copyr}</p>
  </section>

</main>
</body>
</html>
"""

open(OUT, "w", encoding="utf-8").write(doc)
print(f"wrote {OUT}  ({len(doc):,} bytes)")
print(f"movements {len(movements)}  stanzas {sum(len(m[2]) for m in movements)}  "
      f"glosses {sum(len(n) for m in movements for _, n in m[2])}")
print(f"deep rows {len(deep)}  expo rows {len(expo)}  endnotes {len(deep)+len(expo)}")
