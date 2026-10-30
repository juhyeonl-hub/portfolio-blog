import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
import ts from 'typescript';
const jsx=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
// Hook harness exercises actual disclosure state transitions, without mounting network tools.
let values=[],effects=[],cursor=0,queue=[];
globalThis.__extraHooks={
 useState(initial){const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],value=>values[i]=value];},
 useEffect(fn,deps){const i=cursor++;if(!effects[i]||deps.some((v,j)=>v!==effects[i][j])){effects[i]=deps;queue.push(fn);}}
};
const source=readFileSync('app/build-extra.tsx','utf8').replace("import {useEffect,useState,type ReactNode} from 'react';","const {useEffect,useState}=globalThis.__extraHooks;");
const {default:Extra}=await import(moduleUrl(jsx(source)));
const child={type:'heavy-tool',props:{snapshot:'manual plan'}};
function render(requested=false,revision=0){cursor=0;queue=[];let out=Extra({id:'compare',title:'Compare',requested,revision,children:child});if(queue.length){queue.forEach(fn=>fn());cursor=0;queue=[];out=Extra({id:'compare',title:'Compare',requested,revision,children:child});}return out;}
let view=render();assert.equal(view.props.open,false);assert.equal(view.props.children[1],false,'cold tools must not mount or fetch');
view.props.onToggle({currentTarget:{open:true}});view=render();assert.equal(view.props.open,true);assert.equal(view.props.children[1].props.children,child);
view.props.onToggle({currentTarget:{open:false}});view=render();assert.equal(view.props.open,false);assert.equal(view.props.children[1].props.children,child,'closing must retain visited editor state');
view=render(true);assert.equal(view.props.open,true,'old comparison URL opens its section');
view.props.onToggle({currentTarget:{open:false}});view=render(true);assert.equal(view.props.open,false,'editing a plan must not force a section back open');
view=render(true,1);assert.equal(view.props.open,true,'same-section jump opens it again');
view=render(false,1);assert.equal(view.props.open,true,'scrolling elsewhere must not close visited tools');
delete globalThis.__extraHooks;
console.log('PASS: cold lazy mount, open/close state retention, legacy hash open, same-section re-open, no reopen during plan edits.');
