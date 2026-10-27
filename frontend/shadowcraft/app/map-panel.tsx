import TerrainPanel from './terrain-panel';
import {useLocale} from './locale';
import './map-panel.css';

export default function MapPanel({active=false}:{active?:boolean}) {
  const {t}=useLocale();
  return <section className="map-panel card" aria-label={t('지도 탐색')}>
    <h2>{t('지도 & 수집 기록')}</h2>
    <TerrainPanel active={active}/>
  </section>;
}
