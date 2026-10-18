import {useEffect, useRef, useState} from 'react';
import verteron from '../lib/data/terrain-catalog.json';
import altgard from '../lib/data/terrain-altgard.json';
import poeta from '../lib/data/terrain-poeta.json';
import ishalgen from '../lib/data/terrain-ishalgen.json';
import reshantaLower from '../lib/data/terrain-reshanta-lower.json';
import reshantaMiddle from '../lib/data/terrain-reshanta-middle.json';
import terrainLabels from '../lib/data/terrain-labels.json';
import {constrainMapView, zoomMap, mapProgressKey, loadMapProgress, saveMapProgress, type MapView} from '../lib/world-map';
import {visibleTerrainTiles, terrainLabelNames, searchTerrainLocations, terrainLocationView} from '../lib/terrain-map';
import {previewMatches, visiblePreview, previewKinds, previewPage, previewProgressDataset, type SpawnPreview} from '../lib/spawn-preview';
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
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [preview, setPreview] = useState<SpawnPreview[]>([]);
  const [previewOn, setPreviewOn] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [enabledKinds, setEnabledKinds] = useState<Set<string>>(new Set(['teleport']));
  const [previewQuery, setPreviewQuery] = useState('');
  const [previewSelection, setPreviewSelection] = useState('');
  const [page, setPage] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hideCompleted, setHideCompleted] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const progressKey = useRef('');
  const writable = useRef(false);
  const previewResults = previewMatches(preview, enabledKinds, previewQuery).filter(row=>!hideCompleted || !completed.has(row.id));
  const paged = previewPage(previewResults, page, previewSelection);
  const previewVisible = visiblePreview(previewResults, view);
  const chosenPreview = previewResults.find(row=>row.id===previewSelection);
  const previewDraw = [...previewVisible.filter(row=>row.id===previewSelection),...previewVisible.filter(row=>row.id!==previewSelection)].slice(0,400);
  async function togglePreview() {
    if(previewOn){setPreviewOn(false);return;}
    setPreviewError(false);setPreviewLoading(true);
    try {
      const {default: data} = await import('../lib/data/spawn-preview.json');
      const map=data.maps.find(row=>row.name===terrainName);
      if(!map || data.worldProjectionVerified !== false) throw Error('Invalid preview');
      const dataset=previewProgressDataset(terrainName,map.markers);
      const key=await mapProgressKey(dataset);
      let progress={completed:[] as string[],writable:false};
      try {progress=loadMapProgress(localStorage,key,dataset);} catch { /* Storage unavailable. */ }
      progressKey.current=key;writable.current=progress.writable;
      setCompleted(new Set(progress.completed));
      setStorageNotice(progress.writable?'':'저장된 기록을 읽지 못했습니다. 기존 기록은 유지하고 이번 변경은 화면에서만 기억합니다.');
      setPreview(map.markers);setPreviewOn(true);setOpen(true);
    } catch {setPreviewError(true);} finally {setPreviewLoading(false);}
  }
  function focusPreview(row: SpawnPreview) {
    setPreviewSelection(row.id);setView(terrainLocationView(row));setOpen(true);drag.current=null;
  }
  function markPreview(id: string) {
    const next=new Set(completed);if(next.has(id))next.delete(id);else next.add(id);
    setCompleted(next);
    if(!writable.current)return;
    let saved=false;
    try {saved=saveMapProgress(localStorage,progressKey.current,[...next].sort());} catch { /* Memory-only. */ }
    if(!saved)setStorageNotice('기록을 저장하지 못했습니다. 이번 변경은 화면에서만 기억합니다.');
  }
  const regionLabels = terrainLabels.maps.find(map=>map.name === terrainName);
  const labels = regionLabels?.labels ?? [];
  const labelNames = terrainLabelNames(labels, view.zoom);
  const matches = searchTerrainLocations(labels, query);
  const selectedLabel = labels.find(label => label.id === selectedLocation);
  const drag = useRef<{id:number; x:number; y:number; width:number; view:MapView} | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    function wheel(event: WheelEvent) {
      if(!canvas || event.deltaY===0 || event.ctrlKey)return;
      event.preventDefault();
      const rect=canvas.getBoundingClientRect();
      if(!rect.width || !rect.height)return;
      const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      const y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
      drag.current=null;
      setView(v=>{
        const zoom=Math.max(1,Math.min(8,v.zoom*(event.deltaY<0?2:.5)));
        const offset=1000/v.zoom-1000/zoom;
        return constrainMapView({zoom,x:v.x+x*offset,y:v.y+y*offset});
      });
    }
    canvas.addEventListener('wheel',wheel,{passive:false});
    return ()=>canvas.removeEventListener('wheel',wheel);
  },[open]);
  const size = 1000 / view.zoom;
  const tiles = visibleTerrainTiles(view, gridSize);
  return <div>
    <h3>{terrainName} 지형 지도</h3>
    <p>공식 글로벌 Steam 클라이언트 · 빌드 {source.buildId} · 지형 이미지 {gridSize * gridSize}개</p>
    <p>지형을 확대하고 이동할 수 있습니다. 수집물·NPC의 월드 좌표 정합성은 아직 검증 중이며, 아래에서 가져온 사용자 지도와 겹쳐 표시하지 않습니다.</p>
    <button className="button secondary" aria-expanded={open} onClick={() => {setOpen(v=>!v); drag.current=null;}}>{open ? '공식 지형 닫기' : `공식 ${terrainName} 지형 열기`}</button>
    {labels.length > 0 && <div className="terrain-search">
      <label>지역명 검색<input type="search" aria-label="공식 지도 지역명 검색" value={query} maxLength={100}
        placeholder="예: Guard Post" onChange={e=>setQuery(e.target.value)}/></label>
      <label>검색한 위치<select aria-label="공식 지도 검색 결과" value={matches.some(label=>label.id===selectedLocation) ? selectedLocation : ''}
        onChange={e=>{const label=labels.find(item=>item.id===e.target.value);if(!label)return;
          setSelectedLocation(label.id);setView(terrainLocationView(label));setShowLabels(true);setOpen(true);drag.current=null;}}>
        <option value="">{matches.length ? `위치 선택 (${matches.length}개)` : '검색 결과 없음'}</option>
        {matches.map(label=><option key={label.id} value={label.id}>{label.name}</option>)}
      </select></label>
      {query.trim() && <p role="status">검색 결과 {matches.length}개</p>}
    </div>}
    {<div className="notice">
      <div><strong>실험: 공식 위치 미리보기</strong>
      <p>공식 클라이언트의 후보 위치입니다. 지도상의 위치 정확도는 미검증이며 실제 출현·이용 가능 여부를 뜻하지 않습니다.</p>
      <button className="button secondary" disabled={previewLoading} aria-expanded={previewOn} onClick={()=>void togglePreview()}>
        {previewLoading?'위치 자료 불러오는 중':previewOn?'실험 위치 숨기기':'실험 위치 보기'}</button>
      {previewError && <p role="alert">위치 자료를 불러오지 못했습니다. 다시 시도해 주세요.</p>}
      {previewOn && <>
        <fieldset className="map-layers" aria-label="지도 표시 항목">
          <legend>표시할 항목 · 여러 개 선택 가능</legend>
          {Object.entries(previewKinds).map(([key,category])=>{
            const count=preview.filter(row=>row.kind===key).length;
            return <label key={key}><input type="checkbox" aria-label={key==='cube'?'히든큐브':category.name}
              disabled={count===0} checked={enabledKinds.has(key)}
              onChange={e=>{const next=new Set(enabledKinds);if(e.target.checked)next.add(key);else next.delete(key);
                setEnabledKinds(next);setPreviewSelection('');setPage(0);}}/>
              <span aria-hidden="true" style={{color:category.color}}>●</span>
              {key==='cube'?'히든큐브':category.name} ({count})</label>;
          })}
        </fieldset>
        <div className="map-toolbar">
          <button className="button ghost" onClick={()=>{setEnabledKinds(new Set(preview.map(row=>row.kind)));setPreviewSelection('');setPage(0);}}>항목 전체 켜기</button>
          <button className="button ghost" onClick={()=>{setEnabledKinds(new Set());setPreviewSelection('');setPage(0);}}>항목 전체 끄기</button>
        </div>
        {enabledKinds.size===0 && <p role="status">표시할 항목을 체크해 주세요.</p>}
        <p>히든큐브·채집물·던전 입구 등 확보된 후보 위치를 표시합니다. 봉인던전의 별도 분류, 깃털, 주둔지 전용 위치는 아직 연결되지 않았습니다. Empyrean Trace는 원본 이름으로 표시합니다.</p>
        <label>이름 검색<input aria-label="실험 위치 검색" type="search" maxLength={100} value={previewQuery} onChange={e=>{setPreviewQuery(e.target.value);setPreviewSelection('');setPage(0);}}/></label>
        <label>후보 위치<select aria-label="실험 위치 선택" value={chosenPreview?.id ?? ''} onChange={e=>{const row=previewResults.find(item=>item.id===e.target.value);if(!row)return;focusPreview(row);}}>
          <option value="">후보 선택</option>{paged.rows.map((row,i)=><option key={row.id} value={row.id}>{row.name} · {i+1}</option>)}
        </select></label>
        <p role="status">검색 결과 {previewResults.length}개 · 현재 화면 {previewVisible.length}개{previewVisible.length>400?' · 지도에는 앞 400개 표시, 확대하거나 검색해 주세요.':''}</p>
        <div className="map-toolbar">
          <button className="button ghost" disabled={paged.current===0} onClick={()=>setPage(paged.current-1)}>위치 이전 페이지</button>
          <span>{paged.current+1} / {paged.pages}</span>
          <button className="button ghost" disabled={paged.current+1>=paged.pages} onClick={()=>setPage(paged.current+1)}>위치 다음 페이지</button>
        </div>
        <label className="map-check"><input type="checkbox" checked={hideCompleted} onChange={e=>{setHideCompleted(e.target.checked);setPage(0);}}/>확인한 위치 숨기기</label>
        <p>확인 기록 {completed.size}개 · 이 브라우저에 저장됩니다. 후보 지점별 기록이며 실제 수집 개수를 뜻하지 않습니다.</p>
        {storageNotice && <p role="alert">{storageNotice}</p>}
        {chosenPreview && <div className="map-detail">
          <label className="map-check"><input type="checkbox" checked={completed.has(chosenPreview.id)} onChange={()=>markPreview(chosenPreview.id)}/>이 위치 확인 완료</label>
          <button className="button ghost" onClick={()=>focusPreview(chosenPreview)}>후보 위치로 돌아가기</button>
          <p>선택: {chosenPreview.name} · 원본 위치 {chosenPreview.world.map(v=>Math.round(v)).join(', ')} · 후보 지점이며 출현 보장 없음</p><p>같은 이름의 여러 지점은 조건별·대체 배치일 수 있습니다.</p></div>}
      </>}
      </div>
    </div>}
    {open && <>
      <div className="map-toolbar"><button className="button ghost" aria-label="지형 지도 축소" disabled={view.zoom===1} onClick={()=>setView(v=>zoomMap(v,v.zoom/2))}>−</button>
        <span>{Number(view.zoom.toFixed(1))}배</span><button className="button ghost" aria-label="지형 지도 확대" disabled={view.zoom===8} onClick={()=>setView(v=>zoomMap(v,v.zoom*2))}>+</button>
        <button className="button ghost" onClick={()=>setView({x:0,y:0,zoom:1})}>지형 전체 보기</button>
        {labels.length > 0 && <label><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/>지역명 표시 ({labels.length})</label>}</div>
      {labels.length > 0 && <p>공식 지도에 배치된 지역명 {labels.length}개입니다. 겹치는 이름은 확대하면 나타납니다.{!!regionLabels?.unresolvedLabels.length && ` 이름을 확인하지 못한 ${regionLabels.unresolvedLabels.length}개는 표시하지 않습니다.`}</p>}
      {selectedLabel && <p role="status">선택한 지역: <strong>{selectedLabel.name}</strong>
        <button className="button ghost" onClick={()=>setView(terrainLocationView(selectedLabel))}>선택 위치로 이동</button>
        <button className="button ghost" onClick={()=>setSelectedLocation('')}>위치 선택 해제</button></p>}
      {failed.size>0 && <p role="alert">지형 이미지 {failed.size}개를 불러오지 못했습니다. <button className="button ghost" onClick={()=>{setFailed(new Set());setRetry(v=>v+1);}}>지형 다시 불러오기</button></p>}
      <p>+/− 버튼이나 마우스 휠로 확대·축소하고, 드래그 또는 방향키로 이동하세요. 마커를 선택하면 상세와 확인 기록을 볼 수 있습니다.</p>
      <svg ref={canvasRef} className="map-canvas terrain-canvas" role="group" aria-label={`${terrainName} 지형 이미지`} tabIndex={0} viewBox={`${view.x} ${view.y} ${size} ${size}`}
        onKeyDown={e=>{const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(Object.hasOwn(delta,e.key)){e.preventDefault();const [x,y]=delta[e.key];setView(v=>constrainMapView({...v,x:v.x+x*size/10,y:v.y+y*size/10}));}}}
        onPointerDown={e=>{if(e.button!==0)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,width:e.currentTarget.getBoundingClientRect().width,view};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId||!d.width)return;const scale=1000/d.view.zoom/d.width;setView(constrainMapView({...d.view,x:d.view.x-(e.clientX-d.x)*scale,y:d.view.y-(e.clientY-d.y)*scale}));}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
        <rect width="1000" height="1000" fill="#11141b"/>
        {tiles.map(tile=>{const id=`${tile.x}_${tile.y}`;return <image key={`${retry}-${id}`} x={tile.left} y={tile.top} width={tile.width} height={tile.width}
          href={`${basePath}/${id}.webp`} preserveAspectRatio="none" pointerEvents="none"
          onError={()=>setFailed(old=>new Set([...old,id]))} onLoad={()=>setFailed(old=>{if(!old.has(id))return old;const next=new Set(old);next.delete(id);return next;})}/>;})}
        {previewOn && previewDraw.map(row=><circle key={row.id} data-preview-marker={row.kind}
          cx={row.x} cy={row.y} r={(row.id===previewSelection?6:3)/Math.sqrt(view.zoom)}
          fill={previewKinds[row.kind]?.color ?? '#fff'} opacity={completed.has(row.id)?.4:1} stroke="#11141b" strokeWidth={1/Math.sqrt(view.zoom)}
          role="button" tabIndex={0} aria-label={`${row.name} 후보 위치`} aria-pressed={row.id===previewSelection}
          onPointerDown={e=>e.stopPropagation()} onClick={()=>focusPreview(row)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();focusPreview(row);}}}>
          <title>{row.name} · 미검증 후보 위치</title></circle>)}
        {selectedLabel && <circle aria-label={`선택 위치: ${selectedLabel.name}`} cx={selectedLabel.x} cy={selectedLabel.y}
          r={10 / Math.sqrt(view.zoom)} fill="#fbbf2433" stroke="#fbbf24" strokeWidth={2 / Math.sqrt(view.zoom)} pointerEvents="none"/>}
        {showLabels && labels.map(label=><g key={label.id} aria-label={label.name}>
          <title>{label.name}</title><circle cx={label.x} cy={label.y} r={2 / Math.sqrt(view.zoom)} fill="#fff" stroke="#11141b" strokeWidth={1 / Math.sqrt(view.zoom)}/>
          {(labelNames.has(label.id) || label.id === selectedLocation) && <text x={label.x} y={label.y} textAnchor="middle"
          fontSize={12 / Math.sqrt(view.zoom)} fill="#fff" stroke="#11141b" strokeWidth={3 / Math.sqrt(view.zoom)}
          paintOrder="stroke" pointerEvents="none">{label.name}</text>}</g>)}
      </svg>
    </>}
  </div>;
}
