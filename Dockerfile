FROM node:22-alpine

RUN corepack enable

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY --chown=node:node apps/bot ./apps/bot
COPY --chown=node:node packages ./packages

RUN pnpm install --frozen-lockfile

# Only needed so the Prisma config resolves during generate; never used to connect.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm --filter @shiva/database generate

ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@shiva/bot", "start"]
