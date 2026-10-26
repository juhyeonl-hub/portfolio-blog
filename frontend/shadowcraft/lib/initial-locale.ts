export const supportedLocales=['ko','en','ja','fi'] as const;
export type InitialLocale=typeof supportedLocales[number];
// An existing choice always wins. New visitors get their first supported browser
// language; all other languages use English for the Global audience.
export function initialLocale(saved:unknown,languages:readonly string[]=[]):InitialLocale{
 if(typeof saved==='string'&&(supportedLocales as readonly string[]).includes(saved))return saved as InitialLocale;
 for(const language of languages){
  const base=language.toLowerCase().split(/[-_]/)[0];
  if((supportedLocales as readonly string[]).includes(base))return base as InitialLocale;
 }
 return 'en';
}
