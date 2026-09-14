(async()=>{
  const gate=document.getElementById("gameGate"),message=document.getElementById("gateMessage"),frame=document.getElementById("gameFrame"),fullscreen=document.getElementById("fullscreenGame");
  if(!window.supabase||!window.BIRDMEME_CONFIG){message.textContent="身份验证服务暂时无法连接，请稍后再试。";return;}
  const cfg=window.BIRDMEME_CONFIG;
  const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  const {data}=await client.auth.getSession();
  const session=data.session;
  if(!session||session.user.id!==cfg.adminUserId){message.textContent="游戏仍在制作中，完成后会正式开放。";return;}
  try{
    const {data:html,error}=await client.storage.from("private-games").download("dove-sequel.html");
    if(error)throw error;
    const gameUrl=URL.createObjectURL(html);
    frame.src=gameUrl;
    frame.classList.remove("hidden");
    gate.classList.add("hidden");
    fullscreen.classList.remove("hidden");
    fullscreen.addEventListener("click",()=>frame.requestFullscreen?.());
    addEventListener("pagehide",()=>URL.revokeObjectURL(gameUrl),{once:true});
  }catch(error){message.textContent="管理员测试版加载失败，请稍后刷新重试。";console.error(error);}
})();
