import {createContext,useContext} from 'react';
import type {SyncMetadata,SyncState} from '../lib/account-settings';
import {useLocale} from './locale';

export const AccountSyncContext=createContext<{status:SyncState;metadata:SyncMetadata|null;refresh:()=>void}|null>(null);
export function AccountSyncPanel(){
 const sync=useContext(AccountSyncContext),{t,locale}=useLocale();
 if(!sync)return null;
 const {status,metadata,refresh}=sync,busy=status==='pending'||status==='loading';
 const format=(date:string|number)=>new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'medium'}).format(new Date(date));
 return <section className="account-sync-panel" aria-label={t('기기 간 설정 동기화')}>
  <h3>{t('기기 간 설정 동기화')}</h3>
  <p>{t('PC와 모바일에서 같은 Steam 계정으로 로그인하면 아래 설정을 이어서 사용할 수 있습니다.')}</p>
  <div className="account-sync-summary" role="status">
   <strong>{t(status==='offline'?'동기화 실패 · 이 기기의 변경은 보관 중':status==='loading'?'다른 기기의 설정 확인 중…':status==='pending'?'계정에 저장 중…':'계정과 동기화됨')}</strong>
   <dl><div><dt>{t('마지막 계정 저장')}</dt><dd>{metadata?.savedAt?<time dateTime={metadata.savedAt}>{format(metadata.savedAt)}</time>:t('아직 저장 시각을 확인하지 못했습니다.')}</dd></div>
    <div><dt>{t('이 기기의 마지막 확인')}</dt><dd>{metadata?.checkedAt?<time dateTime={new Date(metadata.checkedAt).toISOString()}>{format(metadata.checkedAt)}</time>:t('확인 전')}</dd></div></dl>
  </div>
  <button type="button" className="button secondary" disabled={busy} onClick={refresh}>{t(status==='loading'?'설정 불러오는 중…':'다른 기기 설정 불러오기')}</button>
  <p className="muted">{t('다른 기기에서 저장을 마친 뒤 누르세요. 이 기기의 저장 대기 중인 변경은 유지하고 나머지 설정을 가져옵니다.')}</p>
  <div className="account-sync-columns"><div><h4>{t('계정에 저장되는 항목')}</h4><ul>
   <li>{t('직업별 빌드 배분 · 레벨 · 포인트 총량과 확인한 남은 포인트')}</li>
   <li>{t('콘텐츠 타이머의 서버 · 고정 항목 · 시간 설정')}</li>
   <li>{t('지도에서 완료 표시한 위치 · 즐겨찾기 · 언어')}</li>
  </ul></div><div><h4>{t('이 기기에만 남는 항목')}</h4><ul>
   <li>{t('빌드 보관함에 따로 저장한 빌드')}</li>
   <li>{t('조회한 캐릭터 정보 · 검색 기록 · 장비 이름과 개인 메모')}</li>
  </ul><p>{t('다른 기기에서 실제 사용 포인트를 보려면 캐릭터를 다시 연결하세요.')}</p></div></div>
 </section>;
}
