import {useEffect,useState,type ReactNode} from 'react';
// Heavy tools stay on this page without making armory/reference requests at initial load.
export default function BuildExtra({id,title,requested,revision,children}:{id:string;title:string;requested:boolean;revision:number;children:ReactNode}){
 const [open,setOpen]=useState(requested),[visited,setVisited]=useState(requested);
 useEffect(()=>{if(requested){setOpen(true);setVisited(true)}},[requested,revision]);
 return <details id={'build-section-'+id} className="build-extra" open={open} onToggle={e=>{const value=e.currentTarget.open;setOpen(value);if(value)setVisited(true)}} tabIndex={-1}>
 <summary>{title}</summary>{visited&&<div className="build-extra-content">{children}</div>}
 </details>;
}
