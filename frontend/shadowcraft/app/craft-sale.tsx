import {useEffect,useState} from 'react';
import {tradeAccountId} from '../lib/account-settings';
import {CRAFT_KEY,emptyCraft,parseCraft,type CraftDraft} from '../lib/craft-comparison';
import {craftSalePrices,multiplyCraftBatch} from '../lib/craft-sale';
import {craftSaleText,type craftSaleCopy} from '../lib/craft-sale-text';
import {parseTradeMoney,parseTradeInteger,parseTradeRate,MAX_TRADE_QUANTITY} from '../lib/trade-calculator';
import {useTradeStore} from './use-trade-store';
import {useLocale} from './locale';
import './craft-sale.css';
const emptySale=():CraftDraft=>({...emptyCraft(),materials:[{id:'first',name:'',quantity:'1',price:''}]});
const parseSale=(raw:string|null)=>raw===null?emptySale():parseCraft(raw);
export default function CraftSale({goal,onGoalChange}:{goal:string;onGoalChange:(value:string)=>void}){
 const {t,locale}=useLocale(),account=tradeAccountId();
 const storeKey=account?CRAFT_KEY+':account:'+account:CRAFT_KEY;
 const store=useTradeStore(storeKey,parseSale,emptySale),d=store.value;
 const [batchUndo,setBatchUndo]=useState<{key:string;before:CraftDraft;after:string}|null>(null);
 const [example,setExample]=useState(false),[showExampleNote,setShowExampleNote]=useState(false),[advancedOpen,setAdvancedOpen]=useState(false);
 const s=(key:keyof typeof craftSaleCopy,values:unknown[]=[])=>craftSaleText(locale,key,values);
 const money=(n:bigint)=>t('{0} 키나',[n.toLocaleString(locale)]),update=(patch:Partial<CraftDraft>)=>{setBatchUndo(null);return store.save({...d,...patch});};
 const scaleBatch=(next:CraftDraft)=>{if(store.save(next))setBatchUndo({key:storeKey,before:d,after:JSON.stringify(parseCraft(JSON.stringify(next)))});};
 const canUndo=batchUndo?.key===storeKey&&batchUndo.after===store.raw;
 const undoBatch=()=>{if(canUndo&&batchUndo&&store.save(batchUndo.before))setBatchUndo(null);};
 const result=craftSalePrices(d,goal),target=result?.target,rate=parseTradeRate(goal),rateInvalid=rate===null;
 const extraCost=parseTradeMoney(d.cost),fee=parseTradeMoney(d.fee),advancedInvalid=rateInvalid||extraCost===null||fee===null;
 useEffect(()=>{if(advancedInvalid)setAdvancedOpen(true);},[advancedInvalid]);
 const pending=d.materials.some(m=>parseTradeMoney(m.price)===null)?'pending':d.materials.some(m=>parseTradeInteger(m.quantity,MAX_TRADE_QUANTITY,1n)===null)?'checkQuantities':parseTradeInteger(d.output,MAX_TRADE_QUANTITY,1n)===null?'checkOutput':parseTradeRate(d.tax)===null?'checkTax':'checkSettings';
 const field=(key:'cost'|'output'|'tax'|'fee'|'sell',label:string)=>{
  const invalid=key==='output'?parseTradeInteger(d[key],MAX_TRADE_QUANTITY,1n)===null:key==='tax'?parseTradeRate(d[key])===null:parseTradeMoney(d[key])===null;
  return <label className="trade-field"><span>{label}</span><input disabled={store.error} aria-label={label} aria-invalid={d[key]!==''&&invalid} value={d[key]} maxLength={40} inputMode={key==='tax'?'decimal':'numeric'} onChange={e=>update({[key]:e.target.value})}/>{d[key]!==''&&invalid&&<small className="trade-error">{s(key==='output'?'invalidCount':key==='tax'?'invalidRate':'invalidMoney')}</small>}</label>;
 };
 const loadExample=()=>{if(store.save({...emptyCraft(),item:locale==='ko'?'세공한 완성품 (예시)':'Crafted item (example)',materials:[{id:'wood',name:locale==='ko'?'아스바타 나무':'Asvata wood',quantity:'2',price:'5254'},{id:'paper',name:locale==='ko'?'사포':'Sandpaper',quantity:'1',price:'400'}]})){setExample(false);setShowExampleNote(true);setBatchUndo(null);}};
 return <div className="craft-sale">
 {store.error&&<div className="trade-invalid" role="alert">{t('기존 기록을 읽지 못했거나 다른 탭에서 바뀌어 저장을 멈췄습니다. 기존 데이터는 덮어쓰지 않았습니다.')} <button className="button secondary" onClick={store.reload}>{t('저장된 내용 다시 불러오기')}</button></div>}
 <div className="craft-sale-workspace">
 <fieldset disabled={store.error} className="craft-sale-inputs panel">
 <div className="craft-sale-heading"><h2>{s('materials')}</h2><button className="button ghost" onClick={()=>setExample(true)}>{s('example')}</button></div>
 {example&&<div className="trade-restore-preview" role="alert"><p>{s('replaceExample')}</p><div className="book-actions"><button className="button secondary" onClick={loadExample}>{s('exampleConfirm')}</button><button className="button ghost" onClick={()=>setExample(false)}>{t('취소')}</button></div></div>}
 <p className="trade-note craft-sale-batch-help">{s('materialHelp')}</p>
 {showExampleNote&&<p className="trade-note">{s('exampleNote')}</p>}
 {d.materials.map((m,i)=>{const quantity=parseTradeInteger(m.quantity,MAX_TRADE_QUANTITY,1n),price=parseTradeMoney(m.price);return <div className="craft-sale-material" key={m.id}>
 <div className="craft-sale-material-heading"><details className="craft-sale-name"><summary>{m.name||t('재료 {0}',[i+1])} <small>{s('nameOptional')}</small></summary><label className="trade-field"><span>{s('nameOptional')}</span><input aria-label={t('재료 {0} 이름',[i+1])} maxLength={80} value={m.name} onChange={e=>update({materials:d.materials.map(x=>x.id===m.id?{...x,name:e.target.value}:x)})}/></label></details><span className="craft-sale-subtotal">{quantity===null||price===null?'':money(quantity*price)}</span></div>
 <div className="craft-sale-material-fields">
 <label className="trade-field"><span>{t('개당 가격')}</span><input aria-label={t('재료 {0} 개당 가격',[i+1])} placeholder={s('pricePlaceholder')} value={m.price} aria-invalid={m.price!==''&&price===null} maxLength={40} inputMode="numeric" onChange={e=>update({materials:d.materials.map(x=>x.id===m.id?{...x,price:e.target.value}:x)})}/>{m.price!==''&&price===null&&<small className="trade-error">{s('invalidMoney')}</small>}</label>
 <label className="trade-field"><span>{s('quantity')}</span><input aria-label={t('재료 {0} 수량',[i+1])} value={m.quantity} aria-invalid={m.quantity!==''&&quantity===null} maxLength={24} inputMode="numeric" onChange={e=>update({materials:d.materials.map(x=>x.id===m.id?{...x,quantity:e.target.value}:x)})}/>{m.quantity!==''&&quantity===null&&<small className="trade-error">{s('invalidCount')}</small>}</label>
 <button className="button ghost craft-sale-remove" aria-label={t('재료 {0} 삭제',[i+1])} title={t('재료 {0} 삭제',[i+1])} disabled={d.materials.length===1} onClick={()=>update({materials:d.materials.filter(x=>x.id!==m.id)})}>×</button>
 </div></div>;})}
 <button className="button secondary craft-sale-add" disabled={d.materials.length>=20} onClick={()=>update({materials:[...d.materials,{id:crypto.randomUUID(),name:'',quantity:'1',price:''}]})}>+ {t('재료 추가')}</button>
 <div className="craft-sale-conditions">{field('output',s('output'))}{field('tax',t('판매 세율 (%)'))}</div>
 <p className="trade-note craft-sale-batch-help">{s('yieldHelp')}</p>
 <div className="craft-sale-batch-actions" role="group" aria-label={s('batchActions')}><span>{s('batchActions')}</span>{[2n,10n].map(factor=>{const next=multiplyCraftBatch(d,factor);return <button key={String(factor)} className="button secondary" disabled={!next} onClick={()=>{if(next)scaleBatch(next);}}>{s('multiply',[String(factor)])}</button>;})}{canUndo&&<button className="button ghost" onClick={undoBatch}>{s('undoBatch')}</button>}</div>
 <p className="trade-note craft-sale-batch-help">{s('scaleHelp')}</p>
 </fieldset>
 <section id="craft-sale-result" className="craft-sale-results panel" aria-label={s('result')} aria-live="polite">
 {result?<>
 <p className="craft-sale-batch-summary">{s('batchSummary',[result.quantity.toLocaleString(locale)])}</p>
 <div className="craft-sale-cost"><span>{s('total')}</span><strong>{money(result.totalCost)}</strong></div>
 <h2>{rate===0n?s('breakEven'):s('target',[goal||'—'])}</h2>
 <strong className="craft-sale-price">{rateInvalid?s('invalidRate'):target?.price==null?s('unreachable'):s('unit',[money(target.price)])}</strong>
 {target?.result&&<p className="craft-sale-profit">{s('totalProfit',[money(target.result.profit)])}</p>}
 <div className="craft-sale-profit-choice"><span>{s('chooseProfit')}</span><div className="craft-sale-presets" role="group" aria-label={s('chooseProfit')}>{[0,5,10,20].map(percent=><button key={percent} className="button secondary" aria-pressed={rate===BigInt(percent)*100n} disabled={store.error} onClick={()=>onGoalChange(String(percent))}>{percent===0?s('noLoss'):percent+'%'}</button>)}</div></div>
 {result.breakEven!==null&&<p className="craft-sale-floor">{s('floor',[money(result.breakEven)])}</p>}
 <p className="trade-note">{s('marketNote')}</p>
 </>:<><h2>{s('resultTitle')}</h2><strong className="craft-sale-price craft-sale-placeholder">—</strong>{pending!=='checkSettings'&&<p className="trade-note">{s(pending)}</p>}</>}
 {advancedInvalid&&<p className="trade-error">{s('checkSettings')}</p>}
 </section>
 </div>
 <details className="trade-details craft-sale-advanced" open={advancedOpen} onToggle={e=>setAdvancedOpen(e.currentTarget.open)}>
 <summary>{s('settings')}{advancedInvalid&&<span className="trade-error"> · {s('checkSettings')}</span>}{!advancedInvalid&&(extraCost!==0n||fee!==0n||d.rounding!=='up')&&<small className="craft-sale-custom">{s('customCosts',[money(extraCost!),money(fee!),s(d.rounding)])}</small>}</summary>
 <div className="trade-fields">{field('cost',t('재료 외 추가 제작 비용'))}{field('fee',t('등록 1회당 고정 비용'))}<label className="trade-field"><span>{s('goal')}</span><input disabled={store.error} aria-label={s('goal')} value={goal} maxLength={6} inputMode="decimal" aria-invalid={rateInvalid} onChange={e=>onGoalChange(e.target.value)}/><small className={rateInvalid?'trade-error':''}>{rateInvalid?s('invalidRate'):s('goalHelp')}</small></label><label className="trade-field"><span>{t('묶음별 세금 소수점 처리')}</span><select disabled={store.error} value={d.rounding} onChange={e=>update({rounding:e.target.value as 'up'|'down'})}><option value="up">{t('세금 올림 · 예상 이익을 적게 계산')}</option><option value="down">{t('버림')}</option></select></label></div>
 <p className="trade-note">{s('precision')}</p>
 </details>
 <details className="trade-details"><summary>{s('manual')}</summary>{field('sell',t('완성품 개당 판매가'))}{result?.actual&&<p className={result.actual.profit<0n?'trade-loss':'trade-gain'}>{result.actual.profit<0n?s('totalLoss',[money(-result.actual.profit)]):s('totalProfit',[money(result.actual.profit)])}</p>}</details>
 <details className="trade-details"><summary>{s('breakdown')}</summary>
 {result&&<p className="trade-assumptions">{s('assumption',[d.output,d.tax,money(result.input.fee),s(d.rounding)])}</p>}
 {target?.result&&<dl className="trade-breakdown">{[[s('gross'),target.result.gross],[s('tax'),target.result.tax],[t('등록 1회당 고정 비용'),target.result.fees],[s('net'),target.result.net],[s('total'),target.result.cost]].map(([label,n])=><div key={String(label)}><dt>{String(label)}</dt><dd>{money(n as bigint)}</dd></div>)}</dl>}
 <p className="trade-note">{t('입력한 수량의 결과물이 나오고 모두 판매되는 경우의 계산입니다. 실패·대성공·귀속 여부·거래 제한·제작 시간은 반영하지 않습니다. 보유 재료도 공짜로 계산하지 않습니다.')}</p>
 </details>
 {target?.price!=null&&target.result&&<button className="craft-sale-mobile-result" onClick={()=>document.getElementById('craft-sale-result')?.scrollIntoView({block:'center',behavior:'smooth'})}><span><strong>{s('unit',[money(target.price)])}</strong><small>{s('totalProfit',[money(target.result.profit)])}</small></span><span>{s('seeResult')} ↑</span></button>}
 </div>;
}
