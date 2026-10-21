import {useLocale} from './locale';
import {SkillHover} from './skill-tip';
import {useEffect,useState} from 'react';
import {decodeShare,encodeShare,publicBuild,validateReferences,type SharedBuild} from '../lib/build-share';
import {loadBundledCatalog} from '../lib/catalog-loaders';
import {classProfile} from '../lib/classes';
import {finalLevel,totals,type Catalog,type Plan,MODE_NAMES} from '../lib/planner';
export function ShareBuildPanel({catalog,plan}:{catalog:Catalog;plan:Plan}) {
 const {t}=useLocale();
 const [link,setLink]=useState(''),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 function create(){try{setLink(location.origin+location.pathname+encodeShare(publicBuild(catalog,plan)));setError('');setCopied(false);}catch(e){setLink('');setError(e instanceof Error?e.message:'공유 링크 생성 실패');}}
 return <section className="card" aria-label={t("빌드 링크 공유")}><h2>{t("빌드 링크 공유")}</h2><p>{t("현재 스킬·특화·데바니온·포인트 배분을 공유합니다. 캐릭터와 검색 기록, 장비 이름·메모는 제외합니다. 장비 효과는 선택된 장비의 스킬 보너스 합계로 고정합니다.")}</p><button className="button primary" onClick={create}>{t("현재 배분 공유 링크 만들기")}</button>{error&&<p role="alert">{t(error)}</p>}{link&&<><p>{t("생성 당시의 배분입니다. 이후 수정은 새 링크를 만들어야 반영됩니다. 링크를 가진 사람은 내용을 볼 수 있습니다.")}</p><label>{t("공유 링크")}<textarea aria-label={t("공유 링크")} readOnly value={link} rows={3} style={{width:'100%',overflowWrap:'anywhere'}} onFocus={e=>e.target.select()}/></label><button className="button ghost" onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(true);setError('');}catch{setError('자동 복사가 허용되지 않았습니다. 링크를 선택해 직접 복사하세요.');}}}>{t("공유 링크 복사")}</button><a className="button ghost" href={link} target="_blank" rel="noreferrer">{t("공유 화면 미리보기")}</a>{copied&&<p role="status">{t("공유 링크를 복사했습니다.")}</p>}</>}</section>;
}
/** A shared build waiting to be applied by the planner (session only; the planner validates it like an imported file). */
export const PENDING_SHARED_PLAN='asbc-pending-shared-plan';
export function readPendingShared():{plan:Plan}|null{try{const raw=sessionStorage.getItem(PENDING_SHARED_PLAN);if(!raw||raw.length>150000)return null;const x=JSON.parse(raw);return x&&x.schema==='shadowcraft-v1'&&x.plan&&typeof x.plan.classKey==='string'?x:null;}catch{return null;}}
function download(shared:SharedBuild){const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'shadowcraft-v1',catalogVersion:shared.catalogVersion,plan:shared.plan})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='a2bc-shared-'+shared.plan.classKey+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export default function SharedBuildView({hash}:{hash:string}) {
 const {t,specialization,skill:localSkill,node:localNode}=useLocale();
 const [state,setState]=useState<{shared:SharedBuild;catalog:Catalog}|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let live=true;setState(null);setError('');try{const shared=decodeShare(hash);loadBundledCatalog(shared.plan.classKey!).then(catalog=>{validateReferences(shared,catalog);if(live)setState({shared,catalog});}).catch(e=>{if(live)setError(e instanceof Error?e.message:'직업 데이터를 읽지 못했습니다.');});}catch(e){setError(e instanceof Error?e.message:'공유 링크 오류');}return()=>{live=false;};},[hash,retry]);
 const budget=state?totals(state.catalog,state.shared.plan):null;
 return <main style={{maxWidth:1000,margin:'0 auto',padding:20}}><section className="card" aria-label={t("공유 빌드 읽기 전용")}><h1>{t("공유 빌드")}</h1><p>{t("읽기 전용 미리보기입니다. 내 브라우저의 저장된 빌드는 변경하지 않습니다.")}</p><a href={location.pathname}>{t("내 플래너 열기")}</a>{error?<><p role="alert">{t(error)}</p><button className="button ghost" onClick={()=>setRetry(v=>v+1)}>{t("공유 빌드 다시 확인")}</button></>:!state?<p role="status">{t("공유 빌드를 읽는 중…")}</p>:<>
 <h2>{t(classProfile(state.shared.plan.classKey).name)} · Lv.{state.shared.plan.level}</h2><p>{t(MODE_NAMES[state.shared.plan.mode]||'공격형')} · {t('공유 데이터 {0} · 현재 데이터 {1}',[state.shared.catalogVersion,state.catalog.version])}</p>
 {state.shared.catalogVersion!==state.catalog.version&&<p role="status">{t("데이터 버전이 다릅니다. 아래 레벨·비용은 현재 데이터로 계산되므로 공유 당시와 다를 수 있습니다.")}</p>}
 <p>{t("장비는 스킬 보너스 합계로 반영되어 있습니다. 캐릭터와 장비 목록은 포함하지 않습니다. 게임에서의 유효성·최적 배분을 보증하는 기능은 아닙니다.")}</p>
 <p>{t('승급 3단계 확인')}: {t(state.shared.plan.ascensionGrade3Confirmed?'확인됨':'확인 전')}</p>
 {budget&&<ul aria-label={t("공유 포인트 사용량")}>{[['스킬',budget.sp,budget.spMax],['스티그마',budget.stigma,budget.stigmaMax],['데바니온',budget.crystal,budget.crystalMax],['PvP',budget.battle,budget.battleMax]].map(([name,used,max])=><li key={name}>{t(name)}: {used} / {max}{Number(used)>Number(max)?' · '+t('예산 초과'):''}</li>)}</ul>}
 <div className="shared-actions"><button className="button primary" onClick={()=>{try{sessionStorage.setItem(PENDING_SHARED_PLAN,JSON.stringify({schema:'shadowcraft-v1',catalogVersion:state.shared.catalogVersion,plan:state.shared.plan}));location.hash='';}catch{setError('이 브라우저에 임시 저장하지 못했습니다. JSON을 받아 플래너에서 불러오세요.');}}}>{t("내 플래너에 적용")}</button><button className="button ghost" onClick={()=>download(state.shared)}>{t("공유 빌드 JSON 받기")}</button></div><p>{t("적용하면 이 직업의 현재 계획이 공유 빌드로 바뀝니다. 적용한 뒤 바로 되돌릴 수 있고, 미리 보관함에 저장해 둘 수도 있습니다.")}</p>
 <h2>{t("스킬과 특화")}</h2><div className="database-list">{state.catalog.skills.map(s=><div key={s.id}><SkillHover skill={s} level={finalLevel(state.catalog,state.shared.plan,s)}><strong>{localSkill(s.name)}</strong></SkillHover><p>{t('기본 {0} · 장비 +{1} · 최종 {2}',[state.shared.plan.base[s.id]??(s.stigma?0:1),state.shared.plan.bonus[s.id]||0,finalLevel(state.catalog,state.shared.plan,s)])}</p><p>{(state.shared.plan.specs[s.id]||[]).map(id=>specialization(s.specializations.find(x=>x.id===id)?.description||id,id)).join(' / ')||t('선택한 특화 없음')}</p></div>)}</div>
 <h2>{t("선택한 데바니온")}</h2>{state.catalog.boards.map(board=>{const nodes=board.nodes.filter(n=>state.shared.plan.nodes.includes(n.id));return <details key={board.id}><summary>{t(board.name)} ({t('{0}개',[nodes.length])})</summary><ul>{nodes.map(n=><li key={n.id}>{localNode(n.name)} · ID {n.id} · {t('{0}포인트',[n.pointCost])}</li>)}</ul></details>;})}
 </>}</section></main>;
}
