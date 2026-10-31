"""Generate official NPC/journal names by verified IDs. All languages validate before any output is replaced.
Usage: build-entity-locales.py NPC_INDEX JOURNAL_INDEX TABLE_DIR STRINGS_DIR OUTPUT_DIR ORIGINAL_ENGLISH_JSON TEXT_BUILD_ID
Run in the release staging tree; publishing is a separate validated deployment. Numeric data is unchanged.
"""
import hashlib, importlib.util, json, re, sys, tempfile, os
from pathlib import Path
spec=importlib.util.spec_from_file_location('locales',Path(__file__).with_name('build-client-locales.py'))
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)

def build(npc_index,journal_index,tables,strings,output,original_english,text_build):
    if not re.fullmatch(r'[1-9][0-9]*',text_build):raise ValueError('Explicit installed text build required')
    npc=base.read(npc_index);journal=base.read(journal_index);tables=Path(tables);output=Path(output)
    if npc['source']['buildId']!=journal['source']['buildId']:raise ValueError('Numeric build mismatch')
    sources={};rows={}
    for key in ['Quest','QuestString','Dungeon','Map','NpcData','VehicleList']:
        path=tables/(key+'.json');sources[key]=base.digest(path)
        if sources[key]!=journal['source']['sha256'][key]:raise ValueError('Source mismatch: '+key)
        raw=base.read(path)['Properties']['Data']
        rows[key]={str(v['Name'] if key=='QuestString' else v['ID']['Value']):v for v in raw}
    if sources['NpcData']!=npc['source']['sha256']['NpcData']:raise ValueError('NPC source mismatch')
    for index in [npc,journal]:
        if base.digest(original_english)!=index['source']['sha256']['English']:raise ValueError('English source mismatch')
    english=base.read(original_english)['Entries']
    def string_key(row,field):
        key=row.get(field,{}).get('Key')
        return 'String_'+key+'_body' if key and key!='None' else ''
    keys={'npcs':{},'quests':{},'dungeons':{},'pets':{},'maps':{}};summaries={}
    for row in npc['npcs']:keys['npcs'][row['id']]=string_key(rows['NpcData'][row['id']],'Desc')
    for row in journal['quests']:
        raw=rows['Quest'][row['id']];text=rows['QuestString'].get(raw.get('QuestText'),{})
        keys['quests'][row['id']]=text.get('Title',{}).get('Key','')
        summaries[row['id']]=text.get('ShortSummary',{}).get('Key','')
    for kind,table,field in [('dungeons','Dungeon','Title'),('pets','VehicleList','Desc')]:
        for row in journal[kind]:keys[kind][row['id']]=string_key(rows[table][row['id']],field)
    for row in journal['dungeons']:
        key=str(row['mapId'])
        if key in rows['Map']:keys['maps'][key]=string_key(rows['Map'][key],'Desc')
    for kind,index in [('npcs',npc),('quests',journal),('dungeons',journal),('pets',journal)]:
        for row in index[kind]:
            if (english.get(keys[kind][row['id']],'').strip() or None)!=row['name']:raise ValueError('English ID/name mismatch: '+kind+'/'+row['id'])
    bundles={};report={}
    for locale,culture in base.CULTURES.items():
        path=Path(strings)/(culture+'.json');entries=base.read(path)['Entries'];groups={}
        for kind,mapping in keys.items():
            groups[kind]={}
            for ident,key in mapping.items():
                raw_name=entries.get(key)
                try:value=base.name(re.sub(r'\s+',' ',raw_name).strip()) if isinstance(raw_name,str) else None
                except ValueError:value=None # Unresolved/test placeholders stay explicit fallbacks.
                if value:groups[kind][ident]={'name':value}
        # Unresolved client substitutions are omitted from prose; never invent old numeric values.
        for ident,key in summaries.items():
            if ident in groups['quests'] and entries.get(key):
                desc=base.base.description(entries[key])
                if desc and desc.get('text') and desc.get('unresolvedValues',0)==0 and len(desc['text'])<=2000:groups['quests'][ident]['summary']=re.sub(r'\s+',' ',desc['text']).strip()
        if len(groups['npcs'])<10000 or len(groups['quests'])<1000:raise ValueError('Unexpected name coverage: '+culture)
        bundle={'schema':'asbc-client-entities-v1','locale':locale,'culture':culture,'buildId':npc['source']['buildId'],'textBuildId':text_build,
                'source':{'kind':'installed-steam-client','inputSha256':sources,'stringsSha256':base.digest(path),'npcIndexSha256':base.digest(npc_index),'journalIndexSha256':base.digest(journal_index)},**groups}
        raw=json.dumps(bundle,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n';bundles[locale+'.json']=raw
        report[locale]={'counts':{k:len(v) for k,v in groups.items()},'bytes':len(raw.encode()),'sha256':hashlib.sha256(raw.encode()).hexdigest()}
    # No files are touched on a bad source, ID mapping, or late-language validation failure.
    output.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='entities-',dir=output.parent) as stage:
        for filename,raw in bundles.items():(Path(stage)/filename).write_text(raw,encoding='utf-8')
        for filename in bundles:os.replace(Path(stage)/filename,output/filename)
    return report
if __name__=='__main__':print(json.dumps(build(*sys.argv[1:]),indent=2))
