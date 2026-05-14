FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/next.config.js ./apps/frontend/
COPY apps/frontend/postcss.config.js ./apps/frontend/
COPY apps/frontend/tailwind.config.ts ./apps/frontend/
COPY apps/frontend/src ./apps/frontend/src

RUN npm install --workspace=packages/shared --workspace=apps/frontend && npm run build --workspace=packages/shared

EXPOSE 3000

ENV NODE_ENV=development
WORKDIR /app/apps/frontend

CMD ["npm", "run", "dev"]
