import data from './data/map-names.json';
const names=data.names as Record<string,Partial<Record<string,string>>>;
export function mapName(source:string,locale:string):string{return names[source]?.[locale]||source;}
