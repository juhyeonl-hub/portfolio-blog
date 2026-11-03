import './macro-guide.css';
import ManualSkillGuide from './manual-skill-guide';
import {TEMPLAR_BASIC} from '../lib/macro-evidence';
import {macroLayout,QUICK_KEYS} from '../lib/macro-layout';
import {useState} from 'react';
import type {Catalog} from '../lib/planner';
import type {ClassProfile} from '../lib/classes';
import purposes from '../lib/data/manual-skill-purpose.json';
import {SkillHover} from './skill-tip';
import {useLocale} from './locale';
const purpose=purposes as Record<string,string>;
export default function MacroGuide({profile,catalog,extra=false,onExtra,purpose:context='pve'}:{profile:ClassProfile;catalog:Catalog;extra?:boolean;purpose?:'pve'|'pvp'|'leveling';onExtra?:(value:boolean)=>void}){
 const {t,skill:skillName}=useLocale();const [chosen,setChosen]=useState('');
 const {fixedId,templar,columns,steps,manual,manualKeys}=macroLayout(profile,new Set(catalog.skills.map(s=>s.id)),context,extra);
 const capacity=manualKeys.length;
 const manualSlots=new Map(manual.map((id,i)=>[(Math.floor(i/capacity)*QUICK_KEYS.length)+QUICK_KEYS.findIndex(key=>key===manualKeys[i%capacity]),id]));
 const fixed=catalog.skills.find(s=>s.id===fixedId);
 const selected=catalog.skills.find(s=>s.id===(chosen||manual[0]));
 const keyLabel=(key:string)=>key==='LMB'?t('좌클릭'):key;
 function icon(id:string,key?:string){const s=catalog.skills.find(s=>s.id===id);return s?<button type="button" className="macro-skill-icon" onClick={()=>setChosen(s.id)} aria-label={skillName(s.name)} aria-pressed={chosen===s.id}><img src={'/shadowcraft/game'+s.iconPath} alt=""/>{key&&<kbd>{keyLabel(key)}</kbd>}</button>:null;}
 function cell(row:number,col:number){const column=columns.find(c=>c.key===QUICK_KEYS[col]);const automatic=!!column;const id=column?column.skills[row]:manualSlots.get(row*QUICK_KEYS.length+col);const s=catalog.skills.find(s=>s.id===id);return <div className={'game-slot '+(s?'filled ':'')+(automatic?'repeat-slot':'manual-slot')} key={col}>{s?<button type="button" onClick={()=>setChosen(s.id)} aria-label={t('{0} · {1}행 {2}번 칸',[skillName(s.name),row,col+1])} aria-pressed={chosen===s.id}><SkillHover skill={s}><img src={'/shadowcraft/game'+s.iconPath} alt=""/></SkillHover><span className="slot-mode" aria-hidden="true">{automatic?'↻':'•'}</span></button>:<span aria-hidden="true">·</span>}</div>}
 return <section className="visual-macro">
  <h2>{t('게임 퀵슬롯 배치 예시')}</h2>
  <div className="macro-control-basis"><strong>{t('PC · AION2 조작 모드 기준')}</strong><p>{t('AION1 조작 모드용 배치가 아닙니다. 좌클릭은 고정이며 다른 키로 옮기지 않습니다.')}</p></div>
  <p>{t('직접 사용은 1~4·Q·E부터, 매크로는 5~8에 배치합니다. 세로줄은 0행부터 위로 확인하세요.')}</p>
  {templar&&<p className="macro-evidence"><a href={TEMPLAR_BASIC.source} target="_blank" rel="noreferrer">{t('공개 가이드의 기본 반복 예시 · 45레벨 PvE')}</a> · <time dateTime={TEMPLAR_BASIC.checkedAt}>{TEMPLAR_BASIC.checkedAt}</time><br/>{t('게임 내 동작을 검증한 배치는 아닙니다. 쉬운 적에게 먼저 확인하세요.')}</p>}
  <div className="game-macro-workbench">
   <div className="panel game-hotbar-panel">
    <h3>{t('퀵슬롯')}</h3>
    {fixed&&<div className="macro-fixed-slot">{icon(fixed.id,'LMB')}<div><strong>{skillName(fixed.name)}</strong><span>{t('좌클릭 · 고정 슬롯')}</span><small>{t('다른 키로 이동 불가')}</small></div></div>}
    <div className="game-hotbar macro-hotbar" aria-label={t('게임 퀵슬롯 배치 예시')}>
     {[3,2,1,0].map(row=><div className="game-slot-row" key={row}>{QUICK_KEYS.map((_,col)=>cell(row,col))}<span className="slot-row-number">{row}</span></div>)}
     <div className="game-key-row">{QUICK_KEYS.map(key=><kbd className={columns.some(c=>c.key===key)?'repeat-key':''} key={key}>{key}</kbd>)}</div>
    </div>
    <p className="game-slot-legend"><span>↻ {t('반복 공격')}</span><span>• {t('직접 사용')}</span></p>
    <p className="subtle">{t('아이콘을 누르면 스킬과 사용 상황을 확인할 수 있습니다. 위쪽 행에 둔 수동 기술은 게임에서 개별 키를 지정하세요.')}</p>
    {selected&&<div className="game-slot-detail phone-node-details"><img src={'/shadowcraft/game'+selected.iconPath} alt=""/><div><strong>{skillName(selected.name)}</strong><p>{t(purpose[selected.id]||'게임의 스킬 설명에서 발동 조건을 확인한 뒤 직접 사용하세요.')}</p></div></div>}
   </div>
   <aside className="panel game-macro-steps">
    <h3>{t('스킬 매크로')}</h3>
    {steps.length?<><p>{t('번호 순서대로 키를 등록하세요. 큰 아이콘은 해당 키의 0행 스킬입니다.')}</p>
     <ol className="macro-icon-steps">{steps.map((input,step)=>{
      const base=catalog.skills.find(s=>s.id===input.skills[0])!;
      return <li key={step}><span className="macro-step-number">{step+1}</span><div className="macro-step-content">
       {icon(base.id,input.key)}<strong>{skillName(base.name)}</strong><span className="macro-step-key">{keyLabel(input.key)}{input.fixed?' · '+t('고정'):''}</span>
       {input.skills.length>1&&<div className="macro-column-preview"><small>{t('세로줄 · 0행부터')}</small><div>{input.skills.map((id,i)=><span className="macro-column-node" key={id}>{i>0&&<b aria-hidden="true">↑</b>}{icon(id)}<small>{i}</small></span>)}</div></div>}
       {step<steps.length-1&&<div className="macro-step-delay"><span>{t('지연')}</span><b>{profile.key==='assassin'?'10 ms':t('게임 설정값')}</b><span aria-hidden="true">↓</span></div>}
      </div></li>;
     })}</ol><p className="subtle">{t('세로줄의 스킬은 사용 가능 여부에 따라 실행되며, 모두 연속 실행되는 콤보가 아닙니다.')}</p></>:<p className="macro-unverified">{t('이 직업은 검증된 반복 배치가 없어 자동 공격 배치를 제안하지 않습니다. 아래 기술을 개별 키로 사용하세요.')}</p>}
    {profile.key==='assassin'&&<p>{t('10ms는 기존 예시의 시작값입니다. 실제 게임에서 확인하세요.')}</p>}
    {profile.key==='assassin'&&onExtra&&<label className="toggle-line"><input type="checkbox" checked={extra} onChange={e=>onExtra(e.target.checked)}/>{t('기습도 반복에 포함')}</label>}
    <p className="subtle">{t('이동·회복·충전·생존 기술은 반복 공격 세로줄에 넣지 마세요. 쉬운 적에게 먼저 시험하고 위험하면 매크로 키를 놓으세요.')}</p>
   </aside>
  </div>
  <ManualSkillGuide profile={profile} catalog={catalog} manualSlots={manualSlots} columns={columns} fixedId={fixedId} context={context}/>
 </section>;
}
