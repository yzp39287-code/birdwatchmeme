(()=>{
  const card=document.getElementById("doveSequelCard"),status=document.getElementById("doveSequelStatus");
  if(!card||!window.supabase||!window.BIRDMEME_CONFIG)return;
  const cfg=window.BIRDMEME_CONFIG;
  const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  client.auth.getSession().then(({data})=>{
    if(data.session?.user?.id!==cfg.adminUserId)return;
    card.classList.remove("locked-game");
    card.classList.add("admin-unlocked");
    card.setAttribute("role","link");
    card.setAttribute("tabindex","0");
    card.setAttribute("aria-label","管理员试玩鸠子街区历险记后传");
    status.textContent="管理员试玩 →";
    const open=()=>location.href="dove-sequel-game.html";
    card.addEventListener("click",open);
    card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
  });
})();
