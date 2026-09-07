const CATEGORIES=["全部","珠颈斑鸠","夜鹭","鸦科","鸲类","其他"];
const STARTERS=[
 {id:"dove",title:"斑鸠的凝视",caption:"当你说只看一眼，结果举着望远镜站了半小时",category:"珠颈斑鸠",starter:"left"},
 {id:"heron",title:"夜鹭待机中",caption:"表面一动不动，脑内已经抓了八条鱼",category:"夜鹭",starter:"center"},
 {id:"corvid",title:"鸦科已读",caption:"它不是在看你，它是在评估你的零食库存",category:"鸦科",starter:"right"}
];
const cfg=window.BIRDMEME_CONFIG||{};
const configured=cfg.supabaseUrl&&!cfg.supabaseUrl.startsWith("YOUR_")&&cfg.supabaseAnonKey&&!cfg.supabaseAnonKey.startsWith("YOUR_");
const client=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
let memes=[...STARTERS],active="全部",session=null;
const $=s=>document.querySelector(s),grid=$("#grid"),loginBtn=$("#loginBtn"),logoutBtn=$("#logoutBtn"),uploadBtn=$("#uploadBtn"),dialog=$("#uploadDialog"),form=$("#uploadForm");

function isAdmin(){return session?.user?.user_metadata?.user_name===cfg.adminGithubLogin||session?.user?.user_metadata?.preferred_username===cfg.adminGithubLogin}
function render(){
 const visible=active==="全部"?memes:memes.filter(m=>m.category===active);
 $("#sectionTitle").textContent=`${active}分区`;$("#itemCount").textContent=`${visible.length} 张`;$("#count").textContent=memes.length;$("#empty").classList.toggle("hidden",visible.length>0);
 grid.innerHTML=visible.map(m=>`<article class="card"><div class="photo ${m.starter?`starter ${m.starter}`:""}"><img src="${m.starter?(window.BIRDS_IMAGE||"birds.jpg"):escapeHtml(m.image_url)}" alt="${escapeHtml(m.title)}"><span class="chip">${escapeHtml(m.category)}</span></div><div class="copy"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.caption)}</p></div></article>`).join("");
 uploadBtn.classList.toggle("hidden",!isAdmin());logoutBtn.classList.toggle("hidden",!session);loginBtn.classList.toggle("hidden",!!session);
}
function escapeHtml(value){const d=document.createElement("div");d.textContent=String(value||"");return d.innerHTML}
function buildNav(){const nav=$("#categories");CATEGORIES.forEach(c=>{const b=document.createElement("button");b.textContent=c;b.className=c===active?"active":"";b.onclick=()=>{active=c;[...nav.children].forEach(x=>x.classList.toggle("active",x===b));render()};nav.appendChild(b)})}
async function load(){if(!client)return;const {data}=await client.from("memes").select("id,title,caption,category,image_url,created_at").order("created_at",{ascending:false}).limit(100);if(data)memes=[...data,...STARTERS];const auth=await client.auth.getSession();session=auth.data.session;client.auth.onAuthStateChange((_event,next)=>{session=next;render()});render()}
loginBtn.onclick=async()=>{if(!client){alert("网站管理员尚未完成 Supabase 配置。");return}await client.auth.signInWithOAuth({provider:"github",options:{redirectTo:location.origin}})};
logoutBtn.onclick=async()=>{await client?.auth.signOut()};uploadBtn.onclick=()=>dialog.showModal();$("#closeDialog").onclick=()=>dialog.close();
form.image.onchange=()=>{const f=form.image.files[0];if(f){$("#preview").src=URL.createObjectURL(f);$("#preview").classList.remove("hidden")}};
form.onsubmit=async e=>{e.preventDefault();const message=$("#formMessage");message.textContent="";if(!client||!isAdmin()){message.textContent="当前账号没有上传权限";return}const file=form.image.files[0];if(!file||file.size>8*1024*1024){message.textContent="请选择不超过 8 MB 的图片";return}const ext=file.name.split(".").pop().toLowerCase();const path=`${session.user.id}/${crypto.randomUUID()}.${ext}`;const button=form.querySelector("button[type=submit]");button.disabled=true;button.textContent="正在发布…";try{const uploaded=await client.storage.from("memes").upload(path,file,{contentType:file.type});if(uploaded.error)throw uploaded.error;const imageUrl=client.storage.from("memes").getPublicUrl(path).data.publicUrl;const row={title:form.title.value.trim(),caption:form.caption.value.trim(),category:form.category.value,image_url:imageUrl,storage_path:path,owner_id:session.user.id};const saved=await client.from("memes").insert(row).select().single();if(saved.error)throw saved.error;memes.unshift(saved.data);active=saved.data.category;form.reset();$("#preview").classList.add("hidden");dialog.close();render()}catch(err){message.textContent=err.message||"发布失败，请稍后重试"}finally{button.disabled=false;button.textContent="发布 meme"}};
buildNav();render();load();
