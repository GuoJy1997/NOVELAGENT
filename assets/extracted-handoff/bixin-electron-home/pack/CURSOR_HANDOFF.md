# 给 Cursor Agent 的开发背景

你正在接手“笔心 AI写作工作室”的 Electron 桌面端首页高保真实现。

## 第一目标

不要重新设计 UI。以 `public/assets/reference/current_ui_reference.png` 为视觉基准，把现有 React/Tailwind 页面继续微调到接近 1:1。

## 三层结构必须保持

1. `SceneLayer`：z-10，背景+机器人。
2. Interface：z-20，所有真实 UI 组件、文字和交互。
3. `BookLayer`：z-30，立体地图书+书签，只允许轻微压住人物关系卡片非功能区域。

不要把书合并到背景图；不要让人物关系卡片盖住书；不要让书挡住人物节点和功能按钮。

## 禁止事项

- 不要把整张设计稿作为页面背景。
- 不要把卡片切成 PNG。
- 不要恢复厚重的整块 Sidebar 白色矩形。
- 不要增加首页卡片数量。
- 不要把主色改回蓝色。
- 对外品牌固定为“笔心”，NovelAgent 只可作为内部代码名。

## 启动

```bash
npm install
npm run dev
```

## 推荐微调顺序

1. 1728×972 下对齐 Hero 文案位置。
2. 对齐机器人与书本的比例、位置和前后遮挡。
3. 对齐三列 Dashboard 的宽度和高度。
4. 最后调字体、圆角、阴影、进度条、标签。
