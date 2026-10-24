import {useSettingsRefresh} from './use-settings-refresh';
import {settingsStorage} from '../lib/account-settings';
import {useMemo, useRef, useState} from 'react';
import TerrainPanel from './terrain-panel';
import {useLocale} from './locale';
import {constrainMapView, filterMapMarkers, loadMapProgress, mapProgressKey, MAX_MAP_BYTES, parseMapDataset,
  saveMapProgress, zoomMap, type MapDataset, type MapMarker, type MapView} from '../lib/world-map';

export default function MapPanel({active=false}:{active?:boolean}) {
  const {t} = useLocale();
  const [dataset, setDataset] = useState<MapDataset | null>(null);
  const [key, setKey] = useState('');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selected, setSelected] = useState('');
  const [view, setView] = useState<MapView>({x: 0, y: 0, zoom: 1});
  const [error, setError] = useState('');
  const [storageNotice, setStorageNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const writable = useRef(true);
  const generation = useRef(0);
  const drag = useRef<{id: number; x: number; y: number; width: number; view: MapView} | null>(null);
  const visible = useMemo(() => dataset ? filterMapMarkers(dataset, query, categories, completed, hideCompleted) : [],
    [dataset, query, categories, completed, hideCompleted]);
  const marker = visible.find(m => m.id === selected);
  const size = 1000 / view.zoom;

  async function importFile(file?: File) {
    if (!file) return;
    const token = ++generation.current;
    setLoading(true); setError('');
    try {
      if (file.size > MAX_MAP_BYTES) throw new Error('지도 파일은 2 MB 이하여야 합니다.');
      const next = parseMapDataset(await file.text());
      const nextKey = await mapProgressKey(next);
      if (token !== generation.current) return;
      let progress = {completed: [] as string[], writable: false};
      try { progress = loadMapProgress(settingsStorage, nextKey, next); } catch { /* Storage access itself can throw. */ }
      writable.current = progress.writable;
      setStorageNotice(progress.writable ? '' : '저장된 진행도를 읽지 못했습니다. 기존 기록을 유지하며 이번 체크는 이 화면에서만 기억합니다.');
      setDataset(next); setKey(nextKey); setCompleted(new Set(progress.completed));
      setCategories(new Set(next.categories.map(c => c.id))); setQuery(''); setHideCompleted(false); setSelected('');
      setView({x: 0, y: 0, zoom: 1}); drag.current = null;
    } catch (e) {
      if (token === generation.current) setError(e instanceof Error && /[가-힣]/.test(e.message) ? e.message : '지도 파일을 읽지 못했습니다. 기존 지도와 진행도를 유지합니다.');
    } finally { if (token === generation.current) setLoading(false); }
  }
  function toggleCompleted(id: string) {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCompleted(next);
    if (!writable.current) return;
    let saved = false;
    try { saved = saveMapProgress(settingsStorage, key, [...next].sort()); } catch { /* Memory-only when storage is unavailable. */ }
    setStorageNotice(saved ? '' : '진행도를 저장하지 못했습니다. 이번 체크는 이 화면에서만 기억합니다.');
  }
  useSettingsRefresh(key||null,()=>{if(!dataset)return;const progress=loadMapProgress(settingsStorage,key,dataset);if(progress.writable)setCompleted(new Set(progress.completed));});
  function focus(marker: MapMarker) {
    setSelected(marker.id);
    setView(v => constrainMapView({x: marker.x * 1000 - 500 / v.zoom, y: marker.y * 1000 - 500 / v.zoom, zoom: v.zoom}));
  }
  return <section className="map-panel card" aria-label={t('지도 탐색')}>
    <h2>{t('지도 & 수집 기록')}</h2>
    <TerrainPanel active={active}/>
    <details className="optional-panel"><summary>{t('사용자 지도 파일 가져오기')}</summary>
    <div className="notice amber-notice">{t('직접 만든 지도 파일을 추가로 열 수 있습니다. 가져온 파일의 위치는 검증되지 않으며, 위 지형 지도의 기록과 따로 저장합니다.')}</div>
    <label className="map-field">{t('지도 파일 가져오기')}<input type="file" accept=".json,application/json" aria-label={t('지도 파일 가져오기')} onChange={e => {void importFile(e.target.files?.[0]); e.target.value = '';}}/></label>
    <p>{t('파일은 서버에 전송되지 않습니다. 완료 체크는 이 브라우저에 저장합니다. 새로고침·직업 변경 후에는 같은 지도 파일을 다시 가져오세요.')}</p>
    {loading && <p role="status">{t('지도 파일을 확인하는 중…')}</p>}
    {error && <p role="alert">{t(error)}</p>}
    {storageNotice && <p role="status">{t(storageNotice)}</p>}
    {!dataset ? <div className="gear-empty"><h3>{t('표시할 지도가 없습니다')}</h3><p>{t('글로벌용 a2bc 지도 파일을 가져오면 위치 검색과 완료 체크를 사용할 수 있습니다.')}</p></div> : <>
      <h3>{dataset.name}</h3><p>{t('사용자 파일 · 공식 검증 안 됨 · {0}',[dataset.version])}</p>
      <p>{t('전체 완료 {0} / {1} · 현재 표시 {2}개',[completed.size,dataset.markers.length,visible.length])}</p>
      <label className="map-field">{t('위치 검색')}<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('이름 또는 ID')}/></label>
      <fieldset className="map-layers"><legend>{t('표시할 분류')}</legend>{dataset.categories.map(c => <label key={c.id}><input type="checkbox" checked={categories.has(c.id)} onChange={() => setCategories(old => {const next = new Set(old); if (next.has(c.id)) next.delete(c.id); else next.add(c.id); return next;})}/>{c.name}</label>)}</fieldset>
      <label className="map-check"><input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)}/>{t('완료한 위치 숨기기')}</label>
      <p>{t('좌표 보기 · 배경 지도 미연결. 점을 선택하거나 아래 목록에서 위치를 찾으세요. 드래그와 방향키로 이동할 수 있습니다.')}</p>
      <div className="map-toolbar"><button className="button ghost" aria-label={t('지도 축소')} disabled={view.zoom === 1} onClick={() => setView(v => zoomMap(v, v.zoom / 2))}>−</button>
        <span>{t('{0}배',[view.zoom])}</span><button className="button ghost" aria-label={t('지도 확대')} disabled={view.zoom === 8} onClick={() => setView(v => zoomMap(v, v.zoom * 2))}>+</button>
        <button className="button ghost" onClick={() => setView({x: 0, y: 0, zoom: 1})}>{t('전체 보기')}</button></div>
      <svg className="map-canvas" role="group" aria-label={t('지도 좌표 영역')} tabIndex={0} viewBox={`${view.x} ${view.y} ${size} ${size}`}
        onKeyDown={e => {const delta: Record<string, [number, number]> = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}; if (Object.hasOwn(delta, e.key)) {e.preventDefault(); const [x, y] = delta[e.key]; setView(v => constrainMapView({...v, x: v.x + x * size / 10, y: v.y + y * size / 10}));}}}
        onPointerDown={e => {if (e.button !== 0) return; drag.current = {id: e.pointerId, x: e.clientX, y: e.clientY, width: e.currentTarget.getBoundingClientRect().width, view}; e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e => {const d = drag.current; if (!d || d.id !== e.pointerId || !d.width) return; const scale = 1000 / d.view.zoom / d.width; setView(constrainMapView({...d.view, x: d.view.x - (e.clientX - d.x) * scale, y: d.view.y - (e.clientY - d.y) * scale}));}}
        onPointerUp={() => {drag.current = null;}} onPointerCancel={() => {drag.current = null;}} onLostPointerCapture={() => {drag.current = null;}}>
        <defs><pattern id="a2bc-map-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#34394c" strokeWidth="1"/></pattern></defs>
        <rect width="1000" height="1000" fill="url(#a2bc-map-grid)"/>
        {visible.map(m => <circle key={m.id} cx={m.x * 1000} cy={m.y * 1000} r={8 / view.zoom} fill={completed.has(m.id) ? '#6ed7aa' : '#92dcf9'} stroke={selected === m.id ? '#fff' : '#171a25'} strokeWidth={2 / view.zoom}
          role="button" tabIndex={0} aria-label={`${m.name}${completed.has(m.id) ? ` (${t('완료')})` : ''}`} aria-pressed={selected === m.id}
          onPointerDown={e => e.stopPropagation()} onClick={() => focus(m)} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); e.stopPropagation(); focus(m);}}}><title>{m.name}</title></circle>)}
      </svg>
      {marker && <div className="map-detail"><h3>{marker.name}</h3><p>{t('좌표 {0}%, {1}% · {2}',[(marker.x * 100).toFixed(2),(marker.y * 100).toFixed(2),dataset.categories.find(c => c.id === marker.categoryId)?.name])}</p>
        <label className="map-check"><input type="checkbox" checked={completed.has(marker.id)} onChange={() => toggleCompleted(marker.id)}/>{t('이 위치 완료')}</label></div>}
      <div className="map-results" aria-label={t('위치 검색 결과')}>{visible.slice(0, 100).map(m => <button className="button ghost" key={m.id} onClick={() => focus(m)}>{completed.has(m.id) ? '✓ ' : ''}{m.name}</button>)}</div>
      {!visible.length && <p role="status">{t('표시할 위치가 없습니다. 검색어와 분류를 확인하세요.')}</p>}
      {visible.length > 100 && <p>{t('목록은 처음 100개를 표시합니다. 검색어와 분류를 좁혀 주세요.')}</p>}
    </>}
    </details>
  </section>;
}
