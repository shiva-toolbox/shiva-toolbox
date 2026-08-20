# Shiva Toolbox

[English](#english) · [Português](#português)

## English

Discord bot (TypeScript, discord.js) with PostgreSQL. Current modules: autorole, join/leave (`/guildalert`), Twitch and YouTube live alerts, reaction roles, and per-server language.

### Apps and packages

| Package | Role |
| --- | --- |
| `@shiva/bot` | Discord.js — commands, events, and modules |
| `@shiva/shared` | Configuration contracts |
| `@shiva/database` | Prisma + PostgreSQL |

The bot needs the **Server Members** intent in the Developer Portal.

### Local setup

```bash
pnpm install
cp apps/bot/.env.example apps/bot/.env
cp packages/database/.env.example packages/database/.env
pnpm db:up                                # Postgres on 127.0.0.1:5432
pnpm db:migrate                           # apply migrations and generate the client
pnpm dev:bot
```

Local Postgres defaults to password `shiva` (same as the sample `DATABASE_URL`). For a different password, copy `.env.example` to `.env` at the repo root.

Fill in `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `TWITCH_CLIENT_ID`, and `TWITCH_CLIENT_SECRET` in `apps/bot/.env`. `YOUTUBE_API_KEY` is optional, but required for `/youtube`. With `BOT_DEV_GUILD_ID`, slash commands register only on that guild (useful in development). In production, leave it empty to register globally.

Schema changes go through migrations: edit `schema.prisma` and run `pnpm db:migrate`.

### Deploy

```bash
cp .env.example .env                      # POSTGRES_PASSWORD (required in production)
cp apps/bot/.env.example apps/bot/.env
# fill both in
docker compose up -d --build
```

Compose starts Postgres (with a healthcheck) and the bot, which applies migrations with `migrate deploy` before logging in. The image runs as the `node` user and does not publish the Postgres port — the local port comes from `docker-compose.dev.yml`, used only by `pnpm db:up`. `SIGTERM`/`SIGINT` shut down the Discord client and Prisma.

If the database already existed before migrations (schema created with `db push`), run `pnpm db:baseline` once with `DATABASE_URL` pointing at it. That marks `0_init` as applied; without this step, `migrate deploy` fails because the tables already exist.

Commands: `/ping`, `/status`, `/autorole`, `/guildalert`, `/twitch`, `/youtube`, `/reactionrole`, `/language`.

## Português

Bot Discord (TypeScript, discord.js) com PostgreSQL. Módulos atuais: autorole, join/leave (`/guildalert`), alertas da Twitch e do YouTube, cargos por reação e idioma por servidor.

### Apps e pacotes

| Pacote | Função |
| --- | --- |
| `@shiva/bot` | Discord.js — comandos, events e módulos |
| `@shiva/shared` | Contratos de configuração |
| `@shiva/database` | Prisma + PostgreSQL |

O bot precisa da intent **Server Members** no Developer Portal.

### Setup local

```bash
pnpm install
cp apps/bot/.env.example apps/bot/.env
cp packages/database/.env.example packages/database/.env
pnpm db:up                                # Postgres em 127.0.0.1:5432
pnpm db:migrate                           # aplica as migrations e gera o client
pnpm dev:bot
```

O Postgres local usa a senha `shiva` por padrão (a mesma da `DATABASE_URL` de exemplo). Para outra senha, copie `.env.example` para `.env` na raiz.

Preencha `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET` em `apps/bot/.env`. `YOUTUBE_API_KEY` é opcional, mas necessário para `/youtube`. Com `BOT_DEV_GUILD_ID`, os slash commands registram só nesse servidor (útil em dev). Em produção, deixe vazio para registrar globalmente.

Mudanças de schema entram por migration: edite `schema.prisma` e rode `pnpm db:migrate`.

### Deploy

```bash
cp .env.example .env                      # POSTGRES_PASSWORD (obrigatório em produção)
cp apps/bot/.env.example apps/bot/.env
# preencha os dois
docker compose up -d --build
```

O compose sobe Postgres (com healthcheck) e o bot, que aplica as migrations com `migrate deploy` antes de logar. A imagem roda como usuário `node` e não publica a porta do Postgres — a porta local vem de `docker-compose.dev.yml`, usado só pelo `pnpm db:up`. `SIGTERM`/`SIGINT` desligam o client e o Prisma.

Se o banco já existia antes das migrations (schema criado com `db push`), rode `pnpm db:baseline` uma vez com a `DATABASE_URL` apontando para ele. Isso marca `0_init` como aplicada; sem esse passo, o `migrate deploy` falha porque as tabelas já existem.

Comandos: `/ping`, `/status`, `/autorole`, `/guildalert`, `/twitch`, `/youtube`, `/reactionrole`, `/language`.
