"""Generate ID-keyed official language bundles. No machine translated game data.
Usage: build-client-locales.py CLIENT_INDEX TABLE_DIR EFFECT_DIR STRINGS_DIR OUTPUT_DIR ORIGINAL_ENGLISH_JSON TEXT_BUILD_ID
STRINGS_DIR contains CULTURE.json exports of the installed client's L10NString.dat.
Existing index source hashes and English names must agree before publishing.
"""
import hashlib, importlib.util, json, re, sys
from pathlib import Path
CULTURES={'ko':'ko-KR','en':'en-US','ja':'ja-JP','fr':'fr-FR','de':'de-DE','es':'es-ES','pt-BR':'pt-BR','ru':'ru-RU'}
spec=importlib.util.spec_from_file_location('base',Path(__file__).with_name('build-client-index.py'))
base=importlib.util.module_from_spec(spec); spec.loader.exec_module(base)
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def name(value):
    if not isinstance(value,str) or not value.strip(): return None
    value=re.sub(r'<[^>]*>','',value).strip()
    if not value or len(value)>500 or re.search(r'[\x00-\x1f\x7f<{}]',value): raise ValueError('Invalid official name')
    return value
def build(index_path,tables,effects_dir,strings_dir,output_dir,original_english,text_build_id):
    if not re.fullmatch(r"[1-9][0-9]*",text_build_id): raise ValueError("Explicit installed text build required")
    index=read(index_path); tables=Path(tables); effects_dir=Path(effects_dir); output=Path(output_dir)
    sources={}; rows={}
    for key in ['Item','Skill','SkillEffect','SkillAbnormalEffect']:
        path=(tables if key in ['Item','Skill'] else effects_dir)/(key+'.json')
        sources[key]=digest(path)
        if sources[key]!=index['source']['inputSha256'][key]: raise ValueError('Source mismatch: '+key)
        rows[key]={str(r['ID']['Value']):r for r in read(path)['Properties']['Data']}
    if digest(original_english)!=index['source']['inputSha256']['English']: raise ValueError('English source mismatch')
    english=read(original_english)['Entries']
    keys={'items':{i['id']:'String_'+rows['Item'][i['id']]['Desc']['Key']+'_body' for i in index['items']},
          'skills':{s['id']:'SkillString_'+rows['Skill'][s['id']]['SkillString_Key'] for s in index['skills']}}
    for kind in ['items','skills']:
        for row in index[kind]:
            key=keys[kind][row['id']]+('_skill_name' if kind=='skills' else '')
            if name(english.get(key))!=row['name']: raise ValueError('English ID/name mismatch: '+row['id'])
    output.mkdir(parents=True,exist_ok=True); report={}
    for locale,culture in CULTURES.items():
        path=Path(strings_dir)/(culture+'.json'); entries=read(path)['Entries']
        items={i:name(entries.get(k)) for i,k in keys['items'].items()}
        items={i:n for i,n in items.items() if n}
        skills={}
        for i,prefix in keys['skills'].items():
            n=name(entries.get(prefix+'_skill_name'))
            if not n: continue
            skill={'name':n}
            for field,suffix in [('description','_skill_desc_effect'),('traits','_skill_spec_effect')]:
                value=entries.get(prefix+suffix)
                if value:
                    # Text was updated independently of the decoded numeric tables. Never combine old effect values with newer prose.
                    skill[field]=base.description(value)
                    skill[field]['valueScope']='unresolved-client-values'
            skills[i]=skill
        stats={k.removeprefix('String_StatName_').removesuffix('_body'):name(v) for k,v in entries.items() if k.startswith('String_StatName_') and k.endswith('_body') and v}
        if any(not re.fullmatch(r'[A-Za-z][A-Za-z0-9]{0,79}',k) for k in stats): raise ValueError('Unsupported stat key: '+culture)
        if len(items)<9000 or len(skills)!=len(index['skills']): raise ValueError('Unexpected coverage: '+culture)
        data={'schema':'asbc-client-locale-v1','locale':locale,'culture':culture,'buildId':index['source']['buildId'],
              'textBuildId':text_build_id,'source':{'kind':'installed-steam-client','inputSha256':sources,'stringsSha256':digest(path)},'items':items,'skills':skills,'stats':stats}
        raw=json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n'
        (output/(locale+'.json')).write_text(raw,encoding='utf-8')
        report[locale]={'culture':culture,'items':len(items),'skills':len(skills),'bytes':len(raw.encode()),'sha256':hashlib.sha256(raw.encode()).hexdigest()}
    return report
if __name__=='__main__': print(json.dumps(build(*sys.argv[1:]),indent=2))
