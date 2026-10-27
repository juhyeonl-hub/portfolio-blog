import {useState} from 'react';
import {tradeAccountId} from '../lib/account-settings';
import {CRAFT_KEY,emptyCraft,parseCraft,type CraftDraft} from '../lib/craft-comparison';
import {craftSalePrices} from '../lib/craft-sale';
import {craftSaleText,type craftSaleCopy} from '../lib/craft-sale-text';
import {parseTradeMoney,parseTradeInteger,parseTradeRate,MAX_TRADE_QUANTITY} from '../lib/trade-calculator';
import {useTradeStore} from './use-trade-store';
import {useLocale} from './locale';
import './craft-sale.css';
const emptySale=():CraftDraft=>({...emptyCraft(),materials:[{id:'first',name:'',quantity:'1',price:''}]});
const parseSale=(raw:string|null)=>raw===null?emptySale():parseCraft(raw);
export default function CraftSale({goal,onGoalChange}:{goal:string;onGoalChange:(value:string)=>void}){
 const {t,locale}=useLocale(),account=tradeAccountId();
 const store=useTradeStore(account?CRAFT_KEY+':account:'+account:CRAFT_KEY,parseSale,emptySale),d=store.value;
 const [example,setExample]=useState(false),[showExampleNote,setShowExampleNote]=useState(false);
 const s=(key:keyof typeof craftSaleCopy,values:unknown[]=[])=>craftSaleText(locale,key,values);
 const money=(n:bigint)=>t('{0} 키나',[n.toLocaleString(locale)]),update=(patch:Partial<CraftDraft>)=>store.save({...d,...patch});
 const result=craftSalePrices(d,goal),target=result?.target,rateInvalid=parseTradeRate(goal)===null;
 const field=(key:'cost'|'output'|'tax'|'fee'|'sell',label:string)=>{
  const invalid=key==='output'?parseTradeInteger(d[key],MAX_TRADE_QUANTITY,1n)===null:key==='tax'?parseTradeRate(d[key])===null:parseTradeMoney(d[key])===null;
  return <label className="trade-field"><span>{label}</span><input disabled={store.error} aria-label={label} aria-invalid={d[key]!==''&&invalid} value={d[key]} maxLength={40} inputMode={key==='output'?'numeric':key==='tax'?'decimal':'text'} onChange={e=>update({[key]:e.target.value})}/>{d[key]!==''&&invalid&&<small className="trade-error">{s(key==='output'?'invalidCount':key==='tax'?'invalidRate':'invalidMoney')}</small>}</label>;
 };
 const loadExample=()=>{if(store.save({...emptyCraft(),item:locale==='ko'?'세공한 완성품 (예시)':'Crafted item (example)',materials:[{id:'wood',name:locale==='ko'?'아스바타 나무':'Asvata wood',quantity:'2',price:'5254'},{id:'paper',name:locale==='ko'?'사포':'Sandpaper',quantity:'1',price:'400'}]})){setExample(false);setShowExampleNote(true);}};
 return <div className="craft-sale">
 {store.error&&<div className="trade-invalid" role="alert">{t('기존 기록을 읽지 못했거나 다른 탭에서 바뀌어 저장을 멈췄습니다. 기존 데이터는 덮어쓰지 않았습니다.')} <button className="button secondary" onClick={store.reload}>{t('저장된 내용 다시 불러오기')}</button></div>}
 <fieldset disabled={store.error} className="craft-sale-inputs">
 <section className="panel trade-form"><div className="craft-sale-heading"><h2>{s('materials')}</h2><button className="button ghost" onClick={()=>setExample(true)}>{s('example')}</button></div><p className="trade-note">{s('materialHelp')}</p>
 {example&&<div className="trade-restore-preview" role="alert"><p>{s('replaceExample')}</p><div className="book-actions"><button className="button secondary" onClick={loadExample}>{s('exampleConfirm')}</button><button className="button ghost" onClick={()=>setExample(false)}>{t('취소')}</button></div></div>}
 {showExampleNote&&<p className="trade-note">{s('exampleNote')}</p>}
 {d.materials.map((m,i)=>{const quantity=parseTradeInteger(m.quantity,MAX_TRADE_QUANTITY,1n),price=parseTradeMoney(m.price);return <div className="craft-sale-material" key={m.id}>
 <label className="trade-field craft-sale-name"><span>{t('재료 {0}',[i+1])}</span><input aria-label={t('재료 {0} 이름',[i+1])} maxLength={80} value={m.name} onChange={e=>update({materials:d.materials.map(x=>x.id===m.id?{...x,name:e.target.value}:x)})}/></label>
 <label className="trade-field"><span>{t('개당 가격')}</span><input aria-label={t('재료 {0} 개당 가격',[i+1])} value={m.price} aria-invalid={m.price!==''&&price===null} maxLength={40} inputMode="text" onChange={e=>update({materials:d.materials.map(x=>x.id===m.id?{...x,price:e.target.value}:x)})}/>{m.price!==''&&price===null&&<small className="trade-error">{s('invalidMoney')}</small>}</label>
 <label className="trade-field"><span>{t('필요 수량')}</span><input aria-label={t('재료 {0} 수량',[i+1])} value={m.quantity} aria-invalid={m.quantity!==''&&quantity===null} maxLength={24} inputMode="numeric" onChange={e=>update({materials:d.materials.map(x=>x.id===m.id?{...x,quantity:e.target.value}:x)})}/>{m.quantity!==''&&quantity===null&&<small className="trade-error">{s('invalidCount')}</small>}</label>
 <div className="craft-sale-subtotal"><span>{s('subtotal')}</span><strong>{quantity===null||price===null?'—':money(quantity*price)}</strong></div><button className="button ghost" aria-label={t('재료 {0} 삭제',[i+1])} disabled={d.materials.length===1} onClick={()=>update({materials:d.materials.filter(x=>x.id!==m.id)})}>{t('삭제')}</button>
 </div>;})}<button className="button secondary" disabled={d.materials.length>=20} onClick={()=>update({materials:[...d.materials,{id:crypto.randomUUID(),name:'',quantity:'1',price:''}]})}>{t('재료 추가')}</button></section>
 <section className="panel trade-form"><h2>{s('conditions')}</h2><div className="craft-sale-conditions">{field('output',s('output'))}{field('tax',t('판매 세율 (%)'))}{field('cost',t('재료 외 추가 제작 비용'))}<label className="trade-field"><span>{s('goal')}</span><input aria-label={s('goal')} value={goal} maxLength={6} inputMode="decimal" aria-invalid={rateInvalid} onChange={e=>onGoalChange(e.target.value)}/><small className={rateInvalid?'trade-error':''}>{rateInvalid?s('invalidRate'):s('goalHelp')}</small></label></div>
 <details className="trade-options" open={parseTradeMoney(d.fee)===null?true:undefined}><summary>{s('details')}</summary><div className="trade-fields">{field('fee',t('등록 1회당 고정 비용'))}<label className="trade-field"><span>{t('묶음별 세금 소수점 처리')}</span><select value={d.rounding} onChange={e=>update({rounding:e.target.value as 'up'|'down'})}><option value="up">{t('올림 · 보수적으로 계산')}</option><option value="down">{t('버림')}</option></select></label></div></details>
 <p className="trade-note">{s('precision')}</p></section></fieldset>
 {!result?<p className="craft-sale-empty" role="status">{s('pending')}</p>:<section className="craft-sale-results" aria-label={s('result')} aria-live="polite">
 <div className="craft-sale-cost"><span>{s('total')}</span><strong>{money(result.totalCost)}</strong><small>{money(result.materialCost)} + {money(result.extraCost)}</small></div>
 <p className="trade-assumptions">{s('assumption',[d.output,d.tax,money(result.input.fee),s(d.rounding)])}</p>
 <div className="craft-sale-prices"><article className="panel"><h3>{s('breakEven')}</h3><strong>{result.breakEven===null?s('unreachable'):s('unit',[money(result.breakEven)])}</strong>{result.firstProfit!==null&&<p>{s('profitStart',[money(result.firstProfit)])}</p>}</article>
 <article className="panel craft-sale-target"><h3>{s('target',[goal||'—'])}</h3><strong>{rateInvalid?s('invalidRate'):target?.price==null?s('unreachable'):s('unit',[money(target.price)])}</strong>{target?.result&&<p>{s('totalProfit',[money(target.result.profit)])}</p>}</article></div>
 <div className="craft-sale-presets">{result.examples.map(x=><button key={x.percent} className="button secondary" aria-pressed={parseTradeRate(goal)===BigInt(x.percent)*100n} onClick={()=>onGoalChange(String(x.percent))}>{x.percent}% · {x.price===null?'—':money(x.price)}</button>)}</div><p className="trade-note">{s('marketNote')}</p>
 {target?.result&&<details className="trade-options"><summary>{s('breakdown')}</summary><dl className="trade-breakdown">{[[s('gross'),target.result.gross],[s('tax'),target.result.tax],[t('등록 1회당 고정 비용'),target.result.fees],[s('net'),target.result.net],[s('total'),target.result.cost]].map(([label,n])=><div key={String(label)}><dt>{String(label)}</dt><dd>{money(n as bigint)}</dd></div>)}</dl></details>}
 </section>}
 <details className="trade-details"><summary>{s('manual')}</summary>{field('sell',t('완성품 개당 판매가'))}{result?.actual&&<p className={result.actual.profit<0n?'trade-loss':'trade-gain'}>{s('totalProfit',[money(result.actual.profit)])}</p>}</details>
 <p className="trade-note">{t('입력한 수량의 결과물이 나오고 모두 판매되는 경우의 계산입니다. 실패·대성공·귀속 여부·거래 제한·제작 시간은 반영하지 않습니다. 보유 재료도 공짜로 계산하지 않습니다.')}</p>
 </div>;
}
