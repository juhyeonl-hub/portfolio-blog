import {useState} from 'react';
import {useLocale} from './locale';
import type {Catalog} from '../lib/planner';
import {emptyPlan} from '../lib/planner';
import BuildPreview from './build-preview';
import CharacterEquipment from './character-equipment';
import {SkillHover} from './skill-tip';
import {classProfile} from '../lib/classes';
import {observedBoards} from '../lib/people';
export default function CharacterBuildView({catalog,character}:{catalog:Catalog;character:any}){
 const {t,locale,skill}=useLocale();const [tab,setTab]=useState('skills');
 const raw=Array.isArray(character.skills)?character.skills:[],known=new Map<string,any>(raw.filter((s:any)=>s&&Number.isSafeInteger(s.skillLevel)&&s.skillLevel>=0).map((s:any)=>[String(s.id),s]));
 const boardCatalog=observedBoards(catalog,character);const boardsKnown=!!boardCatalog;
 const boardPlan={...emptyPlan(catalog),nodes:boardsKnown?character.nodes:[]};
 return <section className="person-character"><h2>{character.profile.characterName}</h2><p>{String(character.region).toUpperCase()} · {character.profile.serverName} · {t(classProfile(catalog.classKey!).name)} · Lv.{character.profile.characterLevel}</p><p className="subtle">{t('공식 상세 조회: {0}',[new Date(character.importedAt).toLocaleString(locale)])}</p><p>{t('조회만으로 내 플래너는 바뀌지 않습니다. 공식 정보는 게임 내 변경보다 늦게 갱신될 수 있습니다.')}</p>
 <nav className="preview-tabs" aria-label={t('캐릭터 세팅')} >{[['skills','스킬'],['boards','데바니온'],['gear','장비']].map(([v,label])=><button type="button" key={v} aria-pressed={tab===v} onClick={()=>setTab(v)}>{t(label)}</button>)}</nav>
 {tab==='skills'&&<><p>{t('장비·데바니온 보너스가 포함된 최종 레벨입니다. 기본 투자량·특화·남은 포인트는 공개되지 않습니다.')}</p><div className="preview-skills">{catalog.skills.map(s=>{const actual=known.get(s.id);return <article className="preview-skill" key={s.id}><SkillHover skill={s} level={actual?.skillLevel??0}><img src={'/shadowcraft/game'+s.iconPath} alt=""/><strong>{skill(s.name)}</strong></SkillHover><b>{actual?'Lv.'+actual.skillLevel:t('조회 정보 없음')}</b>{s.stigma&&actual&&<small>{t(actual.equip===1||actual.equip===true?'장착':actual.equip===0||actual.equip===false?'미장착':'조회 정보 없음')}</small>}</article>})}</div></>}
 {tab==='boards'&&(boardsKnown?(boardCatalog.boards.length?<BuildPreview catalog={boardCatalog} plan={boardPlan} boardsOnly/>:<p>{t('조회에서 열린 데바니온 보드가 없습니다.')}</p>):<p role="status">{t('데바니온 일부를 조회하지 못했습니다. 선택 안 된 노드로 간주하지 않고 다시 조회해 주세요.')}</p>)}
 {tab==='gear'&&<CharacterEquipment equipment={character.equipment}/>}<p className="people-actions"><a className="button secondary" href="#/build">{t('내 플래너 열기')}</a></p>
 </section>;
}
