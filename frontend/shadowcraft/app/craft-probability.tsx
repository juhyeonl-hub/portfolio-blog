import {useId, useState} from 'react';
import type {ClientIndex, MasteryGrade} from '../lib/client-index';

export default function CraftProbability({recipe, grades}: {recipe: ClientIndex['recipes'][number]; grades?: MasteryGrade[]}) {
  const [gap, setGap] = useState('0');
  const [mode, setMode] = useState('gap');
  const [gradeKey, setGradeKey] = useState(grades?.[0]?.key ?? '');
  const [mastery, setMastery] = useState('1');
  const helpId = useId();
  const curve = recipe.baseRateCurve;
  if (!curve) return <p>이 제작법에는 기본 예상 확률표가 없습니다.</p>;
  const grade = grades?.find(g => g.key === gradeKey);
  const entered = /^\d{1,4}$/.test(mastery) ? Number(mastery) : NaN;
  const total = grade && entered >= 1 && entered <= grade.max - grade.min + 1 ? grade.min + entered - 1 : NaN;
  const level = mode === 'mastery' ? total - recipe.masteryLevel : /^\d{1,3}$/.test(gap) ? Number(gap) : NaN;
  const valid = Number.isInteger(level) && level >= 0 && level < curve.rawRates.length;
  return <section aria-label="제작 기본 예상 확률">
    <h4>기본 예상 성공 확률</h4>
    {!!grades?.length && <label>확률 입력 방식<select aria-label="확률 입력 방식" value={mode} onChange={e => setMode(e.target.value)}><option value="gap">숙련도 차이 직접 입력</option><option value="mastery">내 등급·레벨로 계산</option></select></label>}
    {mode === 'mastery' && <div>
      <label>내 제작 숙련도 등급<select aria-label="내 제작 숙련도 등급" value={gradeKey} onChange={e => {setGradeKey(e.target.value); setMastery('1');}}>{grades?.map(g => <option key={g.key} value={g.key}>{g.key === 'Beginner' ? '입문' : g.key === 'Intermediate' ? '전문' : g.name} · {g.name}</option>)}</select></label>
      <label>등급 내 레벨<input inputMode="numeric" value={mastery} onChange={e => setMastery(e.target.value)}/></label>
      <p>등급 내 레벨 범위: 1~{grade ? grade.max - grade.min + 1 : '—'}. 보너스 적용 전 기본 숙련도입니다.</p>
      {Number.isFinite(total) && <p>전체 숙련도 {total} · 레시피 요구치 {recipe.masteryLevel} · 차이 {level}</p>}
    </div>}
    {mode === 'gap' && <label>숙련도 레벨 차이<input inputMode="numeric" value={gap} onChange={e => setGap(e.target.value)} aria-describedby={helpId}/></label>}
    <p id={helpId}>{mode === 'gap' ? '게임의 Crafting Chance → Expected Probability → Basic에 표시되는 숙련도 차이를 입력하세요. 현재 숙련도 레벨 자체가 아닙니다.' : '등급·레벨을 전체 숙련도로 환산하고 레시피 요구치를 뺀 기본 차이입니다.'} 표 범위: 0~{curve.rawRates.length - 1}.</p>
    {valid ? <p role="status">기본 예상 성공 확률: 약 {(curve.rawRates[level] / curve.percentDivisor).toFixed(2)}%</p>
      : <p role="alert">{mode === 'mastery' && level < 0 ? '기본 숙련도가 레시피 요구치보다 낮습니다. 성공 확률을 계산하지 않습니다.' : mode === 'mastery' && !Number.isFinite(total) ? '선택한 등급의 유효한 정수 레벨을 입력하세요.' : `숙련도 차이는 0~${curve.rawRates.length - 1}의 정수로 입력하세요.`}</p>}
    <p className="subtle">클라이언트 기본 표를 게임 화면 관측값에 맞춰 환산한 예상치입니다. 제작 가능 여부·캐릭터 보정·연속 제작 확률·수수료는 반영하지 않습니다.</p>
    <details><summary>숙련도 차이별 확률표</summary><div style={{maxHeight: 240, overflow: 'auto'}}>
      <table><thead><tr><th>숙련도 차이</th><th>기본 예상 성공 확률</th></tr></thead><tbody>
        {curve.rawRates.map((raw, i) => <tr key={i}><td>{i}</td><td>약 {(raw / curve.percentDivisor).toFixed(2)}%</td></tr>)}
      </tbody></table></div></details>
  </section>;
}
