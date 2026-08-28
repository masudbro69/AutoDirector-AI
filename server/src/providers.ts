import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const config={ollama:process.env.OLLAMA_URL||'http://127.0.0.1:11434',comfy:process.env.COMFYUI_URL||'http://127.0.0.1:8188',textModel:process.env.OLLAMA_MODEL||'qwen2.5:7b',piperModel:process.env.PIPER_MODEL||'models/en_US-lessac-medium.onnx'};
export async function health(){
 const probe=async(url:string)=>{try{return (await fetch(url,{signal:AbortSignal.timeout(1800)})).ok}catch{return false}};
 return {ollama:await probe(`${config.ollama}/api/tags`),comfyui:await probe(`${config.comfy}/system_stats`),ffmpeg:await commandExists('ffmpeg'),piper:await commandExists('piper')};
}
async function commandExists(cmd:string){return new Promise<boolean>(r=>{const p=spawn(cmd,['--help']);p.on('error',()=>r(false));p.on('close',()=>r(true))})}
export async function ollamaJSON(prompt:string){const response=await fetch(`${config.ollama}/api/generate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:config.textModel,prompt,stream:false,format:'json',options:{temperature:.65}})});if(!response.ok)throw new Error(`Ollama ${response.status}`);const data=await response.json() as {response:string};return JSON.parse(data.response)}
export async function piper(text:string,out:string){await fs.mkdir(path.dirname(out),{recursive:true});return run('piper',['--model',config.piperModel,'--output_file',out],text)}
export async function ffmpeg(args:string[]){return run('ffmpeg',['-y',...args])}
function run(command:string,args:string[],input?:string){return new Promise<void>((resolve,reject)=>{const p=spawn(command,args,{stdio:['pipe','ignore','pipe']});let err='';p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',c=>c===0?resolve():reject(new Error(err.slice(-1500))));if(input)p.stdin.end(input);else p.stdin.end()})}
export async function comfyImage(prompt:string,negative:string,width:number,height:number,outDir:string){
 const seed=Math.floor(Math.random()*2_000_000_000);const workflow={"3":{class_type:'KSampler',inputs:{seed,steps:22,cfg:7,sampler_name:'euler',scheduler:'normal',denoise:1,model:['4',0],positive:['6',0],negative:['7',0],latent_image:['5',0]}},"4":{class_type:'CheckpointLoaderSimple',inputs:{ckpt_name:process.env.COMFY_CHECKPOINT||'sd_xl_base_1.0.safetensors'}},"5":{class_type:'EmptyLatentImage',inputs:{width,height,batch_size:1}},"6":{class_type:'CLIPTextEncode',inputs:{text:prompt,clip:['4',1]}},"7":{class_type:'CLIPTextEncode',inputs:{text:negative,clip:['4',1]}},"8":{class_type:'VAEDecode',inputs:{samples:['3',0],vae:['4',2]}},"9":{class_type:'SaveImage',inputs:{filename_prefix:`autodirector_${seed}`,images:['8',0]}}};
 const queued=await fetch(`${config.comfy}/prompt`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:workflow})});if(!queued.ok)throw new Error(`ComfyUI ${queued.status}`);const {prompt_id}=await queued.json() as {prompt_id:string};
 for(let i=0;i<180;i++){await new Promise(r=>setTimeout(r,1000));const h=await fetch(`${config.comfy}/history/${prompt_id}`);const history=await h.json() as any;const image=history[prompt_id]?.outputs?.['9']?.images?.[0];if(image){const q=new URLSearchParams({filename:image.filename,subfolder:image.subfolder||'',type:image.type||'output'});const bytes=Buffer.from(await (await fetch(`${config.comfy}/view?${q}`)).arrayBuffer());await fs.mkdir(outDir,{recursive:true});const target=path.join(outDir,`${seed}.png`);await fs.writeFile(target,bytes);return target}}throw new Error('ComfyUI generation timed out')
}
