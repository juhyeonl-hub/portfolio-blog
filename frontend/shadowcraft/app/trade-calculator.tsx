import type {PurchaseSeed} from './trade-purchase';
import {useEffect,useState} from 'react';
import {Calculator,ArrowRight,Coins} from 'lucide-react';
import {useLocale} from './locale';
import {calculateTrade,minimumTradePrice,parseSaleDraft,parseTradeRate,tradeProfitTarget,parsePurchaseDraft,tradeProfitExamples,tradeExample,parseTradeMoney,restoreTradeDraft,changePurchaseMode,MAX_TRADE_MONEY,type TradeDraft,type TradeField} from '../lib/trade-calculator';
import CraftSale from './craft-sale';
import {craftSaleText} from '../lib/craft-sale-text';
import TradeWorkbookPanel from './trade-workbook';
import CraftComparison from './craft-comparison';
import TradeScreenshot from './trade-screenshot';
import './trade-calculator.css';
const storageKey='asbc-trade-calculator-v1';
function initialDraft():TradeDraft{
 try{return restoreTradeDraft(JSON.parse(localStorage.getItem(storageKey)||'null'));
 }catch{/* A calculator remains usable with storage disabled. */}
 return {...tradeExample};
}
export default function TradeCalculator(){
 const {t,locale}=useLocale();const [draft,setDraft]=useState(initialDraft),[manual,setManual]=useState(false),[conversionNotice,setConversionNotice]=useState(false);
 const [tool,setTool]=useState<'sale'|'ledger'|'craft'|'craft-sale'>('craft-sale');
 const craftGoal=draft.craftProfitRate,setCraftGoal=(value:string)=>setDraft(old=>({...old,craftProfitRate:value}));
 const cs=(key:Parameters<typeof craftSaleText>[1])=>craftSaleText(locale,key);
 const [purchase,setPurchase]=useState<PurchaseSeed|null>(null);
 const startPurchase=(seed:Omit<PurchaseSeed,'id'>)=>{setPurchase({...seed,id:crypto.randomUUID()});setTool('ledger');};
 const totalPurchase=draft.purchaseMode==='total';
 const [settingsOpen,setSettingsOpen]=useState(()=>Object.keys(parsePurchaseDraft(draft).errors).some(key=>key!=='buy'));
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(draft));}catch{/* Optional browser-local draft. */}},[draft]);
 const {value,errors:baseErrors}=manual?parseSaleDraft(draft):parsePurchaseDraft(draft);
 const profitBps=parseTradeRate(draft.profitRate),goalAmount=parseTradeMoney(draft.target);
 const errors={...baseErrors,...(!manual&&profitBps===null?{profitRate:'rate' as const}:{}),...(manual&&draft.target.trim()&&goalAmount===null?{target:'money' as const}:{})};
 const examples=value?tradeProfitExamples(value):[],selected=value&&profitBps!==null?tradeProfitTarget(value,profitBps):null;
 const profitLabel=profitBps===null?'':(Number(profitBps)/100).toLocaleString(locale,{maximumFractionDigits:2});
 const sale=manual?value?.sell:selected?.price;
 const calculation=value&&sale!==null&&sale!==undefined?{...value,sell:sale}:null;
 const format=(n:bigint)=>n.toLocaleString(locale==='ko'?'ko-KR':locale);
 const money=(n:bigint)=>t('{0} 키나',[format(n)]);
 const signed=(n:bigint)=>(n>0n?'+':'')+money(n);
 const compact=(n:bigint)=>new Intl.NumberFormat(locale,{notation:'compact',maximumFractionDigits:2}).format(n);
 const change=(key:TradeField,text:string)=>setDraft(old=>({...old,[key]:text}));
 const mode=(next:boolean)=>{if(next&&sale!==null&&sale!==undefined&&sale<=MAX_TRADE_MONEY)change('sell',String(sale));setManual(next);};
 const purchaseMode=(next:'unit'|'total')=>{const converted=changePurchaseMode(draft,next);setConversionNotice(!converted.buy);setDraft(converted);};
 const errorText=(key:TradeField)=>errors[key]==='rate'?t('0~100%를 소수 둘째 자리까지 입력하세요.'):errors[key]==='quantity'?t('수량은 1~1,000,000 사이의 정수로 입력하세요.'):t('0~1조 키나를 입력하세요. 예: 130000, 13만, 13만 5천');
 const field=(key:TradeField,label:string,hint?:string)=><label className="trade-field" key={key}><span>{t(label)}</span><input aria-label={t(label)} inputMode={key==='tax'||key==='profitRate'?'decimal':key==='quantity'||key==='bundle'?'numeric':'text'} autoComplete="off" spellCheck={false} maxLength={key==='quantity'||key==='bundle'||key==='tax'?24:40} value={draft[key]} aria-invalid={!!errors[key]} aria-describedby={'trade-'+key+'-hint'} onChange={e=>{change(key,e.target.value);if(key==='buy')setConversionNotice(false);}}/><small id={'trade-'+key+'-hint'} className={errors[key]?'trade-error':''}>{errors[key]?errorText(key):hint||'\u00a0'}</small></label>;
 const amountHint=(key:'buy'|'sell'|'target')=>{const n=parseTradeMoney(draft[key]);return n===null?t('예: 130000, 13만, 13만 5천'):money(n)+' · '+compact(n);};
 const result=calculation?calculateTrade(calculation):null;
 const minimum=value?minimumTradePrice(value,value.bundle,0n):null,target=value&&goalAmount!==null?minimumTradePrice(value,value.bundle,goalAmount):null;
 const groups=value?[...new Set([25n<value.quantity?25n:value.quantity,50n<value.quantity?50n:value.quantity,value.quantity,value.bundle<value.quantity?value.bundle:value.quantity])].sort((a,b)=>a<b?-1:a>b?1:0):[];
 const bundleName=(r:NonNullable<typeof result>)=>r.listingCount===1n?t('한 번에 {0}개',[format(r.size)]):r.remainder?t('{0}개씩 {1}회 + {2}개 1회',[format(r.size),format(r.fullCount),format(r.remainder)]):t('{0}개씩 {1}회',[format(r.size),format(r.fullCount)]);
 const priceBox=(label:string,price:bigint|null)=><div className="trade-price"><span>{t(label)}</span><strong>{price===null?t('이익을 낼 수 없음'):money(price)}</strong><button className="button secondary small" disabled={price===null||price>MAX_TRADE_MONEY} onClick={()=>price!==null&&change('sell',String(price))}>{t('이 가격으로 계산')}<ArrowRight size={14}/></button>{price!==null&&price>MAX_TRADE_MONEY&&<small>{t('계산된 가격이 입력 가능한 범위를 넘습니다.')}</small>}</div>;
 return <section className="trade-calculator" aria-labelledby="trade-title">
  <header className="trade-heading"><div><p className="eyebrow"><Calculator size={16}/>{t('거래소 계산기')}</p><h1 id="trade-title">{tool==='craft-sale'?cs('title'):t(tool==='ledger'?'팔고 남은 물건, 지금 손익은?':tool==='craft'?'제작할까요, 재료를 팔까요?':'얼마에 팔면 남을까요?')}</h1><p>{tool==='craft-sale'?cs('intro'):tool==='sale'?t(manual?'개당 가격을 넣으면 세금과 매입 비용을 뺀 이익이 바로 바뀝니다.':'구매 비용을 입력하면 세금을 계산한 개당 판매가가 바로 나옵니다.'):t(tool==='craft'?'재료와 완성품의 가격으로 두 방법의 손익을 비교합니다.':'산 물량과 실제 정산 금액을 기록하면 재고와 순이익을 계산합니다.')}</p></div></header>
  <div className="trade-tools craft-sale-tools" role="group" aria-label={t('거래 도구')}><button className={'button '+(tool==='craft-sale'?'primary':'ghost')} aria-pressed={tool==='craft-sale'} onClick={()=>setTool('craft-sale')}>{cs('calculator')}</button><button className={'button '+(tool==='ledger'?'primary':'ghost')} aria-pressed={tool==='ledger'} onClick={()=>setTool('ledger')}>{t('거래 장부')}</button></div>
  {tool==='craft-sale'?<CraftSale goal={craftGoal} onGoalChange={setCraftGoal}/>:tool==='ledger'?<TradeWorkbookPanel purchase={purchase} onPurchaseDone={()=>setPurchase(null)}/>:tool==='craft'?<CraftComparison/>:<>
  <div className="trade-mode" role="group" aria-label={t('계산 방식')}><button className={'button '+(!manual?'primary':'ghost')} aria-pressed={!manual} onClick={()=>mode(false)}>{t('구매가만 입력')}</button><button className={'button '+(manual?'primary':'ghost')} aria-pressed={manual} disabled={!manual&&sale!=null&&sale>MAX_TRADE_MONEY} onClick={()=>mode(true)}>{t('판매가 직접 비교')}</button></div>
  <TradeScreenshot onApply={scan=>{setDraft(old=>({...old,item:scan.name,buy:scan.price,quantity:scan.quantity,purchaseMode:'unit'}));setConversionNotice(false);setSettingsOpen(true)}}/>
  <div className="trade-form panel">
   <div className="trade-purchase-mode" role="group" aria-label={t('구매 비용 입력 기준')}><button className={'button small '+(!totalPurchase?'secondary':'ghost')} aria-pressed={!totalPurchase} onClick={()=>purchaseMode('unit')}>{t('한 개 가격')}</button><button className={'button small '+(totalPurchase?'secondary':'ghost')} aria-pressed={totalPurchase} onClick={()=>purchaseMode('total')}>{t('전체 구매 비용')}</button></div>
   <p className="trade-money-help">{t('13만·13만 5천처럼 입력해도 됩니다.')}</p>
   {conversionNotice&&<p className="trade-conversion" role="status">{t('정확한 정수 금액으로 바꿀 수 없어 입력을 비웠습니다. 선택한 기준의 구매 비용을 입력하세요.')}</p>}
   <div className={'trade-purchase'+(manual||totalPurchase?' expanded':'')}>{field('buy',totalPurchase?'전체 구매 비용 (키나)':'개당 구매 가격 (키나)',amountHint('buy'))}{totalPurchase&&field('quantity','산 수량',t('위 금액으로 구매한 전체 수량'))}{manual&&field('sell','개당 팔 가격',amountHint('sell'))}</div>
   {totalPurchase&&value&&<p className="trade-cost-summary">{t('{0}개를 총 {1}에 구매한 것으로 계산합니다.',[format(value.quantity),money(value.totalCost!)])}</p>}
   <p className="trade-assumptions">{value?t('{0}개 구매 · {1}개씩 판매 · 세율 {2}% · 등록 1회당 {3}',[format(value.quantity),format(value.bundle<value.quantity?value.bundle:value.quantity),draft.tax,money(value.fee)]):t('구매 가격과 아래 계산 조건을 확인하세요.')}</p>
   <details className="trade-options" open={settingsOpen} onToggle={e=>setSettingsOpen(e.currentTarget.open)}><summary>{t('수량·세율·등록비 변경 (선택)')}</summary><div className="trade-fields">
    {!totalPurchase&&field('quantity','산 수량',t('모두 판매하는 것으로 계산'))}
    {field('bundle','한 번에 팔 수량',t('남는 수량은 마지막에 따로 판매'))}
    {field('tax','판매 세율 (%)',t('기본 10% · 게임의 현재 세율로 수정'))}
    {field('fee','등록 1회당 고정 비용',t('확인한 비용만 입력 · 기본 0키나'))}
    <label className="trade-field"><span>{t('묶음별 세금 소수점 처리')}</span><select aria-label={t('묶음별 세금 소수점 처리')} value={draft.rounding} onChange={e=>setDraft(old=>({...old,rounding:e.target.value as 'up'|'down'}))}><option value="up">{t('올림 · 보수적으로 계산')}</option><option value="down">{t('버림')}</option></select><small>{t('게임의 실제 처리 방식은 미확인')}</small></label>
    <label className="trade-field"><span>{t('아이템 이름 (메모)')}</span><input aria-label={t('아이템 이름 (메모)')} maxLength={80} value={draft.item} onChange={e=>setDraft(old=>({...old,item:e.target.value}))}/></label>
   </div><p>{t('고정 비용은 매 등록마다 같은 금액이 드는 경우에만 쓰세요. 판매 금액에 비례하는 등록비는 이 항목에 포함되지 않습니다.')}</p><button className="button ghost small" onClick={()=>{setDraft(old=>({...tradeExample,buy:old.buy,item:old.item,purchaseMode:old.purchaseMode,quantity:old.quantity}));}}>{t('구매 내용을 유지하고 판매 조건 초기화')}</button></details>
   {manual&&<div className="trade-manual-target">{field('target','목표 총 순이익 (선택)',draft.target.trim()?amountHint('target'):t('비워 두어도 현재 판매가의 손익은 계산됩니다.'))}</div>}
  </div>
  {parsePurchaseDraft(draft).value&&<div className="trade-purchase-link"><button className="button secondary" onClick={()=>startPurchase({item:draft.item,quantity:draft.quantity,price:draft.buy,mode:draft.purchaseMode})}>{t('이 구매 내용으로 장부 작성')}</button><small>{t('다음 화면에서 실제 구매를 확인한 뒤 저장합니다.')}</small></div>}
  {!value?<p className="trade-invalid" role="status">{t('구매 가격과 아래 계산 조건을 확인하세요.')}</p>:<>
   {!manual&&<section className="trade-examples" aria-labelledby="trade-examples-title"><h2 id="trade-examples-title">{t('세금을 뺀 뒤, 이만큼 남길 판매가')}</h2><p>{t('이익률은 매입 비용 기준입니다. 시세 추천이 아닌 계산 예시입니다.')}</p><div className="trade-example-grid">{examples.map(row=><button type="button" className={'trade-example'+(profitBps===BigInt(row.percent)*100n?' selected':'')} key={row.percent} aria-pressed={profitBps===BigInt(row.percent)*100n} onClick={()=>change('profitRate',String(row.percent))}><span>{row.percent===0?t('본전 이상'):t('{0}% 순이익 예시',[row.percent])}</span><strong>{row.price===null?t('이익을 낼 수 없음'):money(row.price)}</strong><small>{row.result?t('총이익 {0}',[signed(row.result.profit)]):t('세율과 등록비를 확인하세요.')}</small></button>)}</div><div className="trade-profit-rate">{field('profitRate','목표 순이익률 (%)',t('매입 비용 대비 · 0~100% · 소수 둘째 자리까지'))}</div></section>}
   {result&&calculation?<>
   <section className="trade-results" aria-label={t('계산 결과')}>
    <div className="trade-total" aria-live="polite" aria-atomic="true"><span>{t('전체 판매 후 순이익')}</span><strong className={result.profit<0n?'trade-loss':result.profit>0n?'trade-gain':''}>{signed(result.profit)}</strong><p>{bundleName(result)} · {result.profit>0n?t('이익'):result.profit<0n?t('손해'):t('본전')}</p></div>
    {manual?<div className="trade-prices">{priceBox('손해 보지 않는 최소 개당 가격',minimum)}{goalAmount!==null?priceBox('목표 이익을 남길 최소 개당 가격',target):<p>{t('목표 총이익을 입력하면 그만큼 남길 판매가도 계산합니다.')}</p>}</div>:<div className="trade-auto-sale"><span>{t('{0}% 순이익 목표의 판매가',[profitLabel])}</span><strong>{t('개당 {0}',[money(calculation.sell)])}</strong><p>{t('총 {0}개 · 매입 비용 {1}',[format(value.quantity),money(result.cost)])}</p>{minimum!==null&&<small className="trade-break-even">{t('손해 보지 않으려면 개당 {0} 이상',[money(minimum)])}</small>}<small>{t('선택한 이익률 예시의 가격입니다. 실제로 팔릴지는 시세를 확인하세요.')}</small></div>}
   </section>
   <p className="trade-explanation">{t('같은 개당 가격에 전부 팔리면 묶음을 나눠도 총이익은 같습니다. 다만 등록 1회당 비용이나 세금의 소수점 처리로 차이가 날 수 있습니다.')}</p>
   <details className="trade-details"><summary>{t('판매 금액·세금 내역')}</summary><dl className="trade-breakdown"><div><dt>{t('총 판매 금액')}</dt><dd>{money(result.gross)}</dd></div><div><dt>{t('판매 세금')}</dt><dd>−{money(result.tax)}</dd></div><div><dt>{t('등록 비용 합계')}</dt><dd>−{money(result.fees)}</dd></div><div><dt>{t('총 매입 비용')}</dt><dd>−{money(result.cost)}</dd></div><div><dt>{t('세금·등록비 뺀 수령액')}</dt><dd>{money(result.net)}</dd></div></dl></details>
   <details className="trade-details"><summary>{t('묶음별 이익 비교')}</summary><section className="trade-compare" aria-labelledby="trade-compare-title"><h2 id="trade-compare-title"><Coins size={20}/>{t('나누어 팔면 얼마나 다를까요?')}</h2><p>{t('개당 {0}에 {1}개를 모두 판매하는 경우입니다.',[money(calculation.sell),format(value.quantity)])}</p>
    {result.full.profit===null&&<p>{t('매입 비용이 수량으로 나누어떨어지지 않아 묶음별로는 세후 수령액을 표시합니다. 총이익에는 전체 매입 비용을 반영했습니다.')}</p>}
    <div className="trade-bundles">{groups.map(size=>{const r=calculateTrade(calculation,size),active=r.size===result.size;return <article key={String(size)} className={'trade-bundle'+(active?' selected':'')}><h3>{bundleName(r)}</h3><small>{t('전체 순이익')}</small><strong className={r.profit<0n?'trade-loss':r.profit>0n?'trade-gain':''}>{signed(r.profit)}</strong><dl><div><dt>{t(r.full.profit===null?'한 묶음 세후 수령액':'한 묶음 이익')}</dt><dd>{r.full.profit===null?money(r.full.net):signed(r.full.profit)}</dd></div>{r.last&&<div><dt>{t(r.last.profit===null?'마지막 {0}개 세후 수령액':'마지막 {0}개 이익',[format(r.remainder)])}</dt><dd>{r.last.profit===null?money(r.last.net):signed(r.last.profit)}</dd></div>}<div><dt>{t('판매 세금')}</dt><dd>{money(r.tax)}</dd></div><div><dt>{t('등록 비용 합계')}</dt><dd>{money(r.fees)}</dd></div></dl><button className="button secondary" aria-pressed={manual?active:undefined} onClick={()=>{setManual(true);change('sell',String(calculation.sell));change('bundle',String(size));}} disabled={calculation.sell>MAX_TRADE_MONEY}>{t(!manual?'이 가격으로 직접 비교':active?'이 묶음으로 계산 중':'이 묶음으로 계산')}</button></article>})}</div>
   </section></details>
   </>:<p className="trade-invalid" role="status">{t(!manual&&profitBps===null?'목표 순이익률을 0~100%로 입력하거나 위의 예시를 선택하세요.':'이 조건으로는 목표 이익을 낼 수 없습니다. 세율과 등록비를 확인하세요.')}</p>}
  </>}
  </>}
  {tool!=='ledger'&&tool!=='craft-sale'&&<p className="trade-note">{t('추가 비용 0키나와 묶음별 세금 올림은 계산용 기본값입니다. 실제 등록비·정산 금액은 게임 화면에서 확인하세요.')}</p>}
  {tool==='sale'&&<p className="trade-note">{t('표시된 판매가에 전부 팔린다는 가정의 예상치입니다. 실시간 시세·미판매·재등록 비용은 자동 반영하지 않습니다. 입력은 이 브라우저에만 보관됩니다.')}</p>}
  <details className="trade-details craft-sale-legacy"><summary>{cs('otherTools')}</summary><p className="trade-note">{cs('preserved')}</p><div className="book-actions"><button className="button secondary" onClick={()=>{setTool('craft');document.getElementById('trade-title')?.scrollIntoView({block:'start'});}}>{cs('plans')}</button><button className="button ghost" onClick={()=>{setTool('sale');document.getElementById('trade-title')?.scrollIntoView({block:'start'});}}>{cs('resale')}</button></div></details>
 </section>;
}
