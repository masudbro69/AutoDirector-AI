import crypto from 'node:crypto';
import type { Request,Response,NextFunction } from 'express';

const pairingCode=process.env.PAIRING_CODE||String(crypto.randomInt(100000,999999));
const sessions=new Set<string>();
const failures=new Map<string,{count:number,until:number}>();
export function showPairingCode(){return pairingCode}
export function pair(req:Request,res:Response){
 const ip=req.ip||'unknown';const state=failures.get(ip);if(state&&state.until>Date.now())return res.status(429).json({error:'Too many attempts. Try again shortly.'});
 const submitted=String(req.body?.code||'');if(!crypto.timingSafeEqual(Buffer.from(submitted.padEnd(6).slice(0,6)),Buffer.from(pairingCode))){const count=(state?.count||0)+1;failures.set(ip,{count,until:count>=5?Date.now()+60_000:0});return res.status(401).json({error:'Invalid pairing code'})}
 failures.delete(ip);const token=crypto.randomBytes(32).toString('base64url');sessions.add(token);res.json({token,deviceName:process.env.DEVICE_NAME||'AutoDirector PC'})
}
export function auth(req:Request,res:Response,next:NextFunction){if(process.env.DISABLE_AUTH==='true')return next();const token=req.header('authorization')?.replace(/^Bearer\s+/i,'');if(!token||!sessions.has(token))return res.status(401).json({error:'Pairing required'});next()}
export function revoke(req:Request,res:Response){const token=req.header('authorization')?.replace(/^Bearer\s+/i,'');if(token)sessions.delete(token);res.status(204).end()}
