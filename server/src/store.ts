import fs from 'node:fs/promises';import path from 'node:path';
export const ROOT=path.resolve(process.env.PROJECTS_DIR||'storage/projects');
export type YouTubeSource={type:'youtube',videoId:string,url:string,title?:string,author?:string,lengthSeconds?:number,transcript?:string,transcriptSource?:'captions'|'manual',analysis?:any};
export type Project={id:string;topic:string,status:string;progress:number,stage:string,createdAt:string,settings:any,logs:{time:string;message:string;level:string}[],scenes?:any[],source?:YouTubeSource,error?:string,export?:string};
const file=(id:string)=>path.join(ROOT,id,'project.json');
export async function save(p:Project){await fs.mkdir(path.dirname(file(p.id)),{recursive:true});await fs.writeFile(file(p.id),JSON.stringify(p,null,2));return p}
export async function get(id:string){return JSON.parse(await fs.readFile(file(id),'utf8')) as Project}
export async function list(){await fs.mkdir(ROOT,{recursive:true});const dirs=await fs.readdir(ROOT);const all=await Promise.all(dirs.map(async d=>{try{return await get(d)}catch{return null}}));return all.filter(Boolean).sort((a:any,b:any)=>b.createdAt.localeCompare(a.createdAt))}
export async function update(id:string,patch:Partial<Project>){const p=await get(id);return save({...p,...patch})}
export async function log(id:string,message:string,level='info'){const p=await get(id);p.logs.push({time:new Date().toISOString(),message,level});return save(p)}
export async function remove(id:string){await fs.rm(path.join(ROOT,id),{recursive:true,force:true})}
