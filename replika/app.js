import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client/+esm";
const $=id=>document.getElementById(id);
const state={identity:null,target:null,result:null};let clientPromise;
function status(s){$("status").textContent=s}
function refresh(){ $("generateButton").disabled=!(state.identity&&state.target&&$("consent").checked); }
function addPhoto(input,img,name,key,card){$(input).addEventListener("change",e=>{const f=e.target.files?.[0];if(!f)return;if(!["image/jpeg","image/png","image/webp"].includes(f.type)){status("Usa una foto JPG, PNG o WebP.");return;}state[key]=f;$(img).src=URL.createObjectURL(f);$(img).hidden=false;$(name).textContent=f.name;card.classList.add("has-image");refresh();});}
const cards=document.querySelectorAll(".upload-card");
addPhoto("identityInput","identityPreview","identityName","identity",cards[0]);
addPhoto("targetInput","targetPreview","targetName","target",cards[1]);
$("consent").addEventListener("change",refresh);
$("generateButton").addEventListener("click",async()=>{
 if(!state.identity||!state.target||!$("consent").checked)return;
 $("generateButton").disabled=true;status("Conectando con el motor gratuito…");
 try{
  clientPromise ||= Client.connect("kulkas2pintu/QWEN_EDIT_IMAGE");
  const client=await clientPromise;status("Generando. Puede tardar unos minutos si hay espera.");
  const result=await client.predict("/edit",{image:state.identity,prompt:$("instruction").value.trim(),lora_adapter:"Fal-Multiple-Angles",image2:state.target,seed:0,randomize_seed:true,guidance_scale:2.5,steps:6,preserve_identity:true,identity_strength:85,output_size:1280,fix_hands:true});
  const item=result.data?.[0];const url=typeof item==="string"?item:(item?.url||item?.path);
  if(!url)throw new Error("No se recibió una imagen.");
  state.result=url;$("resultImage").src=url;$("resultPanel").hidden=false;$("resultPanel").scrollIntoView({behavior:"smooth"});status("Fotografía generada.");
 }catch(e){clientPromise=null;status("El motor gratuito está ocupado o no disponible. Inténtalo nuevamente más tarde.");}
 finally{$("generateButton").disabled=!(state.identity&&state.target&&$("consent").checked);}
});
$("downloadButton").addEventListener("click",async()=>{if(!state.result)return;try{const r=await fetch(state.result);const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="replika-ai.png";a.click();URL.revokeObjectURL(u);}catch{window.open(state.result,"_blank","noopener");}});
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
