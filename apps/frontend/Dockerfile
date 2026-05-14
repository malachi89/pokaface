FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

RUN npm install --workspace=packages/shared --workspace=apps/frontend

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/frontend

EXPOSE 3000

ENV NODE_ENV=production
WORKDIR /app/apps/frontend

CMD ["npm", "start"]
