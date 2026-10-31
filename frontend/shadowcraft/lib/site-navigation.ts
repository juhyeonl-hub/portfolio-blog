export type SiteLink={id:string;label:string};
export type SiteGroup={label:string;items:SiteLink[]};
export const SITE_NAV:(SiteLink|SiteGroup)[]=[
 {id:'home',label:'메인'},
 {id:'quick',label:'빌드'},
 {label:'빌드 찾기',items:[{id:'people',label:'캐릭터 찾기'},{id:'public-builds',label:'공개 빌드'},{id:'rankers',label:'랭킹'}]},
 {label:'게임 도구',items:[{id:'map',label:'지도 & 수집'},{id:'timers',label:'콘텐츠 타이머'},{id:'trade',label:'거래소 계산기'},{id:'population',label:'접속 현황'}]},
 {id:'builds',label:'빌드 보관함'},
 {label:'자료',items:[{id:'database',label:'글로벌 데이터'},{id:'updates',label:'업데이트'}]},
];
const BUILD_SCREENS=new Set(['quick','skills','daevanion','gear','macro','rotation','compare','save']);
export const navActive=(active:string,id:string)=>id==='quick'?BUILD_SCREENS.has(active):active===id;
