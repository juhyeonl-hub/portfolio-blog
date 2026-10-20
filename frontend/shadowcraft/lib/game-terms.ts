/**
 * Korean names for client slot and grade keys that have no official source in our data yet. They follow the
 * conventions already confirmed elsewhere (Korean: native word when one exists, otherwise transliteration;
 * Japanese: katakana of the English name, as game8.jp writes アミュレット, ベルト, アルカナ). Translations live in
 * ui-translations.json. INFERRED entries are to be corrected from player reports (contact@asbc.app).
 * Confirmed: Amulet/Arcana in Japanese (game8.jp). Inferred: everything else in this file.
 */
export const SLOT_BASE_NAMES: Record<string, string> = {Cape: '망토', Rune: '룬', Amulet: '아뮬렛', Arcana: '아르카나'};
export const GRADE_NAMES: Record<string, string> = {Common: '일반', Rare: '희귀', Special: '특별', Epic: '영웅', Unique: '유일', Legend: '전설'};
