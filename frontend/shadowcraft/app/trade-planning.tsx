import {useEffect,useRef,useState} from 'react';
import {useLocale} from './locale';
import {parseTradeDraft,parsePurchaseDraft,parseTradeMoney,parseTradeInteger,parseTradeRate,changePurchaseMode,maximumTradePurchase,calculateTradeLedger,restoreTradeLedger,MAX_TRADE_QUANTITY,type TradeDraft,type TradeField,type TradeLedger,type TradeSale} from '../lib/trade-calculator';

export default function TradePlanning({mode,initial}:{mode:'limit'|'ledger';initial:TradeDraft}){
 const {t,locale}=useLocale(),key=mode==='limit'?'asbc-trade-limit-v1':'asbc-trade-ledger-v1';
 const [saved]=useState(()=>{try{const raw=localStorage.getItem(key);return {raw,data:raw?restoreTradeLedger(JSON.parse(raw)):null,unreadable:!!raw&&!restoreTradeLedger(JSON.parse(raw))};}catch{return {raw:null,data:null,unreadable:true};}});
 const [book,setBook]=useState<TradeLedger>(saved.data??{draft:{...initial},sales:[]});
 const [storageFailed,setStorageFailed]=useState(false),[quantity,setQuantity]=useState(''),[received,setReceived]=useState(''),[attempted,setAttempted]=useState(false),[undo,setUndo]=useState<TradeSale[]|null>(null);
 const expectedRaw=useRef(saved.raw);
 useEffect(()=>{if(saved.unreadable){setStorageFailed(true);return;}try{if(localStorage.getItem(key)!==expectedRaw.current){setStorageFailed(true);return;}const raw=JSON.stringify(book);localStorage.setItem(key,raw);expectedRaw.current=raw;setStorageFailed(false);}catch{setStorageFailed(true);}},[book,key,saved.unreadable]);
 const draft=book.draft,isLimit=mode==='limit',total=draft.purchaseMode==='total';
 const parsed=isLimit?parseTradeDraft({...draft,buy:'0',target:'0',purchaseMode:'unit'}):parsePurchaseDraft(draft);
 const rate=parseTradeRate(draft.profitRate),input=parsed.value;
 const errors={...parsed.errors,...(isLimit&&rate===null?{profitRate:'rate' as const}:{})};
 const cap=isLimit&&input&&rate!==null?maximumTradePurchase(input,rate):null;
 let ledger:ReturnType<typeof calculateTradeLedger>|null=null;
 if(!isLimit&&input){try{ledger=calculateTradeLedger(input,book.sales);}catch{/* The changed purchase quantity may be below the already sold quantity. */}}
 const format=(n:bigint)=>n.toLocaleString(locale),money=(n:bigint)=>t('{0} 키나',[format(n)]),signed=(n:bigint)=>(n>0n?'+':'')+money(n);
 const update=(k:TradeField,v:string)=>setBook(old=>({...old,draft:{...old.draft,[k]:v}}));
 const field=(k:TradeField,label:string,hint:string)=>{const n=parseTradeMoney(draft[k]);return <label className="trade-field"><span>{t(label)}</span><input aria-label={t(label)} value={draft[k]} inputMode={k==='tax'||k==='profitRate'?'decimal':k==='quantity'||k==='bundle'?'numeric':'text'} maxLength={40} aria-invalid={!!errors[k]} aria-describedby={'planning-'+k} onChange={e=>update(k,e.target.value)}/><small id={'planning-'+k} className={errors[k]?'trade-error':''}>{errors[k]?t(errors[k]==='rate'?'0~100%를 소수 둘째 자리까지 입력하세요.':errors[k]==='quantity'?'수량은 1~1,000,000 사이의 정수로 입력하세요.':'0~1조 키나를 입력하세요. 예: 130000, 13만, 13만 5천'):t(hint)+(n!==null&&['buy','sell','fee'].includes(k)?' · '+money(n):'')}</small></label>;};
 const conditions=<details className="trade-options"><summary>{t('세율·묶음·등록비 확인')}</summary><div className="trade-fields">{field('bundle',isLimit?'한 번에 팔 수량':'남은 물건을 한 번에 팔 수량','남는 수량은 마지막에 따로 판매')}{field('tax','판매 세율 (%)','기본 10% · 게임의 현재 세율로 수정')}{field('fee','등록 1회당 고정 비용','확인한 비용만 입력 · 기본 0키나')}<label className="trade-field"><span>{t('묶음별 세금 소수점 처리')}</span><select aria-label={t('묶음별 세금 소수점 처리')} value={draft.rounding} onChange={e=>setBook(old=>({...old,draft:{...old.draft,rounding:e.target.value as 'up'|'down'}}))}><option value="up">{t('올림 · 보수적으로 계산')}</option><option value="down">{t('버림')}</option></select><small>{t('게임의 실제 처리 방식은 미확인')}</small></label></div></details>;
 const soldCount=parseTradeInteger(quantity,MAX_TRADE_QUANTITY,1n),net=parseTradeMoney(received);
 const rowError=soldCount===null?t('팔린 수량을 1개 이상 입력하세요.'):net===null?t('정산 후 받은 총금액을 입력하세요.'):!ledger||soldCount>ledger.remaining?t('남은 수량보다 많이 기록할 수 없습니다.'):book.sales.length>=200?t('판매 기록은 구매 물량당 200개까지 보관합니다.'):'';
 const add=()=>{setAttempted(true);if(rowError||soldCount===null||net===null)return;setBook(old=>({...old,sales:[...old.sales,{id:crypto.randomUUID(),quantity:String(soldCount),received:String(net)}]}));setQuantity('');setReceived('');setAttempted(false);setUndo(null);};
 return <div className="trade-planning">
  {(storageFailed||saved.unreadable)&&<p className="trade-error" role="status">{t(storageFailed?'브라우저에 저장하지 못했습니다. 이 화면에서는 계속 계산할 수 있습니다.':'저장된 기록을 읽지 못해 새 계산으로 시작했습니다.')}</p>}
  <div className="trade-form panel">
   {!isLimit&&<><p className="trade-money-help">{t('같은 가격에 함께 산 물량을 기록하세요. 구매 내용을 고치면 기존 판매 손익도 다시 계산됩니다.')}</p><div className="trade-purchase-mode">{(['unit','total'] as const).map(m=><button key={m} className={'button small '+(draft.purchaseMode===m?'secondary':'ghost')} aria-pressed={draft.purchaseMode===m} onClick={()=>setBook(old=>({...old,draft:changePurchaseMode(old.draft,m)}))}>{t(m==='unit'?'한 개 가격':'전체 구매 비용')}</button>)}</div></>}
   <div className="trade-planning-fields">
    {isLimit?field('sell','예상 개당 판매가','거래소에서 직접 확인한 판매가'):field('buy',total?'전체 구매 비용 (키나)':'개당 구매 가격 (키나)','13만·13만 5천처럼 입력해도 됩니다.')}
    {field('quantity',isLimit?'구매할 수량':'처음 산 수량',isLimit?'전부 판매하는 것으로 계산':'이미 판 수량도 포함한 전체 수량')}
    {isLimit&&field('profitRate','목표 순이익률 (%)','매입 비용 대비 · 0~100% · 소수 둘째 자리까지')}
   </div>
   <p className="trade-assumptions">{t('세율 {0}% · {1}개씩 판매 · 등록 1회당 {2}',[draft.tax,draft.bundle,parseTradeMoney(draft.fee)===null?'—':money(parseTradeMoney(draft.fee)!)])}</p>{conditions}
  </div>
  {isLimit?<>{!input||rate===null?<p className="trade-invalid" role="status">{t('판매가·수량·목표 이익률을 확인하세요.')}</p>:cap?<section className="trade-results" aria-label={t('구매 상한 결과')} aria-live="polite"><div className="trade-total"><span>{t('개당 이 가격 이하로 구매')}</span><strong className="trade-gain">{money(cap.unit)}</strong><p>{t('{0}% 순이익 목표',[draft.profitRate])}</p></div><div className="trade-auto-sale"><span>{t('전체 구매 비용 상한')}</span><strong>{money(cap.total)}</strong><p>{t('{0}개를 모두 판매한 뒤의 기준입니다.',[format(input.quantity)])}</p><small>{t('개당 상한으로 샀을 때 예상 총이익 {0}',[signed(cap.profitAtUnit)])}</small></div></section>:<p className="trade-invalid" role="status">{t('판매 비용이 수령액보다 커서 이 조건으로는 구매할 수 없습니다.')}</p>}<p className="trade-note">{t('이 가격에 전부 팔린다는 가정입니다. 실제 판매 가능 가격을 먼저 확인하세요.')}</p></>:<>
   {!input?<p className="trade-invalid" role="status">{t('구매 가격과 아래 계산 조건을 확인하세요.')}</p>:!ledger?<p className="trade-invalid" role="status">{t('처음 산 수량이 판매 기록보다 적습니다. 구매 수량이나 판매 기록을 고쳐 주세요.')}</p>:<>
    <section className="trade-ledger-summary" aria-label={t('일부 판매 손익')} aria-live="polite">
     <div className="panel"><span>{t('팔린 물건의 순이익')}</span><strong className={ledger.realizedProfit<0n?'trade-loss':'trade-gain'}>{signed(ledger.realizedProfit)}</strong><small>{t('{0}개 판매 · 실제 받은 금액 {1}',[format(ledger.sold),money(ledger.received)])}</small></div>
     <div className="panel"><span>{t('남은 물건의 매입 비용')}</span><strong>{money(ledger.inventoryCost)}</strong><small>{t('아직 팔지 않은 {0}개',[format(ledger.remaining)])}</small></div>
    </section>
    <div className="trade-remaining panel"><h2>{t(ledger.remaining?'남은 물건은 얼마에 팔면 본전일까요?':'모두 판매했습니다')}</h2>{ledger.remaining?<><strong>{ledger.remainingPrice===null?t('이 조건으로는 본전 회수가 불가능합니다.'):t('개당 {0} 이상',[money(ledger.remainingPrice)])}</strong><p>{t('이미 받은 돈과 남은 {0}개 판매대금을 합쳐 전체 구매 비용을 회수하는 가격입니다.',[format(ledger.remaining)])}</p></>:<strong className={ledger.cashBalance<0n?'trade-loss':'trade-gain'}>{t('최종 순이익 {0}',[signed(ledger.cashBalance)])}</strong>}<small>{t('구매비는 수량 비율로 나누며, 1키나 미만 원가는 남은 재고에 포함합니다.')}</small></div>
    {ledger.remaining>0n&&<section className="trade-sale-entry panel"><h2>{t('이번에 팔린 물건 기록')}</h2><div className="trade-planning-fields"><label className="trade-field"><span>{t('이번에 팔린 수량')}</span><input aria-label={t('이번에 팔린 수량')} inputMode="numeric" maxLength={24} value={quantity} onChange={e=>setQuantity(e.target.value)}/><small>{t('기록 가능한 수량: {0}개',[format(ledger.remaining)])}</small></label><label className="trade-field"><span>{t('정산 후 받은 총금액')}</span><input aria-label={t('정산 후 받은 총금액')} inputMode="text" maxLength={40} value={received} onChange={e=>setReceived(e.target.value)}/><small>{t('세금·등록비를 뺀 실제 수령액 · 다시 차감하지 않습니다.')}</small></label></div>{attempted&&rowError&&<p className="trade-error" role="alert">{rowError}</p>}<button className="button primary" onClick={add}>{t('판매 기록 추가')}</button></section>}
   </>}
   {book.sales.length>0&&<section className="trade-sale-log"><h2>{t('판매 기록')}</h2>{book.sales.map((row,i)=><div className="trade-sale-row" key={row.id}><div><strong>{t('{0}번째 판매 · {1}개',[i+1,format(BigInt(row.quantity))])}</strong><small>{t('실제 수령액 {0}',[money(BigInt(row.received))])}</small></div><button className="button ghost small" aria-label={t('{0}번째 판매 기록 삭제',[i+1])} onClick={()=>{setUndo(book.sales);setBook(old=>({...old,sales:old.sales.filter(s=>s.id!==row.id)}));}}>{t('삭제')}</button></div>)}<button className="button ghost small" onClick={()=>{setUndo(book.sales);setBook(old=>({...old,sales:[]}));}}>{t('판매 기록 전체 비우기')}</button></section>}
   {undo&&<p role="status">{t('판매 기록을 지웠습니다.')} <button className="button secondary small" onClick={()=>{setBook(old=>({...old,sales:undo}));setUndo(null);}}>{t('되돌리기')}</button></p>}
   <p className="trade-note">{t('판매 기록은 이 브라우저에만 보관됩니다. 다른 구매 물량을 기록하려면 기존 판매 기록을 먼저 비우세요.')}</p>
  </>}
 </div>;
}
