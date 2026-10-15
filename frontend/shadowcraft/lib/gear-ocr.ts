import type {Catalog} from './planner';
export type OcrBonus={skillId:string;value:number|null;uncertain:boolean;source:string};
const normalize=(s:string)=>s.normalize('NFKC').replace(/[^가-힣a-z0-9]/gi,'').toLowerCase();
function distance(a:string,b:string){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next}return row[b.length]}
export function parseGearText(text:string,c:Catalog){
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),bonuses:OcrBonus[]=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i],n=normalize(line);let matches=c.skills.filter(s=>n.includes(normalize(s.name)));
  let uncertain=false;
  if(!matches.length){const letters=line.replace(/[^가-힣]/g,'');if(letters.length>=3){const scored=c.skills.map(s=>({s,score:1-distance(letters,s.name.replace(/\s/g,''))/Math.max(letters.length,s.name.replace(/\s/g,'').length)})).filter(x=>x.score>=.75).sort((a,b)=>b.score-a.score);if(scored.length===1||(scored[0]&&scored[0].score>(scored[1]?.score||0))){matches=[scored[0].s];uncertain=true}}}
  if(matches.length!==1)continue;
  const s=matches[0];if(bonuses.some(b=>b.skillId===s.id))continue;
  // Require a visible plus sign. Never turn damage percentages or ordinary stats into levels.
  let source=line;
  if(!/[+＋]/.test(line)&&/^\s*(?:[lLiIvV/]{1,3}\s*\.?\s*)?[+＋]/.test(lines[i+1]||''))source+=' '+lines[i+1];
  const m=source.match(/[+＋]\s*(\d{1,2}|[lI])\b(?!\s*[%％])/);
  const value=m?(/^[lI]$/.test(m[1])?1:Number(m[1])):null;
  bonuses.push({skillId:s.id,value:value!==null&&value>=1&&value<=30?value:null,uncertain:uncertain||!!m&&/^[lI]$/.test(m[1]),source});
 }
 const heading=lines.slice(0,8).find(l=>(l.match(/[가-힣]/g)||[]).length>=3&&!/아이템|공격력|아이템 레벨|영혼|장착 제한|유일 단검|외형 정보/.test(l))||'';
 const name=heading.replace(/^[^+＋가-힣0-9]+/,'').slice(0,100);
 const slots=[['투구','투구'],['장갑','장갑'],['신발','신발'],['목걸이','목걸이'],['귀걸이','귀걸이 1'],['반지','반지 1'],['팔찌','팔찌 1'],['허리띠','허리띠'],['날개','날개']] as const;
 const suggestedSlot=slots.find(([word])=>name.includes(word))?.[1]||'주무기';
 return {name,suggestedSlot,bonuses};
}
