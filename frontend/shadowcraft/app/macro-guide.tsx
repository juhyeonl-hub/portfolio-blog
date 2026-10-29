import type {Catalog} from '../lib/planner';
import type {ClassProfile} from '../lib/classes';
import purposes from '../lib/data/manual-skill-purpose.json';
import {SkillHover} from './skill-tip';
import {useLocale} from './locale';
const purpose=purposes as Record<string,string>;
export default function MacroGuide({profile,catalog,extra=false,onExtra}:{profile:ClassProfile;catalog:Catalog;extra?:boolean;onExtra?:(value:boolean)=>void}){
 const {t,skill:skillName}=useLocale();
 const columns=profile.key==='assassin'?[{skills:['13010000']},{skills:['13130000','13350000',...(extra?['13060000']:[])]}]:profile.macroColumns||[];
 const manual=[...new Set([...profile.movement,...profile.manual,...(profile.key==='assassin'?['13100000',...(!extra?['13060000']:[])]:[])])];
 const keys=['Q','E','R','F','Z','X','C','V','G','T','Y','H','J','K'];
 function icon(id:string){const s=catalog.skills.find(x=>x.id===id);return s?<SkillHover skill={s}><img src={'/shadowcraft/game'+s.iconPath} alt={skillName(s.name)}/><span>{skillName(s.name)}</span></SkillHover>:null;}
 return <section className="visual-macro"><h2>{t('게임 퀵슬롯 배치 예시')}</h2><p>{t('숫자 키 바로 위의 세로줄에 공격을 배치하세요. 맨 아래 칸부터 위로 확인합니다. 키는 예시이며 게임 설정에 맞게 바꾸세요.')}</p><div className="panel"><h3>{t('반복 공격 배치')}</h3>{columns.length?<><div className="quickslot-grid">{columns.map((col,i)=><div className="quickslot-column" key={i}>{[3,2,1,0].map(row=><div className={'quickslot-cell'+(col.skills[row]?' filled':'')} key={row}>{col.skills[row]?icon(col.skills[row]):<span aria-hidden="true">·</span>}<small>{col.skills[row]?t(row===0?'먼저 확인':'그다음 {0}',[row]):t('비워 두는 칸')}</small></div>)}<kbd>{i+1}</kbd></div>)}</div><p>{t('↑ 각 세로줄은 맨 아래부터 확인 · 사용 가능한 스킬이 실행됩니다. 연속 콤보를 보장하는 순서가 아닙니다.')}</p></>:<p>{t('이 직업은 검증된 반복 배치가 없어 자동 공격 배치를 제안하지 않습니다. 아래 기술을 개별 키로 사용하세요.')}</p>}{profile.key==='assassin'&&<p>{t('반복 매크로 입력 예시: 2번 키 → 1번 키 · 각 10ms. 지연은 시작값이며 실제 게임에서 확인하세요.')}</p>}{profile.key==='assassin'&&onExtra&&<label className="toggle-line"><input type="checkbox" checked={extra} onChange={e=>onExtra(e.target.checked)}/>{t('기습도 반복에 포함')}</label>}<p className="subtle">{t('이동·회복·충전·생존 기술은 반복 공격 세로줄에 넣지 마세요. 쉬운 적에게 먼저 시험하고 위험하면 매크로 키를 놓으세요.')}</p></div><div className="panel"><h3>{t('필요할 때 직접 누르는 키')}</h3><p>{t('아래 키는 반복 공격과 별도로 배치하세요. 각 스킬의 사용 상황을 보고 직접 누릅니다.')}</p><div className="manual-key-grid">{manual.map((id,i)=><article key={id}><kbd>{keys[i]||'Shift '+(i-keys.length+1)}</kbd>{icon(id)}<p>{t(purpose[id]||'게임의 스킬 설명에서 발동 조건을 확인한 뒤 직접 사용하세요.')}</p></article>)}</div></div></section>;
}
