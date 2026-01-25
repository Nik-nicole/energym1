# Dockerfile para FitZone Gym
# Para usar en el futuro cuando se implemente Docker

FROM node:18-alpine AS base

# Instalar dependencias solo cuando se necesiten
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Construir la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# Imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configurar permisos para prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar archivos de build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
