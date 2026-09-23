# AI 接口管理：扣子部署与使用

网站新增“AI 接口”页面，地址为 `/settings/ai`。每个登录账号独立保存最多 10 个接口，并选择自己的默认接口。

支持 DeepSeek、通义千问（阿里云百炼北京）、硅基流动，以及管理员开放域名的其他 Chat Completions 兼容服务。保留原扣子内置模型，未设置自定义默认接口时继续使用它。调用自定义服务失败时会直接提示原因，不会擅自换服务商。

## 在原扣子项目中启用

1. 将此版本代码同步到原扣子项目，保留原有数据库和扣子 AI 环境配置。
2. 在该项目**实际使用的数据库**中执行 `scripts/ai-provider-settings.sql`。脚本只新增 AI 配置表及其访问权限，不修改课程、班级、学生、报告等已有业务表。可以重复执行；执行前仍建议保留正常数据库备份。不要用旧的全库初始化脚本替代它。
3. 保留已有 `SUPABASE_SERVICE_ROLE_KEY`（或 `COZE_SUPABASE_SERVICE_ROLE_KEY`）。新增服务端环境变量 `AI_CONFIG_ENCRYPTION_KEY`，内容为 32 字节随机值的 Base64 字符串。下面的命令可在你的终端生成；生成值直接填入扣子的环境配置，勿粘贴到公开聊天或 GitHub：

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
   ```

4. 妥善备份加密密钥。更换或丢失它会导致旧接口密钥无法解密，需要逐条重新输入。此变量不可命名为 `NEXT_PUBLIC_*`。
5. 重新部署，登录网站并打开“AI 接口”。新增配置、保存、测试连接，成功后点击“设为默认”。

缺少配置表时，新页面会提示尚未启用，自定义配置不能保存；现有扣子生成入口保持默认选择。缺少加密密钥时不能保存或使用自定义密钥。配置读取出错不会静默改用其他接口。

开发电脑无需连接生产数据库；本次自动化测试使用模拟服务，没有访问线上学生数据，也没有执行上述数据库脚本。

## 如何填写

| 平台 | 接口地址 | 模型名称 |
|---|---|---|
| DeepSeek | `https://api.deepseek.com` | 当前预填 `deepseek-flash`，以账号当前可用模型为准 |
| 通义千问 / 百炼北京 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 预填 `qwen-plus`，可自行修改 |
| 硅基流动 | `https://api.siliconflow.cn/v1` | 从平台复制完整模型 ID；平台提供的 DeepSeek 模型 ID 可能与 DeepSeek 官方不同 |
| 其他兼容接口 | 服务商提供的基础地址 | 服务商提供的文本对话模型 ID |

API 密钥由对应平台提供。编辑同一个平台、地址的接口时，密钥留空表示保留原值；更换平台或地址则需重新填写。密钥保存后只显示末四位，不能通过页面读取原值。

接口使用非流式 `POST /chat/completions`，发送 `model`、`messages`、`stream: false`，读取 `choices[0].message.content`。不同模型的可用性、访问权限及输出风格应通过真实账号测试。此版本不支持直接填写 Anthropic 原生协议或专用工作流地址。

参考官方文档（核对日期 2026-09-17）：[DeepSeek](https://api-docs.deepseek.com/zh-cn/)、[百炼地址与地域](https://help.aliyun.com/zh/model-studio/base-url)、[硅基流动快速开始](https://docs.siliconflow.cn/docs/userguide/quickstart)。

## 自定义域名

管理员可以设置服务端变量 `AI_ALLOWED_HOSTS`，精确列出要开放的域名，逗号分隔，例如 `gateway.example.com,another.example.com`。只开放你信任的公网模型服务域名，不要添加本机、私网、云元数据或其他内部服务。

所有地址必须使用 HTTPS，不允许用户名、密码、查询参数、自定义端口或跳转。国内外不同地域的百炼接口需按实际地域选择“其他兼容接口”，并添加对应域名。

## 使用与验收

- 先测试连接，再设为默认；测试会产生一次简短请求，可能由服务商计费，不发送学生数据。
- 生成报告时，必要的学生姓名、课程和学习表现会发给当前选中的模型服务商。
- 测试结果展示耗时，以及服务商返回的总 token 用量（若提供）。当前不保存调用历史、不估算金额、不查询余额。
- 在现有两个报告生成入口分别生成报告，检查三段文案、三条建议和海报；接口失败或输出不完整时，应看到错误提示，原编辑内容继续保留。
- 换一个账号登录，应看不到上一账号的配置。所有管理与生成 API 均向 Supabase 验证用户身份，数据库配置表不允许浏览器直接读写。
- 在另一个浏览器登录同一账号，保存的配置和默认选择应一致。并发修改会提示刷新，而不是直接覆盖。
- 默认接口必须先切换到其他接口或扣子，才能删除；删除配置不影响历史报告。

## 技术维护

新增表 `public.ai_provider_settings` 使用用户 UUID 作为主键，单行 JSON 存储配置，带版本号进行并发保护。API 密钥使用 AES-256-GCM 加密，关联用户、接口 ID 与目标地址；服务端加密密钥不入库。表开启 RLS，撤销匿名及普通认证角色的表访问权限，只允许服务端访问。

接口网络超时为 90 秒，响应上限为 1 MiB，不自动重试收费调用，不向第三方转发扣子的请求头或用户登录令牌。生产环境若有多人高频调用，可在网关进一步设置调用频率和总额限制。

本次新增测试命令：

```bash
pnpm exec tsx --test tests/ai-settings.test.ts
pnpm ts-check
pnpm exec eslint src/lib/ai src/app/api/ai src/app/settings/ai tests/ai-settings.test.ts
pnpm build
```

回滚网站代码时保留新增表和加密环境变量，便于恢复配置；不需要删除表或重置数据库。
