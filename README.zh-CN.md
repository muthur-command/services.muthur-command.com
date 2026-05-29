# services.muthur-command.com

Muthur Command 对外 Web 服务（whoami / assist）。本仓库构建 **Docker 镜像** 并推送到 **GitHub Container Registry（GHCR）**，在 **1Panel** 中导入镜像运行，再由 **OpenResty 网站** 对外提供 HTTPS。

## 来源

- **上游：** [home-assistant/services.home-assistant.io](https://github.com/home-assistant/services.home-assistant.io)
- **本仓库：** 面向 `*.muthur-command.com`，供 **Muthur Command OS** Supervisor 调用

## 镜像地址

```text
ghcr.io/muthur-command/services.muthur-command.com:<version>
ghcr.io/muthur-command/services.muthur-command.com:latest   # Release 时更新
```

CI 在推送到 `mc` 分支或发布 GitHub Release 时自动构建并推送（`linux/amd64`、`linux/arm64`）。

---

## 架构

```text
Internet
   ↓
1Panel OpenResty 网站 (services.muthur-command.com, HTTPS)
   ↓ 反向代理
127.0.0.1:3000
   ↓
Docker 容器 (ghcr.io/muthur-command/services.muthur-command.com)
```

---

## API

### whoami

```bash
curl -sSL https://services.muthur-command.com/whoami/v1
curl -sSL https://services.muthur-command.com/whoami/v1/timezone
```

Supervisor 依赖 JSON 中的 `timezone` 与 `timestamp`。

### assist（可选）

```bash
curl --location --request PUT \
  'https://services.muthur-command.com/assist/wake_word/training_data/upload?wake_word=ok_nabu&user_content=demo' \
  --header 'Content-Type: audio/webm' \
  --data '@/data/file.webm'
```

---

## 一、CI 发布镜像

无需本地出包。合并到 `mc` 或发布 Release 后，GitHub Actions 工作流 **Publish** 会：

1. 编译 Node standalone 服务
2. 构建 Docker 镜像
3. 推送到 `ghcr.io/muthur-command/services.muthur-command.com`

首次使用需在 GitHub 组织/仓库 **Packages** 中将该包设为 **Public**（或在 1Panel 配置 GHCR 登录）。

---

## 二、1Panel 导入镜像并启动容器

### 1. 拉取镜像

**容器 → 镜像 → 拉取镜像**（或「从仓库拉取」）：

```text
ghcr.io/muthur-command/services.muthur-command.com:latest
```

若包为私有，先在 **容器 → 仓库** 添加 GHCR 凭据（GitHub PAT，权限 `read:packages`）。

### 2. 创建容器

**容器 → 创建容器**，建议参数：

| 项 | 值 |
|----|-----|
| 镜像 | `ghcr.io/muthur-command/services.muthur-command.com:latest` |
| 容器名 | `services-muthur-command` |
| 重启策略 | 总是重启 |
| 端口 | 容器 `3000` → 宿主机 `127.0.0.1:3000` |
| 卷 | 宿主机 `/opt/1panel/apps/services-muthur-command/data/wakeword` → 容器 `/data/wakeword` |

环境变量（可选，默认已够用）：

| 变量 | 默认值 |
|------|--------|
| `PORT` | `3000` |
| `WORKER_ENV` | `production` |
| `WAKEWORD_DATA_DIR` | `/data/wakeword` |

### 3. 验证容器

```bash
curl -sSL http://127.0.0.1:3000/whoami/v1 | head
```

---

## 三、1Panel 创建 OpenResty 网站

### 1. 创建网站

1. **网站 → 创建网站**
2. 主域名：`services.muthur-command.com`
3. 可选追加：`whoami.muthur-command.com`
4. 运行环境：**OpenResty**
5. 申请 **SSL 证书**

### 2. 配置反向代理

**网站 → services.muthur-command.com → 配置 → 反向代理**

- 代理地址：`http://127.0.0.1:3000`

或使用 **OpenResty 自定义配置**，粘贴 `deploy/openresty.conf.example` 中的 `location /` 片段。

### 3. 外网验证

```bash
curl -sSL https://services.muthur-command.com/whoami/v1
curl -sSL https://services.muthur-command.com/whoami/v1/timezone
```

---

## 四、升级

1. **容器 → 拉取** 新版本镜像（如 `:2026.05.0` 或 `:latest`）
2. **停止** 旧容器 → **创建/重建** 容器（保持相同端口与卷映射）
3. 确认 `curl http://127.0.0.1:3000/whoami/v1` 正常后，OpenResty 无需改动

---

## GeoIP 说明

容器内使用 `geoip-lite` 推断时区，不再依赖 Cloudflare。

OpenResty 反代须传递 `X-Real-IP` / `X-Forwarded-For`，参见 `deploy/openresty.conf.example`。

---

## 本地开发

```bash
yarn install
yarn build:standalone
yarn start
# 或
docker build -t services-muthur-command:local .
docker run --rm -p 3000:3000 services-muthur-command:local
```
