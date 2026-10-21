export const FAVORITE_TOOLS=[
 {id:'quick',title:'빌드 플래너'}, {id:'map',title:'지도 & 수집'},
 {id:'public-builds',title:'빌드 커뮤니티'}, {id:'builds',title:'저장한 빌드'},
 {id:'database',title:'글로벌 데이터'}, {id:'updates',title:'공식 업데이트'},
] as const;
export type FavoriteId=typeof FAVORITE_TOOLS[number]['id'];
export const favoritesKey=(memberId:string)=>'a2bc-home-favorites-v1:'+memberId;
export function parseFavorites(raw:string):FavoriteId[]{
 const value:unknown=JSON.parse(raw);
 if(!Array.isArray(value)||value.length>FAVORITE_TOOLS.length||value.some(id=>!FAVORITE_TOOLS.some(tool=>tool.id===id)))throw Error('Invalid favorites');
 return [...new Set(value)] as FavoriteId[];
}
