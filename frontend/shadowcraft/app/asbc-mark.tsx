/** ASBC mark: "AS / BC" in four cells with C highlighted (same design as shadowcraft/operations/build-asbc-icons.py, small version). */
export function AsbcMark({size=37}:{size?:number}){
 const gap=3,pad=3,cell=(100-2*pad-gap)/2;
 return <svg className="asbc-mark" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="14" fill="#171a21"/>
  {[...'ASBC'].map((ch,i)=>{const x=pad+(i%2)*(cell+gap),y=pad+Math.floor(i/2)*(cell+gap),c=ch==='C';
   return <g key={ch}><rect x={x} y={y} width={cell} height={cell} rx={6} fill={c?'#1ec8ff':'#1b2838'}/><text x={x+cell/2} y={y+cell/2} textAnchor="middle" dominantBaseline="central" style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:40}} fill={c?'#06202e':'#eaf6ff'}>{ch}</text></g>;})}
 </svg>;
}
