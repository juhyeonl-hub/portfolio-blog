/**
 * Old address (juhyeonl.dev/lab/shadowcraft/) after the move: a light page instead of the planner.
 * Shared links go straight to asbc.app; saved planner data can still be handed over with the move banner,
 * because browser storage of the old origin is only readable here.
 */
import {createRoot} from 'react-dom/client';
import {LocaleProvider,LanguageSelect,useLocale} from './app/locale';
import {MoveBanner} from './app/origin-transfer';
import {AsbcMark} from './app/asbc-mark';
import {NEW_ORIGIN,NEW_PATH,collectEntries,summarize} from './lib/origin-transfer';
import './app/globals.css';

const target=NEW_ORIGIN||'https://asbc.app';
// Shared and published build links carry no saved data: forward them with their hash.
if(location.hash.startsWith('#build=')||location.hash.startsWith('#published='))location.replace(target+NEW_PATH+location.hash);

function Moved(){
 const {t}=useLocale();
 // Only planner data counts (the language setting is stored on every visit).
 let saved=0;try{const s=summarize(collectEntries(localStorage));saved=s.plans+s.library+s.maps;}catch{/* Storage unavailable: offer the plain link only. */}
 return <main className="asbc-moved">
  <header><AsbcMark size={44}/><b>ASBC</b><LanguageSelect/></header>
  <p className="asbc-moved-address"><a href={target+NEW_PATH}>{target.replace(/^https?:\/\//,'')}</a></p>
  {saved>0?<MoveBanner/>:<><h1>{t('ASBC가 새 주소로 이사했습니다.')}</h1><p>{t('이 브라우저에는 옮길 데이터가 없습니다. 새 주소에서 바로 시작하세요.')}</p><a className="button primary" href={target+NEW_PATH}>{t('새 주소로 이동')}</a></>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<LocaleProvider><Moved/></LocaleProvider>);
