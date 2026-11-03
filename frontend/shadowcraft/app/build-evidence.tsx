import type {ClassProfile,PvePreset} from '../lib/classes';
import {macroEvidence,TEMPLAR_BASIC} from '../lib/macro-evidence';
import {pveText} from '../lib/pve-direction-text';
import {useLocale} from './locale';
import './build-evidence.css';
export default function BuildEvidence({profile,context='pve',preset='group',macro=false}:{profile:ClassProfile;context?:string;preset?:PvePreset;macro?:boolean}){
 const {t,locale}=useLocale(),evidence=macroEvidence(profile.key,context);
 return <section className="build-evidence" aria-label={t('근거와 검증 범위')}>
  <div className="build-evidence-heading"><strong>{t('참고 배치 · 실전 검증 전')}</strong><span>{t(profile.name)} · {context==='pve'?pveText(locale,preset):context==='pvp'?'PvP':t('레벨링')}</span></div>
  <p>{t('실제 전투의 실행 순서·지연·피해량은 아직 확인하지 않았습니다.')}</p>
  <details><summary>{t('확인한 근거와 게임에서 확인할 항목')}</summary>
   <dl>
    {evidence.checkedAt&&<><dt>{t('스킬 정보·배치 대조')}</dt><dd><time dateTime={evidence.checkedAt}>{evidence.checkedAt}</time> · {t('스킬 연결과 키 중복을 점검했습니다. 실전 성능 검증은 아닙니다.')}</dd></>}
    {context==='pve'&&profile.pvePresetSource&&<><dt>{t('추천 근거')}</dt><dd><a href={profile.pvePresetSource.url} target="_blank" rel="noreferrer">gaming.tools</a> · <time dateTime={profile.pvePresetSource.checkedAt}>{profile.pvePresetSource.checkedAt}</time></dd></>}
    {macro&&<><dt>{t('좌클릭·조작 방식 근거')}</dt><dd>{evidence.fixedOrigin==='screen'?<>{t('궁성 제공 화면 · AION2 모드와 고정 좌클릭만 대조')} · <time dateTime={evidence.screenCheckedAt}>{evidence.screenCheckedAt}</time></>:evidence.fixedOrigin==='reference'?<><a href={TEMPLAR_BASIC.source} target="_blank" rel="noreferrer">gaming.tools</a> · <time dateTime={TEMPLAR_BASIC.checkedAt}>{TEMPLAR_BASIC.checkedAt}</time></>:t('사이트 스킬 배치 기반 · 게임 화면 대조 전')}</dd>
    <dt>{t('반복 배치 근거')}</dt><dd>{evidence.repeatOrigin==='reference'?<><a href={TEMPLAR_BASIC.source} target="_blank" rel="noreferrer">gaming.tools</a> · <time dateTime={TEMPLAR_BASIC.checkedAt}>{TEMPLAR_BASIC.checkedAt}</time></>:t('사이트에서 구성한 참고 예시 · 게임 화면과 동일한 배치가 아닙니다.')}</dd></>}
   </dl>
   {context==='pve'&&<p>{t('파티·솔로·필드는 투자·특화 우선순위가 다릅니다. 매크로는 공통 참고 배치입니다.')}</p>}
   <ul className="build-evidence-checks"><li>{t('게임에서 조작 모드, 배운 스킬과 선택한 스티그마를 먼저 맞추세요.')}</li>{evidence.check&&<li>{t(evidence.check)}</li>}<li>{t('쉬운 적에게 실행과 중단을 확인한 뒤 사용하세요. 확인 전에는 버프·이동·생존기를 한꺼번에 묶지 마세요.')}</li></ul>
  </details>
 </section>;
}
