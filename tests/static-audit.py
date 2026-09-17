"""Run with Python + tinycss2; optionally compare the supplied v3.5.0 ZIP."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter, defaultdict
import json, re, sys, zipfile
import tinycss2
root=Path(__file__).resolve().parents[1]
def selectors(tokens):
    groups=[[]]
    for t in tokens:
        if t.type=='literal' and t.value==',': groups.append([])
        else: groups[-1].append(t)
    return [tinycss2.serialize(g).strip() for g in groups]
def inspect_css(files):
    errors=[]; owners=defaultdict(set); declarations=defaultdict(list)
    def walk(rules,name,scope=()):
        for r in rules:
            if r.type=='error': errors.append([name,r.message])
            if r.type=='qualified-rule':
                sels=selectors(r.prelude)
                for d in tinycss2.parse_declaration_list(r.content,skip_whitespace=True,skip_comments=True):
                    if d.type=='error': errors.append([name,d.message])
                    if d.type=='declaration':
                        for s in sels:
                            owners[(s,d.lower_name,scope)].add(name)
                            declarations[(name,s,d.lower_name,scope)].append(tinycss2.serialize(d.value).strip())
            elif r.type=='at-rule' and r.content is not None:
                if r.lower_at_keyword in ('media','supports','layer','container','keyframes','-webkit-keyframes'):
                    walk(tinycss2.parse_rule_list(r.content),name,scope+(r.lower_at_keyword+' '+tinycss2.serialize(r.prelude).strip(),))
    for name,text in files.items(): walk(tinycss2.parse_stylesheet(text),name)
    cross={str(k):sorted(v) for k,v in owners.items() if len(v)>1}
    return errors,cross,declarations
files={p.name:p.read_text() for p in (root/'src/styles').glob('*.css')}
errors,cross,declarations=inspect_css(files)
class HTMLIds(HTMLParser):
    def __init__(self): super().__init__();self.ids=[]
    def handle_starttag(self,tag,attrs): self.ids.extend(v for k,v in attrs if k=='id')
html=(root/'index.html').read_text(); h=HTMLIds();h.feed(html)
js=(root/'src/main.js').read_text()
functions=re.findall(r'^(?:async )?function\s+(\w+)\s*\(',js,re.M)
duplicates=lambda xs:[k for k,n in Counter(xs).items() if n>1]
qa_redefinitions=[str(k) for k,values in declarations.items() if '.quick-access' in k[1] and len(set(values))>1]
new_cross=cross
if len(sys.argv)>1:
    with zipfile.ZipFile(sys.argv[1]) as z:
        baseline={Path(n).name:z.read(n).decode() for n in z.namelist() if n.startswith('src/styles/') and n.endswith('.css')}
    baseline_cross=inspect_css(baseline)[1]
    new_cross={k:v for k,v in cross.items() if k not in baseline_cross}
result={'css_files':len(files),'css_errors':errors,'duplicate_html_ids':duplicates(h.ids),
'duplicate_top_level_function_names':duplicates(functions),'malformed_important':sum(t.count('!important,') for t in files.values()),
'quick_access_css_owners':[name for name,text in files.items() if '.quick-access' in text],
'quick_access_same_scope_property_redefinitions':qa_redefinitions,
'cross_file_exact_selector_property_owners':cross,'new_cross_file_owners_vs_baseline':new_cross if len(sys.argv)>1 else 'baseline not supplied',
'static_quick_access_buttons':bool(re.search(r'<section class="quick-access"[\s\S]*?<button',html.split('</aside>')[0]))}
print(json.dumps(result,indent=2))
assert not errors and not duplicates(h.ids) and not duplicates(functions)
assert not result['malformed_important'] and not qa_redefinitions and not result['static_quick_access_buttons']
assert result['quick_access_css_owners']==['style.css']
if len(sys.argv)>1: assert not new_cross
