import {readFileSync} from 'node:fs';
import ts from 'typescript';
export const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
export const classesUrl=moduleUrl(readFileSync('lib/classes.ts','utf8').replace("import data from './data/class-profiles.json';",'const data='+readFileSync('lib/data/class-profiles.json','utf8')+';'));
export const classes=await import(classesUrl);
export const plannerUrl=moduleUrl(readFileSync('lib/planner.ts','utf8').replace("import ascensionRules from './data/ascension-rules.json';",'const ascensionRules='+readFileSync('lib/data/ascension-rules.json','utf8')+';').replace("'./classes'",JSON.stringify(classesUrl)));
export const planner=await import(plannerUrl);
export const {recommendBuild}=await import(moduleUrl(readFileSync('lib/recommendation.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
