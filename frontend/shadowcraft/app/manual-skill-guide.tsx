import type {Catalog} from '../lib/planner';
import type {ClassProfile} from '../lib/classes';
import {QUICK_KEYS,type MacroInput} from '../lib/macro-layout';
import purposes from '../lib/data/manual-skill-purpose.json';
import {useLocale} from './locale';
const purpose=purposes as Record<string,string>;
const rangerHold:Record<string,string>={
 '14090000':'이동할 방향이 위험하면 먼저 방향을 바꾸세요.',
 '14010000':'회피가 급하면 충전보다 생존을 우선하세요.',
 '14310000':'적이 곧 죽거나 공격할 수 없는 구간이 오면 다음 기회까지 아끼세요.',
 '14220000':'적이 곧 죽거나 공격할 수 없는 구간이 오면 다음 기회까지 아끼세요.',
 '14380000':'적이 곧 죽거나 공격할 수 없는 구간이 오면 다음 기회까지 아끼세요.',
 '14070000':'공격 순서에 억지로 끼워 넣지 말고, 필요한 제어·대응 상황에 사용하세요.',
 '14170000':'공격 순서에 억지로 끼워 넣지 말고, 필요한 제어·대응 상황에 사용하세요.',
 '14260000':'공격 순서에 억지로 끼워 넣지 말고, 필요한 제어·대응 상황에 사용하세요.'
};
export default function ManualSkillGuide({profile,catalog,manualSlots,columns,fixedId,context}:{profile:ClassProfile;catalog:Catalog;manualSlots:Map<number,string>;columns:MacroInput[];fixedId?:string;context:string}){
 const {t,skill:skillName}=useLocale();
 const bindings=[...manualSlots].map(([slot,id])=>({id,key:QUICK_KEYS[slot%QUICK_KEYS.length],row:Math.floor(slot/QUICK_KEYS.length)}));
 const flow=context==='pve'?profile.rotation:[];
 function keyFor(id:string){
  if(id===fixedId)return t('좌클릭');
  const manual=bindings.find(b=>b.id===id);
  if(manual)return manual.row?t('별도 키 지정'):manual.key;
  return columns.find(c=>c.skills.includes(id))?.key;
 }
 function tag(id:string){const skill=catalog.skills.find(s=>s.id===id);if(!skill)return null;const key=keyFor(id),needsKey=bindings.some(b=>b.id===id&&b.row>0);return <span className="manual-flow-skill" key={id}><span className="manual-guide-icon"><img src={'/shadowcraft/game'+skill.iconPath} alt=""/>{key&&<kbd aria-label={needsKey?t('별도 키 지정'):undefined}>{needsKey?'?':key}</kbd>}</span><span>{skillName(skill.name)}</span></span>;}
 return <section className="manual-usage-guide" aria-label={t('수동 스킬 사용 가이드')}>
  <h2>{t('수동 스킬 사용 가이드')}</h2>
  <p>{t('아이콘과 키를 보고 사용 시점을 확인하세요. 아래 흐름은 모든 스킬을 차례대로 누르는 고정 콤보가 아닙니다.')}</p>
  {flow.length>0?<><h3>{t('PvE 보스전 사용 흐름')}</h3><ol className="manual-use-flow">{flow.map((stage,index)=><li key={index}><span className="manual-flow-number">{index+1}</span><div><h4>{t(stage.title)}</h4><p>{t(stage.body)}</p><div className="manual-flow-icons">{stage.ids.map(tag)}</div></div></li>)}</ol></>:<p className="macro-unverified">{t('이 목적에 대해 검증된 고정 순서는 없습니다. 아래 상황별 사용법을 참고하세요.')}</p>}
  <div className="manual-usage-cards">{bindings.map(binding=>{
   const skill=catalog.skills.find(s=>s.id===binding.id);if(!skill)return null;
   const stageIndex=flow.findIndex(stage=>stage.ids.includes(binding.id));
   const hold=profile.key==='ranger'?rangerHold[binding.id]:undefined;
   return <article className="manual-usage-card" key={binding.id}>
    <header>{tag(binding.id)}{binding.row>0&&<small>{t('{0}행 · {1}키 세로줄 · 별도 키 지정 필요',[binding.row,binding.key])}</small>}</header>
    <dl><dt>{t('사용 시점')}</dt><dd>{t(purpose[binding.id]||'게임의 스킬 설명에서 발동 조건을 확인한 뒤 직접 사용하세요.')}</dd>
     <dt>{t('사용 순서')}</dt><dd>{stageIndex>=0?t('{0}단계 · {1}',[stageIndex+1,t(flow[stageIndex].title)]):t('상황이 생겼을 때')}</dd>
     {hold&&<><dt>{t('아껴야 할 때')}</dt><dd>{t(hold)}</dd></>}
    </dl>
   </article>;
  })}</div>
  <h2>{t('어떤 방식으로 사용할까요?')}</h2>
  <div className="macro-method-comparison">
   <article className="macro-method-current"><h3>{t('수동 병행 · 현재 배치')}</h3><p>{columns.length?t('반복 공격은 매크로로, 수동으로 표시된 버프·대응기는 필요한 순간에 직접 사용합니다.'):t('이 직업은 검증된 반복 배치가 없어 자동 공격 배치를 제안하지 않습니다. 아래 기술을 개별 키로 사용하세요.')}</p><p>{t('보스 패턴에 맞춰 버프와 대응기를 아낄 수 있습니다. 직접 눌러야 할 키는 늘어납니다.')}</p></article>
   <article><h3>{t('공격·버프 통합 · 편의성 우선')}</h3><p>{t('조작은 줄지만, 버프를 원하지 않는 시점에 소모할 수 있습니다. 모든 스킬을 넣는 배치는 검증되지 않았습니다.')}</p><p>{t('충전·이동·생존기는 수동으로 남기는 것을 권장합니다.')}</p></article>
  </div>
  <p className="macro-method-advice">{t('익숙해지는 동안에는 현재 수동 병행 방식을 권장합니다. 편의성이 중요하다면 일반 공격부터 묶고 버프는 하나씩 시험하세요.')}</p>
  <p className="subtle">{t('이 비교는 방식 선택을 위한 안내입니다. 현재 키 배치나 게임 설정을 바꾸지 않습니다.')}</p>
 </section>;
}
