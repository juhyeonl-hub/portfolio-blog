// Optional real-image verification: node tests/gear-ocr-image.mjs /absolute/preprocessed.png
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createWorker,PSM} from 'tesseract.js';
import {moduleUrl} from './modules.mjs';
const path=process.argv[2];if(!path)throw Error('Provide a locally preprocessed test image');
const {parseGearText}=await import(moduleUrl(readFileSync('lib/gear-ocr.ts','utf8')));
const c=JSON.parse(readFileSync('lib/data/catalogs/assassin.json'));
const w=await createWorker(['kor','eng'],1,{langPath:process.cwd()+'/../public/shadowcraft/ocr/lang',cacheMethod:'none'});
try{await w.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});const {data}=await w.recognize(path);const parsed=parseGearText(data.text,c);assert(parsed.bonuses.some(b=>b.skillId==='13130000'&&b.value===1));console.log(JSON.stringify({nameCandidate:parsed.name,bonuses:parsed.bonuses,confidence:data.confidence,result:'actual screenshot → Rune Burst +1 PASS'}));}finally{await w.terminate()}
