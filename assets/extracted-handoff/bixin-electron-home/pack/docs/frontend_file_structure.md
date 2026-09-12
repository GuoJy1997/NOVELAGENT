# 前端文件结构说明

```text
src/
├── App.tsx                       首页装配
├── main.tsx                      React 入口
├── styles/
│   └── globals.css               全局样式与复用 class
├── data/
│   ├── home.ts                   首页 mock data
│   └── nav.ts                    左侧导航数据
├── lib/
│   └── cn.ts                     className 工具
└── components/
    ├── cards/
    │   ├── CalendarCard.tsx
    │   ├── ChapterProgressCard.tsx
    │   ├── CharacterNetworkCard.tsx
    │   ├── ProjectOverviewCard.tsx
    │   ├── ScheduleCard.tsx
    │   └── WritingGoalsCard.tsx
    ├── layout/
    │   ├── BrandHeader.tsx
    │   ├── DashboardGrid.tsx
    │   ├── HeroSection.tsx
    │   ├── SidebarRail.tsx
    │   └── TopBar.tsx
    ├── scene/
    │   ├── BookLayer.tsx
    │   └── SceneLayer.tsx
    └── ui/
        ├── Button.tsx
        ├── Card.tsx
        └── ProgressRing.tsx
```
