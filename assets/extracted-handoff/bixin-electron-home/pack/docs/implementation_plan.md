# 实现方案

## 1. 目标

按照当前确认版视觉图，在 Electron + React + TypeScript + Vite + Tailwind 的技术栈下实现“笔心”桌面端首页高保真前端。

## 2. 分层策略

### Layer 1 — SceneBackground
- 使用 `/public/assets/layers/scene_robot_background.png`
- 承载天空、云层、城堡、浮空岛、山脉、瀑布与机器人
- 不含书本、不含 UI

### Layer 2 — InterfaceLayer
- 左侧导航、顶部搜索、Hero 文案、CTA、Dashboard 卡片
- 全部由 React 组件 + Tailwind 构建

### Layer 3 — BookForeground
- 使用 `/public/assets/layers/book_foreground.png`
- 单独浮在最上层
- 允许少量压住下方人物关系卡片的非功能留白

## 3. 页面布局

- 基准画布：1728 × 972
- 左侧导航：118px
- 主内容区：Hero 区 + Dashboard 网格
- Dashboard 采用三列结构：
  - 第一列：项目总览（跨两行）
  - 第二列：章节进度 / 写作目标
  - 第三列：人物关系网 / 日程+日历

## 4. 样式原则

- 卡片采用半实体玻璃感白色容器
- 导航不使用大矩形容器，只保留单项控件
- 书本由独立前景资产承担外层压覆感
- 主色为绿色，辅以云白、淡灰和少量墨黑文字

## 5. 建议开发顺序

1. `npm install`
2. `npm run dev`
3. 优先检查 Hero 区与三层遮挡
4. 再微调卡片尺寸、间距和文字大小
5. 若需要可替换 `public/assets/layers/*` 资产，而无需重写组件结构

## 6. 后续扩展建议

- 引入 React Router 扩展其他导航页面
- 引入 Zustand/Jotai 做本地状态管理
- 增加 preload 与 ipc，连接桌面端本地文件系统
- 加入小说项目列表、章节树、人物设定编辑器等真实业务功能
