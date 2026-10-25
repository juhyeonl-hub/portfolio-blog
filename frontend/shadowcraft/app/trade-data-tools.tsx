import {workbookTotals} from '../lib/trade-workbook';
import {calculateCraft,craftFunding} from '../lib/craft-comparison';
import {useContext,useState} from 'react';
import {AccountSyncContext} from './account-sync-panel';
import {useLocale} from './locale';
import {parseTradeBackup,parseTradeCollection,tradeBackup} from '../lib/trade-collections';
import {activeTradeConflict,previousTradeBackup,preserveTradeBackup,resolveActiveTradeConflict,tradeAccountId} from '../lib/account-settings';
export function downloadTrade(key:string,value:unknown,suffix='backup'){
 const url=URL.createObjectURL(new Blob([tradeBackup(key,value)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=key+'-'+suffix+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function counts(key:string,raw:string|null){const v=parseTradeCollection(key,raw);return 'books' in v?{items:v.books.length,rows:v.books.reduce((n,b)=>n+b.entries.length,0),names:v.books.map(b=>b.name).join(', ')}:{items:v.plans.length,rows:null,names:v.plans.map(p=>p.name).join(', ')};}
function ConflictPreview({dataKey,raw,other}:{dataKey:string;raw:string|null;other:string|null}){
 const {t,locale}=useLocale(),data=parseTradeCollection(dataKey,raw),opposite=parseTradeCollection(dataKey,other);
 const money=(n:bigint)=>t('{0} 키나',[n.toLocaleString(locale)]);
 const otherItems='books' in opposite?opposite.books:opposite.plans;
 const changed=(item:{id:string})=>JSON.stringify(item)!==JSON.stringify(otherItems.find(x=>x.id===item.id));
 return <div className="trade-conflict-preview">{'books' in data?data.books.filter(changed).map(b=>{const total=workbookTotals(b.entries);return <article key={b.id}><strong>{b.name}</strong><p>{t('남은 수량 {0}개 · 팔린 순이익 {1}',[total.remaining.toLocaleString(locale),money(total.realizedProfit)])}</p><ul>{b.entries.slice(-2).map(row=><li key={row.id}>{t(row.kind==='buy'?'매입':'판매')} · {t('{0}개',[BigInt(row.quantity).toLocaleString(locale)])} · {t(row.kind==='buy'?'총 구매 비용 {0}':'총 수령액 {0}',[money(BigInt(row.amount))])}</li>)}</ul></article>}):data.plans.filter(changed).map(p=>{const result=calculateCraft(p.draft),fund=craftFunding(p.draft);return <article key={p.id}><strong>{p.name}</strong><p>{p.draft.item}</p>{result&&<p>{t('예상 순이익')}: {money(result.profit)}</p>}{fund&&<p>{t('지금 더 필요한 키나: {0}',[money(fund.additionalCost)])}</p>}</article>})}</div>;
}
export function TradeConflictPanel(){
 const sync=useContext(AccountSyncContext),{t}=useLocale(),[error,setError]=useState('');
 let conflict:ReturnType<typeof activeTradeConflict>=null;try{conflict=activeTradeConflict();}catch{/* Storage failure is shown by the sync status. */}
 if(!conflict)return null;
 const c=conflict,local=counts(c.key,c.local),remote=counts(c.key,c.remote);
 const resolve=(choice:'local'|'remote')=>{try{resolveActiveTradeConflict(choice,c);setError('');sync?.refresh();}catch(error){setError(t(error instanceof Error&&error.message==='changed'?'기록이 변경됐습니다. 내용을 다시 확인하고 선택하세요.':'백업하지 못해 기록을 변경하지 않았습니다. 브라우저 저장 공간을 확인하세요.'));}};
 return <section className="panel trade-conflict" role="alert"><h3>{t('같은 기록이 두 기기에서 바뀌었습니다')}</h3><p>{t('거래 순서가 달라지면 손익도 바뀔 수 있어 자동 저장을 멈췄습니다. 두 기록을 확인하고 사용할 쪽을 선택하세요. 선택 전 이 기기의 기록은 별도 백업됩니다.')}</p>
 <div className="trade-ledger-summary">{([['local',local,c.local],['remote',remote,c.remote]] as const).map(([side,summary,raw])=><div key={side}><h4>{t(side==='local'?'이 기기의 기록':'계정에 저장된 기록')}</h4><p>{t('항목 {0}개',[summary.items])}{summary.rows!==null?' · '+t('거래 {0}개',[summary.rows]):''}</p><p className="trade-record-names">{summary.names||t('기록 없음')}</p><ConflictPreview dataKey={c.key} raw={raw} other={side==='local'?c.remote:c.local}/><button className="button ghost" onClick={()=>downloadTrade(c.key,parseTradeCollection(c.key,raw),side)}>{t('이 기록 백업 다운로드')}</button><button className="button secondary" onClick={()=>resolve(side)}>{t(side==='local'?'이 기기 기록 사용':'계정 기록 사용')}</button></div>)}</div>{error&&<p>{error}</p>}</section>;
}
export default function TradeDataTools({dataKey,value,save,disabled=false}:{dataKey:string;value:unknown;save:(v:unknown)=>boolean;disabled?:boolean}){
 const sync=useContext(AccountSyncContext),{t}=useLocale();
 const [pending,setPending]=useState<unknown>(null),[previewBase,setPreviewBase]=useState(''),[message,setMessage]=useState('');
 const stage=(raw:string,backup:boolean)=>{try{const v=backup?parseTradeBackup(dataKey,raw):parseTradeCollection(dataKey,raw);setPending(v);setPreviewBase(JSON.stringify(value));setMessage('');}catch{setPending(null);setMessage(t('올바른 백업 파일이 아닙니다. 기존 기록은 변경하지 않았습니다.'));}};
 const restore=()=>{if(JSON.stringify(value)!==previewBase){setPending(null);setMessage(t('기록이 변경됐습니다. 복원할 파일을 다시 선택하고 확인하세요.'));return;}try{preserveTradeBackup(dataKey,tradeBackup(dataKey,value));if(!save(pending))throw Error('save');setPending(null);setMessage(t('기록을 복원했습니다. 복원 전 기록도 이 기기에 백업했습니다.'));}catch{setMessage(t('복원하지 못했습니다. 기존 기록을 다시 확인하세요.'));}};
 let previous:string|null=null;try{previous=previousTradeBackup(dataKey);}catch{/* optional backup */}
 let guest:string|null=null;try{if(tradeAccountId())guest=localStorage.getItem(dataKey);}catch{/* optional import */}
 const pendingSummary=pending?counts(dataKey,JSON.stringify(pending)):null;
 return <><p className="trade-note">{t(sync?'같은 Steam 계정의 PC와 모바일에 자동 저장됩니다. 다른 기기의 변경은 입력을 마친 뒤 반영합니다.':'지금은 이 브라우저에 저장됩니다. 로그인하면 계정별 장부와 제작 계획을 사용할 수 있습니다.')}</p><TradeConflictPanel/>
 <details className="trade-details"><summary>{t('백업·복원')}</summary><p>{t('백업에는 이 화면의 기록만 포함됩니다. 복원은 현재 기록을 교체하므로 아래 내용을 먼저 확인하세요.')}</p><div className="book-actions"><button className="button secondary" disabled={disabled} onClick={()=>{try{downloadTrade(dataKey,value);}catch{setMessage(t('백업 파일을 만들지 못했습니다.'));}}}>{t('백업 다운로드')}</button><label className="button secondary trade-file-label">{t('백업 파일 선택')}<input type="file" accept=".json,application/json" aria-label={t('백업 파일 선택')} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>5000000)throw Error('size');stage(await file.text(),true);}catch{setMessage(t('백업 파일을 읽지 못했습니다. 기존 기록은 변경하지 않았습니다.'));}}}/></label></div>
 {previous&&<button className="button ghost" onClick={()=>{try{downloadTrade(dataKey,parseTradeBackup(dataKey,previous!),'before-restore');}catch{setMessage(t('백업 파일을 읽지 못했습니다. 기존 기록은 변경하지 않았습니다.'));}}}>{t('복원 전 기록 내려받기')}</button>}
 {guest&&<button className="button ghost" onClick={()=>stage(guest!,false)}>{t('로그인 전에 이 브라우저에 쓴 기록 확인')}</button>}
 {pendingSummary&&<div className="panel trade-restore-preview"><strong>{t('복원할 내용: 항목 {0}개',[pendingSummary.items])}</strong>{pendingSummary.rows!==null&&<p>{t('거래 {0}개',[pendingSummary.rows])}</p>}<p className="trade-record-names">{pendingSummary.names||t('기록 없음')}</p><p>{t('현재 이 화면의 기록을 위 내용으로 교체합니다. 다른 계정이나 다른 종류의 기록은 바꾸지 않습니다.')}</p><div className="book-actions"><button className="button secondary" disabled={disabled} onClick={restore}>{t('현재 기록을 백업하고 복원')}</button><button className="button ghost" onClick={()=>setPending(null)}>{t('취소')}</button></div></div>}
 {message&&<p role="status">{message}</p>}</details></>;
}
