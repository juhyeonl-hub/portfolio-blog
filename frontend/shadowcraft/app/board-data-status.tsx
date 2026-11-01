import type {Catalog} from '../lib/planner';
import {useLocale} from './locale';
export type BoardRefresh={enabled?:boolean;ok?:boolean;checkedAt?:string;lastSuccess?:string;reason?:string};
export default function BoardDataStatus({catalog,status}:{catalog:Catalog;status:BoardRefresh}){
 const {t,locale}=useLocale();const skills=catalog.skillDataCheck,boards=catalog.boardDataCheck;
 const skillCount=(skills?.added||0)+(skills?.removed||0)+(skills?.changedRules||0),boardCount=(boards?.added||0)+(boards?.removed||0)+(boards?.changedRules||0);
 const pending=!!(skills?.needsReview||boards?.needsReview||status.reason?.endsWith('needs-review')||status.reason==='review-required');
 const reason=status.reason==='source-unavailable'?t('원본 사이트에 연결하지 못했습니다.'):status.reason==='response-too-large'?t('원본 데이터 크기가 달라져 자동 반영을 멈췄습니다.'):status.reason?.endsWith('needs-review')?t('새 스킬이나 삭제된 노드가 있어 검토가 필요합니다.'):t('원본 데이터 형식이 달라졌거나 검증을 통과하지 못했습니다.');
 const date=(value?:string)=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString(locale==='ko'?'ko-KR':locale):t('아직 확인 전');
 return <div className="board-data-status">
 {(pending||status.ok===false)&&<p className="point-diagnostics" role="status"><strong>{t(pending?'게임 데이터 변경 검토 중':'최근 데이터 확인 실패')}</strong><br/>{status.ok===false?reason:t('비용·해금·효과 변경은 검토 후 반영합니다. 현재는 마지막으로 검증한 계산을 사용합니다.')}{status.ok===false&&<> {t('기존 데이터와 내 빌드는 유지됩니다.')}</>}</p>}
 <details><summary>{t('보드 데이터 정보')}</summary><p>{t(status.enabled?'6시간마다 원본을 확인합니다. 이름·아이콘만 자동 갱신하며, 비용·효과·새 노드는 검토 후 반영합니다.':'검증한 데이터를 표시합니다. 이 환경에서는 자동 확인이 꺼져 있습니다.')}</p>
 <dl><div><dt>{t('최근 확인')}</dt><dd>{date(status.checkedAt)}</dd></div><div><dt>{t('최근 정상 확인')}</dt><dd>{date(status.lastSuccess)}</dd></div></dl>
 {pending&&skillCount+boardCount>0&&<p>{t('검토할 변경: 스킬 {0}개 · 보드 {1}개',[skillCount,boardCount])}</p>}
 <p>{t('새 데이터가 확인되어도 직접 수정한 배분을 자동으로 바꾸지 않습니다.')}</p></details></div>;
}
