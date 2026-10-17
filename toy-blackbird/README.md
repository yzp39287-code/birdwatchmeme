# 《乌鸫的生活》Bilibili Toy 独立适配版

原版位置：main 分支 games/blackbird-life/index.html （未修改）。
本适配版位于独立分支 toy-blackbird-2026 的 toy-blackbird/ 目录，不会修改原网站。

## 下载并上传 Toy
1. 等候 GitHub Actions 的 "Build Blackbird Toy upload ZIP" 完成。
2. 下载本目录下的 Blackbird_Bilibili_Toy_upload.zip。
3. 在 Bilibili Toy 发布后台上传 ZIP 文件（ZIP 根目录含 index.html 和 vendor/）。
4. 先选“链接访问”，分别预览 PC 和手机，确认可玩后再决定公开。

## 手机操作
- 左下摇杆：移动、飞行方向转弯。
- 起飞/降落：空格对应原操作。
- 上升/跳：按住上升；在地面按下为小跳。
- 下降：按住下降。
- 发射：飞行后，先点击画面瞄准，再点“发射”。
- 画面拖动：环绕镜头；双指捏合缩放镜头。
- 觅食：在湿润草地，按住蚯蚓向外拖动，拖到进度满后松手。

## 技术与版权
- 保留源游戏世界、模型导出/读回 GLTF 管线、飞行物理、蚯蚓觅食、行人、计分、声音和电脑控制。
- 采用 Pointer Events、Pointer Capture 和本地进口映射；模块在 vendor 内，不依赖运行时 CDN。
- npm three@0.160.0，Three.js 许可证 MIT，见 ZIP 内 vendor/THREE-LICENSE.txt。
- 手机性能优化：像素比限制为 1.35；并不是降低或修改游戏机制。
- 建议以 HTTPS 测试，并检查 WebGL2、WebAudio、手机返回/恢复、竖/横屏和分数存储。
- 如遇 Toy 限制或者 WebGL 上下文丢失，尚需用真实手机检查与调试；此版不能保证所有型号都通过。
- ZIP 不会自动发布 Toy，不含任何用户个人信息、服务端数据或后台授权凭证。

## 构建说明
GitHub Actions workflow 自动安装 three@0.160.0、执行 vendor-three.cjs 并生成仅包含 index.html/vendor 的 ZIP。
