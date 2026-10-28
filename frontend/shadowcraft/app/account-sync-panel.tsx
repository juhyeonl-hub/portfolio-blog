import {TradeConflictPanel} from './trade-data-tools';
import {createContext,useContext} from 'react';
import type {SyncMetadata,SyncState} from '../lib/account-settings';
import {useLocale} from './locale';

export const AccountSyncContext=createContext<{status:SyncState;metadata:SyncMetadata|null;refresh:()=>void}|null>(null);
export function AccountSyncPanel(){
 const sync=useContext(AccountSyncContext),{t,locale}=useLocale();
 if(!sync)return null;
 const {status,metadata,refresh}=sync;
 const format=(date:string|number)=>new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'medium'}).format(new Date(date));
 return <section className="account-sync-panel" aria-label={t('기기 간 설정 동기화')}>
  <h3>{t('기기 간 설정 동기화')}</h3>
  <p>{t('PC와 모바일에서 같은 Steam 계정으로 로그인하면 아래 설정을 이어서 사용할 수 있습니다.')}</p>
  <div className="account-sync-summary" role="status">
   <strong>{t(status==='full'?'계정 저장 한도 1MB 초과 · 이 기기 기록 보관 중':status==='conflict'?'두 기기의 거래 기록 확인 필요':status==='offline'?'동기화 실패 · 이 기기의 변경은 보관 중':status==='loading'?'다른 기기의 설정 확인 중…':status==='pending'?'계정에 저장 중…':'계정과 동기화됨')}</strong>
   <dl><div><dt>{t('마지막 계정 저장')}</dt><dd>{metadata?.savedAt?<time dateTime={metadata.savedAt}>{format(metadata.savedAt)}</time>:t('아직 저장 시각을 확인하지 못했습니다.')}</dd></div>
    <div><dt>{t('이 기기의 마지막 확인')}</dt><dd>{metadata?.checkedAt?<time dateTime={new Date(metadata.checkedAt).toISOString()}>{format(metadata.checkedAt)}</time>:t('확인 전')}</dd></div></dl>
  </div>
  <TradeConflictPanel/>
  {status==='offline'&&<button type="button" className="button secondary" onClick={refresh}>{t('설정 동기화 다시 시도')}</button>}
  <p className="muted">{t('변경한 설정은 자동 저장됩니다. 화면으로 돌아오거나 사용 중일 때 약 10초마다 다른 기기의 변경을 확인합니다. 입력을 마치면 새 설정을 반영합니다.')}</p>
  {metadata?.conflict&&<p role="status" className="muted">{t('두 기기에서 같은 항목을 수정해 이 기기의 변경을 유지했습니다. 현재 설정을 확인해 주세요.')}</p>}
  <div className="account-sync-columns"><div><h4>{t('계정에 저장되는 항목')}</h4><ul>
   <li>{t('직업별 빌드 배분 · 레벨 · 포인트 총량과 확인한 남은 포인트')}</li>
   <li>{t('품목별 거래 장부 · 저장한 제작 계획')}</li>
   <li>{t('콘텐츠 타이머의 서버 · 고정 항목 · 시간 설정')}</li>
   <li>{t('지도에서 완료 표시한 위치 · 즐겨찾기 · 언어')}</li>
  </ul></div><div><h4>{t('이 기기에만 남는 항목')}</h4><ul>
   <li>{t('빌드 보관함에 따로 저장한 빌드')}</li>
   <li>{t('캐릭터 성장 기록 · 계산기 입력 · 저장하지 않은 제작 초안')}</li>
   <li>{t('조회한 캐릭터 정보 · 검색 기록 · 장비 이름과 개인 메모')}</li>
  </ul><p>{t('다른 기기에서 실제 사용 포인트를 보려면 캐릭터를 다시 연결하세요.')}</p></div></div>
 </section>;
}
