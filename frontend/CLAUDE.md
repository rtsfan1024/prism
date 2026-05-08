# Prism Frontend

## 技术栈

- React 19+ / TypeScript (strict mode)
- 构建工具: Vite
- 状态管理: Zustand
- 样式: Tailwind CSS
- 拖拽排序: @dnd-kit/core + @dnd-kit/sortable
- 包管理: npm

## 架构原则

遵循 SOLID / YAGNI / KISS：

- **单一职责**: 每个组件只负责一个功能区域，避免上帝组件
- **开闭原则**: 通过组合而非修改来扩展组件功能
- **YAGNI**: 不为假设的未来需求提前编写代码
- **KISS**: 优先选择简单直接的实现方案，避免过度抽象

## 代码组织

```
src/
├── api/           → API 请求封装，与后端接口一一对应
├── stores/        → Zustand 状态管理，按功能域拆分
├── components/    → UI 组件
│   ├── layout/    → 布局组件 (Header, Sidebar, MainContent)
│   ├── slides/    → Slide 管理组件 (列表、卡片、编辑器)
│   ├── preview/   → 图片预览组件
│   ├── player/    → 全屏播放器
│   ├── style/     → 风格选择弹窗
│   └── common/    → 通用基础组件 (Button, Input, Modal)
├── hooks/         → 自定义 Hooks (useSlides, useKeyboard)
├── types/         → TypeScript 类型定义
└── styles/        → 全局样式
```

## 编码规范

- TypeScript strict mode，禁止 `any` 类型
- 函数组件 + Hooks，不使用 class 组件
- 组件文件使用 `.tsx`，纯逻辑文件使用 `.ts`
- Props 接口定义在组件文件顶部，使用 `interface` 而非 `type`
- 组件导出使用 `export default function ComponentName`
- 使用 `const` 箭头函数定义事件处理函数和回调

## 状态管理

- Zustand store 按功能域拆分 (slideStore, playerStore)
- Store 中只存放共享状态，组件局部状态使用 `useState`
- 异步操作在 store action 中处理，组件层不直接调用 API
- 使用 Zustand 的 `immer` 中间件处理复杂状态更新 (如数组重排序)

## 并发与异步

- 所有 API 调用使用 `async/await`
- 使用 `Promise.all` 并发独立请求
- 加载状态使用 store 中的 `isLoading` / `isGenerating` 标志
- 图片生成等长时操作提供 loading 反馈，防止重复提交
- 使用 `AbortController` 取消不再需要的请求

## 错误处理

- API 请求统一在 `api/index.ts` 中处理错误响应
- 网络错误和业务错误分别处理，展示用户友好的错误信息
- 使用 Error Boundary 捕获组件渲染异常
- 关键操作 (删除、重排序) 失败后回滚本地状态
- 图片加载失败时显示占位图

## 样式规范

- 优先使用 Tailwind CSS 工具类，避免自定义 CSS
- 全局样式仅用于 CSS Reset 和基础变量定义
- 组件内样式使用 Tailwind，不使用 CSS Modules
- 响应式设计使用 Tailwind 断点前缀 (sm:, md:, lg:)
