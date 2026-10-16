type Item = {id: string; name: string; kind: string; grade: string; level: number};
type Learning = {level: number; autoLearn: boolean; requiredCharacterLevel: number; skillPoints: number; stigmaPoints: number; ascensionRequirement: string};
type Description = {text: string; unresolvedValues: number; valueScope?: 'base-client-values'; resolvedReferences?: {reference: string; value: string}[]};
type Skill = {id: string; name: string; classKey: string; learning?: Learning[]; description?: Description | null; traits?: Description | null};
type Recipe = {id: string; itemId: string; outputQuantity: number; category: string; race: string; masteryLevel: number;
  baseRateCurve?: {group: string; rawRates: number[]; scope: 'client-table-estimate'; percentDivisor: 1000000} | null;
  craftType?: 'Common' | 'Succession'; successionCandidateItemIds?: string[];
  ingredients: {itemId: string; quantity: number; enchant: number}[]; hasCombo: boolean; comboRecipeId?: string | null; successRate: null; feePerAttempt: null};
export type ClientIndex = {schema: string; source: {kind: string; region: string; buildId: string; language: string}; items: Item[]; skills: Skill[]; recipes: Recipe[]};


/** Validate static exports before rendering; no self-reported file imports. */
export function parseClientIndex(value: unknown): ClientIndex {
  const fail = (): never => {throw new Error('Invalid Global client index');};
  const object = (v: unknown): Record<string, any> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, any> : fail();
  const data = object(value), source = object(data.source);
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0 && v.length <= 2000;
  const id = (v: unknown) => typeof v === 'string' && /^[1-9][0-9]*$/.test(v);
  const number = (v: unknown, min = 0, max = 1000000) => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
  if (data.schema !== 'a2bc-client-index-v1' || source.kind !== 'installed-steam-client' || source.region !== 'global' || source.appId !== 3393110 || source.language !== 'en-US' || !id(source.buildId)) fail();
  for (const key of ['items', 'skills', 'recipes']) {
    if (!Array.isArray(data[key]) || !data[key].length || data[key].length > 100000) fail();
    const seen = new Set();
    for (const entry of data[key]) {
      const row = object(entry);
      if (!id(row.id) || seen.has(row.id)) fail();
      seen.add(row.id);
    }
  }
  const ids = new Set(data.items.map((i: Item) => i.id));
  for (const i of data.items) if (!text(i.name) || !text(i.kind) || !text(i.grade) || !number(i.level, 0, 10000)) fail();
  const classes = ['assassin', 'gladiator', 'templar', 'ranger', 'elementalist', 'sorcerer', 'cleric', 'chanter'];
  for (const s of data.skills) {
    if (!text(s.name) || !classes.includes(s.classKey)) fail();
    for (const field of ['description', 'traits']) {
      if (s[field] !== undefined && s[field] !== null) {
        const desc = object(s[field]);
        if (!text(desc.text) || /[{}<>]/.test(desc.text) || !number(desc.unresolvedValues, 0, 1000) ||
            (desc.text.match(/\[unresolved value\]/g) ?? []).length !== desc.unresolvedValues) fail();
        if (desc.valueScope !== undefined || desc.resolvedReferences !== undefined) {
          if (desc.valueScope !== 'base-client-values' || !Array.isArray(desc.resolvedReferences) || desc.resolvedReferences.length > 1000) fail();
          for (const entry of desc.resolvedReferences) {
            const ref = object(entry);
            if (typeof ref.reference !== 'string' || !/^(se|abe):[1-9][0-9]*:(effect_value[0-9]{2}|value[0-9]{2}|aggro_absolute)(?::(divide100|divide100abs|divide1000|noneabs|time))?$/.test(ref.reference) ||
                typeof ref.value !== 'string' || !/^-?\d{1,12}(?:\.\d{1,11})?s?$/.test(ref.value)) fail();
          }
        }
      }
    }
    // Older v1 exports remain readable during deployment/cache transitions.
    if (s.learning !== undefined) {
      if (!Array.isArray(s.learning) || !s.learning.length || s.learning.length > 100) fail();
      s.learning.forEach((entry: unknown, index: number) => {
        const row = object(entry);
        if (row.level !== index + 1 || typeof row.autoLearn !== 'boolean' ||
            !number(row.requiredCharacterLevel, 0, 10000) || !number(row.skillPoints, 0, 10000) ||
            !number(row.stigmaPoints, 0, 10000) || typeof row.ascensionRequirement !== 'string' ||
            !/^(None|AscensionGrade_[1-9][0-9]*)$/.test(row.ascensionRequirement)) fail();
      });
    }
  }
  const recipeIds = new Set(data.recipes.map((r: Recipe) => r.id));
  for (const r of data.recipes) {
    if (r.baseRateCurve !== undefined && r.baseRateCurve !== null) {
      const curve = object(r.baseRateCurve);
      if (!text(curve.group) || curve.scope !== 'client-table-estimate' || curve.percentDivisor !== 1000000 ||
          !Array.isArray(curve.rawRates) || !curve.rawRates.length || curve.rawRates.length > 128 ||
          curve.rawRates.some((v: unknown) => !number(v, 0, 100000000))) fail();
    }
    if (r.craftType !== undefined || r.successionCandidateItemIds !== undefined) {
      if (!['Common', 'Succession'].includes(r.craftType) || !Array.isArray(r.successionCandidateItemIds) ||
          r.successionCandidateItemIds.length > 100 || new Set(r.successionCandidateItemIds).size !== r.successionCandidateItemIds.length ||
          r.successionCandidateItemIds.some((i: unknown)=>!ids.has(i)) || (r.craftType === 'Common' && r.successionCandidateItemIds.length)) fail();
    }
    if (r.comboRecipeId !== undefined && (r.comboRecipeId === null ? r.hasCombo :
        !r.hasCombo || !id(r.comboRecipeId) || !recipeIds.has(r.comboRecipeId))) fail();
    if (!ids.has(r.itemId) || !number(r.outputQuantity, 1) || !text(r.category) || !text(r.race) || !number(r.masteryLevel) || typeof r.hasCombo !== 'boolean' || r.successRate !== null || r.feePerAttempt !== null || !Array.isArray(r.ingredients) || r.ingredients.length > 100) fail();
    for (const entry of r.ingredients) {
      const i = object(entry);
      if (!ids.has(i.itemId) || !number(i.quantity, 1) || !number(i.enchant)) fail();
    }
  }
  return data as ClientIndex;
}
