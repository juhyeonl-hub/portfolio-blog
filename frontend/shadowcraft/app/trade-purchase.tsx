import {useRef,useState} from 'react';
import {useLocale} from './locale';
import {MAX_BOOKS,MAX_ENTRIES,parseEntryAmount,parseWorkbook,type TradeWorkbook} from '../lib/trade-workbook';
export type PurchaseSeed={id:string;item:string;quantity:string;price:string;mode:'unit'|'total';fromLimit?:boolean};
export default function TradePurchase({seed,workbook,save,close,disabled}:{seed:PurchaseSeed;workbook:TradeWorkbook;save:(w:TradeWorkbook)=>boolean;close:()=>void;disabled:boolean}){
 const {t,locale}=useLocale(),[target,setTarget]=useState(''),[name,setName]=useState(seed.item),[quantity,setQuantity]=useState(seed.quantity),[price,setPrice]=useState(seed.price),[mode,setMode]=useState(seed.mode),[message,setMessage]=useState('');
 const submitted=useRef(false),parsed=parseEntryAmount(price,quantity,mode),book=workbook.books.find(b=>b.id===target);
 const valid=parsed&&(book||name.trim())&&(book?book.entries.length<MAX_ENTRIES:workbook.books.length<MAX_BOOKS);
 const record=()=>{
  if(!valid||!parsed||disabled||submitted.current)return;
  if(workbook.books.some(b=>b.entries.some(e=>e.id===seed.id))){close();return;}
  const b=book??{id:crypto.randomUUID(),name:name.trim(),entries:[]};
  const updated={...b,entries:[...b.entries,{id:seed.id,kind:'buy' as const,quantity:String(parsed.quantity),amount:String(parsed.amount),at:new Date().toISOString()}]};
  const next={...workbook,selected:b.id,books:book?workbook.books.map(x=>x.id===b.id?updated:x):[...workbook.books,updated]};
  try{parseWorkbook(JSON.stringify(next));submitted.current=true;if(!save(next)){submitted.current=false;throw Error('save');}close();}catch{setMessage(t('기록하지 못했습니다. 수량·금액과 저장 상태를 확인하세요.'));}
 };
 return <section className="panel trade-purchase-confirm"><h2>{t('실제로 산 내용 확인')}</h2><p>{t(seed.fromLimit?'구매 상한은 계산 예시입니다. 실제로 지불한 가격으로 고친 뒤 기록하세요.':'계산한 구매 내용을 가져왔습니다. 실제로 산 물량만 기록하세요.')}</p>
 <label className="trade-field"><span>{t('기록할 장부')}</span><select value={target} onChange={e=>setTarget(e.target.value)}><option value="">{t('새 품목으로 기록')}</option>{workbook.books.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 {!book&&<label className="trade-field"><span>{t('품목 이름')}</span><input maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label>}
 <div className="trade-planning-fields"><label className="trade-field"><span>{t('실제로 산 수량')}</span><input inputMode="numeric" maxLength={24} value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label className="trade-field"><span>{t(mode==='unit'?'실제 개당 구매 가격':'실제 전체 구매 비용')}</span><input inputMode="text" maxLength={40} value={price} onChange={e=>setPrice(e.target.value)}/></label><label className="trade-field"><span>{t('가격 입력 방법')}</span><select value={mode} onChange={e=>{setMode(e.target.value as 'unit'|'total');setPrice('');}}><option value="unit">{t('한 개 가격')}</option><option value="total">{t('전체 구매 비용')}</option></select></label></div>
 {parsed&&<p>{t('이번 매입 비용 {0}',[t('{0} 키나',[parsed.amount.toLocaleString(locale)])])}</p>}
 <div className="book-actions"><button className="button primary" disabled={!valid||disabled} onClick={record}>{t('확인한 구매를 장부에 기록')}</button><button className="button ghost" onClick={close}>{t('취소')}</button></div>{message&&<p role="alert">{message}</p>}</section>;
}
