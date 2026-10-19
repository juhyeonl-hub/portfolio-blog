import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const templates=JSON.parse(readFileSync('lib/data/specialization-translations.json','utf8'));
const {localizeSpecialization:translate,localizeNodeName}=await import(moduleUrl(readFileSync('lib/specialization-localization.ts','utf8').replace("import templates from './data/specialization-translations.json';",'const templates='+JSON.stringify(templates)+';').replace("import skillNames from './data/skill-names.json';",'const skillNames='+readFileSync('lib/data/skill-names.json','utf8')+';').replace("import official from './data/official-specializations.json';",'const official='+readFileSync('lib/data/official-specializations.json','utf8')+';')));
const exact=[
 ['재시전 시간 1.5초 감소','en','-1.5s cooldown'],
 ['적중 시 확정 치명타','en','Guaranteed Critical Hit on hit'],
 ['적중 시 확정 다단 히트','en','Guaranteed Multi-Hit on hit'],
 ['적중 시 3s 동안 공격력 20% 증가','en','On hit, +20% Attack for 3s'],
 // probability vs guarantee, critical vs multi-hit
 ['은신 중 공격 시 확정 치명타','en','Guaranteed Critical Hit when attacking from Stealth'],
 ['은신 중 공격 시 치명타','en','Lands as a Critical Hit when attacking from Stealth'],
 ['막기 및 회피를 무시하고 다단히트로 적중','en','Ignores Block and Evasion and lands as Multi-Hit'],
 ['적중 시 50%의 확률로 [회오리 베기] 활성화','en','50% chance to trigger [Whirlwind Slice] on hit'],
 // cooldown reduction vs increase vs reset vs removal
 ['모든 스킬의 재시전 시간 10% 증가','en','+10% cooldown for all skills'],
 ['적중 시 모든 스킬 재시전 시간 10% 감소','en','Reduces all skill cooldowns by 10% on hit'],
 ['치명타 적중 시 [심장 찌르기] 재시전 시간 초기화','en','Resets [Heart Gore] cooldown on landing a Critical Hit'],
 ['[암격쇄] 재시전 시간 삭제','en','Removes [Dark Crush] cooldown'],
 // trigger conditions, argument order and decimals
 ['PC 처치 관여 시 재시전 시간 초기화','en','Resets cooldown on participating in defeating a player'],
 ['생명력 50% 이하일 때 회복량 30% 증가','en','+30% amount restored when HP is 50% or less'],
 ['5초 동안 30% 확률로 속박 효과 부여','en','30% chance to inflict Root for 5s'],
 ['유지 시간 동안 [배후 강타] 효과 1.5배 증가','en','x1.5 [Rear Smite] effect for the duration'],
 ['2번 연속기 [암격] 추가','en','Adds Chain Skill 2 [암격]'],
 ['기운을 중심으로 4m내의 최대 4명의 적들의 이동 속도를 3s 동안 40% 감소','en','Reduces Move Speed of up to 4 enemies within 4m of the Aura by 40% for 3s'],
 ['PVE 피해 증폭 10%, PVP 피해 증폭 5% 추가 감소','en','+10% PvE Damage Boost reduction and +5% PvP Damage Boost reduction'],
 ['적중 시 50%의 확률로 3s 동안 기절','ja','的中時、50%の確率で3秒間気絶'],
 ['적중 시 50%의 확률로 3s 동안 기절','fi','Osumalla 50% todennäköisyys tainnuttaa 3 sekunniksi'],
];
for(const [source,locale,expected] of exact)assert.equal(translate(source,locale),expected,source);
// Korean output keeps Korean skill names; other locales use official global-client names, unknown names stay literal.
assert.equal(translate('적중 시 50%의 확률로 [회오리 베기] 활성화','ko'),'적중 시 50%의 확률로 [회오리 베기] 활성화');
assert.equal(translate('[침투] 사거리 10m 증가','en'),'+10m [Infiltrate] range');
for(const source of ['재시전 시간 1초 증가','재시전 시간 1초 감소 및 피해 증가','[다른 스킬] 재시전 시간 1초 감소','재시전 시간 -1초 감소','재시전 시간 1초 감소\n'])assert.equal(translate(source,'en'),source,'unknown/compound effects must remain exact source text');
const numbers=s=>s.match(/\d+(?:\.\d+)?/g)?.sort()||[];
for(const row of templates){const source=row.source.replace(/\{(\d+)\}/g,(_,i)=>String(12.5+Number(i)));
 for(const locale of ['en','ja','fi']){assert.deepEqual(numbers(translate(source,locale)),numbers(source));assert.ok(!/\{\d+\}/.test(translate(source,locale)));}
 assert.equal(translate(source,'ko'),source);
}
let total=0,matched=0;
for(const file of readdirSync('lib/data/catalogs').filter(f=>f.endsWith('.json'))){const catalog=JSON.parse(readFileSync('lib/data/catalogs/'+file,'utf8'));const before=JSON.stringify(catalog);
 for(const skill of catalog.skills)for(const spec of skill.specializations||[]){total++;if(translate(spec.description,'en')!==spec.description)matched++;for(const locale of ['en','ja','fi'])assert.deepEqual(numbers(translate(spec.description,locale)),numbers(spec.description));}
 assert.equal(JSON.stringify(catalog),before);
}
assert.equal(total,896);assert.equal(matched,total,'every catalog specialization has a reviewed template');
assert.equal(new Set(templates.map(row=>row.source)).size,templates.length,'template sources are unique');
for(const row of templates)for(const locale of ['en','ja','fi']){const ph=s=>(s.match(/\{\d+\}/g)||[]).sort().join();assert.equal(ph(row[locale]),ph(row.source),row.source+' '+locale);assert.ok(!/[가-힣]/.test(row[locale].replace(/\[[^\]]+\]/g,'')),'untranslated Korean outside skill names: '+row[locale]);}
console.log(`Specialization localization: ${matched}/${total} descriptions match reviewed templates; all numeric values preserved, unknown effects untouched, source catalogs unchanged PASS`);

// Official global-client skill names: every catalog skill maps by id to the en-US client name.
{const names=JSON.parse(readFileSync('lib/data/skill-names.json','utf8'));const client=JSON.parse(readFileSync('../public/shadowcraft/data/client-index.json','utf8'));const byId=new Map(client.skills.map(s=>[s.id,s.name]));
 for(const file of readdirSync('lib/data/catalogs').filter(f=>f.endsWith('.json')))for(const skill of JSON.parse(readFileSync('lib/data/catalogs/'+file,'utf8')).skills)assert.equal(names[skill.name].en,byId.get(skill.id),skill.name);
 for(const file of readdirSync('lib/data/catalogs').filter(f=>f.endsWith('.json')))for(const board of JSON.parse(readFileSync('lib/data/catalogs/'+file,'utf8')).boards)for(const node of board.nodes){const m=node.name.match(/^스킬 레벨 상승 - (.+)$/);if(m)assert.equal(names[m[1]].en,byId.get(node.skill.id),node.name);}
 console.log(`Skill names: ${Object.keys(names).length} catalog/node skill names map to official global-client names PASS`);}
// Daevanion node names: patterns, official skill names, comma-joined stats; Korean unchanged; every catalog node name resolves.
{const messages=JSON.parse(readFileSync('lib/data/ui-translations.json','utf8'));const {localizedValue}=await import(moduleUrl(readFileSync('lib/localization.ts','utf8')));
 const tr=locale=>(key,values)=>localizedValue(key,Object.fromEntries(Object.entries(messages).map(([k,v])=>[k,v[locale]])),values);
 assert.equal(localizeNodeName('스킬 레벨 상승 - 침투','en',tr('en')),'Skill Level Up - Infiltrate');
 assert.equal(localizeNodeName('네자칸 - 시작','en',tr('en')),'Nezekan - Start');
 assert.equal(localizeNodeName('PVP 치명타, PVP 치명타 저항','en',tr('en')),'PvP Critical Hit, PvP Critical Hit Resist');
 assert.equal(localizeNodeName('침투','en',tr('en')),'Infiltrate');
 assert.equal(localizeNodeName('네자칸 - 시작','ko',tr('ko')),'네자칸 - 시작');
 let nodes=0;for(const file of readdirSync('lib/data/catalogs').filter(f=>f.endsWith('.json')))for(const board of JSON.parse(readFileSync('lib/data/catalogs/'+file,'utf8')).boards)for(const node of board.nodes)for(const locale of ['en','ja','fi']){nodes++;const out=localizeNodeName(node.name,locale,tr(locale));assert.ok(!/[가-힣]/.test(out),node.name+' '+locale+' -> '+out);}
 console.log(`Daevanion nodes: ${nodes/3} node names translate in en/ja/fi with no Korean left PASS`);}
// Official client text by specialization id (en/ja), only where numbers match the Korean catalog; Japanese skill names in ja.
{const officialText=JSON.parse(readFileSync('lib/data/official-specializations.json','utf8'));
 assert.equal(translate('[침투] 적중 시 행동력 300 회복','ja','13360010'),'[侵入]的中時に行動力300回復');
 assert.equal(translate('[침투] 적중 시 행동력 300 회복','en','13360010'),'Restores 300 Stamina on landing [Infiltrate]');
 assert.equal(translate('[침투] 적중 시 행동력 300 회복','fi','13360010'),'[Infiltrate] palauttaa osuessaan 300 Staminaa');
 assert.equal(translate('[침투] 적중 시 행동력 300 회복','ko','13360010'),'[침투] 적중 시 행동력 300 회복');
 assert.equal(translate('[침투] 사거리 10m 증가','ja'),'[侵入]の射程が10m増加');
 // A changed server description must not show the old official effect for the same id.
 assert.equal(translate('[침투] 적중 시 행동력 500 회복','en','13360010'),translate('[침투] 적중 시 행동력 500 회복','en'));
 assert.notEqual(translate('[침투] 적중 시 행동력 500 회복','en','13360010'),officialText['13360010'].en);
 const num=s=>(s.replace(/(?<=\d),(?=\d{3})/g,'').match(/\d+(?:\.\d+)?/g)||[]).sort();
 let used=0;for(const file of readdirSync('lib/data/catalogs').filter(f=>f.endsWith('.json')))for(const skill of JSON.parse(readFileSync('lib/data/catalogs/'+file,'utf8')).skills)for(const spec of skill.specializations)for(const locale of ['en','ja']){const out=translate(spec.description,locale,spec.id);assert.deepEqual(num(out),num(spec.description),spec.id+' '+locale);if(officialText[spec.id]?.[locale]){used++;assert.equal(officialText[spec.id].ko,spec.description);assert.equal(out,officialText[spec.id][locale]);}}
 console.log(`Official specialization text: ${used} en/ja entries used by id, numbers equal to the Korean catalog PASS`);}
