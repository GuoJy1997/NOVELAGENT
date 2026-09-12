# 笔心 Electron 首页高保真实现包

这是一个可直接在 **Cursor** 中打开并继续开发的桌面端首页工程包，技术栈为：

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

## 本包包含内容

- 首页高保真前端实现（1728 基准）
- 三层分层实现：
  - 背景 + 机器人（Layer 1）
  - UI 组件与卡片（Layer 2）
  - 书本前景（Layer 3）
- Electron 主进程
- React 组件源码
- 设计 Spec / 实施文档 / 文件结构说明
- 视觉资产（logo、场景层、书本层、项目封面、参考图）

## 快速启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 主要目录

```text
public/assets/
  brand/          应用图标
  covers/         项目封面
  layers/         场景层与书本层
  reference/      当前确认版 UI 参考图

src/
  components/     页面组件
  data/           mock data
  styles/         全局样式
  lib/            工具函数

docs/
  component_inventory.md
  frontend_file_structure.md
  implementation_plan.md
  superpowers/specs/
  superpowers/plans/
```

## 说明

这次交付范围固定为：

- **仅首页高保真实现**
- 其他页面路由先不展开
- 卡片和控件全部由前端代码实现，不使用整页截图切图

如果要继续扩展到多页面应用，可以在此工程上继续增加：

- 路由系统
- 状态管理
- 文件系统桥接
- 本地项目管理
- AI 功能面板

## 验证记录

详见 `docs/verification_report.md`。在本沙箱中已完成静态、语法和资产验证；依赖安装与 Vite build 需要在可访问 npm registry 的环境中执行。
