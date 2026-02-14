# Development Dockerfile for Next.js
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web

WORKDIR /app/apps/web

ENV NODE_ENV=development
ENV PORT=3001

EXPOSE 3001

CMD ["pnpm", "dev"]
