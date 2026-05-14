FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN npm install --workspace=packages/shared --workspace=apps/backend

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/backend

WORKDIR /app/apps/backend

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
