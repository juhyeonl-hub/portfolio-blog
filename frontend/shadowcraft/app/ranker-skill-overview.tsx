import {rankerSkillRows} from '../lib/ranker-builds';
import {rankerText} from '../lib/ranker-comparison-text';
import type {Catalog,Plan} from '../lib/planner';
import {useLocale} from './locale';
import {SkillHover} from './skill-tip';
export default function RankerSkillOverview({catalog,plan,skills}:{catalog:Catalog;plan:Plan;skills:unknown}){
 const {locale,t,skill:name}=useLocale();
 const copy=(key:Parameters<typeof rankerText>[1])=>rankerText(locale,key);
 const rows=rankerSkillRows(catalog,plan.character?.classKey===catalog.classKey?plan.character.skills:undefined,skills);
 const groups=[{key:'active',label:'액티브',rows:rows.filter(r=>!r.skill.stigma&&r.skill.kind==='active')},{key:'passive',label:'패시브',rows:rows.filter(r=>!r.skill.stigma&&r.skill.kind==='passive')},{key:'stigma',label:'스티그마',rows:rows.filter(r=>r.skill.stigma)}];
 return <section className="ranker-skill-overview" aria-label={copy('skills')}><h3>{copy('skills')}</h3><p>{copy('skillHelp')}</p><p className="subtle">{copy('noSkills')}</p>{groups.map(group=><section key={group.key}><h4>{t(group.label)}</h4><div className="ranker-skill-cards">{group.rows.map(row=><article key={row.skill.id} className={'ranker-skill-card '+(row.ranker===null?'unknown':'')}>
  <SkillHover skill={row.skill} level={row.ranker??undefined} role={copy('reference')}><img src={'/shadowcraft/game'+row.skill.iconPath} alt="" loading="lazy"/><strong>{name(row.skill.name)}</strong></SkillHover>
  <dl><div><dt>{copy('ranker')}</dt><dd>{row.ranker===null?'—':'Lv.'+row.ranker}</dd></div><div><dt>{copy('mine')}</dt><dd>{row.mine===null?'—':'Lv.'+row.mine}</dd></div></dl>
  <small>{row.difference===null?copy('unknown'):copy('difference')+' '+(row.difference>0?'+':'')+row.difference}</small>
  {row.equipped!==null&&<span className={'ranker-equipped '+(row.equipped?'equipped':'')}>{t(row.equipped?'장착':'미장착')}</span>}
 </article>)}</div></section>)}</section>;
}
