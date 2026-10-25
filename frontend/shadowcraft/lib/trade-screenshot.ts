import {parseTradeMoney,parseTradeInteger,MAX_TRADE_QUANTITY} from './trade-calculator';
export type TradeScan={name:string;price:string;quantity:string};
export type PriceCandidate={text:string;value:string;context:string};
// OCR supplies candidates, never final inputs. Labels and the user's confirmation determine their meaning.
export function tradePriceCandidates(text:string):PriceCandidate[]{
 const result:PriceCandidate[]=[];const seen=new Set<string>();
 for(const line of text.slice(0,30000).split(/\r?\n/)){
  if(/남은\s*시간|현재\s*세율/.test(line))continue;
  const pattern=/\d[\d,]*(?:\.\d+)?(?:\s*[조억만천백십](?:\s*\d[\d,]*(?:\.\d+)?)?)*/g;
  for(const match of line.matchAll(pattern)){
   const raw=match[0].trim();const next=line.slice((match.index??0)+match[0].length).trimStart();
   if(/^(?:%|일|시간|분|초|개|\/)/.test(next))continue;
   const value=parseTradeMoney(raw);if(value===null||value===0n||(!/[만억조천백십,]/.test(raw)&&raw.replace(/\D/g,'').length<3))continue;
   if(seen.has(String(value)))continue;seen.add(String(value));result.push({text:raw,value:String(value),context:line.trim().slice(0,160)});
   if(result.length>=30)return result;
  }
 }
 return result;
}
export function quantityFromPrices(unit:string,total:string):string{
 const u=parseTradeMoney(unit),all=parseTradeMoney(total);if(u===null||all===null||u===0n||all%u!==0n)return '';
 const q=all/u;return parseTradeInteger(String(q),MAX_TRADE_QUANTITY,1n)===null?'':String(q);
}
export function scanName(text:string):string{
 const lines=text.slice(0,30000).split(/\r?\n/).map(l=>l.trim());
 return lines.find(l=>/[가-힣A-Za-z]{2}/.test(l)&&l.length<=50&&!/거래소|판매|구매|아이템|시간|수량|가격|금액|전체|정산|메인|교환소|선택|현재|세율|키나|\d/.test(l))||'';
}
