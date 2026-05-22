FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
RUN npm ci --workspace=packages/shared --workspace=apps/backend

COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

RUN npm run build --workspace=packages/shared && npm run build --workspace=apps/backend

WORKDIR /app/apps/backend

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
