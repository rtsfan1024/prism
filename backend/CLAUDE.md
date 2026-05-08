# Prism Backend

## 技术栈

- Python 3.11+ / FastAPI / uvicorn
- 依赖管理: uv (pyproject.toml + uv.lock)
- 数据验证: Pydantic v2 + pydantic-settings
- 外部服务: Google GenAI SDK (支持 Imagen 和 Gemini 模型，自动切换)
- 数据存储: 文件系统 (YAML + 图片文件)

## 架构原则

遵循 SOLID / YAGNI / KISS：

- **单一职责**: 每个模块只做一件事 — route 只处理 HTTP，service 只处理业务逻辑，repository 只处理存储
- **依赖倒置**: service 通过构造函数注入 repository，不直接依赖具体实现
- **YAGNI**: 不为假设的未来需求提前编写代码
- **KISS**: 优先选择简单直接的实现方案

## 代码组织 (分层架构)

```
api/routes/    → HTTP 路由，参数校验，响应格式化
api/schemas/   → Pydantic 请求/响应模型
services/      → 业务逻辑，编排 repository 和 client
repositories/  → 文件系统读写 (YAML, 图片)
models/        → 领域模型 (dataclass)
clients/       → 外部服务封装 (Gemini API)
utils/         → 纯函数工具 (hash 计算)
```

调用链路: route → service → repository / client，禁止跨层调用。

## 编码规范

- 所有函数必须有类型注解 (参数和返回值)
- 使用 `async def` 处理 I/O 密集操作 (Gemini API 调用、文件读写)
- 使用 `def` 处理纯计算逻辑
- Pydantic model 用于所有 API 边界的输入验证和输出序列化
- 领域模型使用 `@dataclass`，不混用 Pydantic
- 路由注册顺序: style → images → cost → slides (特殊性从高到低，避免路径冲突)

## 并发处理

- FastAPI 原生支持 async，图片生成等 I/O 操作使用 `async/await`
- 多张图片并发生成时使用 `asyncio.gather` 或 `asyncio.TaskGroup`
- 文件系统操作为同步阻塞，大文件操作考虑 `run_in_executor`
- 无数据库连接池需求 (文件系统存储)

## 错误处理

- 业务异常使用自定义 Exception 类，在 route 层统一捕获
- API 层使用 FastAPI 的 `HTTPException` 返回标准错误响应
- 外部服务调用 (Gemini API) 必须有超时和重试逻辑
- 文件操作失败时提供明确的错误信息 (文件不存在、权限不足等)

## 日志

- 使用 Python 标准库 `logging`，模块级 logger: `logger = logging.getLogger(__name__)`
- 日志级别: DEBUG (开发调试) / INFO (关键业务节点) / WARNING (可恢复异常) / ERROR (需关注的失败)
- 记录关键操作: 图片生成开始/完成、项目创建/删除、外部 API 调用耗时
- 生产环境使用 structured logging (JSON 格式)

## 测试

- 测试框架: pytest + pytest-asyncio
- 使用 httpx 的 AsyncClient 进行 API 集成测试
- Repository 层测试使用 tmp_path fixture 隔离文件系统
- GeminiClient 测试使用 mock 避免真实 API 调用
