// Whether NCSOFT has started publishing the official Abyss/Arena rankings (backend daily probe, see
// OfficialRankingProbe). Until it has, PvP builds are recommender output and the ranker list is combat power only.
export const RANKING_AVAILABILITY_URL='/api/public/shadowcraft/ranking-availability';
export const RANKING_KINDS=['abyss','arenaOfSolitude','arenaOfCooperation'] as const;
export type RankingKind=typeof RANKING_KINDS[number];
export type RankingAvailability={checkedAt:string|null;published:Record<RankingKind,boolean>;failed:boolean};
export const RANKING_KIND_NAMES:Record<RankingKind,string>={abyss:'어비스',arenaOfSolitude:'고독의 아레나',arenaOfCooperation:'협력의 아레나'};

export function validRankingAvailability(value:unknown):value is RankingAvailability{
 if(!value||typeof value!=='object')return false;
 const v=value as RankingAvailability;
 if(v.checkedAt!==null&&(typeof v.checkedAt!=='string'||Number.isNaN(Date.parse(v.checkedAt))))return false;
 if(typeof v.failed!=='boolean'||!v.published||typeof v.published!=='object')return false;
 return RANKING_KINDS.every(kind=>typeof v.published[kind]==='boolean');
}

/** null when the probe could not be read; the screens then say the status is unknown. */
export function loadRankingAvailability(fetchImpl:typeof fetch=fetch):Promise<RankingAvailability|null>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 return fetchImpl(RANKING_AVAILABILITY_URL,{signal:controller.signal}).then(async response=>{
  if(!response.ok)return null;
  const data:unknown=await response.json();
  return validRankingAvailability(data)?data:null;
 }).catch(()=>null).finally(()=>clearTimeout(timer));
}

/** Source-language (Korean) sentence with its placeholders for the ranker section; the caller translates it. */
export function rankingAvailabilityText(value:RankingAvailability|null|undefined,t:(s:string)=>string=s=>s):{text:string;values:unknown[]}{
 if(value===undefined)return {text:'공식 어비스·아레나 랭킹 공개 여부 확인 중…',values:[]};
 if(value===null)return {text:'공식 어비스·아레나 랭킹 공개 여부를 확인하지 못했습니다. 공개되면 PvP 랭커 빌드를 가져옵니다.',values:[]};
 const published=RANKING_KINDS.filter(kind=>value.published[kind]);
 const when=value.checkedAt?new Date(value.checkedAt).toISOString().slice(0,10):'';
 if(published.length)return {text:'공식 {0} 랭킹이 공개되었습니다 (확인 {1}). PvP 랭커 빌드 가져오기를 준비합니다.',values:[published.map(kind=>t(RANKING_KIND_NAMES[kind])).join('·'),when]};
 if(value.failed&&!value.checkedAt)return {text:'공식 어비스·아레나 랭킹 공개 여부를 아직 확인하지 못했습니다. 공개되면 PvP 랭커 빌드를 가져옵니다.',values:[]};
 return {text:'공식 어비스·아레나 랭킹은 아직 공개 전입니다 (마지막 확인 {0}). 공개되면 PvP 랭커 빌드를 가져옵니다.',values:[when]};
}
