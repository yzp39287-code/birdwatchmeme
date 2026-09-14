const fs=require("node:fs");
const path=require("node:path");

const SUPABASE_URL="https://xlfpyzvuadqfekluwrdv.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_xrB_nrHZNAqkPQK5OELb4g_hpez-0lx";
const ADMIN_USER_ID="e06f43d2-f022-43ec-87bc-9d0b36ce5b4f";

exports.handler=async event=>{
  const token=(event.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!token)return{statusCode:401,body:"Unauthorized"};
  try{
    const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`}});
    if(!response.ok)return{statusCode:401,body:"Unauthorized"};
    const user=await response.json();
    if(user.id!==ADMIN_USER_ID)return{statusCode:403,body:"Forbidden"};
    const candidates=[path.join(__dirname,"dove-sequel.html"),path.join(process.cwd(),"netlify/functions/dove-sequel.html"),path.join(process.cwd(),"dove-sequel.html")];
    const gamePath=candidates.find(fs.existsSync);
    if(!gamePath)throw new Error("Protected game file was not bundled");
    const html=fs.readFileSync(gamePath,"utf8");
    return{statusCode:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"},body:html};
  }catch(error){console.error(error);return{statusCode:500,body:"Game unavailable"};}
};
