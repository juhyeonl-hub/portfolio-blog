import {useId, useState} from 'react';
import type {ClientIndex} from '../lib/client-index';

export default function CraftProbability({recipe}: {recipe: ClientIndex['recipes'][number]}) {
  const [gap, setGap] = useState('0');
  const helpId = useId();
  const curve = recipe.baseRateCurve;
  if (!curve) return <p>이 제작법에는 기본 예상 확률표가 없습니다.</p>;
  const level = /^\d{1,3}$/.test(gap) ? Number(gap) : NaN;
  const valid = Number.isInteger(level) && level >= 0 && level < curve.rawRates.length;
  return <section aria-label="제작 기본 예상 확률">
    <h4>기본 예상 성공 확률</h4>
    <label>숙련도 레벨 차이<input inputMode="numeric" value={gap} onChange={e => setGap(e.target.value)} aria-describedby={helpId}/></label>
    <p id={helpId}>게임의 Crafting Chance → Expected Probability → Basic에 표시되는 숙련도 차이를 입력하세요. 현재 숙련도 레벨 자체가 아닙니다. 표 범위: 0~{curve.rawRates.length - 1}.</p>
    {valid ? <p role="status">기본 예상 성공 확률: 약 {(curve.rawRates[level] / curve.percentDivisor).toFixed(2)}%</p>
      : <p role="alert">숙련도 차이는 0~{curve.rawRates.length - 1}의 정수로 입력하세요.</p>}
    <p className="subtle">클라이언트 기본 표를 게임 화면 관측값에 맞춰 환산한 예상치입니다. 제작 가능 여부·캐릭터 보정·연속 제작 확률·수수료는 반영하지 않습니다.</p>
    <details><summary>숙련도 차이별 확률표</summary><div style={{maxHeight: 240, overflow: 'auto'}}>
      <table><thead><tr><th>숙련도 차이</th><th>기본 예상 성공 확률</th></tr></thead><tbody>
        {curve.rawRates.map((raw, i) => <tr key={i}><td>{i}</td><td>약 {(raw / curve.percentDivisor).toFixed(2)}%</td></tr>)}
      </tbody></table></div></details>
  </section>;
}
