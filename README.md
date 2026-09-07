# 观鸟meme

公开浏览、仅仓库所有者可通过 GitHub 登录并上传的鸟类 meme 网站。

## 完成 Supabase 设置

1. 在 Supabase 新建免费项目，进入 SQL Editor，运行 `supabase.sql`。
2. 在 Authentication → Providers → GitHub 启用 GitHub 登录，并按页面提示在 GitHub 建立 OAuth App。
3. 在 Project Settings → API 复制 Project URL 与 anon public key，填入 `config.js`。
4. 在 Authentication → URL Configuration 中，将 Netlify 网站地址设为 Site URL，并加入 Redirect URLs。

## 部署到 Netlify

在 Netlify 选择 Add new site → Import an existing project → GitHub → `birdwatchmeme`。本项目无需构建命令，Publish directory 填 `.`。

请勿把 Supabase `service_role` 密钥写入仓库；前端只能使用 anon public key。数据和图片写入权限由 `supabase.sql` 中的 RLS 策略限制为 GitHub 用户 `yzp39287-code`。
