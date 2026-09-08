const DEFAULT_CATEGORIES=["珠颈斑鸠","夜鹭","鸦科","鸲类","其他"];
const cfg=window.BIRDMEME_CONFIG||{};
const configured=Boolean(cfg.supabaseUrl&&!cfg.supabaseUrl.startsWith("YOUR_")&&cfg.supabaseAnonKey&&!cfg.supabaseAnonKey.startsWith("YOUR_")&&window.supabase);
const client=configured?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
let categories=["全部",...DEFAULT_CATEGORIES],memes=[],active="全部",session=null,loading=true;
const $=s=>document.querySelector(s),grid=$("#grid"),loginBtn=$("#loginBtn"),logoutBtn=$("#logoutBtn"),uploadBtn=$("#uploadBtn"),uploadDialog=$("#uploadDialog"),uploadForm=$("#uploadForm"),editDialog=$("#editDialog"),editForm=$("#editForm"),categoryDialog=$("#categoryDialog"),categoryForm=$("#categoryForm");

function isAdmin(){const m=session?.user?.user_metadata;return m?.user_name===cfg.adminGithubLogin||m?.preferred_username===cfg.adminGithubLogin}
function escapeHtml(value){const node=document.createElement("div");node.textContent=String(value||"");return node.innerHTML}
function showNotice(message,kind="info"){const n=$("#notice");n.textContent=message;n.className=`notice ${kind}`;n.classList.remove("hidden");clearTimeout(showNotice.timer);showNotice.timer=setTimeout(()=>n.classList.add("hidden"),4200)}
function render(){
 const visible=active==="全部"?memes:memes.filter(m=>m.category===active);
 $("#sectionTitle").textContent=`${active}分区`;$("#itemCount").textContent=loading?"加载中…":`${visible.length} 张`;$("#count").textContent=loading?"…":memes.length;
 $("#loading").classList.toggle("hidden",!loading);$("#empty").classList.toggle("hidden",loading||visible.length>0);
 grid.innerHTML=visible.map(m=>`<article class="card" data-id="${escapeHtml(m.id)}"><div class="photo"><img src="${escapeHtml(m.image_url)}" alt="${escapeHtml(m.title)}" loading="lazy" decoding="async"><span class="chip">${escapeHtml(m.category)}</span></div><div class="copy"><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.caption)}</p>${isAdmin()?`<div class="card-actions"><button class="edit-button" type="button" data-action="edit">编辑</button><button class="delete-button" type="button" data-action="delete">删除</button></div>`:""}</div></article>`).join("");
 uploadBtn.classList.toggle("hidden",!isAdmin());logoutBtn.classList.toggle("hidden",!session);loginBtn.classList.toggle("hidden",Boolean(session));
}
function syncCategorySelects(){
 const options=categories.slice(1).map(c=>`<option>${escapeHtml(c)}</option>`).join("");
 uploadForm.category.innerHTML=`<option value="">请选择</option>${options}`;
 editForm.category.innerHTML=options;
}
function renderNav(){
 const nav=$("#categories");nav.innerHTML="";
 categories.forEach(c=>{const b=document.createElement("button");b.textContent=c;b.className=c===active?"active":"";b.onclick=()=>{active=c;renderNav();render()};nav.appendChild(b)});
 if(isAdmin()){const add=document.createElement("button");add.type="button";add.className="add-category";add.textContent="＋ 增加分区";add.onclick=()=>{categoryForm.reset();$("#categoryMessage").textContent="";categoryDialog.showModal()};nav.appendChild(add)}
}
async function loadCategories(){
 if(!client){syncCategorySelects();renderNav();return}
 const {data,error}=await client.from("categories").select("name,sort_order").order("sort_order",{ascending:true});
 if(!error&&data?.length)categories=["全部",...data.map(row=>row.name)];
 syncCategorySelects();renderNav();
}
async function refreshMemes(){
 if(!client){loading=false;render();showNotice("网站数据服务尚未配置完成。","error");return}
 loading=true;render();
 const {data,error}=await client.from("memes").select("id,title,caption,category,image_url,storage_path,owner_id,created_at").order("created_at",{ascending:false}).limit(200);
 loading=false;
 if(error){render();showNotice(`图片加载失败：${error.message}`,"error");$("#retryLoad").classList.remove("hidden");return}
 $("#retryLoad").classList.add("hidden");memes=data||[];render();
}
async function initialize(){if(!client){loading=false;syncCategorySelects();renderNav();render();return}const {data}=await client.auth.getSession();session=data.session;client.auth.onAuthStateChange((_e,next)=>{session=next;renderNav();render()});renderNav();await Promise.all([loadCategories(),refreshMemes()])}
loginBtn.onclick=async()=>{if(!client)return showNotice("网站管理员尚未完成 Supabase 配置。","error");const {error}=await client.auth.signInWithOAuth({provider:"github",options:{redirectTo:new URL(".",location.href).href}});if(error)showNotice(`登录失败：${error.message}`,"error")};
logoutBtn.onclick=async()=>{const {error}=await client?.auth.signOut();if(error)showNotice(`退出失败：${error.message}`,"error")};
uploadBtn.onclick=()=>uploadDialog.showModal();$("#closeDialog").onclick=()=>uploadDialog.close();$("#closeEditDialog").onclick=()=>editDialog.close();$("#closeCategoryDialog").onclick=()=>categoryDialog.close();
categoryForm.onsubmit=async e=>{
 e.preventDefault();const message=$("#categoryMessage"),button=categoryForm.querySelector("button[type=submit]"),name=categoryForm.name.value.trim();message.textContent="";
 if(!client||!isAdmin())return message.textContent="当前账号没有新增分区权限";
 if(!name||name.length>12||name==="全部")return message.textContent="请输入 1–12 个字的有效分区名称";
 if(categories.includes(name))return message.textContent="这个分区已经存在";
 button.disabled=true;button.textContent="添加中…";
 const {data,error}=await client.from("categories").insert({name,sort_order:categories.length}).select().single();
 button.disabled=false;button.textContent="添加分区";
 if(error)return message.textContent=error.message||"添加失败";
 categories.push(data.name);active=data.name;syncCategorySelects();renderNav();render();categoryDialog.close();showNotice(`“${data.name}”分区已添加。`,"success");
};
uploadForm.image.onchange=()=>{const f=uploadForm.image.files[0];if(f){$("#preview").src=URL.createObjectURL(f);$("#preview").classList.remove("hidden")}};
uploadForm.onsubmit=async e=>{
 e.preventDefault();const message=$("#formMessage");message.textContent="";if(!client||!isAdmin())return message.textContent="当前账号没有上传权限";
 const file=uploadForm.image.files[0];if(!file||file.size>8*1024*1024)return message.textContent="请选择不超过 8 MB 的图片";
 const ext=file.name.split(".").pop().toLowerCase(),path=`${session.user.id}/${crypto.randomUUID()}.${ext}`,button=uploadForm.querySelector("button[type=submit]");button.disabled=true;button.textContent="正在发布…";
 try{
  const uploaded=await client.storage.from("memes").upload(path,file,{contentType:file.type});if(uploaded.error)throw uploaded.error;
  const imageUrl=client.storage.from("memes").getPublicUrl(path).data.publicUrl,row={title:uploadForm.title.value.trim(),caption:uploadForm.caption.value.trim(),category:uploadForm.category.value,image_url:imageUrl,storage_path:path,owner_id:session.user.id};
  const saved=await client.from("memes").insert(row).select().single();if(saved.error){await client.storage.from("memes").remove([path]);throw saved.error}
  memes.unshift(saved.data);active=saved.data.category;uploadForm.reset();$("#preview").classList.add("hidden");uploadDialog.close();render();showNotice("图片发布成功。","success");
 }catch(error){message.textContent=error.message||"发布失败，请稍后重试"}finally{button.disabled=false;button.textContent="发布 meme"}
};
grid.onclick=async e=>{
 const button=e.target.closest("button[data-action]");if(!button||!isAdmin())return;
 const meme=memes.find(m=>m.id===button.closest(".card")?.dataset.id);if(!meme)return;
 if(button.dataset.action==="edit"){editForm.id.value=meme.id;editForm.title.value=meme.title;editForm.caption.value=meme.caption;editForm.category.value=meme.category;$("#editMessage").textContent="";editDialog.showModal();return}
 if(!confirm(`确定删除“${meme.title}”吗？此操作无法撤销。`))return;
 button.disabled=true;button.textContent="删除中…";
 const deleted=await client.from("memes").delete().eq("id",meme.id).select("id").single();
 if(deleted.error){button.disabled=false;button.textContent="删除";return showNotice(`删除失败：${deleted.error.message}`,"error")}
 if(meme.storage_path){const removed=await client.storage.from("memes").remove([meme.storage_path]);if(removed.error)showNotice("记录已删除，但图片文件清理失败。","error")}
 memes=memes.filter(m=>m.id!==meme.id);render();showNotice("图片已删除。","success");
};
editForm.onsubmit=async e=>{
 e.preventDefault();const message=$("#editMessage"),button=editForm.querySelector("button[type=submit]");message.textContent="";if(!client||!isAdmin())return message.textContent="当前账号没有编辑权限";
 button.disabled=true;button.textContent="保存中…";const changes={title:editForm.title.value.trim(),caption:editForm.caption.value.trim(),category:editForm.category.value};
 const updated=await client.from("memes").update(changes).eq("id",editForm.id.value).select().single();button.disabled=false;button.textContent="保存修改";
 if(updated.error)return message.textContent=updated.error.message||"保存失败";
 const i=memes.findIndex(m=>m.id===updated.data.id);if(i>=0)memes[i]=updated.data;editDialog.close();render();showNotice("修改已保存。","success");
};
$("#retryLoad").onclick=refreshMemes;renderNav();render();initialize();
