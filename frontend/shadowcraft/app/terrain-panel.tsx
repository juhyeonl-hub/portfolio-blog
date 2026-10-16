import {useRef, useState} from 'react';
import verteron from '../lib/data/terrain-catalog.json';
import altgard from '../lib/data/terrain-altgard.json';
import poeta from '../lib/data/terrain-poeta.json';
import ishalgen from '../lib/data/terrain-ishalgen.json';
import reshantaLower from '../lib/data/terrain-reshanta-lower.json';
import reshantaMiddle from '../lib/data/terrain-reshanta-middle.json';
import terrainLabels from '../lib/data/terrain-labels.json';
import {constrainMapView, zoomMap, type MapView} from '../lib/world-map';
import {visibleTerrainTiles, terrainLabelNames} from '../lib/terrain-map';
const terrains: Record<string, typeof verteron> = {verteron, altgard, poeta, ishalgen, 'reshanta-lower': reshantaLower, 'reshanta-middle': reshantaMiddle};

export default function TerrainPanel() {
  const [selected, setSelected] = useState('verteron');
  const terrain = terrains[selected] ?? verteron;
  return <section className="terrain-panel" aria-label="공식 글로벌 지형 지도">
    <label>공식 지형 지역<select aria-label="공식 지형 지역" value={selected} onChange={e => setSelected(e.target.value)}>
      {Object.entries(terrains).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
    </select></label>
    <TerrainView key={selected} terrain={terrain}/>
  </section>;
}

function TerrainView({terrain}: {terrain: typeof verteron}) {
  const {name: terrainName, source, gridSize, basePath} = terrain;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MapView>({x:0, y:0, zoom:1});
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [retry, setRetry] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const regionLabels = terrainLabels.maps.find(map=>map.name === terrainName);
  const labels = regionLabels?.labels ?? [];
  const labelNames = terrainLabelNames(labels, view.zoom);
  const drag = useRef<{id:number; x:number; y:number; width:number; view:MapView} | null>(null);
  const size = 1000 / view.zoom;
  const tiles = visibleTerrainTiles(view, gridSize);
  return <div>
    <h3>{terrainName} 지형 지도</h3>
    <p>공식 글로벌 Steam 클라이언트 · 빌드 {source.buildId} · 지형 이미지 {gridSize * gridSize}개</p>
    <p>지형을 확대하고 이동할 수 있습니다. 수집물·NPC의 월드 좌표 정합성은 아직 검증 중이며, 아래에서 가져온 사용자 지도와 겹쳐 표시하지 않습니다.</p>
    <button className="button secondary" aria-expanded={open} onClick={() => {setOpen(v=>!v); drag.current=null;}}>{open ? '공식 지형 닫기' : `공식 ${terrainName} 지형 열기`}</button>
    {open && <>
      <div className="map-toolbar"><button className="button ghost" aria-label="지형 지도 축소" disabled={view.zoom===1} onClick={()=>setView(v=>zoomMap(v,v.zoom/2))}>−</button>
        <span>{view.zoom}배</span><button className="button ghost" aria-label="지형 지도 확대" disabled={view.zoom===8} onClick={()=>setView(v=>zoomMap(v,v.zoom*2))}>+</button>
        <button className="button ghost" onClick={()=>setView({x:0,y:0,zoom:1})}>지형 전체 보기</button>
        {labels.length > 0 && <label><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/>지역명 표시 ({labels.length})</label>}</div>
      {labels.length > 0 && <p>공식 지도에 배치된 지역명 {labels.length}개입니다. 겹치는 이름은 확대하면 나타납니다.{!!regionLabels?.unresolvedLabels.length && ` 이름을 확인하지 못한 ${regionLabels.unresolvedLabels.length}개는 표시하지 않습니다.`}</p>}
      {failed.size>0 && <p role="alert">지형 이미지 {failed.size}개를 불러오지 못했습니다. <button className="button ghost" onClick={()=>{setFailed(new Set());setRetry(v=>v+1);}}>지형 다시 불러오기</button></p>}
      <p>드래그 또는 방향키로 이동하세요. 지형 지도는 수집 진행도를 변경하지 않습니다.</p>
      <svg className="map-canvas terrain-canvas" role="group" aria-label={`${terrainName} 지형 이미지`} tabIndex={0} viewBox={`${view.x} ${view.y} ${size} ${size}`}
        onKeyDown={e=>{const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(Object.hasOwn(delta,e.key)){e.preventDefault();const [x,y]=delta[e.key];setView(v=>constrainMapView({...v,x:v.x+x*size/10,y:v.y+y*size/10}));}}}
        onPointerDown={e=>{if(e.button!==0)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,width:e.currentTarget.getBoundingClientRect().width,view};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId||!d.width)return;const scale=1000/d.view.zoom/d.width;setView(constrainMapView({...d.view,x:d.view.x-(e.clientX-d.x)*scale,y:d.view.y-(e.clientY-d.y)*scale}));}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
        <rect width="1000" height="1000" fill="#11141b"/>
        {tiles.map(tile=>{const id=`${tile.x}_${tile.y}`;return <image key={`${retry}-${id}`} x={tile.left} y={tile.top} width={tile.width} height={tile.width}
          href={`${basePath}/${id}.webp`} preserveAspectRatio="none" pointerEvents="none"
          onError={()=>setFailed(old=>new Set([...old,id]))} onLoad={()=>setFailed(old=>{if(!old.has(id))return old;const next=new Set(old);next.delete(id);return next;})}/>;})}
        {showLabels && labels.map(label=><g key={label.id} aria-label={label.name}>
          <title>{label.name}</title><circle cx={label.x} cy={label.y} r={2 / Math.sqrt(view.zoom)} fill="#fff" stroke="#11141b" strokeWidth={1 / Math.sqrt(view.zoom)}/>
          {labelNames.has(label.id) && <text x={label.x} y={label.y} textAnchor="middle"
          fontSize={12 / Math.sqrt(view.zoom)} fill="#fff" stroke="#11141b" strokeWidth={3 / Math.sqrt(view.zoom)}
          paintOrder="stroke" pointerEvents="none">{label.name}</text>}</g>)}
      </svg>
    </>}
  </div>;
}
