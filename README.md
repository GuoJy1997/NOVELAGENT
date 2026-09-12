# 笔心 (Novelora) · AI 智能小说创作工作台

<div align="center">

**笔落生花 · 心意自成 —— 为小说创作者量身打造的高保真、沉浸式智能写作工作台**

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-black.svg?logo=fastify)](https://fastify.dev/)
[![Electron](https://img.shields.io/badge/Electron-33-47848F.svg?logo=electron)](https://www.electronjs.org/)

</div>

---

## 📖 项目简介 (Introduction)

**笔心（Novelora）**（仓库名 
ovel-agent）是一个专为长篇网络小说与叙事文学设计的专业级创作工作台。

系统融合了**本地文件持久化**、**原生桌面客户端能力**与**本机智能 Agent 编排体系**。平台舍弃了传统生硬的表单与通用聊天框形态，采用沉浸式的“场景 → 界面” Codex 视觉设计语言（--bixin-* 视觉令牌体系），为创作者提供包括工作区管理、大纲树状图谱、人物弧光与关系网络、章节沉浸写作与候选版本审校在内的全链路闭环体验。

---

## 🏛️ 系统架构 (Architecture)

笔心采用模块化的高性能单体分层架构，主要由 **桌面宿主壳（Desktop Shell）**、**前端视效渲染引擎（Web UI）**、**本地持久化核心（Local API Service）** 以及 **智能 Agent 网关（Hermes Gateway）** 构成。

### 架构全景图

`mermaid
graph TB
    subgraph Host["桌面运行宿主 (apps/desktop)"]
        Electron["Electron 33 主进程 (main.ts)"]
        Preload["隔离预加载脚本 (preload.mjs)"]
        NativeIPC["原生文件/目录选择器 (Dialog IPC)"]
        ProcessMgr["API 子进程守护管理器 (apiProcess.ts)"]
    end

    subgraph Web["前端视效渲染层 (apps/web)"]
        ViteDev["Vite 8 开发/构建引擎 (Proxy: /api, /hermes)"]
        Shell["BixinHomePage 单一直播壳 (--bixin-* 视觉令牌)"]
        Views["模块视图: 写作工作台 / 人物关系图谱 / 大纲演化 / 任务看板"]
    end

    subgraph API["本地核心服务 (services/api)"]
        FastifyServer["Fastify 5 本地后端 (端口 8787)"]
        WorkspaceEngine["工作区与项目文件存储 (projectStore.ts)"]
        WorkflowState["工作流图与任务引擎 (workflowEngine)"]
        DiskStorage[(".novelora-data / 用户小说本地目录")]
    end

    subgraph AgentMesh["智能交互网关 (可选本机接入)"]
        HermesGateway["Hermes 本机网关 (端口 8642)"]
        LLMAdapter["DeepSeek / 本地大模型推理适配器"]
    end

    Electron -->|创建窗口 & 加载| Web
    Electron -->|生命周期托管| API
    Web -->|IPC 文件夹选择| NativeIPC
    Web -->|HTTP /api 代理| FastifyServer
    Web -->|HTTP /hermes 代理| HermesGateway
    FastifyServer -->|读写本地文件| DiskStorage
    HermesGateway -.->|技能调度与生成| LLMAdapter
`

### 核心子系统职责

1. **pps/desktop (桌面原生壳)**：
   - 基于 **Electron 33 + electron-vite** 构建。
   - 具备安全的 contextIsolation 隔离沙箱环境，通过 preload.mjs 暴露原生跨平台目录与文件选择器对话框（
ovelora:select-directory, 
ovelora:select-file）。
   - 内置 API 子进程自动化拉起与健康守护机制，在桌面端启动时无缝托管 services/api。

2. **pps/web (前端工作台)**：
   - 基于 **React 19 (StrictMode) + Vite 8 + TypeScript**。
   - 采用原生 CSS 变量设计令牌（集中于 src/styles/tokens.css，--bixin-* 调色与阴影规范）。
   - 零额外状态管理库负担，利用 React 原生状态模型实现毫秒级响应。
   - 包含完整的章节目录树、角色图谱连线可视化（Canvas/SVG）、Markdown 双栏对照阅读与去 AI 化润色视图。

3. **services/api (本地 API 与文件存储)**：
   - 基于 **Fastify 5 + TypeScript (tsx)** 开发，默认监听 127.0.0.1:8787。
   - 实现本地小说工作区的标准文件系统持久化，零云端强制绑定，保护作家创作隐私与数据资产。
   - 维护项目大纲、章节草稿、人物设定、冲突台账以及工作流状态机。

4. **Hermes & 模型接入层**：
   - 通过前端与本地服务的代理网关接入本机 Hermes 网关（默认 127.0.0.1:8642）。
   - 支持通过 services/api/.env 配置 DEEPSEEK_API_KEY 与 DEEPSEEK_BASE_URL，赋能智能情节推演与文稿润色。

---

## ⚡ 项目运行时 (Runtime & Networking)

项目在本地开发与运行时的端口与网络拓扑分布如下：

| 服务组件 | 运行端口 / 协议 | 描述与用途 |
| :--- | :--- | :--- |
| **Electron 桌面窗口** | GUI 进程 (pps/desktop) | 1728×972 原生窗口，加载 Web 视图并托管 API 子进程 |
| **Vite Web 渲染服务器** | http://localhost:5173/ | 网页端开发服务器，提供 HMR 与路由代理 |
| **Fastify API 服务** | http://127.0.0.1:8787/ | 本地文件与数据读写中心，由 Vite 自动代理至 /api |
| **Hermes Agent 网关** | http://127.0.0.1:8642/ | 本机智能模型代理与技能调度（可选，Vite 代理至 /hermes） |

---

## 🚀 快速启动指南 (Getting Started)

### 1. 环境准备

- **Node.js**：>= 20.0.0
- **包管理器**：
pm（每个子包具有独立依赖体系）
- **操作系统**：Windows / macOS / Linux

### 2. 依赖安装

进入各子工程完成依赖安装（首次拉取代码或环境初始化）：

`ash
# 安装前端依赖
cd apps/web && npm install

# 安装本地 API 服务依赖
cd ../../services/api && npm install

# 安装桌面客户端依赖
cd ../../apps/desktop && npm install

# 回到项目根目录
cd ../..
`

### 3. 一键快速启动

#### 方式 A：启动 Electron 桌面版客户端（推荐）

- **Windows 用户**：在项目根目录直接双击运行 **启动笔心桌面版.bat**。
- **命令行启动**：
  `ash
  # 从根目录运行桌面开发环境 (会联动编译 preload 并加载桌面窗口)
  npm run dev:desktop
  `

> **提示**：桌面端启动时会自动在后台拉起 services/api 本地服务。若需加载最新前端开发代码，可配合 
pm run dev:web 协同开发。

#### 方式 B：启动 Web 网页端

`ash
# 1. 启动本地数据服务 (监听 8787)
npm run dev:api

# 2. 初始化预置示例小说工作区 (可选)
npm run seed:api

# 3. 启动前端页面 (监听 5173)
npm run dev:web
`
启动后在浏览器打开：**http://localhost:5173/**

---

## 🛠️ 项目常用命令清单 (Scripts)

在仓库根目录可通过以下快捷命令驱动各层服务：

`ash
# ---------- Web 前端 ----------
npm run dev:web       # 启动 Vite 前端开发服务器 (带 HMR)
npm run build:web     # TypeScript 类型检查并执行前端生产构建
npm run test:web      # 运行 Vitest 单元与交互可访问性测试
npm run lint:web      # 使用 oxlint 极速扫描代码规范

# ---------- API 后端 ----------
npm run dev:api       # 启动 Fastify API 热更新开发服务 (127.0.0.1:8787)
npm run seed:api      # 向 .novelora-data 写入初始化示范工程数据

# ---------- Desktop 桌面端 ----------
npm run dev:desktop   # 启动 Electron 开发调试窗口
npm run build:desktop # 编译 Electron 主进程与 Preload
npm run dist:desktop  # 打包原生桌面安装包 (electron-builder)
`

---

## 📂 代码目录全景 (Codebase Layout)

`
NOVELAGENT/
├── apps/
│   ├── desktop/              # Electron 桌面原生宿主
│   │   ├── src/              # 主进程 (main.ts)、预加载 (preload.ts)、API 进程调度 (apiProcess.ts)
│   │   └── electron.vite.config.ts
│   └── web/                  # 前端视效与工作台界面
│       ├── src/
│       │   ├── App.tsx       # 笔心总入口与导航装配
│       │   ├── styles/       # tokens.css (设计令牌), global.css, cockpit.css
│       │   └── features/
│       │       └── novelora-cockpit/   # 笔心核心特性层 (大纲/写作/角色/关系图谱/工作流)
│       └── vite.config.ts
├── services/
│   └── api/                  # Fastify 本地 API 与工作区存储
│       ├── src/              # projectStore, workspaceStore, folderPicker, index.ts
│       └── scripts/          # seed.ts (数据填充脚本)
├── packages/
│   └── hermes-plugins/       # 本机 Hermes 插件包扩展
├── docs/
│   ├── superpowers/specs/    # 产品规划与设计规格白皮书
│   └── redesign/             # 界面重构与视觉规范文档
├── 启动笔心桌面版.bat          # Windows 桌面版一键启动入口
└── 打开笔心网页版.bat          # 浏览器网页版快捷访问入口
`

---

## 🔒 隐私与数据安全

- **本地优先（Local-First）**：所有故事设定、章节分卷、人物图谱与批注内容均持久化存储在创作者的本地硬盘。
- **零强制联网**：离线状态下所有写作、排版、大纲组织与角色追踪功能保持完整可用。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 协议发布与维护。