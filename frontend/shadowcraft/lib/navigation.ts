// Screen-only hashes never overlap the existing build payload, Steam or transfer hashes.
const routes:Record<string,string>={
 home:'/',quick:'/build',skills:'/build/skills',daevanion:'/build/daevanion',
 gear:'/build/gear',macro:'/build/macro',rotation:'/build/rotation',
 rankers:'/rankers','public-builds':'/public-builds',map:'/map',
 builds:'/builds',database:'/database',updates:'/updates',account:'/account',
};
export function screenHash(screen:string):string{return '#'+(routes[screen]||'/');}
export function screenFromHash(hash:string):string|null{
 if(!hash||hash==='#')return 'home';
 return Object.keys(routes).find(screen=>'#'+routes[screen]===hash)??null;
}
