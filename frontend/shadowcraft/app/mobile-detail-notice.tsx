import {useLocale} from './locale';
import './mobile-detail-notice.css';
// Keep this identical to the media query in mobile-detail-notice.css.
export const PHONE_DETAILS_QUERY="(max-width:600px), (hover:none) and (pointer:coarse) and (max-width:932px)";
export function phoneDetailsHidden(){return typeof window!=='undefined'&&window.matchMedia(PHONE_DETAILS_QUERY).matches;}
export default function MobileDetailNotice(){const {t}=useLocale();return <aside className="mobile-detail-notice" aria-label={t('모바일 이용 안내')}><strong>{t('자세한 확인은 PC에서')}</strong><p>{t('모바일에서는 아이템·스킬·노드의 상세 설명을 생략합니다. 자세한 비교와 빌드 편집은 PC 이용을 권장합니다.')}</p></aside>;}
