import npcIcons from './data/map-npc-icons.json';

/** Read-only display mapping; never changes marker IDs or completion hashes. */
export function mapIconKey(kind:string,region:string,objectId?:number) {
  if((kind==='npc'||kind==='named') && objectId!==undefined) {
    const specific=(npcIcons as Record<string,string>)[String(objectId)];
    if(specific)return specific;
  }
  if(kind==='teleport' && (region==='Chaotic Lower Reshanta'||region==='Chaotic Middle Reshanta'))return 'teleportAbyss';
  if((region==='Altgard'||region==='Ishalgen') && (kind==='teleport'||kind==='monolith'))return kind+'Dark';
  return kind;
}
