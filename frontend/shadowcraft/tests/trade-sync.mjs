import assert from 'node:assert/strict';
import {localModuleUrl} from './modules.mjs';
const {WORKBOOK_KEY,parseWorkbook,workbookTotals}=await import(localModuleUrl('trade-workbook'));
const {CRAFT_PLANS_KEY,parseCraftPlans,mergeTradeCollection,TradeSyncConflict,tradeBackup,parseTradeBackup}=await import(localModuleUrl('trade-collections'));
const {craftFunding,calculateCraft,emptyCraft}=await import(localModuleUrl('craft-comparison'));
const {AccountSettingsStore,SettingsSync,SAVE_DELAY_MS,validateDocument}=await import(localModuleUrl('account-settings'));
const at='2026-10-25T10:00:00.000Z';
const entry=(id,kind='buy',quantity='100',amount='13000000')=>({id,kind,quantity,amount,at});
const book=(id,entries=[entry(id+'-buy')])=>({id,name:id,entries});
const workbook=(books,selected=books[0]?.id||'')=>({version:1,selected,legacyImported:false,books});
const str=JSON.stringify,base=workbook([book('ore'),book('wood')]);
const local=structuredClone(base),remote=structuredClone(base);local.books[0].entries.push(entry('local-sale','sale','25','3375000'));remote.books[1].entries.push(entry('remote-sale','sale','50','7000000'));
const merged=JSON.parse(mergeTradeCollection(WORKBOOK_KEY,str(base),str(local),str(remote)));
assert.equal(merged.books[0].entries.length,2);assert.equal(merged.books[1].entries.length,2);
assert.equal(workbookTotals(merged.books[0].entries).realizedProfit,125000n);assert.equal(workbookTotals(merged.books[0].entries).remaining,75n);
const collision=structuredClone(base);collision.books[0].entries.push(entry('other-sale','sale','80','12000000'));
assert.throws(()=>mergeTradeCollection(WORKBOOK_KEY,str(base),str(local),str(collision)),TradeSyncConflict);
assert.throws(()=>mergeTradeCollection(WORKBOOK_KEY,str(base),str(workbook([base.books[1]])),str(local)),TradeSyncConflict);
assert.deepEqual(JSON.parse(mergeTradeCollection(WORKBOOK_KEY,str(base),str(local),str(local))),local);
assert.equal(JSON.parse(mergeTradeCollection(WORKBOOK_KEY,undefined,str(workbook([book('a')])),str(workbook([book('b')])))).books.length,2);
assert.equal(JSON.parse(mergeTradeCollection(WORKBOOK_KEY,str(base),str(workbook([base.books[1]])),str(base))).books.length,1);
assert.deepEqual(parseTradeBackup(WORKBOOK_KEY,tradeBackup(WORKBOOK_KEY,local)),local);
for(const bad of ['{bad',str({schema:'bad',key:WORKBOOK_KEY,data:local}),tradeBackup(CRAFT_PLANS_KEY,{version:1,selected:'',plans:[]})])assert.throws(()=>parseTradeBackup(WORKBOOK_KEY,bad));
assert.throws(()=>parseWorkbook(str(workbook([book('a',[entry('x','sale')])]))));
const draft={...emptyCraft(),materials:[{id:'mat',name:'ore',quantity:'10',price:'100',owned:'4'}],cost:'100',output:'2',sell:'1000'};
assert.equal(calculateCraft(draft).profit,700n);assert.equal(craftFunding(draft).additionalCost,700n);assert.equal(craftFunding(draft).materials[0].missing,6n);
assert.equal(craftFunding({...draft,materials:[{...draft.materials[0],owned:'30'}]}).additionalCost,100n);
assert.equal(craftFunding({...draft,materials:[{...draft.materials[0],owned:'-1'}]}),null);
const plans={version:1,selected:'p',plans:[{id:'p',name:'one',draft}]};assert.deepEqual(parseCraftPlans(str(plans)),plans);assert.throws(()=>parseCraftPlans(str({...plans,plans:[...plans.plans,...plans.plans]})));
class Storage{data=new Map();fail=false;get length(){return this.data.size;}key(i){return [...this.data.keys()][i]??null;}getItem(k){return this.data.get(k)??null;}setItem(k,v){if(this.fail)throw Error('quota');this.data.set(k,String(v));}removeItem(k){this.data.delete(k);}}
const disk=new Storage();disk.setItem(WORKBOOK_KEY,str(local));const alice=new AccountSettingsStore(()=>disk,'alice'),bob=new AccountSettingsStore(()=>disk,'bob');
assert.equal(alice.getItem(WORKBOOK_KEY),null);assert.equal(bob.getItem(WORKBOOK_KEY),null); // guest records never leak into new members
alice.apply({[WORKBOOK_KEY]:str(base)},1);alice.setItem(WORKBOOK_KEY,str(local));
assert.throws(()=>alice.apply({[WORKBOOK_KEY]:str(collision)},2),TradeSyncConflict);
assert.equal(alice.getItem(WORKBOOK_KEY),str(local));assert.throws(()=>alice.snapshot(),TradeSyncConflict);
const reload=new AccountSettingsStore(()=>disk,'alice');assert.equal(reload.tradeConflict().remote,str(collision));
disk.fail=true;assert.throws(()=>reload.resolveTradeConflict('remote'));assert.equal(reload.getItem(WORKBOOK_KEY),str(local));disk.fail=false;
reload.resolveTradeConflict('local');reload.apply({[WORKBOOK_KEY]:str(collision)},2);assert.equal(reload.getItem(WORKBOOK_KEY),str(local));assert.ok(disk.getItem(reload.cacheKey+':trade-resolution-backup'));
assert.equal(bob.getItem(WORKBOOK_KEY),null);assert.equal(disk.getItem(WORKBOOK_KEY),str(local));
const secondDisk=new Storage(),second=new AccountSettingsStore(()=>secondDisk,'alice');second.apply({[WORKBOOK_KEY]:str(base)},1);second.setItem(WORKBOOK_KEY,str(local));assert.throws(()=>second.apply({[WORKBOOK_KEY]:str(collision)},2));second.resolveTradeConflict('remote');second.apply({[WORKBOOK_KEY]:str(collision)},2);assert.equal(second.getItem(WORKBOOK_KEY),str(collision));
// Fake-clock transport integration: no PUT is allowed while money records conflict.
let timers=[],state='',puts=0;const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;
globalThis.setTimeout=fn=>{timers.push(fn);return fn;};globalThis.clearTimeout=id=>{timers=timers.filter(fn=>fn!==id);};
try{
 const port=new Storage(),store=new AccountSettingsStore(()=>port,'sync');store.apply({[WORKBOOK_KEY]:str(base)},1);store.setItem(WORKBOOK_KEY,str(local));
 let server={version:1,revision:2,entries:{[WORKBOOK_KEY]:str(collision)}};
 const sync=new SettingsSync(store,async(method,input)=>{if(method==='GET')return server;puts++;if(input.revision!==server.revision)throw Object.assign(Error(),{status:409});server={...input,revision:server.revision+1};return server;},()=>{},s=>state=s);
 await sync.start();assert.equal(state,'conflict');assert.equal(puts,0);
 store.setItem('asbc-locale','en');for(const fn of timers.splice(0))await fn();for(let i=0;i<10;i++)await Promise.resolve();assert.equal(puts,0);
 store.resolveTradeConflict('local');await sync.retry();for(const fn of timers.splice(0))await fn();for(let i=0;i<10;i++)await Promise.resolve();assert.equal(puts,1);assert.equal(state,'saved');assert.equal(server.entries[WORKBOOK_KEY],str(local));assert.equal(server.entries['asbc-locale'],'en');sync.stop();
}finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
assert.deepEqual(validateDocument({version:1,revision:0,entries:{[WORKBOOK_KEY]:str(local),[CRAFT_PLANS_KEY]:str(plans)}}).entries,{[WORKBOOK_KEY]:str(local),[CRAFT_PLANS_KEY]:str(plans)});
console.log('PASS trade sync: independent books, concurrent trades/deletion conflicts, both resolutions, backup failure, reload persistence, no blocked PUT, member isolation, guest migration safety, backups and crafting funding');

const noSalePlans={version:1,selected:'new',plans:[...plans.plans,{id:'new',name:'price first',draft:{...draft,sell:''}}]};
assert.deepEqual(parseCraftPlans(str(noSalePlans)),noSalePlans);
assert.deepEqual(parseTradeBackup(CRAFT_PLANS_KEY,tradeBackup(CRAFT_PLANS_KEY,noSalePlans)),noSalePlans);
console.log('PASS crafting plans: old priced and new unpriced drafts coexist and round-trip through backup');
