import {useEffect, useRef, useState} from 'react';
import MapMarkerIcon from './map-marker-icon';
import {useLocale} from './locale';
import verteron from '../lib/data/terrain-catalog.json';
import altgard from '../lib/data/terrain-altgard.json';
import poeta from '../lib/data/terrain-poeta.json';
import ishalgen from '../lib/data/terrain-ishalgen.json';
import reshantaLower from '../lib/data/terrain-reshanta-lower.json';
import reshantaMiddle from '../lib/data/terrain-reshanta-middle.json';
import terrainLabels from '../lib/data/terrain-labels.json';
import legacyProgressKeys from '../lib/data/map-progress-legacy.json';
import {constrainMapView, zoomMap, mapProgressKey, loadMapProgressWithLegacy, saveMapProgress, type MapView} from '../lib/world-map';
import {visibleTerrainTiles, terrainLabelNames, searchTerrainLocations, terrainLocationView} from '../lib/terrain-map';
import {nearestTeleports, previewMatches, visiblePreview, previewKinds, previewGatherKinds, previewKindLabel, previewPage, previewProgressDataset, type SpawnPreview} from '../lib/spawn-preview';
const terrains: Record<string, typeof verteron> = {verteron, altgard, poeta, ishalgen, 'reshanta-lower': reshantaLower, 'reshanta-middle': reshantaMiddle};

export default function TerrainPanel({active=false}:{active?:boolean}) {
  const {t} = useLocale();
  const [selected, setSelected] = useState('verteron');
  const terrain = terrains[selected] ?? verteron;
  return <section className="terrain-panel" aria-label={t('공식 글로벌 지형 지도')}>
    <label>{t('공식 지형 지역')}<select aria-label={t('공식 지형 지역')} value={selected} onChange={e => setSelected(e.target.value)}>
      {Object.entries(terrains).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
    </select></label>
    <TerrainView key={selected} terrain={terrain} active={active}/>
  </section>;
}

function TerrainView({terrain,active}: {terrain: typeof verteron; active: boolean}) {
  const {t} = useLocale();
  const {name: terrainName, source, gridSize, basePath} = terrain;
  const [open, setOpen] = useState(false);
  const [controlsOpen,setControlsOpen]=useState(()=>!window.matchMedia('(max-width:760px)').matches);
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
  const [excludedGatherNames, setExcludedGatherNames] = useState<Set<string>>(new Set());
  const gatherKinds = previewGatherKinds(preview);
  const [previewQuery, setPreviewQuery] = useState('');
  const [previewSelection, setPreviewSelection] = useState('');
  const [page, setPage] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hideCompleted, setHideCompleted] = useState(false);
  const [storageNotice, setStorageNotice] = useState('');
  const progressKey = useRef('');
  const writable = useRef(false);
  const previewResults = previewMatches(preview, enabledKinds, previewQuery, excludedGatherNames).filter(row=>!hideCompleted || !completed.has(row.id));
  const paged = previewPage(previewResults, page, previewSelection);
  const previewVisible = visiblePreview(previewResults, view);
  const detailRef = useRef<HTMLElement>(null);
  useEffect(()=>{if(previewSelection && window.matchMedia('(max-width:700px)').matches)detailRef.current?.scrollIntoView({block:'nearest'});},[previewSelection]);
  const [nearbyId,setNearbyId] = useState('');
  const chosenPreview = previewResults.find(row=>row.id===previewSelection);
  const nearby = chosenPreview ? nearestTeleports(preview,chosenPreview) : [];
  const nearbyFocus = nearby.find(row=>row.id===nearbyId);
  const previewDraw = [...previewVisible.filter(row=>row.id===previewSelection),...previewVisible.filter(row=>row.id!==previewSelection)].slice(0,400);
  async function togglePreview(openMap = true) {
    if(previewOn){setPreviewOn(false);return;}
    setPreviewError(false);setPreviewLoading(true);
    try {
      const {default: data} = await import('../lib/data/spawn-preview.json');
      const map=data.maps.find(row=>row.name===terrainName);
      if(!map || data.worldProjectionVerified !== false) throw Error('Invalid preview');
      const dataset=previewProgressDataset(terrainName,map.markers);
      const key=await mapProgressKey(dataset);
      let progress={completed:[] as string[],writable:false};
      try {progress=loadMapProgressWithLegacy(localStorage,key,dataset,(legacyProgressKeys as Record<string,string>)[terrainName]);} catch { /* Storage unavailable. */ }
      progressKey.current=key;writable.current=progress.writable;
      setCompleted(new Set(progress.completed));
      setStorageNotice(progress.writable?'':'저장된 기록을 읽지 못했습니다. 기존 기록은 유지하고 이번 변경은 화면에서만 기억합니다.');
      setPreview(map.markers);setPreviewOn(true);if(openMap)setOpen(true);
    } catch {setPreviewError(true);} finally {setPreviewLoading(false);}
  }
  // The map opens the first time the tab is shown, so visitors see it without an extra click; it stays hidden (and unloaded) otherwise.
  const autoOpened = useRef(false);
  useEffect(() => {if(active && !autoOpened.current){autoOpened.current=true;showTerrain();}}, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  function showTerrain() {
    setOpen(true);drag.current=null;
    if(!previewOn && !previewLoading)void togglePreview(false);
  }
  function focusPreview(row: SpawnPreview) {
    setNearbyId('');
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
  return <div className={open?"terrain-workspace terrain-workspace-open":"terrain-workspace"}>
    <div className="terrain-overview"><h3>{t('{0} 지형 지도',[terrainName])}</h3>
    <p className="subtle">{t('게임 클라이언트 자료로 표시한 위치입니다. 일부는 실제 게임과 다를 수 있습니다.')}</p>
    <details className="terrain-source"><summary>{t('지도 출처와 데이터 안내')}</summary><p>{t('공식 글로벌 Steam 클라이언트 · 빌드 {0} · 지형 이미지 {1}개. 수집물·NPC의 좌표는 대조 중입니다. 사용자 지도 파일과는 별도로 표시합니다.',[source.buildId,gridSize * gridSize])}</p></details>
    <button className="button secondary" aria-expanded={open} onClick={() => {if(open)setOpen(false);else showTerrain();drag.current=null;}}>{open ? t('공식 지형 닫기') : t('공식 {0} 지형 열기',[terrainName])}</button>
    {labels.length > 0 && <div className="terrain-search">
      <label>{t('지역명 검색')}<input type="search" aria-label={t('공식 지도 지역명 검색')} value={query} maxLength={100}
        placeholder={t('예: Guard Post')} onChange={e=>setQuery(e.target.value)}/></label>
      <label>{t('검색한 위치')}<select aria-label={t('공식 지도 검색 결과')} value={matches.some(label=>label.id===selectedLocation) ? selectedLocation : ''}
        onChange={e=>{const label=labels.find(item=>item.id===e.target.value);if(!label)return;
          setSelectedLocation(label.id);setView(terrainLocationView(label));setShowLabels(true);showTerrain();}}>
        <option value="">{matches.length ? t('위치 선택 ({0}개)',[matches.length]) : t('검색 결과 없음')}</option>
        {matches.map(label=><option key={label.id} value={label.id}>{label.name}</option>)}
      </select></label>
      {query.trim() && <p role="status">{t('검색 결과 {0}개',[matches.length])}</p>}
    </div>}
    </div>
    {<details className="terrain-controls" open={controlsOpen} onToggle={e=>setControlsOpen(e.currentTarget.open)}>
      <summary>{t('지도 표시 항목')}</summary><div>
      <button className="button secondary" disabled={previewLoading} aria-expanded={previewOn} onClick={()=>void togglePreview()}>
        {previewLoading?t('위치 자료 불러오는 중'):previewOn?t('마커 숨기기'):t('마커 보기')}</button>
      {previewError && <p role="alert">{t('위치 자료를 불러오지 못했습니다. 다시 시도해 주세요.')}</p>}
      {previewOn && <>
        <fieldset className="map-layers" aria-label={t('지도 표시 항목')}>
          <legend>{t('표시할 항목 · 여러 개 선택 가능')}</legend>
          {Object.entries(previewKinds).map(([key])=>{
            const rows=preview.filter(row=>row.kind===key),count=rows.length,done=rows.filter(row=>completed.has(row.id)).length;
            return <label key={key} className="map-legend-row"><input type="checkbox" aria-label={t(previewKindLabel(key))}
              disabled={count===0} checked={enabledKinds.has(key)}
              onChange={e=>{const next=new Set(enabledKinds);if(e.target.checked)next.add(key);else next.delete(key);
                setEnabledKinds(next);setPreviewSelection('');setPage(0);}}/>
              <MapMarkerIcon kind={key} region={terrainName}/>
              <span className="map-legend-name">{t(previewKindLabel(key))} ({count})</span>
              {count>0&&<span className="map-legend-done" title={t('확인 {0}/{1}',[done,count])}>{Math.round(done/count*100)}%<i className="map-progress"><b style={{width:`${done/count*100}%`}}/></i></span>}</label>;
          })}
        </fieldset>
        <div className="map-toolbar">
          <button className="button ghost" onClick={()=>{setEnabledKinds(new Set(preview.map(row=>row.kind)));setExcludedGatherNames(new Set());setPreviewSelection('');setPage(0);}}>{t('항목 전체 켜기')}</button>
          <button className="button ghost" onClick={()=>{setEnabledKinds(new Set());setPreviewSelection('');setPage(0);}}>{t('항목 전체 끄기')}</button>
        </div>
        {enabledKinds.has('gather') && gatherKinds.length>0 && <details className="gather-filters">
          <summary>{t('채집물 종류 선택 · {0}/{1}종 표시',[gatherKinds.length-excludedGatherNames.size,gatherKinds.length])}</summary>
          <fieldset className="map-layers" aria-label={t('채집 자원별 표시')}>
            <legend>{t('원하는 자원만 체크하세요')}</legend>
            {gatherKinds.map(({name,count})=><label key={name}>
              <input type="checkbox" aria-label={t('채집물 {0}',[name])} checked={!excludedGatherNames.has(name)}
                onChange={e=>{const next=new Set(excludedGatherNames);if(e.target.checked)next.delete(name);else next.add(name);
                  setExcludedGatherNames(next);setPreviewSelection('');setPage(0);}}/>
              {name} ({count})</label>)}
          </fieldset>
          <div className="map-toolbar">
            <button className="button ghost" onClick={()=>{setExcludedGatherNames(new Set());setPreviewSelection('');setPage(0);}}>{t('채집물 전체 켜기')}</button>
            <button className="button ghost" onClick={()=>{setExcludedGatherNames(new Set(gatherKinds.map(row=>row.name)));setPreviewSelection('');setPage(0);}}>{t('채집물 전체 끄기')}</button>
          </div>
          <p>{t('글로벌 원본 자원명으로 구분합니다. 마커를 선택하면 해당 자원 이름을 볼 수 있습니다.')}</p>
        </details>}
        {enabledKinds.size===0 && <p role="status">{t('표시할 항목을 체크해 주세요.')}</p>}
        <p>{t('봉인던전은 입구, 주둔지는 구역 중심을 표시합니다. 깃털은 Empyrean Trace의 통칭입니다. 항목 옆 숫자는 조건별 배치를 포함한 후보 지점 수이며 현재 출현·수집 가능 수가 아닙니다.')}</p>
        <label>{t('이름 검색')}<input aria-label={t('실험 위치 검색')} type="search" maxLength={100} value={previewQuery} onChange={e=>{setPreviewQuery(e.target.value);setPreviewSelection('');setPage(0);}}/></label>
        <label>{t('후보 위치')}<select aria-label={t('실험 위치 선택')} value={chosenPreview?.id ?? ''} onChange={e=>{const row=previewResults.find(item=>item.id===e.target.value);if(!row)return;focusPreview(row);}}>
          <option value="">{t('후보 선택')}</option>{paged.rows.map((row,i)=><option key={row.id} value={row.id}>{row.name} · {i+1}</option>)}
        </select></label>
        <p role="status">{t('검색 결과 {0}개 · 현재 화면 {1}개',[previewResults.length,previewVisible.length])}{previewVisible.length>400?' '+t('· 지도에는 앞 400개 표시, 확대하거나 검색해 주세요.'):''}</p>
        <div className="map-toolbar">
          <button className="button ghost" disabled={paged.current===0} onClick={()=>setPage(paged.current-1)}>{t('위치 이전 페이지')}</button>
          <span>{paged.current+1} / {paged.pages}</span>
          <button className="button ghost" disabled={paged.current+1>=paged.pages} onClick={()=>setPage(paged.current+1)}>{t('위치 다음 페이지')}</button>
        </div>
        <label className="map-check"><input type="checkbox" checked={hideCompleted} onChange={e=>{setHideCompleted(e.target.checked);setPage(0);}}/>{t('확인한 위치 숨기기')}</label>
        {preview.length>0&&<div className="map-progress-total" role="group" aria-label={t('전체 확인 진행률')}><span>{t('확인 {0}/{1}',[completed.size,preview.length])}</span><i className="map-progress"><b style={{width:`${completed.size/preview.length*100}%`}}/></i><span>{Math.round(completed.size/preview.length*100)}%</span></div>}
        <p>{t('확인 기록 {0}개 · 이 브라우저에 저장됩니다. 후보 지점별 기록이며 실제 수집 개수를 뜻하지 않습니다.',[completed.size])}</p>
        {storageNotice && <p role="alert">{t(storageNotice)}</p>}

      </>}
      </div>
    </details>}
    {open && <div className="terrain-stage">
      <div className="map-toolbar"><button className="button ghost" aria-label={t('지형 지도 축소')} disabled={view.zoom===1} onClick={()=>setView(v=>zoomMap(v,v.zoom/2))}>−</button>
        <span>{t('{0}배',[Number(view.zoom.toFixed(1))])}</span><button className="button ghost" aria-label={t('지형 지도 확대')} disabled={view.zoom===8} onClick={()=>setView(v=>zoomMap(v,v.zoom*2))}>+</button>
        <button className="button ghost" onClick={()=>setView({x:0,y:0,zoom:1})}>{t('지형 전체 보기')}</button>
        {labels.length > 0 && <label><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/>{t('지역명 표시 ({0})',[labels.length])}</label>}</div>
      {labels.length > 0 && <p>{t('공식 지도에 배치된 지역명 {0}개입니다. 겹치는 이름은 확대하면 나타납니다.',[labels.length])}{!!regionLabels?.unresolvedLabels.length && ' '+t('이름을 확인하지 못한 {0}개는 표시하지 않습니다.',[regionLabels.unresolvedLabels.length])}</p>}
      {selectedLabel && <p role="status">{t('선택한 지역:')} <strong>{selectedLabel.name}</strong>
        <button className="button ghost" onClick={()=>setView(terrainLocationView(selectedLabel))}>{t('선택 위치로 이동')}</button>
        <button className="button ghost" onClick={()=>setSelectedLocation('')}>{t('위치 선택 해제')}</button></p>}
      {failed.size>0 && <p role="alert">{t('지형 이미지 {0}개를 불러오지 못했습니다.',[failed.size])} <button className="button ghost" onClick={()=>{setFailed(new Set());setRetry(v=>v+1);}}>{t('지형 다시 불러오기')}</button></p>}

      <p className="map-help">{t('＋/− 버튼으로 확대·축소 · 지도를 손가락이나 마우스로 끌어 이동 · 표시를 눌러 상세 보기')}</p>
      <div className="terrain-map-frame"><svg ref={canvasRef} className="map-canvas terrain-canvas" role="group" aria-label={t('{0} 지형 이미지',[terrainName])} tabIndex={0} viewBox={`${view.x} ${view.y} ${size} ${size}`}
        onKeyDown={e=>{const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(Object.hasOwn(delta,e.key)){e.preventDefault();const [x,y]=delta[e.key];setView(v=>constrainMapView({...v,x:v.x+x*size/10,y:v.y+y*size/10}));}}}
        onPointerDown={e=>{if(e.button!==0)return;drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,width:e.currentTarget.getBoundingClientRect().width,view};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId||!d.width)return;const scale=1000/d.view.zoom/d.width;setView(constrainMapView({...d.view,x:d.view.x-(e.clientX-d.x)*scale,y:d.view.y-(e.clientY-d.y)*scale}));}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
        <rect width="1000" height="1000" fill="#11141b"/>
        {tiles.map(tile=>{const id=`${tile.x}_${tile.y}`;return <image key={`${retry}-${id}`} x={tile.left} y={tile.top} width={tile.width} height={tile.width}
          href={`${basePath}/${id}.webp`} preserveAspectRatio="none" pointerEvents="none"
          onError={()=>setFailed(old=>new Set([...old,id]))} onLoad={()=>setFailed(old=>{if(!old.has(id))return old;const next=new Set(old);next.delete(id);return next;})}/>;})}
        {previewOn && previewDraw.map(row=>{const markerSize=(row.id===previewSelection?44:34)/Math.sqrt(view.zoom);return <g key={row.id} data-preview-marker={row.kind}
          opacity={completed.has(row.id)?.4:1} role="button" tabIndex={0} aria-label={t('{0} 후보 위치',[row.name])} aria-pressed={row.id===previewSelection}
          onPointerDown={e=>e.stopPropagation()} onClick={()=>focusPreview(row)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();focusPreview(row);}}}>
          <title>{t('{0} · {1} · 미검증 후보 위치',[row.name,t(previewKindLabel(row.kind))])}</title>
          <rect x={row.x-markerSize/2} y={row.y-markerSize/2} width={markerSize} height={markerSize} rx={4/Math.sqrt(view.zoom)} fill="transparent" stroke={row.id===previewSelection?'#fff':'none'} strokeWidth={2/Math.sqrt(view.zoom)}/>
          <MapMarkerIcon kind={row.kind} objectId={row.objectId} completed={completed.has(row.id)} region={terrainName} x={row.x-markerSize/2} y={row.y-markerSize/2} size={markerSize}/>
        </g>})}
        {previewOn && nearbyFocus && <g aria-label={t('가까운 이동 지점: {0}',[nearbyFocus.name])} pointerEvents="none"><title>{nearbyFocus.name}</title><rect x={nearbyFocus.x-24/Math.sqrt(view.zoom)} y={nearbyFocus.y-24/Math.sqrt(view.zoom)} width={48/Math.sqrt(view.zoom)} height={48/Math.sqrt(view.zoom)} fill="#5eead433" stroke="#5eead4" strokeWidth={2/Math.sqrt(view.zoom)}/><MapMarkerIcon kind="teleport" region={terrainName} x={nearbyFocus.x-22/Math.sqrt(view.zoom)} y={nearbyFocus.y-22/Math.sqrt(view.zoom)} size={44/Math.sqrt(view.zoom)}/></g>}
        {selectedLabel && <circle aria-label={t('선택 위치: {0}',[selectedLabel.name])} cx={selectedLabel.x} cy={selectedLabel.y}
          r={10 / Math.sqrt(view.zoom)} fill="#fbbf2433" stroke="#fbbf24" strokeWidth={2 / Math.sqrt(view.zoom)} pointerEvents="none"/>}
        {showLabels && labels.map(label=><g key={label.id} aria-label={label.name}>
          <title>{label.name}</title><circle cx={label.x} cy={label.y} r={2 / Math.sqrt(view.zoom)} fill="#fff" stroke="#11141b" strokeWidth={1 / Math.sqrt(view.zoom)}/>
          {(labelNames.has(label.id) || label.id === selectedLocation) && <text x={label.x} y={label.y} textAnchor="middle"
          fontSize={12 / Math.sqrt(view.zoom)} fill="#fff" stroke="#11141b" strokeWidth={3 / Math.sqrt(view.zoom)}
          paintOrder="stroke" pointerEvents="none">{label.name}</text>}</g>)}
      </svg>
      {previewOn && chosenPreview && <section ref={detailRef} className="map-detail terrain-marker-card" aria-label={t('선택한 마커 정보')}>
        <button className="button ghost small" aria-label={t('마커 정보 닫기')} onClick={()=>{setPreviewSelection('');setNearbyId('');}}>{t('닫기')} ×</button>
        <h3><MapMarkerIcon kind={chosenPreview.kind} objectId={chosenPreview.objectId} completed={completed.has(chosenPreview.id)} region={terrainName}/> {chosenPreview.name}</h3><p>{t(previewKindLabel(chosenPreview.kind))} · {terrainName}</p>
        {chosenPreview.locationType==='area-center' && <p>{t('주둔지 구역 중심입니다. 입구·NPC 위치가 아니며 구역 안에서 탐험 퀘스트를 확인하세요.')}</p>}
        {chosenPreview.kind==='cube' && <p className="subtle">{t('히든큐브는 게임 원본 큐브 이미지로 표시합니다.')}</p>}
        <label className="map-check"><input type="checkbox" checked={completed.has(chosenPreview.id)} onChange={()=>markPreview(chosenPreview.id)}/>{t('이 위치 확인 완료')}</label>
        <button className="button ghost small" onClick={()=>{setNearbyId('');focusPreview(chosenPreview);}}>{t('후보 위치로 돌아가기')}</button>
        <h4>{t('가까운 순간이동 지점')}</h4>
        {nearby.length ? nearby.map((row,index)=><button key={row.id} className="button secondary small" aria-pressed={nearbyFocus?.id===row.id} onClick={()=>{setNearbyId(row.id);setView(terrainLocationView(row));drag.current=null;}}>{index+1}. {row.name}</button>) : <p>{t('이 지역에 다른 이동 지점 정보가 없습니다.')}</p>}
        <details><summary>{t('원본 위치 정보')}</summary><p>{chosenPreview.world.map(v=>Math.round(v)).join(', ')} · {t('같은 이름의 여러 지점은 조건별·대체 배치일 수 있습니다.')}</p></details>
        <p className="subtle">{t('지도상 직선거리 순입니다. 실제 이동 경로·해금·이용 가능 여부는 게임에서 확인하세요. 위치는 대조 중인 후보이며 출현을 보장하지 않습니다.')}</p>
      </section>}
      </div>
    </div>}
  </div>;
}
