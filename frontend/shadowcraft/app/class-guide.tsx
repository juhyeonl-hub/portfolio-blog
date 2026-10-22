import MacroGuide from './macro-guide';
'use client';
import {Info} from 'lucide-react';
import {type Catalog} from '@/lib/planner';
import {type ClassProfile} from '@/lib/classes';
import {useLocale} from './locale';
function SkillTag({id,catalog}:{id:string;catalog:Catalog}){const {skill:localSkill}=useLocale();const s=catalog.skills.find(s=>s.id===id);return s?<span className="guide-skill"><img src={'/shadowcraft/game'+s.iconPath} alt=""/>{localSkill(s.name)}</span>:null}
export default function ClassGuide({profile,catalog,tab}:{profile:ClassProfile;catalog:Catalog;tab:string}){
 const {t}=useLocale();
 if(tab==='rotation')return <><div className="section-heading"><div><h2>{t('{0} 보스전 운영',[t(profile.name)])}</h2><p>{t(profile.summary)}</p></div></div><div className="class-rotation">{profile.rotation.map((step,i)=><article className="panel" key={i}><span className="big-number">{String(i+1).padStart(2,'0')}</span><h3>{t(step.title)}</h3><p>{t(step.body)}</p><div className="guide-skills">{step.ids.map(id=><SkillTag key={id} id={id} catalog={catalog}/>)}</div></article>)}</div><div className="notice violet-notice"><Info size={16}/>{t('현재 글로벌 가이드의 보스·파티 역할을 기준으로 정리했습니다. 탱킹·회복·차징은 보스 패턴에 맞춰 직접 판단하세요.')}</div></>;
 return <MacroGuide profile={profile} catalog={catalog}/>;
}
