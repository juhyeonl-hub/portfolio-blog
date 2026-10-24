import {useEffect,useState} from 'react';
import {Calculator,ArrowRight,Coins} from 'lucide-react';
import {useLocale} from './locale';
import {calculateTrade,minimumTradePrice,parseTradeDraft,tradeExample,MAX_TRADE_MONEY,type TradeDraft,type TradeField} from '../lib/trade-calculator';
import './trade-calculator.css';
const storageKey='asbc-trade-calculator-v1';
function initialDraft():TradeDraft{
 try{const value=JSON.parse(localStorage.getItem(storageKey)||'null');
  if(value&&Object.keys(tradeExample).every(key=>typeof value[key]==='string'&&value[key].length<=80)&&['up','down'].includes(value.rounding))return Object.fromEntries(Object.keys(tradeExample).map(key=>[key,value[key]])) as TradeDraft;
 }catch{/* A calculator remains usable with storage disabled. */}
 return {...tradeExample};
}
export default function TradeCalculator(){
 const {t,locale}=useLocale();const [draft,setDraft]=useState(initialDraft);
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(draft));}catch{/* Optional browser-local draft. */}},[draft]);
 const {value,errors}=parseTradeDraft(draft);
 const format=(n:bigint)=>n.toLocaleString(locale==='ko'?'ko-KR':locale);
 const money=(n:bigint)=>t('{0} 키나',[format(n)]);
 const signed=(n:bigint)=>(n>0n?'+':'')+money(n);
 const compact=(n:bigint)=>new Intl.NumberFormat(locale,{notation:'compact',maximumFractionDigits:2}).format(n);
 const change=(key:TradeField,text:string)=>setDraft(old=>({...old,[key]:text}));
 const errorText=(key:TradeField)=>errors[key]==='rate'?t('0~100%를 소수 둘째 자리까지 입력하세요.'):errors[key]==='quantity'?t('수량은 1~1,000,000 사이의 정수로 입력하세요.'):t('금액은 0~1,000,000,000,000 사이의 정수로 입력하세요.');
 const field=(key:TradeField,label:string,hint?:string)=><label className="trade-field" key={key}><span>{t(label)}</span><input aria-label={t(label)} inputMode={key==='tax'?'decimal':'numeric'} autoComplete="off" spellCheck={false} maxLength={24} value={draft[key]} aria-invalid={!!errors[key]} aria-describedby={'trade-'+key+'-hint'} onChange={e=>change(key,e.target.value)}/><small id={'trade-'+key+'-hint'} className={errors[key]?'trade-error':''}>{errors[key]?errorText(key):hint||'\u00a0'}</small></label>;
 const result=value?calculateTrade(value):null;
 const minimum=value?minimumTradePrice(value):null,target=value?minimumTradePrice(value,value.bundle,value.target):null;
 const groups=value?[...new Set([25n<value.quantity?25n:value.quantity,50n<value.quantity?50n:value.quantity,value.quantity,value.bundle<value.quantity?value.bundle:value.quantity])].sort((a,b)=>a<b?-1:a>b?1:0):[];
 const bundleName=(r:NonNullable<typeof result>)=>r.listingCount===1n?t('한 번에 {0}개',[format(r.size)]):r.remainder?t('{0}개씩 {1}회 + {2}개 1회',[format(r.size),format(r.fullCount),format(r.remainder)]):t('{0}개씩 {1}회',[format(r.size),format(r.fullCount)]);
 const priceBox=(label:string,price:bigint|null)=><div className="trade-price"><span>{t(label)}</span><strong>{price===null?t('이익을 낼 수 없음'):money(price)}</strong><button className="button secondary small" disabled={price===null||price>MAX_TRADE_MONEY} onClick={()=>price!==null&&change('sell',String(price))}>{t('이 가격으로 계산')}<ArrowRight size={14}/></button>{price!==null&&price>MAX_TRADE_MONEY&&<small>{t('계산된 가격이 입력 가능한 범위를 넘습니다.')}</small>}</div>;
 return <section className="trade-calculator" aria-labelledby="trade-title">
  <header className="trade-heading"><div><p className="eyebrow"><Calculator size={16}/>{t('거래소 계산기')}</p><h1 id="trade-title">{t('팔고 나면 얼마나 남을까요?')}</h1><p>{t('개당 가격을 넣으면 세금과 매입 비용을 뺀 이익이 바로 바뀝니다.')}</p></div><button className="button ghost" onClick={()=>setDraft({...tradeExample})}>{t('13만 키나 예시로 채우기')}</button></header>
  <div className="trade-form panel">
   <label className="trade-field trade-item"><span>{t('아이템 이름 (메모)')}</span><input aria-label={t('아이템 이름 (메모)')} maxLength={80} value={draft.item} onChange={e=>setDraft(old=>({...old,item:e.target.value}))}/></label>
   <div className="trade-fields">
    {field('buy','개당 산 가격',value?money(value.buy)+' · '+compact(value.buy):undefined)}
    {field('sell','개당 팔 가격',value?money(value.sell)+' · '+compact(value.sell):undefined)}
    {field('quantity','산 수량',t('모두 판매하는 것으로 계산'))}
    {field('bundle','한 번에 팔 수량',t('남는 수량은 마지막에 따로 판매'))}
    {field('tax','판매 세율 (%)',t('기본 10% · 게임의 현재 세율로 수정'))}
    {field('target','목표 총 순이익',value?money(value.target)+' · '+compact(value.target):undefined)}
   </div>
   <details className="trade-options"><summary>{t('등록 비용 · 세금 소수점 설정')}</summary><div className="trade-fields">
    {field('fee','등록 1회당 고정 비용',t('확인한 비용만 입력 · 기본 0키나'))}
    <label className="trade-field"><span>{t('묶음별 세금 소수점 처리')}</span><select aria-label={t('묶음별 세금 소수점 처리')} value={draft.rounding} onChange={e=>setDraft(old=>({...old,rounding:e.target.value as 'up'|'down'}))}><option value="up">{t('올림 · 보수적으로 계산')}</option><option value="down">{t('버림')}</option></select><small>{t('게임의 실제 처리 방식은 미확인')}</small></label>
   </div><p>{t('고정 비용은 매 등록마다 같은 금액이 드는 경우에만 쓰세요. 판매 금액에 비례하는 등록비는 이 항목에 포함되지 않습니다.')}</p></details>
   <p className="trade-note">{t('추가 비용 0키나와 묶음별 세금 올림은 계산용 기본값입니다. 실제 등록비·정산 금액은 게임 화면에서 확인하세요.')}</p>
  </div>
  {!value||!result?<p className="trade-invalid" role="status">{t('입력한 값을 확인하면 계산 결과가 표시됩니다.')}</p>:<>
   <section className="trade-results" aria-label={t('계산 결과')}>
    <div className="trade-total" aria-live="polite" aria-atomic="true"><span>{t('전체 판매 후 순이익')}</span><strong className={result.profit<0n?'trade-loss':result.profit>0n?'trade-gain':''}>{signed(result.profit)}</strong><p>{bundleName(result)} · {result.profit>0n?t('이익'):result.profit<0n?t('손해'):t('본전')}</p><p>{t('세율 {0}% · 등록 1회당 {1}',[draft.tax,money(value.fee)])}</p><small>{t(value.rounding==='up'?'세금은 묶음마다 1키나 단위로 올림':'세금은 묶음마다 1키나 단위로 버림')}</small></div>
    <div className="trade-prices">{priceBox('이익이 나기 시작하는 개당 가격',minimum)}{priceBox('목표 이익을 남길 최소 개당 가격',target)}<p>{t('선택한 묶음으로 전체 수량이 모두 팔렸을 때의 기준입니다.')}</p></div>
   </section>
   <dl className="trade-breakdown"><div><dt>{t('총 판매 금액')}</dt><dd>{money(result.gross)}</dd></div><div><dt>{t('판매 세금')}</dt><dd>−{money(result.tax)}</dd></div><div><dt>{t('등록 비용 합계')}</dt><dd>−{money(result.fees)}</dd></div><div><dt>{t('총 매입 비용')}</dt><dd>−{money(result.cost)}</dd></div><div><dt>{t('세금·등록비 뺀 수령액')}</dt><dd>{money(result.net)}</dd></div></dl>
   <section className="trade-compare" aria-labelledby="trade-compare-title"><h2 id="trade-compare-title"><Coins size={20}/>{t('나누어 팔면 얼마나 다를까요?')}</h2><p>{t('개당 {0}에 {1}개를 모두 판매하는 경우입니다.',[money(value.sell),format(value.quantity)])}</p>
    <div className="trade-bundles">{groups.map(size=>{const r=calculateTrade(value,size),active=r.size===result.size;return <article key={String(size)} className={'trade-bundle'+(active?' selected':'')}><h3>{bundleName(r)}</h3><small>{t('전체 순이익')}</small><strong className={r.profit<0n?'trade-loss':r.profit>0n?'trade-gain':''}>{signed(r.profit)}</strong><dl><div><dt>{t('한 묶음 이익')}</dt><dd>{signed(r.full.profit)}</dd></div>{r.last&&<div><dt>{t('마지막 {0}개 이익',[format(r.remainder)])}</dt><dd>{signed(r.last.profit)}</dd></div>}<div><dt>{t('판매 세금')}</dt><dd>{money(r.tax)}</dd></div><div><dt>{t('등록 비용 합계')}</dt><dd>{money(r.fees)}</dd></div></dl><button className="button secondary" aria-pressed={active} onClick={()=>change('bundle',String(size))}>{t(active?'이 묶음으로 계산 중':'이 묶음으로 계산')}</button></article>})}</div>
    <p className="trade-explanation">{t('가격과 세율이 같다면 나눠 파는 것만으로 총이익이 늘지는 않습니다. 등록 횟수에 따른 비용과 세금의 소수점 처리 때문에 차이가 날 수 있습니다.')}</p>
   </section>
  </>}
  <p className="trade-note">{t('입력한 가격에 전부 팔린다는 가정의 예상치입니다. 실시간 시세·미판매·재등록 비용은 자동 반영하지 않습니다. 입력은 이 브라우저에만 보관됩니다.')}</p>
 </section>;
}
