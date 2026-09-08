const cfg=window.BIRDMEME_CONFIG||{},client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let session=null,memes=[],entryIds=new Set();const $=s=>document.querySelector(s),grid=$("#grid");
function admin(){return session?.user?.id===cfg.adminUserId}
function esc(v){const d=document.createElement("div");d.textContent=String(v||"");return d.innerHTML}
function notice(t,k="success"){const n=$("#notice");n.textContent=t;n.className=`notice ${k}`;setTimeout(()=>n.classList.add("hidden"),3500)}
function render(){
 const chosen=memes.filter(m=>entryIds.has(m.id));$("#loading").classList.add("hidden");$("#empty").classList.toggle("hidden",chosen.length>0);$("#itemCount").textContent=`${chosen.length} 张`;
 grid.innerHTML=chosen.map(m=>`<article class="card"><div class="photo"><img src="${esc(m.image_url)}" alt="${esc(m.title)}" loading="lazy"><span class="chip">夜鹭</span></div><div class="copy"><h3>${esc(m.title)}</h3><p>${esc(m.caption)}</p></div></article>`).join("");
 $("#manager").classList.toggle("hidden",!admin());$("#loginBtn").classList.toggle("hidden",Boolean(session));$("#logoutBtn").classList.toggle("hidden",!session);
 if(admin())$("#candidateGrid").innerHTML=memes.map(m=>`<article class="candidate" data-id="${esc(m.id)}"><img src="${esc(m.image_url)}" alt=""><div><h3>${esc(m.title)}</h3><button class="${entryIds.has(m.id)?"in":""}">${entryIds.has(m.id)?"移出专题":"＋ 加入专题"}</button></div></article>`).join("");
}
async function load(){const [m,e]=await Promise.all([client.from("memes").select("id,title,caption,image_url,created_at").eq("category","夜鹭").order("created_at",{ascending:false}),client.from("night_heron_contest_entries").select("meme_id")]);if(m.error||e.error){$("#loading").textContent="专题数据尚未配置完成";return}memes=m.data||[];entryIds=new Set((e.data||[]).map(x=>x.meme_id));render()}
$("#loginBtn").onclick=async()=>{const {error}=await client.auth.signInWithOAuth({provider:"github",options:{redirectTo:new URL(".",location.href).href}});if(error)notice(error.message,"error")};
$("#logoutBtn").onclick=()=>client.auth.signOut();$("#candidateGrid").onclick=async e=>{const b=e.target.closest("button");if(!b||!admin())return;const id=b.closest(".candidate").dataset.id,inSet=entryIds.has(id);b.disabled=true;const q=inSet?client.from("night_heron_contest_entries").delete().eq("meme_id",id):client.from("night_heron_contest_entries").insert({meme_id:id,created_by:session.user.id});const {error}=await q;if(error){b.disabled=false;return notice(error.message,"error")}inSet?entryIds.delete(id):entryIds.add(id);render();notice(inSet?"已移出专题":"已加入专题")};
async function init(){const {data}=await client.auth.getSession();session=data.session;client.auth.onAuthStateChange((_e,s)=>{session=s;render()});await load()}init();
