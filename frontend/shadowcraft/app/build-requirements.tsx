import type {Catalog,Plan} from '../lib/planner';
import {totals,pointBudgetSourceLabel,unmetAscensionSkills} from '../lib/planner';
import {useLocale} from './locale';
export default function BuildRequirements({catalog,plan}:{catalog:Catalog;plan:Plan}){
 const {t}=useLocale(),budget=totals(catalog,plan);
 const rows=[['스킬 포인트',budget.sp,budget.spMax],['스티그마 포인트',budget.stigma,budget.stigmaMax],['데바니온 포인트',budget.crystal,budget.crystalMax],['아스펠 결정',budget.battle,budget.battleMax],['아리엘 결정',budget.ariel,budget.arielMax]] as const;
 return <section className="build-requirements" aria-label={t('이 배분에 필요한 포인트')}><h3>{t('이 배분에 필요한 포인트')}</h3><p>{t('배분에 실제로 쓰는 포인트입니다. 작성자의 총량 설정과 구분해서 게임에 표시된 내 총량과 비교하세요.')}</p><dl className="build-requirement-grid">{rows.map(([label,used,total])=><div key={label}><dt>{t(label)}</dt><dd><strong>{used}</strong><span>{t('작성자 총량 {0}',[total])}</span>{used>total&&<span className="requirement-warning" role="status">{t('총량보다 {0}포인트 초과',[used-total])}</span>}</dd></div>)}</dl><p className="subtle">{t(pointBudgetSourceLabel(plan))}</p>{unmetAscensionSkills(catalog,plan).length>0&&<p className="requirement-warning" role="status">{t('승급 확인이 필요한 스킬이 포함되어 있습니다. 게임에서 해금 조건을 확인하세요.')}</p>}</section>;
}
