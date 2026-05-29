# services.muthur-command.com

Muthur Command web services (whoami / assist). This fork builds a **Docker image**, publishes it to **GHCR**, runs it in **1Panel**, and exposes it via an **OpenResty** website.

## Origin

- **Upstream:** [home-assistant/services.home-assistant.io](https://github.com/home-assistant/services.home-assistant.io)
- **This repo:** Endpoints for `*.muthur-command.com`, used by **Muthur Command OS** Supervisor

## Image

```text
ghcr.io/muthur-command/services.muthur-command.com:<version>
ghcr.io/muthur-command/services.muthur-command.com:latest
```

GitHub Actions workflow **Publish** builds and pushes on `mc` pushes and GitHub Releases.

## Architecture

```text
Internet → 1Panel OpenResty (HTTPS) → 127.0.0.1:3000 → Docker container
```

Full **1Panel + OpenResty + GHCR** deployment guide: **[README.zh-CN.md](./README.zh-CN.md)**

## API

```bash
curl -sSL https://services.muthur-command.com/whoami/v1
curl -sSL https://services.muthur-command.com/whoami/v1/timezone
```

## Local development

```bash
yarn install
yarn build:standalone
yarn start
```

Or:

```bash
docker build -t services-muthur-command:local .
docker run --rm -p 3000:3000 services-muthur-command:local
```
