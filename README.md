# Prism

AI 驱动的幻灯片图片生成工具。输入文字描述，通过 Google Imagen / Gemini 生成配图，支持风格一致性、版本管理和全屏播放。

## 功能特性

- **AI 图片生成** — 支持 Google Imagen 和 Gemini 模型，从文字 prompt 生成高质量配图
- **风格系统** — 设定全局视觉风格，所有图片自动保持风格一致
- **内容寻址版本管理** — 图片按内容哈希存储，修改内容自动生成新版本，历史版本可回溯
- **拖拽排序** — @dnd-kit 实现幻灯片拖拽重排，乐观更新 + 失败回滚
- **全屏播放** — 浏览器 Fullscreen API，自动轮播，键盘导航
- **实时成本追踪** — 每次生成实时更新费用统计
- **多项目管理** — 支持多个独立项目的创建和切换

## 效果展示

<!-- 在 GitHub 上编辑此区域，插入截图地址 -->

### 项目列表

<!-- ![项目列表](https://your-image-url/1.png) -->

### 幻灯片编辑与图片生成

<!-- ![编辑与生成](https://your-image-url/2.png) -->

### 风格设定

<!-- ![风格设定](https://your-image-url/3.png) -->

### 全屏播放

<!-- ![全屏播放](https://your-image-url/4.png) -->

## 技术架构

```mermaid
graph TB
    subgraph Frontend["前端 — React + TypeScript"]
        UI["React 18 + Tailwind CSS"]
        Store["Zustand + Immer"]
        DnD["dnd-kit"]
        API_Client["Fetch API Client"]
    end

    subgraph Backend["后端 — Python + FastAPI"]
        Routes["API Routes"]
        Services["Business Services"]
        Repos["Repositories"]
        Client["Gemini Client"]
    end

    subgraph Storage["存储层"]
        YAML["文件系统 YAML"]
        Images["图片文件 JPEG"]
    end

    subgraph External["外部服务"]
        Imagen["Google Imagen / Gemini"]
    end

    UI --> Store
    Store --> API_Client
    UI --> DnD
    API_Client -->|HTTP /api| Routes
    Routes --> Services
    Services --> Repos
    Services --> Client
    Repos --> YAML
    Repos --> Images
    Client -->|google-genai SDK| Imagen
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript (strict mode) |
| 构建工具 | Vite 6 |
| 状态管理 | Zustand 5 + Immer |
| 拖拽 | @dnd-kit |
| 样式 | Tailwind CSS 3 |
| 后端框架 | FastAPI + Uvicorn |
| AI 模型 | Google Imagen / Gemini (via google-genai SDK, 自动切换) |
| 数据验证 | Pydantic v2 |
| 内容哈希 | Blake3 |
| 数据存储 | 文件系统 (YAML + JPEG) |
| 依赖管理 | uv (后端) / npm (前端) |

## 快速开始

### 前置条件

- Python 3.11+
- Node.js 18+
- Google Gemini API Key ([获取地址](https://aistudio.google.com/apikey))

### 后端

```bash
cd backend

# 创建 .env 文件
echo "GEMINI_API_KEY=your_api_key_here" > .env

# 安装依赖
uv sync

# 启动服务
uv run uvicorn main:app --reload
```

后端运行在 `http://localhost:8000`。

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在 `http://localhost:5173`，API 请求自动代理到后端。

### 环境变量

在 `backend/.env` 中配置：

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `GEMINI_API_KEY` | 是 | — | Google Gemini API Key |
| `SLIDES_BASE_PATH` | 否 | `./slides` | 项目数据存储路径 |
| `HOST` | 否 | `0.0.0.0` | 服务绑定地址 |
| `PORT` | 否 | `8000` | 服务端口 |
| `CORS_ORIGINS` | 否 | `["http://localhost:5173"]` | 允许的跨域来源 |
| `IMAGEN_MODEL_NAME` | 否 | `imagen-4.0-fast-generate-001` | 图片生成模型（支持 Imagen 和 Gemini 模型，自动切换 API） |
| `IMAGEN_COST_PER_IMAGE` | 否 | `0.134` | 每张图片单价 (USD) |

### 支持的模型

根据 `IMAGEN_MODEL_NAME` 的值自动选择 API 路径：

| 模型前缀 | API 路径 | 示例 |
|----------|----------|------|
| `imagen-*` | `generate_images()` | `imagen-4.0-fast-generate-001` |
| `gemini-*` | `generate_content()` with image modality | `gemini-2.0-flash-exp`, `gemini-3.1-flash-image-preview` |

```bash
# 使用 Imagen（默认）
IMAGEN_MODEL_NAME=imagen-4.0-fast-generate-001

# 使用 Gemini
IMAGEN_MODEL_NAME=gemini-2.0-flash-exp
```

## API 接口

### 幻灯片管理

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant S as 文件系统

    U->>F: 点击 "New Project"
    F->>B: POST /api/slides/{slug}
    B->>S: 创建 outline.yml
    B-->>F: SlideResponse
    F-->>U: 显示新幻灯片

    U->>F: 编辑内容 (双击)
    F->>B: PUT /api/slides/{slug}/{sid}
    B->>S: 更新 outline.yml
    B-->>F: SlideResponse

    U->>F: 拖拽排序
    F->>F: 乐观更新 UI
    F->>B: PUT /api/slides/{slug}/reorder
    B->>S: 保存新顺序
    alt 失败
        B-->>F: Error
        F->>F: 回滚状态
    end
```

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/slides/projects` | 列出所有项目 |
| GET | `/api/slides/{slug}` | 获取项目详情及所有幻灯片 |
| POST | `/api/slides/{slug}` | 创建幻灯片 |
| PUT | `/api/slides/{slug}/{sid}` | 更新幻灯片内容 |
| PUT | `/api/slides/{slug}/reorder` | 重排幻灯片 |
| PUT | `/api/slides/{slug}/title` | 更新项目标题 |
| DELETE | `/api/slides/{slug}/{sid}` | 删除幻灯片及其图片 |

### 图片生成

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant G as Google Imagen/Gemini
    participant S as 文件系统

    U->>F: 点击 "Generate Image"
    F->>B: POST /api/slides/{slug}/{sid}/generate
    B->>B: 构建 prompt<br/>= 风格 prompt + 幻灯片内容
    B->>B: 根据模型名自动选择 API
    B->>G: generate_images 或 generate_content
    G-->>B: JPEG bytes
    B->>S: 保存 {content_hash}.jpg
    B->>S: 更新 total_cost
    B-->>F: GenerateImageResponse
    F->>F: 更新图片列表 + 费用
    F-->>U: 显示生成的图片
```

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/slides/{slug}/{sid}/images` | 列出幻灯片所有图片 |
| GET | `/api/slides/{slug}/{sid}/images/{filename}` | 获取图片文件 |
| POST | `/api/slides/{slug}/{sid}/generate` | 生成新图片 |

### 风格管理

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant G as Google Imagen/Gemini

    U->>F: 输入风格描述
    F->>B: POST /api/slides/{slug}/style/generate
    B->>G: 生成 2 张候选图 (并发)
    G-->>B: 2 张 JPEG
    B-->>F: 2 个候选 URL
    F-->>U: 并排展示候选图

    U->>F: 选择一张
    F->>B: PUT /api/slides/{slug}/style
    B->>B: 保存 Style(prompt, image)
    B-->>F: SelectStyleResponse
    F-->>U: 风格已设定
```

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/slides/{slug}/style` | 获取当前风格 |
| POST | `/api/slides/{slug}/style/generate` | 生成风格候选图 |
| PUT | `/api/slides/{slug}/style` | 选定风格 |
| GET | `/api/slides/{slug}/style/{filename}` | 获取风格图片 |

### 成本统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cost/{slug}` | 获取项目费用明细 |

## 核心设计

### 内容寻址图片存储

```mermaid
flowchart LR
    A["幻灯片内容"] -->|Blake3 哈希| B["content_hash<br/>e.g. a1b2c3d4e5f67890"]
    B --> C["存储路径<br/>images/{sid}/{hash}.jpg"]

    D["内容修改"] -->|重新哈希| E["新 hash"]
    E --> F["新文件名"]
    F --> G["旧文件保留为历史版本"]

    style G fill:#f9f,stroke:#333
```

图片文件名 = 幻灯片内容的 Blake3 哈希（前 16 位十六进制）。内容变化时哈希变化，旧图片自动保留为可回溯的历史版本。

### 分层架构

```mermaid
flowchart TB
    subgraph API["API 层"]
        R1[slides.py]
        R2[images.py]
        R3[style.py]
        R4[cost.py]
    end

    subgraph Service["业务层"]
        S1[SlideService]
        S2[ImageService]
        S3[StyleService]
        S4[CostService]
    end

    subgraph Repo["存储层"]
        RE1[SlideRepository<br/>YAML 读写]
        RE2[ImageRepository<br/>图片文件管理]
    end

    subgraph Client["外部服务"]
        C1[GeminiClient<br/>Google GenAI SDK]
    end

    R1 --> S1
    R2 --> S2
    R3 --> S3
    R4 --> S4

    S1 --> RE1
    S1 --> RE2
    S2 --> RE1
    S2 --> RE2
    S2 --> C1
    S3 --> RE1
    S3 --> RE2
    S3 --> C1
    S4 --> RE1
    S4 --> RE2
```

调用链路：Route -> Service -> Repository / Client，禁止跨层调用。Service 通过构造函数注入 Repository 和 Client。

### Prompt 构建流程

```mermaid
flowchart LR
    A["风格 prompt"] -->|前置| D["最终 prompt"]
    B["幻灯片内容<br/>(去掉第一行标题)"] -->|追加| D
    C["用户额外输入<br/>(可选)"] -->|追加| D
    D --> E["发送给 Imagen / Gemini"]
```

### 前端状态管理

```mermaid
stateDiagram-v2
    [*] --> ProjectList: 初始加载
    ProjectList --> ProjectView: 选择/创建项目
    ProjectView --> ProjectList: 返回

    state ProjectView {
        [*] --> SlideSelected: 自动选中第一张
        SlideSelected --> SlideSelected: 切换幻灯片
        SlideSelected --> Generating: 点击生成
        Generating --> SlideSelected: 生成完成
        SlideSelected --> Editing: 双击编辑
        Editing --> SlideSelected: 保存/取消
        SlideSelected --> StylePicking: 设定风格
        StylePicking --> SlideSelected: 选定风格
        SlideSelected --> Playing: 点击 Play
        Playing --> SlideSelected: 退出播放
    }
```

## 键盘快捷键

| 场景 | 按键 | 功能 |
|------|------|------|
| 全屏播放 | `→` | 下一张 |
| 全屏播放 | `←` | 上一张 |
| 全屏播放 | `Esc` | 退出播放 |
| 编辑弹窗 | `Esc` | 关闭 |
| 风格弹窗 | `Enter` | 生成候选图 |
| 幻灯片编辑 | `Enter` | 保存 |
| 幻灯片编辑 | `Shift+Enter` | 换行 |
| 幻灯片编辑 | `Esc` | 取消 |

## 项目结构

```
prism/
├── backend/
│   ├── api/
│   │   ├── dependencies.py       # 依赖注入 (lru_cache 单例)
│   │   ├── routes/               # HTTP 路由
│   │   └── schemas/              # Pydantic 请求/响应模型
│   ├── clients/
│   │   └── gemini_client.py      # Google GenAI SDK 封装
│   ├── models/                   # 领域模型 (dataclass)
│   ├── repositories/             # 文件系统读写
│   ├── services/                 # 业务逻辑
│   ├── utils/                    # 工具函数 (Blake3 哈希)
│   ├── config.py                 # 配置 (pydantic-settings)
│   ├── main.py                   # FastAPI 入口
│   └── slides/                   # 数据目录 (YAML + 图片)
│
└── frontend/
    └── src/
        ├── api/                  # API 客户端封装
        ├── components/           # React 组件
        │   ├── common/           # Button, Input, Modal
        │   ├── home/             # 项目列表页
        │   ├── layout/           # Header, Sidebar, MainContent
        │   ├── player/           # 全屏播放器
        │   ├── preview/          # 图片预览
        │   ├── slides/           # 幻灯片列表/编辑
        │   └── style/            # 风格选择弹窗
        ├── hooks/                # useSlides, useKeyboard
        ├── stores/               # Zustand 状态管理
        └── types/                # TypeScript 类型定义
```

## 数据存储

项目数据以文件系统方式存储，无需数据库：

```
slides/
├── {project-slug}/
│   ├── outline.yml              # 项目元数据 + 幻灯片内容
│   └── images/
│       ├── {slide-sid}/         # 每张幻灯片的图片目录
│       │   ├── {content_hash}.jpg
│       │   └── {content_hash}.jpg  # 历史版本
│       └── style/               # 风格参考图片
│           └── {image_hash}.jpg
```

`outline.yml` 结构：

```yaml
title: My Presentation
style:
  prompt: "水彩画风格，柔和的色调"
  image: "a1b2c3d4e5f67890.jpg"
total_cost: 0.536
slides:
  - sid: "s_133b6530"
    content: "第一张幻灯片\n山间日落的壮丽景色"
    created_at: "2025-01-01T00:00:00Z"
    updated_at: "2025-01-01T00:00:00Z"
```

## License

[Apache License 2.0](LICENSE)
