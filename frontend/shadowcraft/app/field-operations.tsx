import type {Catalog} from '../lib/planner';
import type {ClassProfile} from '../lib/classes';
import {useLocale} from './locale';
import {SkillHover} from './skill-tip';
export default function FieldOperations({catalog,profile}:{catalog:Catalog;profile:ClassProfile}){
 const {t,skill}=useLocale();return <section className="field-operations panel"><h3>{t('일반 필드 · 사명 · 짧은 전투')}</h3><p>{t('필드에서는 이동과 짧은 전투를 우선하세요. 회복·생존·충전 기술은 필요할 때 직접 쓰고, 매크로에 모두 넣지 마세요.')}</p><p>{t('아래는 이동·회피에 쓰는 기술입니다. 각 기술의 조건을 확인하고 상황에 맞게 사용하세요. 필드 전용 최적 배분이 검증된 것은 아닙니다.')}</p><div>{profile.movement.map(id=>{const s=catalog.skills.find(s=>s.id===id);return s?<SkillHover key={id} skill={s}><span><img src={'/shadowcraft/game'+s.iconPath} alt=""/>{skill(s.name)}</span></SkillHover>:null})}</div></section>;
}
