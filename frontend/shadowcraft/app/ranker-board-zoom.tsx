import {useState,type ReactNode} from 'react';
import {useLocale} from './locale';
import {rankerText} from '../lib/ranker-comparison-text';
export default function RankerBoardZoom({children}:{children:ReactNode}){
 const {locale}=useLocale(),[zoom,setZoom]=useState(false);
 return <div className="ranker-board-zoom" data-expanded={zoom}><button type="button" className="button secondary" aria-pressed={zoom} onClick={()=>setZoom(v=>!v)}>{rankerText(locale,zoom?'fit':'zoom')}</button>{zoom&&<p>{rankerText(locale,'pan')}</p>}<div className="ranker-board-scroll">{children}</div></div>;
}
