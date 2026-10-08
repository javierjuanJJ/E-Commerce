FROM node:20-slim AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY backend ./backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY backend ./backend

RUN chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch(\`http://localhost:\${process.env.PORT || 3000}/health\`).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma db push --skip-generate --schema=backend/prisma/schema.prisma && node backend/server.js"]
