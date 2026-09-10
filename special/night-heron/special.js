const cfg=window.BIRDMEME_CONFIG||{},client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
let session=null,memes=[],entries=[],todayVote=null;const $=s=>document.querySelector(s),grid=$("#grid");
function admin(){return session?.user?.id===cfg.adminUserId}
function esc(v){const d=document.createElement("div");d.textContent=String(v||"");return d.innerHTML}
function bjDay(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function notice(t,k="success"){const n=$("#notice");n.textContent=t;n.className=`notice ${k}`;clearTimeout(notice.timer);notice.timer=setTimeout(()=>n.classList.add("hidden"),3500)}
function chosen(){const byId=new Map(memes.map(m=>[m.id,m]));return entries.map(e=>({...byId.get(e.meme_id),number:e.contest_number})).filter(m=>m.id).sort((a,b)=>a.number-b.number)}
function render(){
 const selected=chosen();$("#loading").classList.add("hidden");$("#empty").classList.toggle("hidden",selected.length>0);$("#itemCount").textContent=`${selected.length} 张`;
 grid.innerHTML=selected.map(m=>`<article class="card contest-card" data-id="${esc(m.id)}"><div class="photo"><img src="${esc(m.image_url)}" alt="${esc(m.title)}" loading="lazy"><b class="contest-number">#${m.number}</b></div><div class="copy"><h3>${esc(m.title)}</h3><p>${esc(m.caption)}</p><button class="vote-button ${todayVote===m.id?"voted":""}" data-vote="${esc(m.id)}" ${todayVote?"disabled":""}>${todayVote===m.id?"✓ 今天已投给它":todayVote?"今天的票已使用":"为它投票"}</button></div></article>`).join("");
 $("#manager").classList.toggle("hidden",!admin());$("#loginBtn").classList.toggle("hidden",Boolean(session));$("#logoutBtn").classList.toggle("hidden",!session);
 if(admin())$("#candidateGrid").innerHTML=memes.map(m=>{const e=entries.find(x=>x.meme_id===m.id);return `<article class="candidate" data-id="${esc(m.id)}"><img src="${esc(m.image_url)}" alt=""><div><h3>${e?`#${e.contest_number} · `:""}${esc(m.title)}</h3><button class="${e?"in":""}">${e?"移出专题":"＋ 加入专题"}</button></div></article>`}).join("");
}
async function load(){
 const [m,e]=await Promise.all([client.from("memes").select("id,title,caption,image_url,created_at").eq("category","夜鹭").order("created_at",{ascending:false}),client.from("night_heron_contest_entries").select("meme_id,contest_number").order("contest_number")]);
 if(m.error||e.error){$("#loading").textContent="专题投票数据尚未配置完成";return}memes=m.data||[];entries=e.data||[];
 if(session){const {data}=await client.from("night_heron_votes").select("meme_id").eq("vote_day",bjDay()).maybeSingle();todayVote=data?.meme_id||null}else todayVote=null;
 render();await loadRanking();
}
async function loadRanking(){const {data,error}=await client.rpc("night_heron_leaderboard");if(error)return $("#ranking").innerHTML="<li>榜单尚未配置</li>";$("#ranking").innerHTML=(data||[]).map((r,i)=>`<li><b>${i+1}</b><span><strong>#${r.contest_number} ${esc(r.title)}</strong><small>${r.vote_count} 票</small></span></li>`).join("")||"<li>暂无参赛作品</li>"}
grid.onclick=async e=>{const b=e.target.closest("[data-vote]");if(!b)return;if(!session){$("#loginDialog").showModal();return}if(todayVote)return notice("你今天已经投过票了","error");b.disabled=true;const id=b.dataset.vote,{error}=await client.from("night_heron_votes").insert({meme_id:id,user_id:session.user.id,vote_day:bjDay()});if(error){b.disabled=false;return notice(error.code==="23505"?"你今天已经投过票了":error.message,"error")}todayVote=id;render();await loadRanking();notice("投票成功，明天还可以再投一票")};
$("#loginBtn").onclick=()=>{$("#loginMessage").textContent="";$("#loginDialog").showModal()};
$("#closeLogin").onclick=()=>$("#loginDialog").close();
$("#emailForm").onsubmit=async e=>{e.preventDefault();const b=e.currentTarget.querySelector("button"),email=e.currentTarget.elements.email.value.trim();b.disabled=true;const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:true}});b.disabled=false;if(error)return $("#loginMessage").textContent=error.message;loginEmail=email;$("#emailForm").classList.add("hidden");$("#otpForm").classList.remove("hidden");$("#loginMessage").textContent="验证码已发送，请检查收件箱和垃圾邮件。"};
$("#githubLogin").onclick=async()=>{const {error}=await client.auth.signInWithOAuth({provider:"github",options:{redirectTo:new URL(".",location.href).href}});if(error)$("#loginMessage").textContent=error.message};
$("#logoutBtn").onclick=()=>client.auth.signOut();
$("#candidateGrid").onclick=async e=>{const b=e.target.closest("button");if(!b||!admin())return;const id=b.closest(".candidate").dataset.id,entry=entries.find(x=>x.meme_id===id);b.disabled=true;let q;if(entry)q=client.from("night_heron_contest_entries").delete().eq("meme_id",id);else{const number=entries.reduce((max,x)=>Math.max(max,x.contest_number),0)+1;q=client.from("night_heron_contest_entries").insert({meme_id:id,contest_number:number,created_by:session.user.id})}const {error}=await q;if(error){b.disabled=false;return notice(error.message,"error")}await load();notice(entry?"已移出专题":"已加入专题")};
async function init(){const {data}=await client.auth.getSession();session=data.session;client.auth.onAuthStateChange(async(_e,s)=>{session=s;await load()});await load();setInterval(loadRanking,15000)}init();
