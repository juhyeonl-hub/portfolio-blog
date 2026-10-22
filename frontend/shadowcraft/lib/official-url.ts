/** Navigation only. Source metadata is retained separately. */
export function isOfficialUrl(value:string):boolean {
 try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['plaync.com','ncsoft.com','steampowered.com','steamcommunity.com'].some(host=>u.hostname===host||u.hostname.endsWith('.'+host));}catch{return false;}
}
