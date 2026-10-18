import {useState} from 'react';
import icons from '../lib/data/map-icons.json';
import {mapIconKey} from '../lib/map-icon-key';
import {previewKinds} from '../lib/spawn-preview';

/** Original PNGs; atlas sprites use their exported baked UV rectangle. */
export default function MapMarkerIcon({kind,region='',objectId,completed=false,x=0,y=0,size=24}:{kind:string;region?:string;objectId?:number;completed?:boolean;x?:number;y?:number;size?:number}) {
  const key=kind==='trace' && completed ? 'traceComplete' : mapIconKey(kind,region,objectId);
  const icon=icons[key as keyof typeof icons];
  const [failed,setFailed]=useState('');
  return <svg x={x} y={y} width={size} height={size} viewBox={icon?.viewBox.join(' ') ?? '0 0 100 100'} overflow="hidden" aria-hidden="true" focusable="false" pointerEvents="none">
    {icon && failed!==icon.src ? <image href={icon.src} x={0} y={0} width={icon.width} height={icon.height} onError={()=>setFailed(icon.src)}/> : <rect data-icon-fallback="true" x={icon?.viewBox[0] ?? 0} y={icon?.viewBox[1] ?? 0} width={icon?.viewBox[2] ?? 100} height={icon?.viewBox[3] ?? 100} rx={10} fill={previewKinds[kind]?.color ?? '#fff'}/>}
  </svg>;
}
