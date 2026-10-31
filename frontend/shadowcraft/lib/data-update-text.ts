const messages:Record<string,[string,string]>={
 "ko": [
  "스킬 이름도 자동 확인합니다. 비용·해금·효과가 바뀌면 검토 전까지 기존 계산을 유지합니다.",
  "스킬 규칙 변경이 감지되어 검토가 필요합니다. 현재는 마지막으로 검증한 비용·해금·효과를 사용합니다."
 ],
 "en": [
  "Skill names are checked automatically too. Changed costs, unlocks or effects remain pending review; existing calculations are preserved.",
  "Skill rule changes were detected and need review. Calculations still use the last verified costs, unlocks and effects."
 ],
 "ja": [
  "スキル名も自動確認します。コスト・解放条件・効果の変更は確認待ちとし、既存の計算を維持します。",
  "スキルのルール変更を検出しました。確認が終わるまで、最後に検証したコスト・解放条件・効果を使用します。"
 ],
 "fi": [
  "Myös taitojen nimet tarkistetaan automaattisesti. Muuttuneet kustannukset, avausehdot ja vaikutukset odottavat tarkistusta; laskenta säilyy ennallaan.",
  "Taitojen sääntömuutoksia havaittiin. Laskenta käyttää viimeksi vahvistettuja kustannuksia, avausehtoja ja vaikutuksia tarkistuksen ajan."
 ],
 "fr": [
  "Les noms des compétences sont aussi vérifiés automatiquement. Les coûts, conditions et effets modifiés attendent une vérification ; les calculs existants sont conservés.",
  "Des changements de règles ont été détectés. Les calculs utilisent les derniers coûts, conditions et effets vérifiés en attendant leur examen."
 ],
 "de": [
  "Auch Fähigkeitsnamen werden automatisch geprüft. Geänderte Kosten, Freischaltungen und Effekte warten auf Prüfung; bisherige Berechnungen bleiben erhalten.",
  "Änderungen an Fähigkeitsregeln wurden erkannt. Bis zur Prüfung gelten die zuletzt bestätigten Kosten, Freischaltungen und Effekte."
 ],
 "es": [
  "Los nombres de habilidades también se revisan automáticamente. Los cambios de coste, desbloqueo o efectos esperan revisión; se conservan los cálculos existentes.",
  "Se detectaron cambios en las reglas de habilidades. Los cálculos siguen usando los últimos costes, desbloqueos y efectos verificados."
 ],
 "pt-BR": [
  "Os nomes das habilidades também são verificados automaticamente. Mudanças de custo, desbloqueio ou efeitos aguardam revisão; os cálculos existentes são preservados.",
  "Foram detectadas mudanças nas regras das habilidades. Os cálculos ainda usam os últimos custos, desbloqueios e efeitos verificados."
 ],
 "ru": [
  "Названия умений тоже проверяются автоматически. Изменения затрат, условий открытия и эффектов ожидают проверки; прежние расчёты сохраняются.",
  "Обнаружены изменения правил умений. До проверки расчёты используют последние подтверждённые затраты, условия открытия и эффекты."
 ]
};
export const dataUpdateText=(locale:string,review:boolean)=>(messages[locale]||messages.en)[review?1:0];
