# 视觉资产清单

| 路径 | 层级 | 用途 |
|---|---:|---|
| `public/assets/layers/scene_robot_background.png` | Layer 1 | 云海、浮空岛、山脉、城堡、瀑布、机器人组合底图 |
| `public/assets/layers/book_foreground.svg` | Layer 3 | 当前参考图风格的 3D 地图书 + 矢量古风书签组合资产 |
| `public/assets/layers/book_body_cutout.png` | Layer 3 source | 从确认版参考图提取的立体地图书主体，供 SVG 组合使用 |
| `public/assets/layers/book_generated_fallback.png` | fallback | 生成式书本备用资产，不作为默认展示 |
| `public/assets/brand/bixin_app_icon.png` | brand | 绿色负形钢笔尖应用图标 |
| `public/assets/covers/project-cover.png` | UI content | “天空之冠”项目封面 |
| `public/assets/reference/current_ui_reference.png` | reference | 当前确认的 UI 高保真对照图 |

## 资产替换原则

只要保持相同文件名与大致宽高比，Cursor 后续可以替换 `scene_robot_background.png` 或 `book_foreground.svg`，无需修改业务组件。
