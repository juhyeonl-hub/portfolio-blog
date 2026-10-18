"""Reviewed snapshot, not a live/global census. Run from repo root then test/deploy."""
import json,re,time,html
from pathlib import Path
from urllib.request import urlopen,Request
from urllib.parse import urlencode,unquote
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[2]
SOURCE='https://aion2tierlist.com/rankings'
KEYS={'Gladiator':'gladiator','Templar':'templar','Assassin':'assassin','Ranger':'ranger','Sorcerer':'sorcerer','Spiritmaster':'elementalist','Cleric':'cleric','Chanter':'chanter'}

def fetch(url):
    with urlopen(Request(url,headers={'User-Agent':'a2bc-profile-review/1.0'}),timeout=30) as r:
        body=r.read(3_000_001)
    if len(body)>3_000_000:raise ValueError('Oversized response')
    return body.decode('utf-8')

def parse_leaders(text,servers):
    found={k:[] for k in KEYS.values()};seen=set()
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',text,re.S):
        link=re.search(r'href="(/character/([^/]+)/([^/]+)/([^"?]+))"',row)
        cls=re.search(r'<small>(Gladiator|Templar|Assassin|Ranger|Sorcerer|Spiritmaster|Cleric|Chanter)</small>',row)
        if not link or not cls:continue
        values=re.findall(r'<td\b[^>]*data-v="([^"]*)"',row)
        if len(values)!=7:raise ValueError('Ranking schema changed')
        rank,name,server_name,level,item_level,cp,_=map(html.unescape,values)
        region=link[2];key=KEYS[cls[1]]
        server=next((s for s in servers.get(region,[]) if s['serverName']==server_name),None)
        if not server or name!=unquote(link[4]) or not 0<int(cp)<100000000 or not 1<=int(level)<=45:raise ValueError('Invalid ranking identity')
        identity=(region,server['serverId'],name)
        if identity in seen:raise ValueError('Duplicate character')
        seen.add(identity)
        if len(found[key])<10:found[key].append({'classKey':key,'rank':len(found[key])+1,'sampleRank':int(rank),'name':name,'region':region,'serverId':server['serverId'],'serverName':server_name,'race':server['raceId'],'combatPower':int(cp),'sourceProfile':'https://aion2tierlist.com'+link[1]})
    if any(len(rows)!=10 for rows in found.values()):raise ValueError('Fewer than ten per class in top500 sample')
    for rows in found.values():
        if any(a['combatPower']<b['combatPower'] for a,b in zip(rows,rows[1:])):raise ValueError('Rank order changed')
    return [x for rows in found.values() for x in rows]

def verify(row):
    time.sleep(.3)
    q=urlencode({'keyword':row['name'],'region':row['region'],'localeInfo':'en-US','page':1,'size':20,'serverId':row['serverId']})
    search=json.loads(fetch('https://api-search.plaync.com/aion2global/search/v2/character?'+q))
    matches=[x for x in search.get('list',[]) if re.sub('<[^>]*>','',x['name'])==row['name'] and x['serverId']==row['serverId']]
    if len(matches)!=1:raise ValueError('Official identity missing/ambiguous: '+row['name'])
    character_id=unquote(matches[0]['characterId'])
    q=urlencode({'region':row['region'],'lang':'en-US','serverId':row['serverId'],'characterId':character_id})
    info=json.loads(fetch('https://aion2.plaync.com/api/character/info?'+q))
    gear=json.loads(fetch('https://aion2.plaync.com/api/character/equipment?'+q))
    profile=info['profile']
    classes=json.loads((ROOT/'frontend/shadowcraft/lib/data/class-profiles.json').read_text())
    ids=next(c['pcIds'] for c in classes if c['key']==row['classKey'])
    if profile['pcId'] not in ids or profile['characterName']!=row['name'] or profile['serverId']!=row['serverId']:raise ValueError('Official profile mismatch')
    equipment=gear['equipment']['equipmentList'];skills=gear['skill']['skillList']
    if not isinstance(equipment,list) or not isinstance(skills,list):raise ValueError('Missing public gear/skills')
    row.update(characterId=character_id,verifiedAt=datetime.now(timezone.utc).isoformat(),currentCombatPower=profile['combatPower'],level=profile['characterLevel'],
        equipment=[{k:x[k] for k in ['id','name','slotPos','slotPosName','enchantLevel','exceedLevel']} for x in equipment],
        skills=[{k:x[k] for k in ['id','name','category','skillLevel','equip']} for x in skills])
    print('Verified',row['classKey'],row['rank'],flush=True)
    return row

def validate_entries(entries):
    if len(entries)!=80 or len({(r['region'],r['serverId'],r['characterId']) for r in entries})!=80:
        raise ValueError('Missing/duplicate verified characters')
    for row in entries:
        if type(row['currentCombatPower']) is not int or not 0<row['currentCombatPower']<100000000:
            raise ValueError('Invalid official combat power')
        for collection,numeric in [(row['skills'],['id','skillLevel','equip']), (row['equipment'],['id','slotPos','enchantLevel','exceedLevel'])]:
            if not collection or len(collection)>100 or len({x['slotPos'] if 'slotPos' in numeric else x['id'] for x in collection})!=len(collection):
                raise ValueError('Missing/duplicate public records')
            for item in collection:
                if not isinstance(item['name'],str) or not 1<=len(item['name'])<=200:
                    raise ValueError('Invalid public item name')
                if any(type(item[k]) is not int or item[k]<0 or item[k]>1000000000 for k in numeric):
                    raise ValueError('Invalid numeric record')
        if any(not 0<=x['skillLevel']<=999 or x['equip'] not in [0,1] for x in row['skills']):
            raise ValueError('Invalid skill record')

if __name__=='__main__':
    servers=json.loads((ROOT/'frontend/shadowcraft/lib/data/servers.json').read_text())
    entries=parse_leaders(fetch(SOURCE),servers)
    with ThreadPoolExecutor(max_workers=2) as pool:entries=list(pool.map(verify,entries))
    validate_entries(entries)
    result={'source':SOURCE,'scope':'global-indexed-top500-class-top10','metric':'combat-power','fetchedAt':datetime.now(timezone.utc).isoformat(),'entries':entries}
    output=ROOT/'frontend/shadowcraft/lib/data/rankers.json';tmp=output.with_suffix('.tmp');tmp.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n');tmp.replace(output)
    print('Saved 80 verified public profiles; review before deployment')
