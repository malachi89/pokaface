FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm ci --workspace=packages/shared --workspace=apps/frontend

COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/next.config.js ./apps/frontend/
COPY apps/frontend/postcss.config.js ./apps/frontend/
COPY apps/frontend/tailwind.config.ts ./apps/frontend/
COPY apps/frontend/src ./apps/frontend/src
RUN npm run build --workspace=packages/shared

ENV NODE_ENV=production
ARG NEXT_PUBLIC_BACKEND_URL=https://api.pokaface.win
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
RUN npm run build --workspace=apps/frontend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=deps --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/frontend/server.js"]
